import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { sceneConfigs, getSceneConfig, getSceneName } from './src/scene-configs';
import ChecklistComponent from './src/ChecklistComponent';
import * as api from './src/api';

const { width: screenWidth } = Dimensions.get('window');

interface Advice {
  id?: string;
  theory_id: string;
  theory_name_ja?: string;
  short_advice: string;
  expected_effect: string;
  caution?: string;
  tips?: string;
  related_theory?: string;
  implementation_steps: string[];
  success_indicators: string[];
  common_mistakes: string[];
  selected_rank?: number;
}

interface Theory {
  id: string;
  name: string;
  description: string;
  key_concepts: string[];
  when_to_use: string[];
  examples: string[];
  related_theories?: Array<{
    id: string;
    name: string;
    description: string;
    relevance: string;
    academic_field: string;
    key_concepts: string[];
    when_to_use: string[];
    examples: string[];
    practical_tips: string[];
  }>;
}

interface RecentAdvice {
  id: string;
  scene: string;
  goal: string;
  timeLimit: string;
  stakes: string;
  participants?: number;
  relationship?: string;
  advice: Advice;
  timestamp: Date;
}

export default function App() {
  const [currentView, setCurrentView] = useState<'main' | 'input' | 'checklist' | 'advices' | 'theory' | 'theoryMemo' | 'theoryDetail'>('main');
  const [scene, setScene] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [timeLimit, setTimeLimit] = useState<string>('');
  const [stakes, setStakes] = useState<string>('');
  const [participants, setParticipants] = useState<number>(2);
  const [relationship, setRelationship] = useState<string>('');
  // 理論詳細用の状態
  const [selectedTheoryId, setSelectedTheoryId] = useState<string>('');
  const [selectedTheoryData, setSelectedTheoryData] = useState<any>(null);
  const [isLoadingTheory, setIsLoadingTheory] = useState<boolean>(false);
  // シーン固有の詳細設定を独立したフィールドとして管理
  // 会議・ミーティング用
  const [meetingType, setMeetingType] = useState<string>('');
  const [meetingFormat, setMeetingFormat] = useState<string>('');
  const [meetingUrgency, setMeetingUrgency] = useState<string>('');
  const [meetingFrequency, setMeetingFrequency] = useState<string>('');
  const [meetingParticipants, setMeetingParticipants] = useState<string>('');
  const [meetingTools, setMeetingTools] = useState<string>('');
  const [meetingChallenges, setMeetingChallenges] = useState<string>('');
  
  // 営業・商談用
  const [customerType, setCustomerType] = useState<string>('');
  const [industry, setIndustry] = useState<string>('');
  const [customerPosition, setCustomerPosition] = useState<string>('');
  const [companySize, setCompanySize] = useState<string>('');
  const [salesStage, setSalesStage] = useState<string>('');
  const [dealSize, setDealSize] = useState<string>('');
  const [competitionLevel, setCompetitionLevel] = useState<string>('');
  const [customerPainPoints, setCustomerPainPoints] = useState<string>('');
  
  // プレゼンテーション用
  const [presentationPurpose, setPresentationPurpose] = useState<string>('');
  const [audienceType, setAudienceType] = useState<string>('');
  const [presentationFormat, setPresentationFormat] = useState<string>('');
  const [presentationTopics, setPresentationTopics] = useState<string>('');
  const [audienceExpertise, setAudienceExpertise] = useState<string>('');
  const [presentationConstraints, setPresentationConstraints] = useState<string>('');
  
  // 面談用
  const [interviewType, setInterviewType] = useState<string>('');
  const [interviewRelationship, setInterviewRelationship] = useState<string>('');
  const [interviewPurpose, setInterviewPurpose] = useState<string>('');
  const [interviewContext, setInterviewContext] = useState<string>('');
  const [interviewOutcomes, setInterviewOutcomes] = useState<string>('');
  
  // チーム構築用
  const [teamBuildingType, setTeamBuildingType] = useState<string>('');
  const [teamMaturity, setTeamMaturity] = useState<string>('');
  const [teamContext, setTeamContext] = useState<string>('');
  const [teamSize, setTeamSize] = useState<string>('');
  const [teamDiversity, setTeamDiversity] = useState<string>('');
  const [teamChallenges, setTeamChallenges] = useState<string>('');
  const [advices, setAdvices] = useState<Advice[]>([]);
  const [currentTheory, setCurrentTheory] = useState<Theory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentAdvices, setRecentAdvices] = useState<RecentAdvice[]>([]);

  // 最近使用したアドバイスを保存
  const saveRecentAdvice = async (advice: Advice) => {
    try {
      const newRecentAdvice: RecentAdvice = {
        id: Date.now().toString(),
        scene,
        goal,
        timeLimit,
        stakes,
        participants,
        relationship,
        advice,
        timestamp: new Date()
      };

      // ローカル状態を更新
      setRecentAdvices(prev => {
        const filtered = prev.filter(ra => ra.advice.theory_id !== advice.theory_id);
        return [newRecentAdvice, ...filtered].slice(0, 10); // 最新10件を保持
      });

      // データベースに保存
      const saveResult = await api.saveRecentAdvice({
        scene_id: scene,
        goal,
        time_limit: timeLimit,
        stakes,
        participants,
        relationship,
        theory_id: advice.theory_id,
        short_advice: advice.short_advice,
        expected_effect: advice.expected_effect,
        caution: advice.caution,
        tips: advice.tips,
        related_theory: advice.related_theory,
        implementation_steps: advice.implementation_steps,
        success_indicators: advice.success_indicators,
        common_mistakes: advice.common_mistakes
      });

      console.log('Recent advice saved to database successfully:', saveResult);
    } catch (error) {
      console.error('Failed to save recent advice to database:', error);
      
      // エラーの詳細をログに出力
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      
      // データベース保存に失敗してもローカル状態は保持
      // ユーザーには静かに失敗を隠す（UXを損なわないため）
      // ただし、開発時には詳細なエラー情報を表示
      if (__DEV__) {
        console.warn('Development mode: Recent advice save failed, but local state is maintained');
      }
    }
  };

  // アプリ起動時に最近のアドバイスを復元
  useEffect(() => {
    const loadRecentAdvices = async () => {
      try {
        const response = await api.getRecentAdvices();
        if (response.data && response.data.length > 0) {
          const loadedAdvices: RecentAdvice[] = response.data.map((dbAdvice: any) => ({
            id: dbAdvice.id,
            scene: dbAdvice.scene_id,
            goal: dbAdvice.goal,
            timeLimit: dbAdvice.time_limit,
            stakes: dbAdvice.stakes,
            participants: dbAdvice.participants,
            relationship: dbAdvice.relationship,
            advice: {
              theory_id: dbAdvice.theory_id,
              short_advice: dbAdvice.short_advice,
              expected_effect: dbAdvice.expected_effect,
              caution: dbAdvice.caution,
              tips: dbAdvice.tips,
              related_theory: dbAdvice.related_theory,
              implementation_steps: dbAdvice.implementation_steps,
              success_indicators: dbAdvice.success_indicators,
              common_mistakes: dbAdvice.common_mistakes
            },
            timestamp: new Date(dbAdvice.created_at)
          }));
          
          setRecentAdvices(loadedAdvices);
          console.log('Recent advices loaded from database:', loadedAdvices.length);
        }
      } catch (error) {
        console.error('Failed to load recent advices from database:', error);
        
        // エラーの詳細をログに出力
        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
        }
        
        // データベースからの読み込みに失敗してもアプリは動作する
        // ただし、開発時には詳細なエラー情報を表示
        if (__DEV__) {
          console.warn('Development mode: Recent advices load failed, but app continues to work');
        }
      }
    };

    loadRecentAdvices();
  }, []);

  // アドバイスを取得
  const getAdvice = async () => {
    if (!scene || !goal) {
      Alert.alert('エラー', 'シーンと目標を選択してください');
      return;
    }

    setIsLoading(true);
    try {
      // シーン固有の詳細設定を含むペイロードを作成
      const payload: any = {
        scene,
        goal,
        participants,
        relationship,
        time_limit: timeLimit,
        stakes
      };

      // シーン固有の詳細設定を追加
      if (scene === 'meeting') {
        if (meetingType) payload.meeting_type = meetingType;
        if (meetingFormat) payload.meeting_format = meetingFormat;
        if (meetingUrgency) payload.meeting_urgency = meetingUrgency;
        if (meetingFrequency) payload.meeting_frequency = meetingFrequency;
        if (meetingParticipants) payload.meeting_participants = meetingParticipants;
        if (meetingTools) payload.meeting_tools = meetingTools;
        if (meetingChallenges) payload.meeting_challenges = meetingChallenges;
      } else if (scene === 'sales') {
        if (customerType) payload.customer_type = customerType;
        if (industry) payload.industry = industry;
        if (customerPosition) payload.customer_position = customerPosition;
        if (companySize) payload.company_size = companySize;
        if (salesStage) payload.sales_stage = salesStage;
        if (dealSize) payload.deal_size = dealSize;
        if (competitionLevel) payload.competition_level = competitionLevel;
        if (customerPainPoints) payload.customer_pain_points = customerPainPoints;
      } else if (scene === 'presentation') {
        if (presentationPurpose) payload.presentation_purpose = presentationPurpose;
        if (audienceType) payload.audience_type = audienceType;
        if (audienceType) payload.audience_count = participants;
        if (presentationFormat) payload.presentation_format = presentationFormat;
        if (presentationTopics) payload.presentation_topics = presentationTopics;
        if (audienceExpertise) payload.audience_expertise = audienceExpertise;
        if (presentationConstraints) payload.presentation_constraints = presentationConstraints;
      } else if (scene === 'interview') {
        if (interviewType) payload.interview_type = interviewType;
        if (interviewPurpose) payload.interview_purpose = interviewPurpose;
        if (interviewRelationship) payload.interview_relationship = interviewRelationship;
        if (interviewContext) payload.interview_context = interviewContext;
        if (interviewOutcomes) payload.interview_outcomes = interviewOutcomes;
      } else if (scene === 'team_building') {
        if (teamBuildingType) payload.team_building_type = teamBuildingType;
        if (teamMaturity) payload.team_maturity = teamMaturity;
        if (teamContext) payload.team_context = teamContext;
        if (teamSize) payload.team_size = teamSize;
        if (teamDiversity) payload.team_diversity = teamDiversity;
        if (teamChallenges) payload.team_challenges = teamChallenges;
      }

      console.log('Sending request with payload:', payload);

      const response = await api.createSession(payload);

      console.log('API response:', response);

      if (response.advices && response.advices.length > 0) {
        setAdvices(response.advices);
        setCurrentView('advices');
        // 最初のアドバイスを最近使用に保存
        saveRecentAdvice(response.advices[0]);
      } else {
        console.warn('No advices in response:', response);
        Alert.alert('エラー', 'アドバイスが見つかりませんでした');
      }
    } catch (error) {
      console.error('Error getting advice:', error);
      
      let errorMessage = 'アドバイスの取得に失敗しました';
      
      // エラーの詳細情報をログに出力
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause
        });
        errorMessage = `エラー: ${error.message}`;
      } else {
        console.error('Unknown error type:', typeof error);
        console.error('Error value:', error);
      }
      
      Alert.alert('エラー', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // アドバイスに関連する理論を取得
  const getRelatedTheories = async (advice: Advice) => {
    console.log('getRelatedTheories called with advice:', advice);
    console.log('Current context:', { scene, goal });
    
    setIsLoadingTheory(true);
    
    try {
      // アドバイス内容から一意のIDを生成（一貫性を保つため）
      const adviceContent = `${advice.short_advice} ${advice.expected_effect} ${advice.caution || ''} ${advice.tips || ''}`;
      const adviceId = generateAdviceId(adviceContent);
      
      const requestPayload = {
        scene,
        goal,
        shortAdvice: advice.short_advice,
        additionalContext: `${advice.expected_effect} ${advice.caution || ''} ${advice.tips || ''}`,
        adviceId: adviceId // アドバイスIDを追加
      };
      
      console.log('Sending request to getRelatedTheories with payload:', requestPayload);
      console.log('Generated advice ID:', adviceId);
      
      const response = await api.getRelatedTheories(requestPayload);
      
      console.log('getRelatedTheories response:', response);
      
      if (response.related_theories) {
        console.log('Setting related theories:', response.related_theories);
        setCurrentTheory({
          id: 'related_theories',
          name: '関連理論',
          description: response.summary || 'アドバイスに関連する理論を表示します',
          key_concepts: [],
          when_to_use: [],
          examples: [],
          related_theories: response.related_theories
        });
        setCurrentView('theory');
      } else {
        console.log('No related theories found, falling back to single theory');
        // 従来の方法で理論を取得
        const theoryResponse = await api.getTheory(advice.theory_id);
        setCurrentTheory(theoryResponse);
        setCurrentView('theory');
      }
    } catch (error) {
      console.error('Error getting related theories:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      
      // フォールバック: 従来の方法で理論を取得
      try {
        console.log('Attempting fallback to single theory fetch');
        const theoryResponse = await api.getTheory(advice.theory_id);
        setCurrentTheory(theoryResponse);
        setCurrentView('theory');
      } catch (fallbackError) {
        console.error('Fallback theory fetch also failed:', fallbackError);
        Alert.alert('エラー', '理論の取得に失敗しました');
      }
    } finally {
      setIsLoadingTheory(false);
    }
  };

  // アドバイス内容から一意のIDを生成する関数
  const generateAdviceId = (content: string): string => {
    // 簡単なハッシュ関数で一意のIDを生成
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32ビット整数に変換
    }
    return `advice_${Math.abs(hash)}`;
  };

  // チェックリストに移動
  const goToChecklist = () => {
    if (!scene || !goal) {
      Alert.alert('エラー', 'シーンと目標を選択してください');
      return;
    }
    setCurrentView('checklist');
  };

  // 最近使用したアドバイスから詳細表示
  const showRecentAdvice = (recentAdvice: RecentAdvice) => {
    setScene(recentAdvice.scene);
    setGoal(recentAdvice.goal);
    setTimeLimit(recentAdvice.timeLimit);
    setStakes(recentAdvice.stakes);
    setParticipants(recentAdvice.participants || 2);
    setRelationship(recentAdvice.relationship || '');
    setAdvices([recentAdvice.advice]);
    setCurrentView('advices');
  };

  // シーン固有の詳細設定をリセット
  const resetSceneDetails = () => {
    // 会議・ミーティング用
    setMeetingType('');
    setMeetingFormat('');
    setMeetingUrgency('');
    setMeetingFrequency('');
    setMeetingParticipants('');
    setMeetingTools('');
    setMeetingChallenges('');
    
    // 営業・商談用
    setCustomerType('');
    setIndustry('');
    setCustomerPosition('');
    setCompanySize('');
    setSalesStage('');
    setDealSize('');
    setCompetitionLevel('');
    setCustomerPainPoints('');
    
    // プレゼンテーション用
    setPresentationPurpose('');
    setAudienceType('');
    setPresentationFormat('');
    setPresentationTopics('');
    setAudienceExpertise('');
    setPresentationConstraints('');
    
    // 面談用
    setInterviewType('');
    setInterviewRelationship('');
    setInterviewPurpose('');
    setInterviewContext('');
    setInterviewOutcomes('');
    
    // チーム構築用
    setTeamBuildingType('');
    setTeamMaturity('');
    setTeamContext('');
    setTeamSize('');
    setTeamDiversity('');
    setTeamChallenges('');
  };

  // シーン変更時に詳細設定をリセット
  const handleSceneChange = (newScene: string) => {
    setScene(newScene);
    resetSceneDetails();
    setCurrentView('input');
  };

  // 理論メモ画面
  const renderTheoryMemo = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.theoryMemoHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentView('main')}
          >
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.theoryMemoHeaderTitle}>理論メモ</Text>
        </View>

        {/* カテゴリー別理論一覧 */}
        <View style={styles.theoryCategories}>
          {/* 行動経済学 */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>行動経済学</Text>
            <Text style={styles.categoryDescription}>人間の意思決定と行動に関する理論</Text>
            <View style={styles.theoryGrid}>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('anchoring_effect')}>
                <Text style={styles.theoryItemTitle}>アンカリング効果</Text>
                <Text style={styles.theoryItemSubtitle}>Anchoring Effect</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('framing_effect')}>
                <Text style={styles.theoryItemTitle}>フレーミング効果</Text>
                <Text style={styles.theoryItemSubtitle}>Framing Effect</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('loss_aversion')}>
                <Text style={styles.theoryItemTitle}>損失回避</Text>
                <Text style={styles.theoryItemSubtitle}>Loss Aversion</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('endowment_effect')}>
                <Text style={styles.theoryItemTitle}>保有効果</Text>
                <Text style={styles.theoryItemSubtitle}>Endowment Effect</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('status_quo_bias')}>
                <Text style={styles.theoryItemTitle}>現状維持バイアス</Text>
                <Text style={styles.theoryItemSubtitle}>Status Quo Bias</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('availability_heuristic')}>
                <Text style={styles.theoryItemTitle}>利用可能性ヒューリスティック</Text>
                <Text style={styles.theoryItemSubtitle}>Availability Heuristic</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('representativeness_heuristic')}>
                <Text style={styles.theoryItemTitle}>代表性ヒューリスティック</Text>
                <Text style={styles.theoryItemSubtitle}>Representativeness</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('confirmation_bias')}>
                <Text style={styles.theoryItemTitle}>確証バイアス</Text>
                <Text style={styles.theoryItemSubtitle}>Confirmation Bias</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('sunk_cost_fallacy')}>
                <Text style={styles.theoryItemTitle}>サンクコスト効果</Text>
                <Text style={styles.theoryItemSubtitle}>Sunk Cost Fallacy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('prospect_theory')}>
                <Text style={styles.theoryItemTitle}>プロスペクト理論</Text>
                <Text style={styles.theoryItemSubtitle}>Prospect Theory</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('probability_weighting')}>
                <Text style={styles.theoryItemTitle}>確率加重</Text>
                <Text style={styles.theoryItemSubtitle}>Probability Weighting</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('mental_accounting')}>
                <Text style={styles.theoryItemTitle}>メンタルアカウンティング</Text>
                <Text style={styles.theoryItemSubtitle}>Mental Accounting</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('hyperbolic_discounting')}>
                <Text style={styles.theoryItemTitle}>双曲割引</Text>
                <Text style={styles.theoryItemSubtitle}>Hyperbolic Discounting</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('paradox_of_choice')}>
                <Text style={styles.theoryItemTitle}>選択肢過多</Text>
                <Text style={styles.theoryItemSubtitle}>Paradox of Choice</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('decoy_effect')}>
                <Text style={styles.theoryItemTitle}>デコイ効果</Text>
                <Text style={styles.theoryItemSubtitle}>Decoy Effect</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('scarcity_effect')}>
                <Text style={styles.theoryItemTitle}>希少性効果</Text>
                <Text style={styles.theoryItemSubtitle}>Scarcity Effect</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('social_proof')}>
                <Text style={styles.theoryItemTitle}>社会的証明</Text>
                <Text style={styles.theoryItemSubtitle}>Social Proof</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('reciprocity')}>
                <Text style={styles.theoryItemTitle}>返報性の原理</Text>
                <Text style={styles.theoryItemSubtitle}>Reciprocity</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('commitment_consistency')}>
                <Text style={styles.theoryItemTitle}>一貫性の原理</Text>
                <Text style={styles.theoryItemSubtitle}>Commitment & Consistency</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('peak_end_rule')}>
                <Text style={styles.theoryItemTitle}>ピーク・エンドの法則</Text>
                <Text style={styles.theoryItemSubtitle}>Peak-End Rule</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* リーダーシップ・組織心理 */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>リーダーシップ・組織心理</Text>
            <Text style={styles.categoryDescription}>リーダーシップと組織運営に関する理論</Text>
            <View style={styles.theoryGrid}>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('servant_leadership')}>
                <Text style={styles.theoryItemTitle}>サーバント・リーダーシップ</Text>
                <Text style={styles.theoryItemSubtitle}>Servant Leadership</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('transformational_leadership')}>
                <Text style={styles.theoryItemTitle}>トランスフォーメーショナル</Text>
                <Text style={styles.theoryItemSubtitle}>Transformational</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('situational_leadership')}>
                <Text style={styles.theoryItemTitle}>シチュエーショナル</Text>
                <Text style={styles.theoryItemSubtitle}>Situational</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('level5_leadership')}>
                <Text style={styles.theoryItemTitle}>レベル5リーダーシップ</Text>
                <Text style={styles.theoryItemSubtitle}>Level 5 Leadership</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('emotional_intelligence')}>
                <Text style={styles.theoryItemTitle}>エモーショナルインテリジェンス</Text>
                <Text style={styles.theoryItemSubtitle}>Emotional Intelligence</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('lmx_theory')}>
                <Text style={styles.theoryItemTitle}>LMX理論</Text>
                <Text style={styles.theoryItemSubtitle}>Leader-Member Exchange</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('authentic_leadership')}>
                <Text style={styles.theoryItemTitle}>オーセンティック・リーダーシップ</Text>
                <Text style={styles.theoryItemSubtitle}>Authentic Leadership</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('grow_model')}>
                <Text style={styles.theoryItemTitle}>GROWモデル</Text>
                <Text style={styles.theoryItemSubtitle}>GROW Model</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('psychological_safety')}>
                <Text style={styles.theoryItemTitle}>心理的安全性</Text>
                <Text style={styles.theoryItemSubtitle}>Psychological Safety</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('groupthink')}>
                <Text style={styles.theoryItemTitle}>集団浅慮</Text>
                <Text style={styles.theoryItemSubtitle}>Groupthink</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('social_loafing')}>
                <Text style={styles.theoryItemTitle}>社会的手抜き</Text>
                <Text style={styles.theoryItemSubtitle}>Social Loafing</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('tuckman_stages')}>
                <Text style={styles.theoryItemTitle}>タックマンモデル</Text>
                <Text style={styles.theoryItemSubtitle}>Tuckman's Stages</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('pygmalion_effect')}>
                <Text style={styles.theoryItemTitle}>ピグマリオン効果</Text>
                <Text style={styles.theoryItemSubtitle}>Pygmalion Effect</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('equity_theory')}>
                <Text style={styles.theoryItemTitle}>公平理論</Text>
                <Text style={styles.theoryItemSubtitle}>Equity Theory</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('expectancy_theory')}>
                <Text style={styles.theoryItemTitle}>期待理論</Text>
                <Text style={styles.theoryItemSubtitle}>Expectancy Theory</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('herzberg_two_factor')}>
                <Text style={styles.theoryItemTitle}>二要因理論</Text>
                <Text style={styles.theoryItemSubtitle}>Herzberg Two-Factor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('job_characteristics_model')}>
                <Text style={styles.theoryItemTitle}>職務特性モデル</Text>
                <Text style={styles.theoryItemSubtitle}>Job Characteristics</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('self_determination_theory')}>
                <Text style={styles.theoryItemTitle}>自己決定理論</Text>
                <Text style={styles.theoryItemSubtitle}>Self-Determination</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('goal_setting_theory')}>
                <Text style={styles.theoryItemTitle}>目標設定理論</Text>
                <Text style={styles.theoryItemSubtitle}>Goal-Setting Theory</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('procedural_justice')}>
                <Text style={styles.theoryItemTitle}>手続き的公正</Text>
                <Text style={styles.theoryItemSubtitle}>Procedural Justice</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 交渉術・影響力 */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>交渉術・影響力</Text>
            <Text style={styles.categoryDescription}>交渉と影響力に関する理論</Text>
            <View style={styles.theoryGrid}>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('batna')}>
                <Text style={styles.theoryItemTitle}>BATNA</Text>
                <Text style={styles.theoryItemSubtitle}>Best Alternative</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('zopa')}>
                <Text style={styles.theoryItemTitle}>ZOPA</Text>
                <Text style={styles.theoryItemSubtitle}>Zone of Agreement</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('principled_negotiation')}>
                <Text style={styles.theoryItemTitle}>プリンシプル・ネゴシエーション</Text>
                <Text style={styles.theoryItemSubtitle}>Principled Negotiation</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('meso')}>
                <Text style={styles.theoryItemTitle}>MESO</Text>
                <Text style={styles.theoryItemSubtitle}>Multiple Offers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('roll_over_tactic')}>
                <Text style={styles.theoryItemTitle}>ロールオーバー戦術</Text>
                <Text style={styles.theoryItemSubtitle}>Roll-over Tactic</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('concession_strategies')}>
                <Text style={styles.theoryItemTitle}>譲歩戦略</Text>
                <Text style={styles.theoryItemSubtitle}>Concession Strategies</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('tactical_empathy')}>
                <Text style={styles.theoryItemTitle}>戦術的共感</Text>
                <Text style={styles.theoryItemSubtitle}>Tactical Empathy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('foot_in_door')}>
                <Text style={styles.theoryItemTitle}>フット・イン・ザ・ドア</Text>
                <Text style={styles.theoryItemSubtitle}>Foot-in-the-Door</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('door_in_face')}>
                <Text style={styles.theoryItemTitle}>ドア・イン・ザ・フェイス</Text>
                <Text style={styles.theoryItemSubtitle}>Door-in-the-Face</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('negotiation_anchoring')}>
                <Text style={styles.theoryItemTitle}>交渉アンカリング</Text>
                <Text style={styles.theoryItemSubtitle}>Negotiation Anchoring</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 経営戦略 */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>経営戦略</Text>
            <Text style={styles.categoryDescription}>企業戦略と競争優位に関する理論</Text>
            <View style={styles.theoryGrid}>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('porters_five_forces')}>
                <Text style={styles.theoryItemTitle}>ファイブフォース分析</Text>
                <Text style={styles.theoryItemSubtitle}>Porter's Five Forces</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('value_chain_analysis')}>
                <Text style={styles.theoryItemTitle}>バリューチェーン</Text>
                <Text style={styles.theoryItemSubtitle}>Value Chain</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('generic_strategies')}>
                <Text style={styles.theoryItemTitle}>基本戦略</Text>
                <Text style={styles.theoryItemSubtitle}>Generic Strategies</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('blue_ocean_strategy')}>
                <Text style={styles.theoryItemTitle}>ブルーオーシャン戦略</Text>
                <Text style={styles.theoryItemSubtitle}>Blue Ocean Strategy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('resource_based_view')}>
                <Text style={styles.theoryItemTitle}>資源ベース理論</Text>
                <Text style={styles.theoryItemSubtitle}>Resource-Based View</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('core_competence')}>
                <Text style={styles.theoryItemTitle}>コア・コンピタンス</Text>
                <Text style={styles.theoryItemSubtitle}>Core Competence</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('swot_analysis')}>
                <Text style={styles.theoryItemTitle}>SWOT分析</Text>
                <Text style={styles.theoryItemSubtitle}>SWOT Analysis</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('pestel_analysis')}>
                <Text style={styles.theoryItemTitle}>PESTEL分析</Text>
                <Text style={styles.theoryItemSubtitle}>PESTEL Analysis</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('balanced_scorecard')}>
                <Text style={styles.theoryItemTitle}>バランススコアカード</Text>
                <Text style={styles.theoryItemSubtitle}>Balanced Scorecard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('okr')}>
                <Text style={styles.theoryItemTitle}>OKR</Text>
                <Text style={styles.theoryItemSubtitle}>Objectives & Key Results</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* イノベーション・プロダクト */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>イノベーション・プロダクト</Text>
            <Text style={styles.categoryDescription}>イノベーションとプロダクト開発に関する理論</Text>
            <View style={styles.theoryGrid}>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('design_thinking')}>
                <Text style={styles.theoryItemTitle}>デザイン思考</Text>
                <Text style={styles.theoryItemSubtitle}>Design Thinking</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('lean_startup')}>
                <Text style={styles.theoryItemTitle}>リーンスタートアップ</Text>
                <Text style={styles.theoryItemSubtitle}>Lean Startup</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('jobs_to_be_done')}>
                <Text style={styles.theoryItemTitle}>ジョブ理論</Text>
                <Text style={styles.theoryItemSubtitle}>Jobs to Be Done</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('kano_model')}>
                <Text style={styles.theoryItemTitle}>KANOモデル</Text>
                <Text style={styles.theoryItemSubtitle}>Kano Model</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('diffusion_of_innovations')}>
                <Text style={styles.theoryItemTitle}>イノベーション普及理論</Text>
                <Text style={styles.theoryItemSubtitle}>Diffusion of Innovations</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('aarrr_funnel')}>
                <Text style={styles.theoryItemTitle}>AARRRファネル</Text>
                <Text style={styles.theoryItemSubtitle}>AARRR Funnel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('north_star_metric')}>
                <Text style={styles.theoryItemTitle}>ノーススターメトリクス</Text>
                <Text style={styles.theoryItemSubtitle}>North Star Metric</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('rice_scoring')}>
                <Text style={styles.theoryItemTitle}>RICEスコアリング</Text>
                <Text style={styles.theoryItemSubtitle}>RICE Scoring</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('moscow_method')}>
                <Text style={styles.theoryItemTitle}>MoSCoW法</Text>
                <Text style={styles.theoryItemSubtitle}>MoSCoW Method</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('user_story_mapping')}>
                <Text style={styles.theoryItemTitle}>ユーザーストーリーマッピング</Text>
                <Text style={styles.theoryItemSubtitle}>User Story Mapping</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* オペレーション・プロジェクト管理 */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>オペレーション・プロジェクト管理</Text>
            <Text style={styles.categoryDescription}>業務効率化とプロジェクト管理に関する理論</Text>
            <View style={styles.theoryGrid}>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('agile_development')}>
                <Text style={styles.theoryItemTitle}>アジャイル開発</Text>
                <Text style={styles.theoryItemSubtitle}>Agile Development</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('scrum')}>
                <Text style={styles.theoryItemTitle}>スクラム</Text>
                <Text style={styles.theoryItemSubtitle}>Scrum</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('kanban')}>
                <Text style={styles.theoryItemTitle}>カンバン</Text>
                <Text style={styles.theoryItemSubtitle}>Kanban</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('critical_path')}>
                <Text style={styles.theoryItemTitle}>クリティカルパス</Text>
                <Text style={styles.theoryItemSubtitle}>Critical Path</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('gantt_chart')}>
                <Text style={styles.theoryItemTitle}>ガントチャート</Text>
                <Text style={styles.theoryItemSubtitle}>Gantt Chart</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('six_sigma')}>
                <Text style={styles.theoryItemTitle}>シックスシグマ</Text>
                <Text style={styles.theoryItemSubtitle}>Six Sigma</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('lean_management')}>
                <Text style={styles.theoryItemTitle}>リーン管理</Text>
                <Text style={styles.theoryItemSubtitle}>Lean Management</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('theory_of_constraints')}>
                <Text style={styles.theoryItemTitle}>制約理論</Text>
                <Text style={styles.theoryItemSubtitle}>Theory of Constraints</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('total_quality_management')}>
                <Text style={styles.theoryItemTitle}>TQM</Text>
                <Text style={styles.theoryItemSubtitle}>Total Quality Management</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('business_process_reengineering')}>
                <Text style={styles.theoryItemTitle}>BPR</Text>
                <Text style={styles.theoryItemSubtitle}>Business Process Reengineering</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ファイナンス・メトリクス */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>ファイナンス・メトリクス</Text>
            <Text style={styles.categoryDescription}>財務分析と指標に関する理論</Text>
            <View style={styles.theoryGrid}>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('roi_analysis')}>
                <Text style={styles.theoryItemTitle}>ROI分析</Text>
                <Text style={styles.theoryItemSubtitle}>ROI Analysis</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('cash_flow')}>
                <Text style={styles.theoryItemTitle}>キャッシュフロー</Text>
                <Text style={styles.theoryItemSubtitle}>Cash Flow</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('cost_benefit_analysis')}>
                <Text style={styles.theoryItemTitle}>コストベネフィット</Text>
                <Text style={styles.theoryItemSubtitle}>Cost-Benefit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('kpi_design')}>
                <Text style={styles.theoryItemTitle}>KPI設計</Text>
                <Text style={styles.theoryItemSubtitle}>KPI Design</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('balanced_scorecard_finance')}>
                <Text style={styles.theoryItemTitle}>バランススコアカード</Text>
                <Text style={styles.theoryItemSubtitle}>Balanced Scorecard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('break_even_analysis')}>
                <Text style={styles.theoryItemTitle}>損益分岐点分析</Text>
                <Text style={styles.theoryItemSubtitle}>Break-Even Analysis</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('net_present_value')}>
                <Text style={styles.theoryItemTitle}>NPV</Text>
                <Text style={styles.theoryItemSubtitle}>Net Present Value</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('internal_rate_of_return')}>
                <Text style={styles.theoryItemTitle}>IRR</Text>
                <Text style={styles.theoryItemSubtitle}>Internal Rate of Return</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('payback_period')}>
                <Text style={styles.theoryItemTitle}>回収期間</Text>
                <Text style={styles.theoryItemSubtitle}>Payback Period</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('economic_value_added')}>
                <Text style={styles.theoryItemTitle}>EVA</Text>
                <Text style={styles.theoryItemSubtitle}>Economic Value Added</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* コミュニケーション・営業 */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>コミュニケーション・営業</Text>
            <Text style={styles.categoryDescription}>コミュニケーションと営業に関する理論</Text>
            <View style={styles.theoryGrid}>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('active_listening_comm')}>
                <Text style={styles.theoryItemTitle}>アクティブリスニング</Text>
                <Text style={styles.theoryItemSubtitle}>Active Listening</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('nonviolent_communication')}>
                <Text style={styles.theoryItemTitle}>非暴力コミュニケーション</Text>
                <Text style={styles.theoryItemSubtitle}>Nonviolent Communication</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('spin_selling')}>
                <Text style={styles.theoryItemTitle}>SPINセリング</Text>
                <Text style={styles.theoryItemSubtitle}>SPIN Selling</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('consultative_selling')}>
                <Text style={styles.theoryItemTitle}>コンサルティングセールス</Text>
                <Text style={styles.theoryItemSubtitle}>Consultative Selling</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('storytelling')}>
                <Text style={styles.theoryItemTitle}>ストーリーテリング</Text>
                <Text style={styles.theoryItemSubtitle}>Storytelling</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('persuasion_techniques')}>
                <Text style={styles.theoryItemTitle}>説得技法</Text>
                <Text style={styles.theoryItemSubtitle}>Persuasion</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('body_language')}>
                <Text style={styles.theoryItemTitle}>ボディランゲージ</Text>
                <Text style={styles.theoryItemSubtitle}>Body Language</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('feedback_skills')}>
                <Text style={styles.theoryItemTitle}>フィードバックスキル</Text>
                <Text style={styles.theoryItemSubtitle}>Feedback Skills</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('conflict_resolution_comm')}>
                <Text style={styles.theoryItemTitle}>対立解消</Text>
                <Text style={styles.theoryItemSubtitle}>Conflict Resolution</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.theoryItem} onPress={() => showTheoryDetail('presentation_skills')}>
                <Text style={styles.theoryItemTitle}>プレゼンテーションスキル</Text>
                <Text style={styles.theoryItemSubtitle}>Presentation Skills</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // メイン画面（Notion風UI）
  const renderMainView = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>OrgShift Advisor</Text>
          <Text style={styles.headerSubtitle}>AI駆動のビジネスアドバイザー</Text>
        </View>

        {/* 最近使用したアドバイス */}
        {recentAdvices.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>最近使用したアドバイス</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.recentScrollView}
              contentContainerStyle={styles.recentContent}
            >
              {recentAdvices.map((recentAdvice) => (
                <TouchableOpacity
                  key={recentAdvice.id}
                  style={styles.recentCard}
                  onPress={() => showRecentAdvice(recentAdvice)}
                >
                  <View style={styles.recentCardHeader}>
                    <Text style={styles.recentCardScene}>
                      {getSceneName(recentAdvice.scene)}
                    </Text>
                    <Text style={styles.recentCardTime}>
                      {recentAdvice.timestamp.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={styles.recentCardGoal} numberOfLines={2}>
                    {recentAdvice.goal}
                  </Text>
                  <Text style={styles.recentCardAdvice} numberOfLines={3}>
                    {recentAdvice.advice.short_advice}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* シーン選択 */}
        <View style={styles.sceneSection}>
          <Text style={styles.sectionTitle}>シーンを選択</Text>
          <View style={styles.sceneGrid}>
            {sceneConfigs.map((sceneConfig) => (
              <TouchableOpacity
                key={sceneConfig.id}
                style={styles.sceneCard}
                onPress={() => handleSceneChange(sceneConfig.id)}
              >
                <Text style={styles.sceneCardTitle}>{sceneConfig.name}</Text>
                <Text style={styles.sceneCardDescription} numberOfLines={2}>
                  {sceneConfig.description}
                </Text>
                <View style={styles.sceneCardMeta}>
                  <Text style={styles.sceneCardGoals}>
                    {sceneConfig.goals.length}個の目標
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 理論メモボタン（一番下） */}
        <View style={styles.theoryMemoSection}>
          <TouchableOpacity
            style={styles.theoryMemoButton}
            onPress={() => setCurrentView('theoryMemo')}
          >
            <Text style={styles.theoryMemoButtonText}>📚 理論メモ</Text>
            <Text style={styles.theoryMemoButtonSubtext}>100の理論をカテゴリー別に学習</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // 入力画面
  const renderInput = () => {
    const sceneConfig = getSceneConfig(scene);
    if (!sceneConfig) return null;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* ヘッダー */}
          <View style={styles.inputHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentView('main')}
            >
              <Text style={styles.backButtonText}>← 戻る</Text>
            </TouchableOpacity>
            <Text style={styles.inputHeaderTitle}>{sceneConfig.name}</Text>
          </View>

          {/* シーン固有の詳細設定 */}
          {scene === 'meeting' && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>会議の詳細</Text>
              
              {/* 会議の種類 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>会議の種類:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.meetingTypes?.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.detailOption,
                          meetingType === type && styles.selectedDetailOption
                        ]}
                        onPress={() => setMeetingType(type)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          meetingType === type && styles.selectedDetailOptionText
                        ]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 会議形式 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>会議形式:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.meetingFormats?.map((format) => (
                      <TouchableOpacity
                        key={format}
                        style={[
                          styles.detailOption,
                          meetingFormat === format && styles.selectedDetailOption
                        ]}
                        onPress={() => setMeetingFormat(format)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          meetingFormat === format && styles.selectedDetailOptionText
                        ]}>
                          {format}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 緊急度 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>緊急度:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.meetingUrgency?.map((urgency) => (
                      <TouchableOpacity
                        key={urgency}
                        style={[
                          styles.detailOption,
                          meetingUrgency === urgency && styles.selectedDetailOption
                        ]}
                        onPress={() => setMeetingUrgency(urgency)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          meetingUrgency === urgency && styles.selectedDetailOptionText
                        ]}>
                          {urgency}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 頻度 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>頻度:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.meetingFrequency?.map((frequency) => (
                      <TouchableOpacity
                        key={frequency}
                        style={[
                          styles.detailOption,
                          meetingFrequency === frequency && styles.selectedDetailOption
                        ]}
                        onPress={() => setMeetingFrequency(frequency)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          meetingFrequency === frequency && styles.selectedDetailOptionText
                        ]}>
                          {frequency}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 参加者タイプ */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>参加者タイプ:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.meetingParticipants?.map((participantType) => (
                      <TouchableOpacity
                        key={participantType}
                        style={[
                          styles.detailOption,
                          meetingParticipants === participantType && styles.selectedDetailOption
                        ]}
                        onPress={() => setMeetingParticipants(participantType)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          meetingParticipants === participantType && styles.selectedDetailOptionText
                        ]}>
                          {participantType}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 使用ツール */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>使用ツール:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.meetingTools?.map((tool) => (
                      <TouchableOpacity
                        key={tool}
                        style={[
                          styles.detailOption,
                          meetingTools === tool && styles.selectedDetailOption
                        ]}
                        onPress={() => setMeetingTools(tool)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          meetingTools === tool && styles.selectedDetailOptionText
                        ]}>
                          {tool}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 想定される課題 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>想定される課題:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.meetingChallenges?.map((challenge) => (
                      <TouchableOpacity
                        key={challenge}
                        style={[
                          styles.detailOption,
                          meetingChallenges === challenge && styles.selectedDetailOption
                        ]}
                        onPress={() => setMeetingChallenges(challenge)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          meetingChallenges === challenge && styles.selectedDetailOptionText
                        ]}>
                          {challenge}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          )}

          {scene === 'sales' && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>営業の詳細</Text>
              
              {/* 顧客タイプ */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>顧客タイプ:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.customerTypes?.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.detailOption,
                          customerType === type && styles.selectedDetailOption
                        ]}
                        onPress={() => setCustomerType(type)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          customerType === type && styles.selectedDetailOptionText
                        ]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 業界 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>業界:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.industries?.map((industryOption) => (
                      <TouchableOpacity
                        key={industryOption}
                        style={[
                          styles.detailOption,
                          industry === industryOption && styles.selectedDetailOption
                        ]}
                        onPress={() => setIndustry(industryOption)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          industry === industryOption && styles.selectedDetailOptionText
                        ]}>
                          {industryOption}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 顧客の役職 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>顧客の役職:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.customerPositions?.map((position) => (
                      <TouchableOpacity
                        key={position}
                        style={[
                          styles.detailOption,
                          customerPosition === position && styles.selectedDetailOption
                        ]}
                        onPress={() => setCustomerPosition(position)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          customerPosition === position && styles.selectedDetailOptionText
                        ]}>
                          {position}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 会社規模 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>会社規模:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.companySizes?.map((size) => (
                      <TouchableOpacity
                        key={size}
                        style={[
                          styles.detailOption,
                          companySize === size && styles.selectedDetailOption
                        ]}
                        onPress={() => setCompanySize(size)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          companySize === size && styles.selectedDetailOptionText
                        ]}>
                          {size}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 営業段階 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>営業段階:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.salesStages?.map((stage) => (
                      <TouchableOpacity
                        key={stage}
                        style={[
                          styles.detailOption,
                          salesStage === stage && styles.selectedDetailOption
                        ]}
                        onPress={() => setSalesStage(stage)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          salesStage === stage && styles.selectedDetailOptionText
                        ]}>
                          {stage}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 商談規模 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>商談規模:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.dealSize?.map((size) => (
                      <TouchableOpacity
                        key={size}
                        style={[
                          styles.detailOption,
                          dealSize === size && styles.selectedDetailOption
                        ]}
                        onPress={() => setDealSize(size)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          dealSize === size && styles.selectedDetailOptionText
                        ]}>
                          {size}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 競合レベル */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>競合レベル:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.competitionLevel?.map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.detailOption,
                          competitionLevel === level && styles.selectedDetailOption
                        ]}
                        onPress={() => setCompetitionLevel(level)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          competitionLevel === level && styles.selectedDetailOptionText
                        ]}>
                          {level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 顧客の課題 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>顧客の課題:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.customerPainPoints?.map((painPoint) => (
                      <TouchableOpacity
                        key={painPoint}
                        style={[
                          styles.detailOption,
                          customerPainPoints === painPoint && styles.selectedDetailOption
                        ]}
                        onPress={() => setCustomerPainPoints(painPoint)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          customerPainPoints === painPoint && styles.selectedDetailOptionText
                        ]}>
                          {painPoint}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          )}

          {scene === 'presentation' && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>プレゼンテーションの詳細</Text>
              
              {/* プレゼンテーションの目的 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>プレゼンテーションの目的:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.presentationPurposes?.map((purpose) => (
                      <TouchableOpacity
                        key={purpose}
                        style={[
                          styles.detailOption,
                          presentationPurpose === purpose && styles.selectedDetailOption
                        ]}
                        onPress={() => setPresentationPurpose(purpose)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          presentationPurpose === purpose && styles.selectedDetailOptionText
                        ]}>
                          {purpose}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 聴衆のタイプ */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>聴衆のタイプ:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.audienceTypes?.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.detailOption,
                          audienceType === type && styles.selectedDetailOption
                        ]}
                        onPress={() => setAudienceType(type)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          audienceType === type && styles.selectedDetailOptionText
                        ]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* プレゼンテーション形式 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>プレゼンテーション形式:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.presentationFormats?.map((format) => (
                      <TouchableOpacity
                        key={format}
                        style={[
                          styles.detailOption,
                          presentationFormat === format && styles.selectedDetailOption
                        ]}
                        onPress={() => setPresentationFormat(format)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          presentationFormat === format && styles.selectedDetailOptionText
                        ]}>
                          {format}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* プレゼン内容 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>プレゼン内容:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.presentationTopics?.map((topic) => (
                      <TouchableOpacity
                        key={topic}
                        style={[
                          styles.detailOption,
                          presentationTopics === topic && styles.selectedDetailOption
                        ]}
                        onPress={() => setPresentationTopics(topic)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          presentationTopics === topic && styles.selectedDetailOptionText
                        ]}>
                          {topic}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 聴衆の専門性 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>聴衆の専門性:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.audienceExpertise?.map((expertise) => (
                      <TouchableOpacity
                        key={expertise}
                        style={[
                          styles.detailOption,
                          audienceExpertise === expertise && styles.selectedDetailOption
                        ]}
                        onPress={() => setAudienceExpertise(expertise)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          audienceExpertise === expertise && styles.selectedDetailOptionText
                        ]}>
                          {expertise}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 制約事項 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>制約事項:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.presentationConstraints?.map((constraint) => (
                      <TouchableOpacity
                        key={constraint}
                        style={[
                          styles.detailOption,
                          presentationConstraints === constraint && styles.selectedDetailOption
                        ]}
                        onPress={() => setPresentationConstraints(constraint)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          presentationConstraints === constraint && styles.selectedDetailOptionText
                        ]}>
                          {constraint}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          )}

          {scene === 'interview' && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>面談の詳細</Text>
              
              {/* 面談の種類 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>面談の種類:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.interviewTypes?.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.detailOption,
                          interviewType === type && styles.selectedDetailOption
                        ]}
                        onPress={() => setInterviewType(type)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          interviewType === type && styles.selectedDetailOptionText
                        ]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 面談の目的 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>面談の目的:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.interviewPurposes?.map((purpose) => (
                      <TouchableOpacity
                        key={purpose}
                        style={[
                          styles.detailOption,
                          interviewPurpose === purpose && styles.selectedDetailOption
                        ]}
                        onPress={() => setInterviewPurpose(purpose)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          interviewPurpose === purpose && styles.selectedDetailOptionText
                        ]}>
                          {purpose}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 面談での関係性 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>面談での関係性:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.interviewRelationships?.map((relationship) => (
                      <TouchableOpacity
                        key={relationship}
                        style={[
                          styles.detailOption,
                          interviewRelationship === relationship && styles.selectedDetailOption
                        ]}
                        onPress={() => setInterviewRelationship(relationship)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          interviewRelationship === relationship && styles.selectedDetailOptionText
                        ]}>
                          {relationship}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 面談の文脈 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>面談の文脈:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.interviewContext?.map((context) => (
                      <TouchableOpacity
                        key={context}
                        style={[
                          styles.detailOption,
                          interviewContext === context && styles.selectedDetailOption
                        ]}
                        onPress={() => setInterviewContext(context)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          interviewContext === context && styles.selectedDetailOptionText
                        ]}>
                          {context}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* 期待される成果 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>期待される成果:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.interviewOutcomes?.map((outcome) => (
                      <TouchableOpacity
                        key={outcome}
                        style={[
                          styles.detailOption,
                          interviewOutcomes === outcome && styles.selectedDetailOption
                        ]}
                        onPress={() => setInterviewOutcomes(outcome)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          interviewOutcomes === outcome && styles.selectedDetailOptionText
                        ]}>
                          {outcome}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          )}

          {scene === 'team_building' && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>チーム構築の詳細</Text>
              
              {/* チーム構築の種類 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>チーム構築の種類:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.teamBuildingTypes?.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.detailOption,
                          teamBuildingType === type && styles.selectedDetailOption
                        ]}
                        onPress={() => setTeamBuildingType(type)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          teamBuildingType === type && styles.selectedDetailOptionText
                        ]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* チームの成熟度 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>チームの成熟度:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.teamMaturities?.map((maturity) => (
                      <TouchableOpacity
                        key={maturity}
                        style={[
                          styles.detailOption,
                          teamMaturity === maturity && styles.selectedDetailOption
                        ]}
                        onPress={() => setTeamMaturity(maturity)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          teamMaturity === maturity && styles.selectedDetailOptionText
                        ]}>
                          {maturity}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* チームの状況 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>チームの状況:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.teamContexts?.map((context) => (
                      <TouchableOpacity
                        key={context}
                        style={[
                          styles.detailOption,
                          teamContext === context && styles.selectedDetailOption
                        ]}
                        onPress={() => setTeamContext(context)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          teamContext === context && styles.selectedDetailOptionText
                        ]}>
                          {context}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* チームサイズ */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>チームサイズ:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.teamSize?.map((size) => (
                      <TouchableOpacity
                        key={size}
                        style={[
                          styles.detailOption,
                          teamSize === size && styles.selectedDetailOption
                        ]}
                        onPress={() => setTeamSize(size)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          teamSize === size && styles.selectedDetailOptionText
                        ]}>
                          {size}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              
              {/* チームの多様性 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>チームの多様性:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.detailOptions}>
                        {sceneConfig.teamDiversity?.map((diversity) => (
                          <TouchableOpacity
                            key={diversity}
                            style={[
                              styles.detailOption,
                              teamDiversity === diversity && styles.selectedDetailOption
                            ]}
                            onPress={() => setTeamDiversity(diversity)}
                          >
                            <Text style={[
                              styles.detailOptionText,
                              teamDiversity === diversity && styles.selectedDetailOptionText
                            ]}>
                              {diversity}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                </ScrollView>
              </View>
              
              {/* チームの課題 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>チームの課題:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.teamChallenges?.map((challenge) => (
                      <TouchableOpacity
                        key={challenge}
                        style={[
                          styles.detailOption,
                          teamChallenges === challenge && styles.selectedDetailOption
                        ]}
                        onPress={() => setTeamChallenges(challenge)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          teamChallenges === challenge && styles.selectedDetailOptionText
                        ]}>
                          {challenge}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          )}

          {/* 基本設定 */}
          <View style={styles.basicSection}>
            <Text style={styles.basicSectionTitle}>基本設定</Text>
            
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>目標:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionsContainer}>
                  {sceneConfig.goals.map((goalOption) => (
                    <TouchableOpacity
                      key={goalOption}
                      style={[
                        styles.optionButton,
                        goal === goalOption && styles.selectedOption
                      ]}
                      onPress={() => setGoal(goalOption)}
                    >
                      <Text style={[
                        styles.optionText,
                        goal === goalOption && styles.selectedOptionText
                      ]}>
                        {goalOption}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>時間制限:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionsContainer}>
                  {sceneConfig.timeLimits.map((timeOption) => (
                    <TouchableOpacity
                      key={timeOption}
                      style={[
                        styles.optionButton,
                        timeLimit === timeOption && styles.selectedOption
                      ]}
                      onPress={() => setTimeLimit(timeOption)}
                    >
                      <Text style={[
                        styles.optionText,
                        timeLimit === timeOption && styles.selectedOptionText
                      ]}>
                        {timeOption}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>重要度:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionsContainer}>
                  {sceneConfig.stakes.map((stakesOption) => (
                    <TouchableOpacity
                      key={stakesOption}
                      style={[
                        styles.optionButton,
                        stakes === stakesOption && styles.selectedOption
                      ]}
                      onPress={() => setStakes(stakesOption)}
                    >
                      <Text style={[
                        styles.optionText,
                        stakes === stakesOption && styles.selectedOptionText
                      ]}>
                        {stakesOption}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {sceneConfig.participants && (
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>参加者数:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.optionsContainer}>
                    {sceneConfig.participants.map((participantOption) => (
                      <TouchableOpacity
                        key={participantOption}
                        style={[
                          styles.optionButton,
                          participants === participantOption && styles.selectedOption
                        ]}
                        onPress={() => setParticipants(participantOption)}
                      >
                        <Text style={[
                          styles.optionText,
                          participants === participantOption && styles.selectedOptionText
                        ]}>
                          {participantOption}人
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {sceneConfig.relationships && (
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>関係性:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.optionsContainer}>
                    {sceneConfig.relationships.map((relationshipOption) => (
                      <TouchableOpacity
                        key={relationshipOption}
                        style={[
                          styles.optionButton,
                          relationship === relationshipOption && styles.selectedOption
                        ]}
                        onPress={() => setRelationship(relationshipOption)}
                      >
                        <Text style={[
                          styles.optionText,
                          relationship === relationshipOption && styles.selectedOptionText
                        ]}>
                          {relationshipOption}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>

          {/* アクションボタン */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.checklistButton}
              onPress={goToChecklist}
            >
              <Text style={styles.checklistButtonText}>チェックリストを作成</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.adviceButton}
              onPress={getAdvice}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.adviceButtonText}>アドバイスを取得</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // アドバイス表示画面
  const renderAdvices = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.adviceHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentView('input')}
          >
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.adviceHeaderTitle}>AIアドバイス</Text>
        </View>

        {advices.map((advice, index) => (
          <View key={advice.theory_id || index} style={styles.adviceCard}>
            <Text style={styles.adviceTitle}>アドバイス {index + 1}</Text>
            <Text style={styles.adviceText}>{advice.short_advice}</Text>
            
            <Text style={styles.adviceSubtitle}>期待される効果</Text>
            <Text style={styles.adviceDescription}>{advice.expected_effect}</Text>
            
            {advice.implementation_steps && advice.implementation_steps.length > 0 && (
              <>
                <Text style={styles.adviceSubtitle}>実装ステップ</Text>
                {advice.implementation_steps.map((step, stepIndex) => (
                  <Text key={stepIndex} style={styles.adviceStep}>
                    {stepIndex + 1}. {step}
                  </Text>
                ))}
              </>
            )}
            
            {advice.success_indicators && advice.success_indicators.length > 0 && (
              <>
                <Text style={styles.adviceSubtitle}>成功指標</Text>
                {advice.success_indicators.map((indicator, indicatorIndex) => (
                  <Text key={indicatorIndex} style={styles.adviceIndicator}>
                    • {indicator}
                  </Text>
                ))}
              </>
            )}
            
            {advice.common_mistakes && advice.common_mistakes.length > 0 && (
              <>
                <Text style={styles.adviceSubtitle}>よくある間違い</Text>
                {advice.common_mistakes.map((mistake, mistakeIndex) => (
                  <Text key={mistakeIndex} style={styles.adviceMistake}>
                    • {mistake}
                  </Text>
                ))}
              </>
            )}
            
            {advice.caution && (
              <>
                <Text style={styles.adviceSubtitle}>注意点</Text>
                <Text style={styles.adviceDescription}>{advice.caution}</Text>
              </>
            )}
            
            {advice.tips && (
              <>
                <Text style={styles.adviceSubtitle}>実践のコツ</Text>
                <Text style={styles.adviceDescription}>{advice.tips}</Text>
              </>
            )}
            
            <View style={styles.adviceActions}>
              <TouchableOpacity
                style={[
                  styles.theoryButton,
                  isLoadingTheory && styles.theoryButtonDisabled
                ]}
                onPress={() => getRelatedTheories(advice)}
                disabled={isLoadingTheory}
              >
                {isLoadingTheory ? (
                  <View style={styles.theoryButtonLoading}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.theoryButtonText}>理論を検索中...</Text>
                  </View>
                ) : (
                  <Text style={styles.theoryButtonText}>理論を学ぶ</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );

  // 理論表示画面
  const renderTheory = () => {
    if (!currentTheory) return null;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.theoryHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentView('advices')}
            >
              <Text style={styles.backButtonText}>← 戻る</Text>
            </TouchableOpacity>
            <Text style={styles.theoryHeaderTitle}>関連理論</Text>
          </View>

          {isLoadingTheory ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>AIが関連理論を検索中...</Text>
              <Text style={styles.loadingSubtext}>しばらくお待ちください</Text>
            </View>
          ) : (
            <View style={styles.theoryCard}>
              {/* 関連理論がある場合は最初に表示 */}
              {currentTheory.related_theories && currentTheory.related_theories.length > 0 ? (
                <>
                  <Text style={styles.theorySubtitle}>関連理論</Text>
                  {currentTheory.related_theories.map((theory, index) => (
                    <View key={index} style={styles.relatedTheoryCard}>
                      <Text style={styles.relatedTheoryTitle}>{theory.name}</Text>
                      <View style={styles.theoryMeta}>
                        <Text style={styles.theoryAcademicField}>{theory.academic_field}</Text>
                      </View>
                      <Text style={styles.relatedTheoryDescription}>{theory.description}</Text>
                      
                      {theory.key_concepts && theory.key_concepts.length > 0 && (
                        <>
                          <Text style={styles.relatedTheorySubtitle}>主要概念</Text>
                          {theory.key_concepts.map((concept, conceptIndex) => (
                            <Text key={conceptIndex} style={styles.relatedTheoryConcept}>• {concept}</Text>
                          ))}
                        </>
                      )}
                      
                      {theory.when_to_use && theory.when_to_use.length > 0 && (
                        <>
                          <Text style={styles.relatedTheorySubtitle}>使用場面</Text>
                          {theory.when_to_use.map((use, useIndex) => (
                            <Text key={useIndex} style={styles.theoryUse}>• {use}</Text>
                          ))}
                        </>
                      )}
                      
                      {theory.examples && theory.examples.length > 0 && (
                        <>
                          <Text style={styles.theorySubtitle}>具体例</Text>
                          {theory.examples.map((example, exampleIndex) => (
                            <Text key={exampleIndex} style={styles.theoryExample}>• {example}</Text>
                          ))}
                        </>
                      )}
                      
                      {theory.practical_tips && theory.practical_tips.length > 0 && (
                        <>
                          <Text style={styles.relatedTheorySubtitle}>実践のコツ</Text>
                          {theory.practical_tips.map((tip, tipIndex) => (
                            <Text key={tipIndex} style={styles.relatedTheoryTip}>• {tip}</Text>
                          ))}
                        </>
                      )}
                    </View>
                  ))}
                </>
              ) : (
                <>
                  <Text style={styles.theoryDescription}>{currentTheory.description}</Text>
                  
                  {currentTheory.key_concepts && currentTheory.key_concepts.length > 0 && (
                    <>
                      <Text style={styles.theorySubtitle}>主要概念</Text>
                      {currentTheory.key_concepts.map((concept, index) => (
                        <Text key={index} style={styles.theoryConcept}>• {concept}</Text>
                      ))}
                    </>
                  )}
                  
                  {currentTheory.when_to_use && currentTheory.when_to_use.length > 0 && (
                    <>
                      <Text style={styles.theorySubtitle}>使用場面</Text>
                      {currentTheory.when_to_use.map((use, index) => (
                        <Text key={index} style={styles.theoryUse}>• {use}</Text>
                      ))}
                    </>
                  )}
                  
                  {currentTheory.examples && currentTheory.examples.length > 0 && (
                    <>
                      <Text style={styles.theorySubtitle}>具体例</Text>
                      {currentTheory.examples.map((example, index) => (
                        <Text key={index} style={styles.theoryExample}>• {example}</Text>
                      ))}
                    </>
                  )}
                </>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  };

  // 理論詳細を表示
  const showTheoryDetail = async (theoryId: string) => {
    setSelectedTheoryId(theoryId);
    setCurrentView('theoryDetail');
    setIsLoadingTheory(true);
    
    // シンプルな理論情報を直接設定（API呼び出しなし）
    const theoryInfo = getTheoryInfo(theoryId);
    setSelectedTheoryData(theoryInfo);
    setIsLoadingTheory(false);
  };

  // 理論IDから基本情報を取得する関数
  const getTheoryInfo = (theoryId: string) => {
    const theoryMap: { [key: string]: any } = {
      'anchoring_effect': {
        name_ja: 'アンカリング効果',
        name_en: 'Anchoring Effect',
        academic_field: '行動経済学',
        one_liner: '最初に提示された基準がその後の判断を左右する心理効果',
        definition: '価格や条件の初提示は、その後の交渉や評価の基準点として強く影響を与える',
        content: '人間の意思決定において、最初に提示された情報（アンカー）が基準となり、その後の判断に大きな影響を与える現象です。',
        applicable_scenarios: ['価格交渉', '予算策定', 'KPI設定', '評価面談'],
        key_concepts: ['基準点の設定', '比較効果', '認知バイアス', '意思決定の歪み'],
        practical_tips: ['複数の選択肢を同時提示', '客観的な基準を事前に設定', 'アンカーの影響を認識する'],
        examples: ['価格交渉での初期提示', '予算会議での基準値', '人事評価での基準設定']
      },
      'framing_effect': {
        name_ja: 'フレーミング効果',
        name_en: 'Framing Effect',
        academic_field: '行動経済学',
        one_liner: '同じ情報でも提示の仕方によって受け取られ方や選好が変わる',
        definition: '利得枠と損失枠の両面から事実を提示することで意思決定をコントロールする',
        content: '同じ内容の情報でも、どのように表現するかによって受け手の印象や選択が大きく変わる現象です。',
        applicable_scenarios: ['企画提案', '稟議承認', '営業トーク', '変更提案'],
        key_concepts: ['表現方法', '認知フレーム', '意思決定バイアス', 'コミュニケーション効果'],
        practical_tips: ['ポジティブな表現を心がける', '具体的な数値を示す', '相手の立場に立って表現する'],
        examples: ['成功率90% vs 失敗率10%', '節約効果 vs コスト削減', '成長機会 vs リスク回避']
      },
      'loss_aversion': {
        name_ja: '損失回避',
        name_en: 'Loss Aversion',
        academic_field: '行動経済学',
        one_liner: '人は利益を得るより損失を避けることを優先する傾向がある',
        definition: '未導入時の損失額を明示することで行動を促す',
        content: '人間は利益を得ることよりも、損失を避けることを強く求める心理的傾向があります。',
        applicable_scenarios: ['導入提案', '解約抑止', '業務改善', '変更推進'],
        key_concepts: ['損失の重み', '利益の軽視', '現状維持バイアス', 'リスク回避'],
        practical_tips: ['損失の具体的な金額を示す', '現状維持のコストを明示', '段階的な改善を提案'],
        examples: ['システム導入による損失回避', '現状維持の機会損失', '改善によるリスク軽減']
      }
    };

    // 理論IDに対応する情報があれば返す、なければデフォルト情報を返す
    if (theoryMap[theoryId]) {
      return theoryMap[theoryId];
    }

    // デフォルト情報（理論IDから推測）
    const theoryName = theoryId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return {
      name_ja: theoryId,
      name_en: theoryName,
      academic_field: '理論',
      one_liner: `${theoryName}について学びましょう`,
      definition: `理論「${theoryName}」は、組織変革とリーダーシップにおいて重要な概念です。`,
      content: 'この理論は、実践的なビジネスシーンで活用できる重要な知見を提供します。',
      applicable_scenarios: ['組織変革', 'リーダーシップ開発', 'チームビルディング', '業務改善'],
      key_concepts: ['理論の核心概念', '実践的な応用', '効果的な活用方法', '成功のポイント'],
      practical_tips: ['段階的な導入', '継続的な評価', 'チーム全体での共有', '定期的な見直し'],
      examples: ['成功事例', '実践例', '応用例', '改善例']
    };
  };

  // 理論詳細画面
  const renderTheoryDetail = () => {
    if (isLoadingTheory) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.theoryDetailHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentView('theoryMemo')}
            >
              <Text style={styles.backButtonText}>← 戻る</Text>
            </TouchableOpacity>
            <Text style={styles.theoryDetailHeaderTitle}>理論詳細</Text>
          </View>
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>理論の詳細情報を読み込み中...</Text>
            <Text style={styles.loadingSubtext}>しばらくお待ちください</Text>
          </View>
        </SafeAreaView>
      );
    }

    if (!selectedTheoryData) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.theoryDetailHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentView('theoryMemo')}
            >
              <Text style={styles.backButtonText}>← 戻る</Text>
            </TouchableOpacity>
            <Text style={styles.theoryDetailHeaderTitle}>理論詳細</Text>
          </View>
          
          <View style={styles.theoryDetailCard}>
            <Text style={styles.theoryDetailTitle}>エラー</Text>
            <Text style={styles.theoryDetailDescription}>
              理論の詳細情報を読み込めませんでした。
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.theoryDetailHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentView('theoryMemo')}
            >
              <Text style={styles.backButtonText}>← 戻る</Text>
            </TouchableOpacity>
            <Text style={styles.theoryDetailHeaderTitle}>理論詳細</Text>
          </View>
          
          <View style={styles.theoryDetailCard}>
            <View style={styles.theoryMeta}>
              <Text style={styles.theoryAcademicField}>
                {selectedTheoryData.academic_field || '理論'}
              </Text>
            </View>
            
            <Text style={styles.theoryDetailTitle}>
              {selectedTheoryData.name_ja || selectedTheoryId}
            </Text>
            
            {selectedTheoryData.name_en && (
              <Text style={styles.theoryDetailSubtitle}>
                {selectedTheoryData.name_en}
              </Text>
            )}
            
            {selectedTheoryData.one_liner && (
              <Text style={styles.theoryDetailDescription}>
                {selectedTheoryData.one_liner}
              </Text>
            )}
            
            {selectedTheoryData.definition && (
              <View style={styles.theorySection}>
                <Text style={styles.theorySectionTitle}>定義</Text>
                <Text style={styles.theorySectionContent}>
                  {selectedTheoryData.definition}
                </Text>
              </View>
            )}
            
            {selectedTheoryData.content && (
              <View style={styles.theorySection}>
                <Text style={styles.theorySectionTitle}>内容</Text>
                <Text style={styles.theorySectionContent}>
                  {selectedTheoryData.content}
                </Text>
              </View>
            )}
            
            {selectedTheoryData.applicable_scenarios && selectedTheoryData.applicable_scenarios.length > 0 && (
              <View style={styles.theorySection}>
                <Text style={styles.theorySectionTitle}>適用場面</Text>
                {selectedTheoryData.applicable_scenarios.map((scenario: string, index: number) => (
                  <Text key={index} style={styles.theoryListItem}>
                    • {scenario}
                  </Text>
                ))}
              </View>
            )}
            
            {selectedTheoryData.key_concepts && selectedTheoryData.key_concepts.length > 0 && (
              <View style={styles.theorySection}>
                <Text style={styles.theorySectionTitle}>キーコンセプト</Text>
                {selectedTheoryData.key_concepts.map((concept: string, index: number) => (
                  <Text key={index} style={styles.theoryListItem}>
                    • {concept}
                  </Text>
                ))}
              </View>
            )}
            
            {selectedTheoryData.practical_tips && selectedTheoryData.practical_tips.length > 0 && (
              <View style={styles.theorySection}>
                <Text style={styles.theorySectionTitle}>実践的なヒント</Text>
                {selectedTheoryData.practical_tips.map((tip: string, index: number) => (
                  <Text key={index} style={styles.theoryListItem}>
                    • {tip}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // メインのレンダリング
  switch (currentView) {
    case 'main':
      return renderMainView();
    case 'input':
      return renderInput();
    case 'checklist':
      return (
        <ChecklistComponent
          scene={scene}
          goal={goal}
          timeLimit={timeLimit}
          stakes={stakes}
          participants={participants}
          relationship={relationship}
          onBack={() => setCurrentView('input')}
        />
      );
    case 'advices':
      return renderAdvices();
    case 'theory':
      return renderTheory();
    case 'theoryMemo':
      return renderTheoryMemo();
    case 'theoryDetail':
      return renderTheoryDetail();
    default:
      return renderMainView();
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  recentSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  recentScrollView: {
    marginHorizontal: -20,
  },
  recentContent: {
    paddingHorizontal: 20,
  },
  recentCard: {
    width: 200,
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  recentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentCardScene: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007bff',
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentCardTime: {
    fontSize: 11,
    color: '#6c757d',
  },
  recentCardGoal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
    lineHeight: 18,
  },
  recentCardAdvice: {
    fontSize: 12,
    color: '#495057',
    lineHeight: 16,
  },
  sceneSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  sceneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sceneCard: {
    width: (screenWidth - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sceneCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  sceneCardDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
    lineHeight: 18,
  },
  sceneCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sceneCardGoals: {
    fontSize: 12,
    color: '#007bff',
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quickStartSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
    marginBottom: 20,
  },
  quickStartButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  quickStartButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  quickStartButtonSubtext: {
    fontSize: 14,
    color: '#b3d9ff',
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  inputHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  detailSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  detailOptions: {
    flexDirection: 'row',
  },
  detailOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedDetailOption: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  detailOptionText: {
    fontSize: 14,
    color: '#495057',
  },
  selectedDetailOptionText: {
    color: '#fff',
  },
  basicSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  basicSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  inputRow: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  optionButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedOption: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  optionText: {
    fontSize: 14,
    color: '#495057',
  },
  selectedOptionText: {
    color: '#fff',
  },
  actionButtons: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  checklistButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  checklistButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  adviceButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  adviceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  adviceHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  adviceCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  adviceText: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 16,
    lineHeight: 24,
  },
  adviceSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
  },
  adviceDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 20,
  },
  adviceStep: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  adviceIndicator: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  adviceMistake: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  adviceActions: {
    marginTop: 20,
    alignItems: 'center',
  },
  theoryButton: {
    backgroundColor: '#6f42c1',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  theoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  theoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  theoryHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  theoryCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  theoryDescription: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 20,
    lineHeight: 24,
  },
  theorySubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
  },
  theoryConcept: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  theoryUse: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  theoryExample: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  relatedTheoryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  relatedTheoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },

  relatedTheoryDescription: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 16,
    lineHeight: 20,
  },
  relatedTheorySubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
  },
  relatedTheoryConcept: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  relatedTheoryUse: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  relatedTheoryTip: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  theoryButtonDisabled: {
    opacity: 0.6,
  },
  theoryButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  theoryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  theoryAcademicField: {
    fontSize: 12,
    color: '#28a745',
    backgroundColor: '#d4edda',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '600',
  },
  theoryMemoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  theoryMemoHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  theoryCategories: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
    lineHeight: 18,
  },
  theoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  theoryItem: {
    width: 120,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: 120,
  },
  theoryItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
    lineHeight: 18,
  },
  theoryItemSubtitle: {
    fontSize: 12,
    color: '#6c757d',
    lineHeight: 16,
  },
  theoryMemoButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  theoryMemoButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  theoryMemoButtonSubtext: {
    fontSize: 14,
    color: '#b3d9ff',
  },
  theoryMemoSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  theoryScrollView: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  theoryScrollContent: {
    paddingHorizontal: 20,
  },
  theoryDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  theoryDetailHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  theoryDetailCard: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  theoryDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  theoryDetailDescription: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 16,
    lineHeight: 24,
  },
  theoryDetailSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  theorySection: {
    marginBottom: 16,
  },
  theorySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  theorySectionContent: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  theoryListItem: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
});