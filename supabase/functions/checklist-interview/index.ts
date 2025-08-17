// 面談専用のチェックリスト生成Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { generateAIAdvice, type AIContext } from "../_shared/ai-utils.ts"

interface InterviewChecklistRequest {
  scene: string;
  goal: string;
  time_limit: string;
  stakes: string;
  interview_type: string; // 採用面接、評価面談、退職面談、相談、指導
  relationship: string; // 上司-部下、人事-従業員、外部コンサルタント-クライアント
  interview_purpose: string; // 評価、指導、相談解決、関係構築
  additional_context?: string;
}

interface ChecklistItem {
  id: string;
  category: string;
  question: string;
  description: string;
  importance: 'critical' | 'important' | 'recommended';
  examples: string[];
  reasoning: string;
  timing: string;
  specific_advice: string; // 面談特有の具体的なアドバイス
}

interface ChecklistResponse {
  checklist: ChecklistItem[];
  summary: string;
  recommendations: string[];
  interview_specific_tips: string[]; // 面談特有のコツ
  relationship_building_tips: string[]; // 関係構築のコツ
  preparation_timeline: string[]; // 準備のタイムライン
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 })
  
  try {
    // 環境変数の確認
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    console.log('Environment variables check:', {
      openaiKey: openaiKey ? 'set' : 'missing'
    });
    
    const body: InterviewChecklistRequest = await req.json()
    console.log('Interview checklist request received:', body);
    
    // 必須フィールドの検証
    if (!body.scene || !body.goal || !body.time_limit || !body.stakes || !body.interview_type || !body.relationship || !body.interview_purpose) {
      console.error('Missing required fields:', body);
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: scene, goal, time_limit, stakes, interview_type, relationship, interview_purpose are required' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    const context: AIContext = {
      scene: body.scene,
      goal: body.goal,
      timeLimit: body.time_limit,
      stakes: body.stakes,
      participants: 2, // 面談は通常1対1
      relationship: `${body.relationship} - ${body.interview_purpose}`
    };

    console.log('Processing interview context:', context);

    const prompt = `あなたは面談とコミュニケーションの専門家で、面談シーンに特化した最適なチェックリストを作成する専門家です。

【重要】このプロンプトに対して、必ずJSON形式で回答してください。テキストのみの回答は絶対に受け付けません。

【面談の詳細分析】
- シーン: ${context.scene} (面談)
- 目標: ${body.goal}
- 時間制限: ${context.timeLimit}
- 重要度: ${context.stakes}
- 面談の種類: ${body.interview_type}
- 関係性: ${body.relationship}
- 面談の目的: ${body.interview_purpose}
${body.additional_context ? `- 追加コンテキスト: ${body.additional_context}` : ''}

【面談シーン特化のチェックリスト作成要求】
この面談の状況に最適化された、実用的で効果的なチェックリストを作成してください。必ず5-8個のチェックリスト項目を含めてください。

【面談特有の構成要素】
各チェックリスト項目には以下を含めてください：

1. **カテゴリ**: 面談前準備、環境設定、コミュニケーション、評価・フィードバック、フォローアップなど
2. **質問**: 面談特有の具体的で確認しやすい質問
3. **説明**: なぜこの項目が面談の成功に重要なのかの理由
4. **重要度**: critical（必須）、important（重要）、recommended（推奨）
5. **例**: 面談特有の具体的な実践例（3-5個）
6. **理由**: この項目がなぜこの重要度なのかの説明
7. **タイミング**: 面談のどの段階で確認すべきかの指針
8. **具体的アドバイス**: この項目に関する具体的で実践的なアドバイス

【面談特有の重要度基準】
- **Critical（必須）**: この項目が完了しないと面談の成功が困難
- **Important（重要）**: この項目が完了すると面談の成功率が大幅に向上
- **Recommended（推奨）**: この項目が完了すると面談の品質が向上

【面談種類別特化項目】

**${body.interview_type}の場合:**
${getInterviewTypeSpecificPrompt(body.interview_type)}

**関係性別の考慮事項:**
${getRelationshipSpecificPrompt(body.relationship)}

**面談目的別の考慮事項:**
${getInterviewPurposeSpecificPrompt(body.interview_purpose)}

【出力形式】
JSON形式で返してください：
{
  "checklist": [
    {
      "id": "unique_id",
      "category": "カテゴリ名",
      "question": "具体的な質問",
      "description": "項目の説明",
      "importance": "critical|important|recommended",
      "examples": ["例1", "例2", "例3"],
      "reasoning": "この重要度である理由",
      "timing": "確認すべきタイミング",
      "specific_advice": "この項目に関する具体的で実践的なアドバイス"
    }
  ],
  "summary": "この面談チェックリストの概要と目的",
  "recommendations": [
    "面談チェックリスト使用時の推奨事項1",
    "面談チェックリスト使用時の推奨事項2",
    "面談チェックリスト使用時の推奨事項3"
  ],
  "interview_specific_tips": [
    "この面談種類に特化したコツ1",
    "この面談種類に特化したコツ2",
    "この面談種類に特化したコツ3"
  ],
  "relationship_building_tips": [
    "この関係性構築のコツ1",
    "この関係性構築のコツ2",
    "この関係性構築のコツ3"
  ],
  "preparation_timeline": [
    "面談前の準備タイムライン1",
    "面談前の準備タイムライン2",
    "面談前の準備タイムライン3"
  ]
}

【面談特有の専門的視点】
- 面談の目的に応じた適切なアプローチの選択
- 関係性に応じたコミュニケーションスタイルの調整
- 時間制限に応じた面談内容の優先順位付け
- 相手の立場と関心事を考慮した配慮
- 面談後のフォローアップと継続的な関係性の構築
- 信頼関係の構築と維持の重要性`

    try {
      console.log('Calling AI for interview checklist...');
      const aiResponse = await generateAIAdvice(prompt, context);
      console.log('AI response received for interview:', aiResponse);
      
      // AIレスポンスからチェックリストを抽出
      const checklistData = extractChecklistFromAIResponse(aiResponse);
      console.log('Extracted interview checklist data:', checklistData);
      
      return new Response(JSON.stringify(checklistData), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (error) {
      console.error("AI generation failed for interview:", error);
      // フォールバック用の面談特化チェックリスト
      const fallbackChecklist = generateInterviewFallbackChecklist(body);
      console.log('Using interview fallback checklist:', fallbackChecklist);
      return new Response(JSON.stringify(fallbackChecklist), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  } catch (error) {
    console.error('Interview checklist function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    })
  }
});

// 面談種類別特化プロンプト
function getInterviewTypeSpecificPrompt(interviewType: string): string {
  const interviewTypePrompts: Record<string, string> = {
    '採用面接': `採用面接特有の項目を含めてください：
- 候補者の経歴とスキルの確認
- 職務要件との適合性の評価
- 候補者の意欲と価値観の把握
- チームとの相性と文化適合性
- 候補者の質問への適切な回答`,

    '評価面談': `評価面談特有の項目を含めてください：
- 過去の成果と課題の客観的評価
- 具体的な改善点と成長機会の提示
- 次期の目標設定と期待値の明確化
- 建設的フィードバックの提供
- サポート体制と育成計画の確認`,

    '退職面談': `退職面談特有の項目を含めてください：
- 退職理由の真摯な聴取と理解
- 改善可能な課題の特定と対策
- 退職後の関係性とネットワークの維持
- 後任への引き継ぎと知識移転
- 会社への建設的フィードバック`,

    '相談': `相談面談特有の項目を含めてください：
- 相談内容の詳細な聴取と理解
- 相談者の立場と関心事の把握
- 適切なアドバイスと解決策の提示
- 相談者の自己解決能力の育成
- 継続的なサポート体制の構築`,

    '指導': `指導面談特有の項目を含めてください：
- 指導対象の現状と課題の把握
- 具体的な改善方法と手順の提示
- 実践的な練習とフィードバック
- 成長の確認と次のステップの設定
- 継続的な学習と成長の促進`
  };

  return interviewTypePrompts[interviewType] || `一般的な面談の項目を含めてください：
- 面談の目的と目標の明確化
- 相手の立場と関心事の理解
- 適切なコミュニケーション方法
- 面談後のフォローアップ計画
- 関係性の構築と維持`;
}

// 関係性別特化プロンプト
function getRelationshipSpecificPrompt(relationship: string): string {
  const relationshipPrompts: Record<string, string> = {
    '上司-部下': `上司-部下関係特有の考慮事項：
- 上司としての責任と権限の適切な行使
- 部下の成長と発展の支援
- 明確で建設的なフィードバックの提供
- 部下の意見やアイデアの積極的な活用
- 長期的なキャリア開発の視点`,

    '人事-従業員': `人事-従業員関係特有の考慮事項：
- 公平性と客観性の維持
- 個人情報の適切な取り扱い
- 組織の制度とルールの説明
- 従業員の権利と義務の明確化
- 組織全体の利益との調整`,

    '外部コンサルタント-クライアント': `外部コンサルタント-クライアント関係特有の考慮事項：
- 専門性と客観性の活用
- クライアントの課題の深掘りと理解
- 具体的で実践的な解決策の提示
- 長期的なパートナーシップの構築
- 継続的な価値提供の約束`
  };

  return relationshipPrompts[relationship] || '- 関係性に応じた適切なアプローチの検討';
}

// 面談目的別特化プロンプト
function getInterviewPurposeSpecificPrompt(interviewPurpose: string): string {
  const purposePrompts: Record<string, string> = {
    '評価': `評価目的特有の考慮事項：
- 客観的で公平な評価基準の適用
- 具体的な証拠と事例の提示
- 評価結果の根拠と理由の説明
- 改善点と成長機会の明確化
- 次期の目標設定と期待値の調整`,

    '指導': `指導目的特有の考慮事項：
- 指導対象の現状と課題の正確な把握
- 段階的で実践的な指導方法の選択
- 具体的な改善手順と練習方法の提示
- 継続的なフィードバックとサポート
- 成長の確認と次のステップの設定`,

    '相談解決': `相談解決目的特有の考慮事項：
- 相談内容の詳細な聴取と理解
- 相談者の立場と関心事の把握
- 適切なアドバイスと解決策の提示
- 相談者の自己解決能力の育成
- 継続的なサポート体制の構築`,

    '関係構築': `関係構築目的特有の考慮事項：
- 相互理解と信頼関係の促進
- 共通の目標と価値観の共有
- 効果的なコミュニケーション方法の確立
- 長期的な関係性の構築
- 継続的な価値提供の約束`
  };

  return purposePrompts[interviewPurpose] || '- 面談目的に応じた適切なアプローチの検討';
}

// AIレスポンスからチェックリストを抽出
function extractChecklistFromAIResponse(aiResponse: any): ChecklistResponse {
  try {
    console.log('Extracting interview checklist from AI response:', aiResponse);
    
    if (aiResponse) {
      // 直接チェックリストが含まれている場合
      if (aiResponse.checklist && Array.isArray(aiResponse.checklist)) {
        console.log('Found checklist in response');
        return aiResponse;
      }
      
      // アドバイスが含まれている場合
      if (aiResponse.advices && Array.isArray(aiResponse.advices)) {
        console.log('Found advices, converting to checklist format');
        return convertAdvicesToChecklist(aiResponse.advices);
      }
      
      // 配列の場合、最初の要素を確認
      if (Array.isArray(aiResponse) && aiResponse.length > 0) {
        const firstResponse = aiResponse[0];
        console.log('First response:', firstResponse);
        
        if (firstResponse.checklist && Array.isArray(firstResponse.checklist)) {
          console.log('Found checklist in first response');
          return firstResponse;
        }
        
        if (firstResponse.advices && Array.isArray(firstResponse.advices)) {
          console.log('Found advices in first response, converting to checklist format');
          return convertAdvicesToChecklist(firstResponse.advices);
        }
      }
    }
    
    // フォールバック
    console.log('Failed to extract interview checklist, using fallback');
    throw new Error("Failed to extract interview checklist from AI response");
  } catch (error) {
    console.error("Interview checklist extraction failed:", error);
    throw error;
  }
}

// アドバイスをチェックリスト形式に変換
function convertAdvicesToChecklist(advices: any[]): ChecklistResponse {
  const checklist = advices.map((advice, index) => ({
    id: `interview_advice_${index}`,
    category: "面談準備・実行",
    question: advice.short_advice || "この面談アドバイスは実行可能ですか？",
    description: advice.expected_effect || "面談の効果的な実行のための確認事項",
    importance: "important" as const,
    examples: [
      "具体的な面談計画を立てる",
      "必要な資料を準備する",
      "面談のタイミングを決める"
    ],
    reasoning: "この面談アドバイスの効果的な実行のため",
    timing: "面談開始前",
    specific_advice: "面談特有の具体的なアドバイス"
  }));

  return {
    checklist,
    summary: "AI生成された面談アドバイスをチェックリスト形式に変換しました。",
    recommendations: [
      "各面談項目を順番に確認してください",
      "実行可能な項目から始めてください",
      "必要に応じて面談戦略を調整してください"
    ],
    interview_specific_tips: [
      "面談の目的を明確にする",
      "相手の立場を理解する",
      "効果的なコミュニケーションを心がける"
    ],
    relationship_building_tips: [
      "信頼関係を構築する",
      "相互理解を促進する",
      "長期的な関係性を維持する"
    ],
    preparation_timeline: [
      "面談前日までに資料を準備",
      "面談開始1時間前に環境を確認",
      "面談開始30分前に最終準備"
    ]
  };
}

// フォールバック用の面談特化チェックリスト
function generateInterviewFallbackChecklist(body: InterviewChecklistRequest): ChecklistResponse {
  return {
    checklist: [
      {
        id: "interview_preparation",
        category: "面談前準備",
        question: "面談の目的と目標は明確に設定されていますか？",
        description: "面談の目的と目標を明確にすることで、効果的な面談が可能になります。",
        importance: "critical",
        examples: ["目的の明確化", "目標の設定", "期待される成果の定義"],
        reasoning: "目的が不明確だと、面談の方向性が曖昧になり、効果が低下します。",
        timing: "面談開始前",
        specific_advice: `${body.interview_type}では、具体的で測定可能な目標設定が重要です。`
      },
      {
        id: "environment_setting",
        category: "環境設定",
        question: "面談に適した環境は準備されていますか？",
        description: "適切な環境により、面談がスムーズに進行し、効果的なコミュニケーションが可能になります。",
        importance: "critical",
        examples: ["静かな場所の確保", "適切な座席配置", "プライバシーの確保"],
        reasoning: "環境が不適切だと、面談に集中できず、効果が低下します。",
        timing: "面談開始前",
        specific_advice: `${body.relationship}では、相手が安心して話せる環境が特に重要です。`
      },
      {
        id: "communication_plan",
        category: "コミュニケーション計画",
        question: "効果的なコミュニケーション方法は計画されていますか？",
        description: "適切なコミュニケーション方法により、相手の理解と関与が向上します。",
        importance: "important",
        examples: ["質問の準備", "聴き方の工夫", "フィードバック方法"],
        reasoning: "コミュニケーションが不適切だと、相手の理解が困難になり、面談の効果が低下します。",
        timing: "面談開始前",
        specific_advice: `${body.interview_purpose}では、相手の立場に立ったコミュニケーションが効果的です。`
      },
      {
        id: "feedback_preparation",
        category: "フィードバック準備",
        question: "適切なフィードバックは準備されていますか？",
        description: "適切なフィードバックにより、面談の成果と継続的な改善が可能になります。",
        importance: "important",
        examples: ["具体的な例の準備", "建設的な提案の検討", "フォローアップ計画"],
        reasoning: "フィードバックが不適切だと、面談の成果が不明確になり、継続性が失われます。",
        timing: "面談進行中・終了後",
        specific_advice: `${body.interview_type}では、具体的で実践的なフィードバックが重要です。`
      },
      {
        id: "follow_up_plan",
        category: "フォローアップ計画",
        question: "面談後のフォローアップ計画は策定されていますか？",
        description: "適切なフォローアップにより、面談の成果を確実に実行に移すことができます。",
        importance: "recommended",
        examples: ["アクションアイテムの設定", "次回面談の日程調整", "進捗確認の方法"],
        reasoning: "フォローアップが不十分だと、面談の成果が実行されず、面談の価値が失われます。",
        timing: "面談終了後",
        specific_advice: `${body.interview_purpose}では、継続的なフォローアップが成功の鍵です。`
      }
    ],
    summary: `${body.interview_type}に特化した基本的な準備状況を確認するチェックリストです。`,
    recommendations: [
      "各面談項目を順番に確認してください",
      "面談の目的に応じて項目を調整してください",
      "関係性に応じて優先順位を設定してください",
      "定期的に面談の効果を評価し、チェックリストを更新してください"
    ],
    interview_specific_tips: [
      `${body.interview_type}では、相手の準備が成功の鍵です`,
      `${body.relationship}では、相互理解が特に重要です`,
      `${body.interview_purpose}では、目的の明確化が効果を左右します`
    ],
    relationship_building_tips: [
      `${body.relationship}では、信頼関係の構築が重要です`,
      `${body.interview_purpose}では、継続的な関係性の維持が効果的です`,
      `${body.interview_type}では、長期的な視点でのアプローチが重要です`
    ],
    preparation_timeline: [
      "面談前日までに目的と資料を準備・確認",
      "面談開始1時間前に環境と設備を確認",
      "面談開始30分前に最終準備と心構えの確認"
    ]
  };
}
