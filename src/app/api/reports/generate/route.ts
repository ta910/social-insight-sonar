import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
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
あなたはマーケティングリサーチャーです。
以下のカテゴリについて、web検索を使って${periodDesc}してください。

調査基準日: ${periodStart}
カテゴリ: ${category}${keywordNote}

調査観点:
- 最新のトレンドと消費者の関心
- 市場動向・成長分野
- 新しい製品・技術・サービスの動向
- SNSや口コミで話題になっていること

日本語で500字程度の要約を提供してください。重要なポイントは箇条書きも使って整理してください。
`.trim();

    // 2. ブランドトレンド調査
    const brandPrompt = `
あなたはマーケティングリサーチャーです。
以下のブランドについて、web検索を使って${periodDesc}してください。

調査基準日: ${periodStart}
ブランド: ${brand}
カテゴリ: ${category}${keywordNote}

調査観点:
- SNS（Twitter/X, Instagram, TikTok等）での評判・口コミ
- インフルエンサー・KOLによる言及
- ニュース記事・プレスリリース
- 消費者レビュー・評価
- 競合との比較

日本語で500字程度の要約を提供してください。重要なポイントは箇条書きも使って整理してください。
`.trim();

    // 並列でリサーチ実行
    const [categoryResult, brandResult] = await Promise.all([
      researchWithWebSearch(categoryPrompt),
      researchWithWebSearch(brandPrompt),
    ]);

    // キーインサイトをカテゴリ要約とブランド要約から合成
    const insightPrompt = `
以下の2つの調査結果をもとに、マーケター向けの重要なインサイトを5〜8項目、簡潔な箇条書きでまとめてください。
1項目は1〜2文で、具体的かつ実践的な内容にしてください。

=== カテゴリトレンド ===
${categoryResult.summary}

=== ブランドトレンド ===
${brandResult.summary}

箇条書き形式（行頭に「-」を使用）で出力してください。
`.trim();

    const insightResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: insightPrompt }],
    });

    const insightText = extractText(insightResponse.content);
    const keyInsights = parseInsights(insightText);

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
        key_insights: keyInsights,
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
