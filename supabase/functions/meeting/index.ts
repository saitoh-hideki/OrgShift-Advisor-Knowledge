// 会議専用の専門アドバイザー
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { generateAIAdvice, generateFallbackAdvice, type AIAdvice, type AIContext } from "../_shared/ai-utils.ts"

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 })
  
  try {
    const body = await req.json()
    const context: AIContext = {
      scene: body.scene,
      goal: body.goal || "decide",
      timeLimit: body.time_limit || "medium",
      stakes: body.stakes || "medium",
      participants: body.participants
    }

    const prompt = `あなたは会議ファシリテーションと意思決定の専門家で、以下の専門分野に精通しています：
- 会議設計とファシリテーション技術
- グループダイナミクスとチームビルディング
- 意思決定理論と合意形成手法
- 時間管理と効率化技術
- 参加者エンゲージメントとモチベーション
- 会議後のフォローアップとアクション管理

【会議の詳細分析】
- 目標: ${context.goal}
- 時間制限: ${context.timeLimit}
- 重要度: ${context.stakes}
- 参加者数: ${context.participants || '未指定'}人

【会議の種類別専門アドバイス】
以下の3つの具体的で実践的なアドバイスを提供してください：

1. **会議設計・準備段階のアドバイス**
   - アジェンダ設計のコツ
   - 参加者の事前準備の促し方
   - 会議室・ツールの最適化

2. **会議進行・ファシリテーションのアドバイス**
   - 時間管理の具体的な手法
   - 参加者の発言促進技術
   - 合意形成のプロセス設計

3. **会議後・フォローアップのアドバイス**
   - アクションアイテムの明確化
   - 参加者の理解度確認方法
   - 次回会議への改善点の反映

【各アドバイスの要求事項】
各アドバイスには以下を含めてください：
- 理論名（英語）+ 日本語説明
- 具体的な行動指針（200文字以内）
- 期待される効果（100文字以内）
- 注意点（80文字以内）
- 実践のコツ（100文字以内）
- 関連する理論や研究（50文字以内）
- 実装ステップ（3-5ステップ）
- 成功指標（3-5項目）
- よくある間違い（3-5項目）

【出力形式】
JSON形式で返してください：
{
  "advices": [
    {
      "theory_id": "理論名",
      "theory_name_ja": "日本語理論名",
      "short_advice": "具体的な行動指針",
      "expected_effect": "期待される効果",
      "caution": "注意点",
      "tips": "実践のコツ",
      "related_theory": "関連理論",
      "implementation_steps": ["ステップ1", "ステップ2", "ステップ3"],
      "success_indicators": ["指標1", "指標2", "指標3"],
      "common_mistakes": ["間違い1", "間違い2", "間違い3"]
    }
  ]
}

【専門的な視点】
- 参加者数に応じた会議設計の違い
- 時間制限に応じた効率化手法
- 重要度に応じた意思決定プロセスの選択
- 目標達成のための最適な会議形式
- 参加者の心理的安全性の確保
- 会議のROI最大化のための工夫`

    let advices: AIAdvice[] = []

    try {
      advices = await generateAIAdvice(prompt, context)
    } catch (aiError) {
      console.error("AI generation failed, using fallback:", aiError)
      advices = generateFallbackAdvice(context)
    }

    return new Response(JSON.stringify({ advices }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    })
  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
