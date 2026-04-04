import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic'
import type { RawSource } from "@/lib/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/** Claude のレスポンスからテキストブロックを結合して返す */
function extractText(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

/** web_search_tool_result ブロックから URL・タイトルを抽出する */
function extractSources(
  content: Anthropic.Messages.ContentBlock[]
): RawSource[] {
  const sources: RawSource[] = [];
  for (const block of content) {
    if (block.type === "web_search_tool_result") {
      const wsBlock = block as Anthropic.Messages.WebSearchToolResultBlock;
      if (Array.isArray(wsBlock.content)) {
        for (const item of wsBlock.content) {
          if (item.type === "web_search_result" && item.url) {
            sources.push({ url: item.url, title: item.title ?? item.url });
          }
        }
      }
    }
  }
  return sources;
}

/** web_search ツールを使って単一のプロンプトを調査し、要約テキストとソースを返す */
async function researchWithWebSearch(
  prompt: string
): Promise<{ summary: string; sources: RawSource[] }> {
  const webSearchTool: Anthropic.Messages.WebSearchTool20250305 = {
    type: "web_search_20250305",
    name: "web_search",
  };

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    tools: [webSearchTool],
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const summary = extractText(response.content);
  const sources = extractSources(response.content);

  return { summary, sources };
}

/** テキストからキーインサイト（箇条書き）を抽出してリスト化する */
function parseInsights(text: string): string[] {
  const lines = text.split("\n");
  const insights: string[] = [];

  for (const line of lines) {
    const cleaned = line.replace(/^[-•*\d.]\s*/, "").trim();
    if (cleaned.length > 20) {
      insights.push(cleaned);
    }
  }

  return insights.slice(0, 8);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, period_type } = body;

    if (!project_id || !period_type) {
      return NextResponse.json(
        { error: "project_id と period_type は必須です" },
        { status: 400 }
      );
    }

    // プロジェクト情報を取得
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "プロジェクトが見つかりません" },
        { status: 404 }
      );
    }

    const { category, brand, keywords } = project;
    const keywordNote =
      keywords?.length > 0 ? `（関連キーワード: ${keywords.join(", ")}）` : "";

    const periodStart = new Date().toISOString().split("T")[0];

    const periodLabel: Record<string, string> = {
      weekly:  "過去1週間（直近7日間）のトレンドを調査",
      monthly: "過去1ヶ月間のトレンドを調査",
      yearly:  "過去1年間のトレンドを調査",
    };
    const periodDesc = periodLabel[period_type] ?? "最新のトレンドを調査";

    // 1. カテゴリトレンド調査
    const categoryPrompt = `
あなたはP&G・ユニリーバ・花王でブランドマネージャーを10年以上務めたマーケティングの専門家です。
ブランドマネージャーが月曜の朝に読んで今週の意思決定に使えるインサイトを出してください。

以下のカテゴリについて、web検索を使って${periodDesc}してください。
※ブランド固有の話題は含めないこと。カテゴリ全体の話のみ。

調査基準日: ${periodStart}
カテゴリ: ${category}${keywordNote}

以下の4つの観点で必ず各観点の発見を出してください：

1. 市場トレンド（数値・成長率を含めること）
2. 消費者インサイト（なぜそう思うか・動機まで）
3. 競合動向（具体的なブランド名・施策）
4. 機会・リスク（カテゴリ全体への示唆）

日本語で各観点200字程度、合計800字程度の要約を提供してください。重要なポイントは箇条書きも使って整理してください。
`.trim();

    // 2. ブランドトレンド調査
    const brandPrompt = `
あなたはP&G・ユニリーバ・花王でブランドマネージャーを10年以上務めたマーケティングの専門家です。
ブランドマネージャーが月曜の朝に読んで今週の意思決定に使えるインサイトを出してください。

以下のブランドについて、web検索を使って${periodDesc}してください。
※カテゴリ全体の市場動向は含めないこと。このブランドに関する話のみ。

調査基準日: ${periodStart}
ブランド: ${brand}
カテゴリ: ${category}${keywordNote}

以下の4つの観点で必ず各観点の発見を出してください：

1. ブランドの最新動向（数値・キャンペーン・リリース）
2. 消費者の評判・口コミ（SNS・レビュー、なぜそう思うか・動機まで）
3. 競合との比較（具体的なブランド名・差別化ポイント）
4. 機会・リスク（このブランドへの示唆）

日本語で各観点200字程度、合計800字程度の要約を提供してください。重要なポイントは箇条書きも使って整理してください。
`.trim();

    // 並列でリサーチ実行
    const [categoryResult, brandResult] = await Promise.all([
      researchWithWebSearch(categoryPrompt),
      researchWithWebSearch(brandPrompt),
    ]);

    // 3. カテゴリインサイトとブランドインサイトを並列生成
    const categoryInsightPrompt = `
以下のカテゴリトレンド調査結果をもとに、カテゴリ全体に関するマーケター向けの重要なインサイトを3〜5項目、簡潔な箇条書きでまとめてください。
1項目は1〜2文で、具体的かつ実践的な内容にしてください。
ブランド固有の話題は含めないこと。カテゴリ全体の市場・消費者・競合動向に関する洞察のみ。

【良いインサイトの例】
- 環境配慮型製品へのシフトが加速しており、詰め替え・濃縮タイプの購買が前年比120%増。カテゴリとして環境訴求が差別化軸になりつつある。
- 20代女性層でTikTok経由の「洗い物ASMR」コンテンツが急増。カテゴリ全体でUGC活用のコンテンツ戦略が有効な可能性。

【避けるべき悪い例】
- 食器洗剤市場は成長しています。（数値・示唆がない）

=== カテゴリトレンド ===
${categoryResult.summary}

箇条書き形式（行頭に「-」を使用）で出力してください。数値・具体的なブランド名・実践的な示唆を必ず含めてください。
`.trim();

    const brandInsightPrompt = `
以下のブランドトレンド調査結果をもとに、このブランドに関するマーケター向けの重要なインサイトを3〜5項目、簡潔な箇条書きでまとめてください。
1項目は1〜2文で、具体的かつ実践的な内容にしてください。
カテゴリ全体の市場動向は含めないこと。このブランドに固有の評判・施策・機会・リスクに関する洞察のみ。

【良いインサイトの例】
- JOYへのネガティブ言及の60%が「香り」に集中。競合花王キュキュットは無香料ラインを強化中で差別化リスクあり。
- 20代女性のインフルエンサーによるJOY紹介動画が急増、ブランド認知向上の好機。

【避けるべき悪い例】
- JOYは人気があります。（具体性がない）

=== ブランドトレンド ===
${brandResult.summary}

箇条書き形式（行頭に「-」を使用）で出力してください。数値・具体的な施策・実践的な示唆を必ず含めてください。
`.trim();

    const [categoryInsightResponse, brandInsightResponse] = await Promise.all([
      anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: categoryInsightPrompt }],
      }),
      anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: brandInsightPrompt }],
      }),
    ]);

    const categoryInsights = parseInsights(extractText(categoryInsightResponse.content));
    const brandInsights = parseInsights(extractText(brandInsightResponse.content));

    // ソースをマージして重複除去
    const allSources = [
      ...categoryResult.sources,
      ...brandResult.sources,
    ].filter(
      (src, idx, arr) => arr.findIndex((s) => s.url === src.url) === idx
    );

    // Supabase に保存
    const { data: savedReport, error: insertError } = await supabase
      .from("reports")
      .insert({
        project_id,
        period_type,
        period_start: periodStart,
        category_summary: categoryResult.summary,
        brand_summary: brandResult.summary,
        key_insights: [],
        category_insights: categoryInsights,
        brand_insights: brandInsights,
        raw_sources: allSources,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ report: savedReport }, { status: 201 });
  } catch (err) {
    console.error("Report generation error:", err);
    const message =
      err instanceof Error ? err.message : "レポート生成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
