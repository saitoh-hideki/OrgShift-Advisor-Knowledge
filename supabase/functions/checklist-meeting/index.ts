// 会議・ミーティング専用のチェックリスト生成Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { generateAIAdvice, type AIContext } from "../_shared/ai-utils.ts"
import { adminClient, diagnoseEnvironment } from "../_shared/client.ts"

interface MeetingChecklistRequest {
  scene: string;
  goal: string;
  time_limit: string;
  stakes: string;
  meeting_type: string; // 定例会議、プロジェクト会議、意思決定会議、ブレインストーミング、報告会
  participants_count: number; // 少人数(2-5)、中規模(6-15)、大規模(16+)
  participant_roles: string[]; // 上司、同僚、部下、他部署、クライアント、ベンダー
  meeting_format: string; // 対面、オンライン、ハイブリッド
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
  specific_advice: string; // 会議特有の具体的なアドバイス
}

interface ChecklistResponse {
  checklist: ChecklistItem[];
  summary: string;
  recommendations: string[];
  meeting_specific_tips: string[]; // 会議特有のコツ
  preparation_timeline: string[]; // 準備のタイムライン
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 })
  
  try {
    // 環境変数の診断
    const envDiagnosis = diagnoseEnvironment();
    console.log('Environment diagnosis:', envDiagnosis);
    
    const body: MeetingChecklistRequest = await req.json()
    console.log('Meeting checklist request received:', body);
    
    // 必須フィールドの検証
    if (!body.scene || !body.goal || !body.time_limit || !body.stakes || !body.meeting_type || !body.participants_count || !body.participant_roles) {
      console.error('Missing required fields:', body);
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: scene, goal, time_limit, stakes, meeting_type, participants_count, participant_roles are required' 
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
      participants: body.participants_count,
      relationship: body.participant_roles.join(', ')
    };

    console.log('Processing meeting context:', context);

    const prompt = `あなたは会議ファシリテーションと意思決定の専門家で、会議・ミーティングシーンに特化した最適なチェックリストを作成する専門家です。

【会議の詳細分析】
- シーン: ${context.scene} (会議・ミーティング)
- 目標: ${context.goal}
- 時間制限: ${context.timeLimit}
- 重要度: ${context.stakes}
- 会議の種類: ${body.meeting_type}
- 参加者数: ${body.participants_count}人
- 参加者の役割: ${body.participant_roles.join(', ')}
- 会議形式: ${body.meeting_format}
${body.additional_context ? `- 追加コンテキスト: ${body.additional_context}` : ''}

【会議シーン特化のチェックリスト作成要求】
この会議の状況に最適化された、実用的で効果的なチェックリストを作成してください。

【会議特有の構成要素】
各チェックリスト項目には以下を含めてください：

1. **カテゴリ**: 会議前準備、参加者調整、会議進行、意思決定、フォローアップ、リスク管理など
2. **質問**: 会議特有の具体的で確認しやすい質問
3. **説明**: なぜこの項目が会議の成功に重要なのかの理由
4. **重要度**: critical（必須）、important（重要）、recommended（推奨）
5. **例**: 会議特有の具体的な実践例（3-5個）
6. **理由**: この項目がなぜこの重要度なのかの説明
7. **タイミング**: 会議のどの段階で確認すべきかの指針
8. **具体的アドバイス**: この項目に関する具体的で実践的なアドバイス

【会議特有の重要度基準】
- **Critical（必須）**: この項目が完了しないと会議の成功が困難
- **Important（重要）**: この項目が完了すると会議の成功率が大幅に向上
- **Recommended（推奨）**: この項目が完了すると会議の品質が向上

【会議の種類別特化項目】

**${body.meeting_type}の場合:**
${getMeetingTypeSpecificPrompt(body.meeting_type)}

**参加者数別の考慮事項:**
${getParticipantsCountSpecificPrompt(body.participants_count)}

**参加者役割別の考慮事項:**
${getParticipantRolesSpecificPrompt(body.participant_roles)}

**会議形式別の考慮事項:**
${getMeetingFormatSpecificPrompt(body.meeting_format)}

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
  "summary": "この会議チェックリストの概要と目的",
  "recommendations": [
    "会議チェックリスト使用時の推奨事項1",
    "会議チェックリスト使用時の推奨事項2",
    "会議チェックリスト使用時の推奨事項3"
  ],
  "meeting_specific_tips": [
    "この会議の種類に特化したコツ1",
    "この会議の種類に特化したコツ2",
    "この会議の種類に特化したコツ3"
  ],
  "preparation_timeline": [
    "会議前の準備タイムライン1",
    "会議前の準備タイムライン2",
    "会議前の準備タイムライン3"
  ]
}

【会議特有の専門的視点】
- 参加者数に応じた会議形式の最適化
- 時間制限に応じた議題の優先順位付け
- 参加者の役割に応じたコミュニケーションスタイルの調整
- 会議の目的に応じた進行方法の選択
- 会議後の成果測定と継続性の確保
- 参加者の立場と関心事を考慮したアプローチ`

    try {
      console.log('Calling AI for meeting checklist...');
      const aiResponse = await generateAIAdvice(prompt, context);
      console.log('AI response received for meeting:', aiResponse);
      
      // AIレスポンスからチェックリストを抽出
      const checklistData = extractChecklistFromAIResponse(aiResponse);
      console.log('Extracted meeting checklist data:', checklistData);
      
      return new Response(JSON.stringify(checklistData), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (error) {
      console.error("AI generation failed for meeting:", error);
      // フォールバック用の会議特化チェックリスト
      const fallbackChecklist = generateMeetingFallbackChecklist(body);
      console.log('Using meeting fallback checklist:', fallbackChecklist);
      return new Response(JSON.stringify(fallbackChecklist), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  } catch (error) {
    console.error('Meeting checklist function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    })
  }
});

// 会議の種類別特化プロンプト
function getMeetingTypeSpecificPrompt(meetingType: string): string {
  const meetingTypePrompts: Record<string, string> = {
    '定例会議': `定例会議特有の項目を含めてください：
- 前回会議の議事録とアクションアイテムの確認
- 今回の議題の優先順位付け
- 定期的な進捗報告の準備
- 継続的な課題の追跡と解決策の検討
- 次回会議の日程と議題の調整`,

    'プロジェクト会議': `プロジェクト会議特有の項目を含めてください：
- プロジェクトの進捗状況の詳細確認
- マイルストーンの達成状況と課題の特定
- リソース配分とスケジュール調整
- リスク要因の特定と対策の検討
- ステークホルダーへの報告内容の準備`,

    '意思決定会議': `意思決定会議特有の項目を含めてください：
- 決定すべき事項の明確化と選択肢の整理
- 各選択肢のメリット・デメリットの分析
- 意思決定プロセスと責任者の明確化
- 合意形成のための議論の進め方
- 決定事項の実行計画とフォローアップ体制`,

    'ブレインストーミング': `ブレインストーミング特有の項目を含めてください：
- 創造的なアイデア発想のための環境設定
- 参加者の役割とファシリテーション方法
- アイデアの記録と整理方法
- 評価基準と優先順位付けの方法
- アイデアの実現可能性と次のステップ`,

    '報告会': `報告会特有の項目を含めてください：
- 報告内容の構成と時間配分
- 視覚資料の準備と効果的なプレゼンテーション
- 質疑応答への準備と対応方法
- 聴衆の関心と理解度の確認方法
- 報告後のアクションアイテムの設定`
  };

  return meetingTypePrompts[meetingType] || `一般的な会議の項目を含めてください：
- 議題の明確化と時間配分
- 参加者の準備状況確認
- 会議の進行管理と時間管理
- 意思決定プロセスの明確化
- アクションアイテムの設定とフォローアップ`;
}

// 参加者数別特化プロンプト
function getParticipantsCountSpecificPrompt(participantsCount: number): string {
  if (participantsCount <= 5) {
    return `少人数会議（2-5人）特有の考慮事項：
- 全員が発言できる機会の確保
- 個別の意見や関心事の深掘り
- インフォーマルな議論の促進
- 迅速な意思決定と合意形成
- 参加者全員のエンゲージメント維持`;
  } else if (participantsCount <= 15) {
    return `中規模会議（6-15人）特有の考慮事項：
- グループ分けやブレークアウトセッションの活用
- 時間管理と発言時間の調整
- 参加者の役割と責任の明確化
- 議題の優先順位付けと時間配分
- 全員の意見を集約する方法`;
  } else {
    return `大規模会議（16人以上）特有の考慮事項：
- 司会者とファシリテーターの役割分担
- 参加者のグループ分けと段階的な議論
- 時間管理の厳格化と議題の絞り込み
- 意思決定プロセスの明確化と投票システム
- フォローアップ会議の計画`;
  }
}

// 参加者役割別特化プロンプト
function getParticipantRolesSpecificPrompt(participantRoles: string[]): string {
  const roleSpecificPrompts: string[] = [];
  
  if (participantRoles.includes('上司')) {
    roleSpecificPrompts.push('- 上司の期待と関心事の把握');
    roleSpecificPrompts.push('- 意思決定権限と承認プロセスの確認');
    roleSpecificPrompts.push('- 上司への適切な報告と相談方法');
  }
  
  if (participantRoles.includes('同僚')) {
    roleSpecificPrompts.push('- 同僚との協力関係の構築');
    roleSpecificPrompts.push('- 共通の課題と解決策の共有');
    roleSpecificPrompts.push('- 相互理解と信頼関係の促進');
  }
  
  if (participantRoles.includes('部下')) {
    roleSpecificPrompts.push('- 部下の成長と学習機会の提供');
    roleSpecificPrompts.push('- 明確な指示と期待値の設定');
    roleSpecificPrompts.push('- 部下の意見やアイデアの積極的な活用');
  }
  
  if (participantRoles.includes('他部署')) {
    roleSpecificPrompts.push('- 他部署の立場と関心事の理解');
    roleSpecificPrompts.push('- 部門間の調整と連携の促進');
    roleSpecificPrompts.push('- 共通の目標と協力体制の構築');
  }
  
  if (participantRoles.includes('クライアント')) {
    roleSpecificPrompts.push('- クライアントのニーズと期待値の把握');
    roleSpecificPrompts.push('- プロフェッショナルな対応と信頼関係の構築');
    roleSpecificPrompts.push('- クライアントの満足度向上のための配慮');
  }
  
  if (participantRoles.includes('ベンダー')) {
    roleSpecificPrompts.push('- ベンダーの専門性と制約の理解');
    roleSpecificPrompts.push('- 明確な要件と期待値の伝達');
    roleSpecificPrompts.push('- 長期的なパートナーシップの構築');
  }
  
  return roleSpecificPrompts.join('\n') || '- 参加者の役割に応じた適切なアプローチの検討';
}

// 会議形式別特化プロンプト
function getMeetingFormatSpecificPrompt(meetingFormat: string): string {
  const formatPrompts: Record<string, string> = {
    '対面': `対面会議特有の考慮事項：
- 会議室の準備と設備の確認
- 参加者の座席配置と資料の配布
- 非言語コミュニケーションの活用
- 会議室の環境（温度、照明、音響）の調整
- 参加者の到着確認と開始時間の管理`,

    'オンライン': `オンライン会議特有の考慮事項：
- 技術的な準備と接続テスト
- 参加者の音声・映像設定の確認
- 画面共有と資料の事前アップロード
- チャット機能と投票機能の活用
- 参加者の集中力維持のための工夫`,

    'ハイブリッド': `ハイブリッド会議特有の考慮事項：
- 対面・オンライン参加者の公平な参加機会の確保
- 技術的な統合と音声・映像の調整
- 両方の参加者にとって分かりやすい進行方法
- 資料の共有とアクセシビリティの確保
- 参加者全員のエンゲージメント維持`
  };

  return formatPrompts[meetingFormat] || '- 会議形式に応じた適切な準備と進行方法の検討';
}

// AIレスポンスからチェックリストを抽出
function extractChecklistFromAIResponse(aiResponse: any): ChecklistResponse {
  try {
    console.log('Extracting meeting checklist from AI response:', aiResponse);
    
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
    console.log('Failed to extract meeting checklist, using fallback');
    throw new Error("Failed to extract meeting checklist from AI response");
  } catch (error) {
    console.error("Meeting checklist extraction failed:", error);
    throw error;
  }
}

// アドバイスをチェックリスト形式に変換
function convertAdvicesToChecklist(advices: any[]): ChecklistResponse {
  const checklist = advices.map((advice, index) => ({
    id: `meeting_advice_${index}`,
    category: "会議準備・実行",
    question: advice.short_advice || "この会議アドバイスは実行可能ですか？",
    description: advice.expected_effect || "会議の効果的な実行のための確認事項",
    importance: "important" as const,
    examples: [
      "具体的な行動計画を立てる",
      "必要な資料を準備する",
      "会議のタイミングを決める"
    ],
    reasoning: "この会議アドバイスの効果的な実行のため",
    timing: "会議開始前",
    specific_advice: "会議特有の具体的なアドバイス"
  }));

  return {
    checklist,
    summary: "AI生成された会議アドバイスをチェックリスト形式に変換しました。",
    recommendations: [
      "各会議項目を順番に確認してください",
      "実行可能な項目から始めてください",
      "必要に応じて会議形式を調整してください"
    ],
    meeting_specific_tips: [
      "会議の目的を明確にする",
      "参加者の準備を促す",
      "時間管理を徹底する"
    ],
    preparation_timeline: [
      "会議前日までに資料を準備",
      "会議開始30分前に会議室を確認",
      "会議開始10分前に参加者を確認"
    ]
  };
}

// フォールバック用の会議特化チェックリスト
function generateMeetingFallbackChecklist(body: MeetingChecklistRequest): ChecklistResponse {
  return {
    checklist: [
      {
        id: "meeting_agenda",
        category: "会議前準備",
        question: "アジェンダは明確に設計され、参加者に共有されていますか？",
        description: "明確なアジェンダがあることで、会議の目的と進行が明確になり、効率的な会議が可能になります。",
        importance: "critical",
        examples: ["議題を優先順位付け", "時間配分を設定", "期待される成果を定義"],
        reasoning: "アジェンダが不明確だと、会議の方向性が曖昧になり、時間の無駄が発生します。",
        timing: "会議開始前",
        specific_advice: `${body.meeting_type}の場合、特に重要な議題を最初に配置し、参加者の関心を引く構成にしましょう。`
      },
      {
        id: "meeting_participants",
        category: "参加者準備",
        question: "参加者は会議の目的と自分の役割を理解していますか？",
        description: "参加者が適切に準備されることで、会議の質と参加者のエンゲージメントが向上します。",
        importance: "critical",
        examples: ["事前資料の共有", "役割の明確化", "準備時間の確保"],
        reasoning: "参加者の準備不足は、会議の進行を遅らせ、成果を低下させます。",
        timing: "会議開始前",
        specific_advice: `${body.participant_roles.join(', ')}の参加者には、それぞれの立場に応じた事前準備を促しましょう。`
      },
      {
        id: "meeting_time_management",
        category: "時間管理",
        question: "会議の時間配分と進行管理の計画は立てられていますか？",
        description: "適切な時間管理により、すべての議題を効率的に処理し、参加者の時間を尊重できます。",
        importance: "important",
        examples: ["各議題の時間設定", "進行役の指定", "時間超過への対応策"],
        reasoning: "時間管理が不適切だと、重要な議題が処理できず、会議の効果が低下します。",
        timing: "会議開始前・進行中",
        specific_advice: `${body.participants_count}人の参加者には、一人あたりの発言時間を考慮した時間配分を設定しましょう。`
      },
      {
        id: "meeting_decision_process",
        category: "意思決定",
        question: "会議での意思決定プロセスは明確に定義されていますか？",
        description: "明確な意思決定プロセスにより、合意形成がスムーズになり、会議の成果が向上します。",
        importance: "important",
        examples: ["決定方法の明確化", "合意の確認方法", "責任者の指定"],
        reasoning: "意思決定プロセスが不明確だと、会議が長引き、成果が曖昧になります。",
        timing: "会議進行中",
        specific_advice: `${body.meeting_type}では、参加者の合意を得るための具体的なプロセスを事前に準備しましょう。`
      },
      {
        id: "meeting_follow_up",
        category: "フォローアップ",
        question: "会議後のアクションアイテムとフォローアップ計画は策定されていますか？",
        description: "適切なフォローアップにより、会議の成果を確実に実行に移すことができます。",
        importance: "recommended",
        examples: ["アクションアイテムの文書化", "責任者の明確化", "次回会議の日程調整"],
        reasoning: "フォローアップが不十分だと、会議の成果が実行されず、会議の価値が失われます。",
        timing: "会議終了後",
        specific_advice: `${body.meeting_type}の成果を継続的に追跡し、次回会議での改善点を特定しましょう。`
      }
    ],
    summary: `${body.meeting_type}に特化した基本的な準備状況を確認するチェックリストです。`,
    recommendations: [
      "各会議項目を順番に確認してください",
      "会議の目的に応じて項目を調整してください",
      "参加者数や時間制限に応じて優先順位を設定してください",
      "定期的に会議の効果を評価し、チェックリストを更新してください"
    ],
    meeting_specific_tips: [
      `${body.meeting_type}では、参加者の準備が成功の鍵です`,
      `${body.participants_count}人の参加者には、全員が発言できる機会を確保しましょう`,
      `${body.meeting_format}形式では、技術的な準備が重要です`
    ],
    preparation_timeline: [
      "会議前日までにアジェンダと資料を準備・共有",
      "会議開始1時間前に会議室・オンライン環境を確認",
      "会議開始30分前に参加者への最終確認"
    ]
  };
}
