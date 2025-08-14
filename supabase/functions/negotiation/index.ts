// 交渉専用の専門アドバイザー
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { generateAIAdvice, generateFallbackAdvice, type AIAdvice, type AIContext } from "../_shared/ai-utils.ts"

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 })
  
  try {
    const body = await req.json()
    const context: AIContext = {
      scene: body.scene,
      goal: body.goal || "win-win",
      timeLimit: body.time_limit || "medium",
      stakes: body.stakes || "medium",
      relationship: body.relationship
    }

    const prompt = `あなたは交渉理論と戦略の専門家で、以下の専門分野に精通しています：
- 交渉心理学と人間行動分析
- ゲーム理論と戦略的思考
- 価値創造と統合的交渉
- 立場の異なる関係者との調整技術
- 文化的背景を考慮した交渉手法
- 長期的な関係性を保ちながらの交渉戦略

【交渉状況の詳細分析】
- 目標: ${context.goal}
- 時間制限: ${context.timeLimit}
- 重要度: ${context.stakes}
- 関係性: ${context.relationship || '未指定'}

【交渉フェーズ別専門アドバイス】
以下の3つの具体的で実践的なアドバイスを提供してください：

1. **交渉準備・情報収集段階のアドバイス**
   - 相手の立場と制約の詳細分析
   - 自分の立場と代替案の準備
   - 交渉の場とタイミングの最適化
   - 関係者への事前調整と根回し

2. **交渉進行・価値創造段階のアドバイス**
   - 相手の真のニーズと関心事の把握
   - 共通利益と相乗効果の創出
   - 創造的な解決策の提案と検討
   - 関係性の構築と信頼の醸成

3. **合意形成・クロージング段階のアドバイス**
   - 合意事項の明確化と文書化
   - 実行可能性と持続可能性の確保
   - 関係者への合意内容の共有
   - 次回交渉への布石と関係性の維持

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
- ゼロサムゲームから正和ゲームへの転換
- 相手の心理的ニーズと物質的ニーズの区別
- 文化的背景と交渉スタイルの違いへの対応
- 長期的な関係性と短期的な利益のバランス
- 交渉の場の設定と雰囲気作り
- 関係者への影響とステークホルダー管理`

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
