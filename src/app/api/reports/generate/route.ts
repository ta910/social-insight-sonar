import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import type { RawSource, PeriodComparison, CompetitorSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type PrevReportData = {
  id: string;
  period_start: string;
  category_insights: string[];
  brand_insights: string[];
} | null;

function extractText(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

function extractSources(content: Anthropic.Messages.ContentBlock[]): RawSource[] {
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
    messages: [{ role: "user", content: prompt }],
  });
  return {
    summary: extractText(response.content),
    sources: extractSources(response.content),
  };
}

function parseInsights(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^[-•*\d.]\s*/, "").trim())
    .filter((line) => line.length > 20)
    .slice(0, 8);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, period_type, period_start: periodStartInput } = body;

    if (!project_id || !period_type) {
      return NextResponse.json(
        { error: "project_id と period_type は必須です" },
        { status: 400 }
      );
    }

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

    const { category, brand, keywords, competitor_brands } = project;
    const keywordNote =
      keywords?.length > 0 ? `（関連キーワード: ${keywords.join(", ")}）` : "";
    const periodStart = periodStartInput ?? new Date().toISOString().split("T")[0];

    const periodLabel: Record<string, string> = {
      weekly: "過去1週間（直近7日間）のトレンドを調査",
      monthly: "過去1ヶ月間のトレンドを調査",
      yearly: "過去1年間のトレンドを調査",
    };
    const periodDesc = periodLabel[period_type] ?? "最新のトレンドを調査";

    const expertIntro = `あなたはP&G・ユニリーバ・花王でブランドマネージャーを10年以上務めたマーケティングの専門家です。
ブランドマネージャーが月曜の朝に読んで今週の意思決定に使えるインサイトを出してください。`;

    const categoryPrompt = `
${expertIntro}

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

    const brandPrompt = `
${expertIntro}

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

    // Phase 1: research + previous report lookup in parallel
    const [categoryResult, brandResult, prevReportQuery] = await Promise.all([
      researchWithWebSearch(categoryPrompt),
      researchWithWebSearch(brandPrompt),
      supabase
        .from("reports")
        .select("id, period_start, category_insights, brand_insights")
        .eq("project_id", project_id)
        .eq("period_type", period_type)
        .lt("period_start", periodStart)
        .order("period_start", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const prevReport = prevReportQuery.data as PrevReportData;

    // Competitor brands (max 3)
    const competitorList: string[] = Array.isArray(competitor_brands)
      ? competitor_brands.slice(0, 3)
      : [];

    const competitorPrompts = competitorList.map(
      (comp) => `
${expertIntro}

競合ブランド「${comp}」について、web検索を使って${periodDesc}してください。
カテゴリ: ${category}

以下の観点で調査してください：
- 最新の動向・キャンペーン・製品リリース（数値を含めること）
- 消費者の評判・口コミ（SNS・レビュー）
- 強みと弱み（${brand}との比較視点で）

日本語で300字程度の要約を提供してください。
`.trim()
    );

    const categoryInsightPrompt = `
以下のカテゴリトレンド調査結果をもとに、カテゴリ全体に関するマーケター向けの重要なインサイトを3〜5項目、簡潔な箇条書きでまとめてください。
1項目は1〜2文で、具体的かつ実践的な内容にしてください。
ブランド固有の話題は含めないこと。カテゴリ全体の市場・消費者・競合動向に関する洞察のみ。

【良いインサイトの例】
- 環境配慮型製品へのシフトが加速しており、詰め替え・濃縮タイプの購買が前年比120%増。カテゴリとして環境訴求が差別化軸になりつつある。
- 20代女性層でTikTok経由の「洗い物ASMR」コンテンツが急増。カテゴリ全体でUGC活用のコンテンツ戦略が有効な可能性。

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

=== ブランドトレンド ===
${brandResult.summary}

箇条書き形式（行頭に「-」を使用）で出力してください。数値・具体的な施策・実践的な示唆を必ず含めてください。
`.trim();

    // Phase 2: insights + competitor research in parallel
    const [[categoryInsightResp, brandInsightResp], competitorResults] =
      await Promise.all([
        Promise.all([
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
        ]),
        Promise.all(competitorPrompts.map((p) => researchWithWebSearch(p))),
      ]);

    const categoryInsights = parseInsights(extractText(categoryInsightResp.content));
    const brandInsights = parseInsights(extractText(brandInsightResp.content));

    const competitorSummaries: Record<string, CompetitorSummary> = {};
    competitorList.forEach((comp, i) => {
      competitorSummaries[comp] = {
        summary: competitorResults[i].summary,
        sources: competitorResults[i].sources,
      };
    });

    // Phase 3: period comparison (only if previous report has insights)
    let periodComparison: PeriodComparison | null = null;
    if (
      prevReport &&
      Array.isArray(prevReport.category_insights) &&
      prevReport.category_insights.length > 0
    ) {
      const comparisonPrompt = `
前回と今回のインサイトを比較して変化を分析してください。

前回（${prevReport.period_start}）:
カテゴリインサイト:
${prevReport.category_insights.map((i) => `- ${i}`).join("\n")}
ブランドインサイト:
${(prevReport.brand_insights ?? []).map((i) => `- ${i}`).join("\n")}

今回（${periodStart}）:
カテゴリインサイト:
${categoryInsights.map((i) => `- ${i}`).join("\n")}
ブランドインサイト:
${brandInsights.map((i) => `- ${i}`).join("\n")}

以下のJSON形式のみで回答してください（前後のテキスト不要）：
{
  "new_category_insights": ["新しく登場したカテゴリインサイトを要約（1文）"],
  "lost_category_insights": ["前回あったが今回ないカテゴリインサイトを要約（1文）"],
  "new_brand_insights": ["新しく登場したブランドインサイトを要約（1文）"],
  "lost_brand_insights": ["前回あったが今回ないブランドインサイトを要約（1文）"],
  "summary": "全体的な変化のまとめ（2〜3文）"
}
`.trim();

      const comparisonResp = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: comparisonPrompt }],
      });
      const compText = extractText(comparisonResp.content);
      try {
        const match = compText.match(/\{[\s\S]*\}/);
        if (match) periodComparison = JSON.parse(match[0]) as PeriodComparison;
      } catch {
        // ignore JSON parse errors
      }
    }

    // Merge and deduplicate sources
    const allSources = [
      ...categoryResult.sources,
      ...brandResult.sources,
      ...competitorList.flatMap((c) => competitorSummaries[c]?.sources ?? []),
    ].filter((src, idx, arr) => arr.findIndex((s) => s.url === src.url) === idx);

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
        competitor_summaries: competitorSummaries,
        period_comparison: periodComparison,
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
