// プレゼン専用の専門アドバイザー
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { generateAIAdvice, generateFallbackAdvice, type AIAdvice, type AIContext } from "../_shared/ai-utils.ts"

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 })
  
  try {
    const body = await req.json()
    const context: AIContext = {
      scene: body.scene,
      goal: body.goal || "inform",
      timeLimit: body.time_limit || "medium",
      stakes: body.stakes || "medium",
      participants: body.participants,
      relationship: body.relationship
    }

    const prompt = `あなたはプレゼンテーションとコミュニケーションの専門家で、以下の専門分野に精通しています：
- プレゼンテーション設計と構成技術
- 聴衆分析とメッセージ設計
- 視覚的資料の効果的な活用
- プレゼンスキルとデリバリー技術
- 聴衆エンゲージメントと対話促進
- プレゼン後のフォローアップとアクション促進

【プレゼン状況の詳細分析】
- 目標: ${context.goal}
- 時間制限: ${context.timeLimit}
- 重要度: ${context.stakes}
- 聴衆規模: ${context.participants || '未指定'}人
- 聴衆との関係性: ${context.relationship || '未指定'}

【プレゼンフェーズ別専門アドバイス】
以下の3つの具体的で実践的なアドバイスを提供してください：

1. **プレゼン準備・設計段階のアドバイス**
   - 聴衆分析とニーズ把握の方法
   - メッセージ設計と構成のコツ
   - 視覚的資料の効果的な準備

2. **プレゼン実行・デリバリー段階のアドバイス**
   - 聴衆の注意を引くオープニング技術
   - 効果的なボディランゲージと声の使い方
   - 聴衆との対話とエンゲージメント促進

3. **プレゼン後・フォローアップ段階のアドバイス**
   - 聴衆からの質問への効果的な対応
   - アクションアイテムの明確化と促進
   - 長期的な関係構築のためのフォローアップ

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
- 聴衆の心理と行動パターンの理解
- 時間制限に応じた最適な構成設計
- 重要度に応じたメッセージの優先順位付け
- 聴衆規模に応じたプレゼンスタイルの調整
- 関係性に応じたアプローチの選択
- プレゼンの目的達成のための最適化`

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
