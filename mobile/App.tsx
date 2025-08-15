import React, { useState, useEffect, useRef } from 'react';
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
  practical_tips?: string[];
  academic_field?: string;
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
  const [participants, setParticipants] = useState<number>(0);
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // ScrollViewのref
  const adviceScrollViewRef = useRef<ScrollView>(null);
  const theoryScrollViewRef = useRef<ScrollView>(null);

  // 最近使用したアドバイスを保存
  const saveRecentAdvice = async (advice: Advice) => {
    try {
      // 元のtheory_idを使用して一意性を保つ
      const theoryId = advice.theory_id || `advice_${Date.now()}_${Math.random()}`;
      
      const newRecentAdvice: RecentAdvice = {
        id: theoryId,
        scene,
        goal,
        timeLimit,
        stakes,
        participants,
        relationship,
        advice,
        timestamp: new Date()
      };

      // ローカル状態を更新（theory_idベースで重複チェック）
      setRecentAdvices(prev => {
        const filtered = prev.filter(ra => ra.advice.theory_id !== theoryId);
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
        theory_id: theoryId, // 元のtheory_idを使用
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
        }
      } catch (error) {
        console.error('Failed to load recent advices:', error);
      }
    };

    loadRecentAdvices();
  }, []);

  // AIアドバイザー画面に移動した時にスクロール位置をリセット
  useEffect(() => {
    if (currentView === 'advices') {
      // 画面が表示された時に一番上から表示されるようにする
      setTimeout(() => {
        adviceScrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    }
  }, [currentView]);

  // 理論表示画面に移動した時にスクロール位置をリセット
  useEffect(() => {
    if (currentView === 'theory') {
      // 画面が表示された時に一番上から表示されるようにする
      setTimeout(() => {
        // 理論表示のScrollViewを一番上にスクロール
        if (theoryScrollViewRef.current) {
          theoryScrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
      }, 100);
    }
  }, [currentView]);

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
      } else if (scene === 'team-building') {
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
        // 全てのアドバイスを最近使用に保存（重複を防ぎながら）
        const savePromises = response.advices.map(async (advice: Advice) => {
          try {
            await saveRecentAdvice(advice);
          } catch (error) {
            console.error(`Failed to save advice ${advice.theory_id}:`, error);
          }
        });
        
        // 並行して保存を実行
        await Promise.all(savePromises);
        console.log(`Saved ${response.advices.length} advices to recent advices`);
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
      
      if (response.related_theories && response.related_theories.length > 0) {
        console.log('Setting related theories:', response.related_theories);
        
        // 一番上の理論をメインとして表示し、関連理論も含める
        const topTheory = response.related_theories[0];
        console.log('Top theory to display:', topTheory);
        
        setCurrentTheory({
          id: 'related_theories',
          name: topTheory.name || '関連理論',
          description: topTheory.description || '理論の説明がありません',
          key_concepts: topTheory.key_concepts || [],
          when_to_use: topTheory.when_to_use || [],
          examples: topTheory.examples || [],
          practical_tips: topTheory.practical_tips || [],
          academic_field: topTheory.academic_field || '理論',
          related_theories: response.related_theories // 関連理論も含める
        });
        setCurrentView('theory');
      } else {
        console.log('No related theories found, showing single theory');
        // 単一の理論を表示
        await showSingleTheory(advice);
      }
    } catch (error) {
      console.error('Error getting related theories:', error);
      
      // エラーの詳細をログに出力
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      
      // フォールバック: 単一の理論を表示
      try {
        console.log('Attempting fallback to single theory display');
        await showSingleTheory(advice);
      } catch (fallbackError) {
        console.error('Fallback theory display also failed:', fallbackError);
        Alert.alert('エラー', '理論の表示に失敗しました。しばらく時間をおいて再度お試しください。');
      }
    } finally {
      setIsLoadingTheory(false);
    }
  };

  // 単一の理論を表示する関数
  const showSingleTheory = async (advice: Advice) => {
    try {
      if (advice.theory_id) {
        // theory_idがある場合は、その理論の詳細を表示
        const theoryResponse = await api.getTheory(advice.theory_id);
        if (theoryResponse) {
          setCurrentTheory(theoryResponse);
          setCurrentView('theory');
        } else {
          // 理論が見つからない場合は、アドバイス内容を理論として表示
          showAdviceAsTheory(advice);
        }
      } else {
        // theory_idがない場合は、アドバイス内容を理論として表示
        showAdviceAsTheory(advice);
      }
    } catch (error) {
      console.error('Error showing single theory:', error);
      // エラーが発生した場合は、アドバイス内容を理論として表示
      showAdviceAsTheory(advice);
    }
  };

  // アドバイス内容を理論として表示する関数
  const showAdviceAsTheory = (advice: Advice) => {
    const theoryData = {
      id: 'advice_theory',
      name: 'アドバイス理論',
      description: advice.short_advice,
      key_concepts: [advice.expected_effect],
      when_to_use: [scene, goal],
      examples: [advice.short_advice],
      related_theories: []
    };
    
    setCurrentTheory(theoryData);
    setCurrentView('theory');
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
    setParticipants(recentAdvice.participants || 0); // 0をデフォルト値に変更
    setRelationship(recentAdvice.relationship || '');
    setAdvices([recentAdvice.advice]);
    setCurrentView('advices');
  };

  // シーン固有の詳細設定をリセット
  const resetSceneDetails = () => {
    // 基本設定をリセット
    setGoal('');
    setTimeLimit('');
    setStakes('');
    setParticipants(0); // 0に設定して選択状態を解除
    setRelationship('');
    
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
    // 現在のシーンと異なる場合のみリセット
    if (newScene !== scene) {
      setScene(newScene);
      resetSceneDetails();
      console.log(`Scene changed to ${newScene}, all settings reset`);
    }
    setCurrentView('input');
  };

  // 理論メモ画面
  const renderTheoryMemo = () => {
    // カテゴリーが選択されている場合は理論一覧を表示
    if (selectedCategory) {
      return renderTheoryList();
    }

    // 第1段階: カテゴリー一覧
    return (
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

          {/* カテゴリー一覧 */}
          <View style={styles.theoryCategories}>
            <TouchableOpacity 
              style={styles.categoryCard} 
              onPress={() => setSelectedCategory('behavioral_economics')}
            >
              <Text style={styles.categoryCardTitle}>行動経済学</Text>
              <Text style={styles.categoryCardDescription}>人間の意思決定と行動に関する理論</Text>
              <Text style={styles.categoryCardCount}>20件の理論</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.categoryCard} 
              onPress={() => setSelectedCategory('leadership_psychology')}
            >
              <Text style={styles.categoryCardTitle}>リーダーシップ・組織心理</Text>
              <Text style={styles.categoryCardDescription}>リーダーシップと組織開発の理論</Text>
              <Text style={styles.categoryCardCount}>20件の理論</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.categoryCard} 
              onPress={() => setSelectedCategory('negotiation')}
            >
              <Text style={styles.categoryCardTitle}>交渉術・影響力</Text>
              <Text style={styles.categoryCardDescription}>交渉と影響力に関する理論</Text>
              <Text style={styles.categoryCardCount}>10件の理論</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.categoryCard} 
              onPress={() => setSelectedCategory('strategy')}
            >
              <Text style={styles.categoryCardTitle}>経営戦略</Text>
              <Text style={styles.categoryCardDescription}>戦略立案と競争優位の理論</Text>
              <Text style={styles.categoryCardCount}>10件の理論</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.categoryCard} 
              onPress={() => setSelectedCategory('innovation')}
            >
              <Text style={styles.categoryCardTitle}>イノベーション・プロダクト</Text>
              <Text style={styles.categoryCardDescription}>革新と製品開発の理論</Text>
              <Text style={styles.categoryCardCount}>10件の理論</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.categoryCard} 
              onPress={() => setSelectedCategory('operations')}
            >
              <Text style={styles.categoryCardTitle}>オペレーション・プロジェクト管理</Text>
              <Text style={styles.categoryCardDescription}>業務効率化とプロジェクト管理の理論</Text>
              <Text style={styles.categoryCardCount}>10件の理論</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.categoryCard} 
              onPress={() => setSelectedCategory('finance_metrics')}
            >
              <Text style={styles.categoryCardTitle}>ファイナンス・メトリクス</Text>
              <Text style={styles.categoryCardDescription}>財務分析と指標の理論</Text>
              <Text style={styles.categoryCardCount}>10件の理論</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.categoryCard} 
              onPress={() => setSelectedCategory('communication_sales')}
            >
              <Text style={styles.categoryCardTitle}>コミュニケーション・営業</Text>
              <Text style={styles.categoryCardDescription}>コミュニケーションと営業の理論</Text>
              <Text style={styles.categoryCardCount}>10件の理論</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // 理論一覧表示
  const renderTheoryList = () => {
    if (!selectedCategory) return null;
    
    const theories = getTheoriesByCategory(selectedCategory);
    
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.theoryMemoHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={styles.backButtonText}>← 戻る</Text>
            </TouchableOpacity>
            <Text style={styles.theoryMemoHeaderTitle}>{getCategoryTitle(selectedCategory)}</Text>
          </View>

          <View style={styles.theoryList}>
            {theories.map((theory) => (
              <TouchableOpacity 
                key={theory.id}
                style={styles.theoryListItem} 
                onPress={() => showTheoryDetail(theory.id)}
              >
                <Text style={styles.theoryListItemTitle}>{theory.name_ja}</Text>
                <Text style={styles.theoryListItemSubtitle}>{theory.name_en}</Text>
                <Text style={styles.theoryListItemField}>{theory.academic_field}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // カテゴリー別理論データを取得
  const getTheoriesByCategory = (category: string) => {
    const theoryMap: { [key: string]: any[] } = {
      'behavioral_economics': [
        { id: 'anchoring_effect', name_ja: 'アンカリング効果', name_en: 'Anchoring Effect', academic_field: '行動経済学' },
        { id: 'framing_effect', name_ja: 'フレーミング効果', name_en: 'Framing Effect', academic_field: '行動経済学' },
        { id: 'loss_aversion', name_ja: '損失回避', name_en: 'Loss Aversion', academic_field: '行動経済学' },
        { id: 'endowment_effect', name_ja: '保有効果', name_en: 'Endowment Effect', academic_field: '行動経済学' },
        { id: 'status_quo_bias', name_ja: '現状維持バイアス', name_en: 'Status Quo Bias', academic_field: '行動経済学' },
        { id: 'availability_heuristic', name_ja: '利用可能性ヒューリスティック', name_en: 'Availability Heuristic', academic_field: '行動経済学' },
        { id: 'representativeness_heuristic', name_ja: '代表性ヒューリスティック', name_en: 'Representativeness', academic_field: '行動経済学' },
        { id: 'confirmation_bias', name_ja: '確証バイアス', name_en: 'Confirmation Bias', academic_field: '行動経済学' },
        { id: 'sunk_cost_fallacy', name_ja: 'サンクコスト効果', name_en: 'Sunk Cost Fallacy', academic_field: '行動経済学' },
        { id: 'prospect_theory', name_ja: 'プロスペクト理論', name_en: 'Prospect Theory', academic_field: '行動経済学' },
        { id: 'probability_weighting', name_ja: '確率加重', name_en: 'Probability Weighting', academic_field: '行動経済学' },
        { id: 'mental_accounting', name_ja: 'メンタルアカウンティング', name_en: 'Mental Accounting', academic_field: '行動経済学' },
        { id: 'hyperbolic_discounting', name_ja: '双曲割引', name_en: 'Hyperbolic Discounting', academic_field: '行動経済学' },
        { id: 'paradox_of_choice', name_ja: '選択肢過多', name_en: 'Paradox of Choice', academic_field: '行動経済学' },
        { id: 'decoy_effect', name_ja: 'デコイ効果', name_en: 'Decoy Effect', academic_field: '行動経済学' },
        { id: 'scarcity_effect', name_ja: '希少性効果', name_en: 'Scarcity Effect', academic_field: '行動経済学' },
        { id: 'social_proof', name_ja: '社会的証明', name_en: 'Social Proof', academic_field: '行動経済学' },
        { id: 'reciprocity', name_ja: '返報性の原理', name_en: 'Reciprocity', academic_field: '行動経済学' },
        { id: 'commitment_consistency', name_ja: '一貫性の原理', name_en: 'Commitment & Consistency', academic_field: '行動経済学' },
        { id: 'peak_end_rule', name_ja: 'ピーク・エンドの法則', name_en: 'Peak-End Rule', academic_field: '行動経済学' }
      ],
      'leadership_psychology': [
        { id: 'servant_leadership', name_ja: 'サーバント・リーダーシップ', name_en: 'Servant Leadership', academic_field: 'リーダーシップ理論' },
        { id: 'transformational_leadership', name_ja: 'トランスフォーメーショナル・リーダーシップ', name_en: 'Transformational Leadership', academic_field: 'リーダーシップ理論' },
        { id: 'situational_leadership', name_ja: 'シチュエーショナル・リーダーシップ', name_en: 'Situational Leadership', academic_field: 'リーダーシップ理論' },
        { id: 'level5_leadership', name_ja: 'レベル5リーダーシップ', name_en: 'Level 5 Leadership', academic_field: 'リーダーシップ理論' },
        { id: 'emotional_intelligence', name_ja: 'エモーショナルインテリジェンス', name_en: 'Emotional Intelligence', academic_field: '組織心理学' },
        { id: 'lmx_theory', name_ja: 'LMX理論', name_en: 'Leader-Member Exchange', academic_field: '組織心理学' },
        { id: 'authentic_leadership', name_ja: 'オーセンティック・リーダーシップ', name_en: 'Authentic Leadership', academic_field: 'リーダーシップ理論' },
        { id: 'grow_model', name_ja: 'GROWモデル', name_en: 'GROW Model', academic_field: 'コーチング理論' },
        { id: 'psychological_safety', name_ja: '心理的安全性', name_en: 'Psychological Safety', academic_field: '組織心理学' },
        { id: 'groupthink', name_ja: '集団浅慮', name_en: 'Groupthink', academic_field: '組織心理学' },
        { id: 'social_loafing', name_ja: '社会的手抜き', name_en: 'Social Loafing', academic_field: '組織心理学' },
        { id: 'tuckman_stages', name_ja: 'タックマンモデル', name_en: 'Tuckman\'s Stages', academic_field: 'チーム開発理論' },
        { id: 'pygmalion_effect', name_ja: 'ピグマリオン効果', name_en: 'Pygmalion Effect', academic_field: '組織心理学' },
        { id: 'equity_theory', name_ja: '公平理論', name_en: 'Equity Theory', academic_field: '動機付け理論' },
        { id: 'expectancy_theory', name_ja: '期待理論', name_en: 'Expectancy Theory', academic_field: '動機付け理論' },
        { id: 'herzberg_two_factor', name_ja: '二要因理論', name_en: 'Herzberg Two-Factor', academic_field: '動機付け理論' },
        { id: 'job_characteristics', name_ja: '職務特性モデル', name_en: 'Job Characteristics Model', academic_field: '職務設計理論' },
        { id: 'self_determination', name_ja: '自己決定理論', name_en: 'Self-Determination Theory', academic_field: '動機付け理論' },
        { id: 'goal_setting', name_ja: '目標設定理論', name_en: 'Goal-Setting Theory', academic_field: '目標管理理論' },
        { id: 'procedural_justice', name_ja: '手続き的公正', name_en: 'Procedural Justice', academic_field: '組織正義理論' }
      ],
      'negotiation': [
        { id: 'batna', name_ja: 'BATNA', name_en: 'Best Alternative to Negotiated Agreement', academic_field: '交渉理論' },
        { id: 'zopa', name_ja: 'ZOPA', name_en: 'Zone of Possible Agreement', academic_field: '交渉理論' },
        { id: 'principled_negotiation', name_ja: 'プリンシプル・ネゴシエーション', name_en: 'Principled Negotiation', academic_field: '交渉理論' },
        { id: 'meso', name_ja: 'MESO', name_en: 'Multiple Equivalent Simultaneous Offers', academic_field: '交渉戦術' },
        { id: 'rollover_tactic', name_ja: 'ロールオーバー戦術', name_en: 'Roll-over Tactic', academic_field: '交渉戦術' },
        { id: 'concession_strategies', name_ja: '譲歩戦略', name_en: 'Concession Strategies', academic_field: '交渉戦術' },
        { id: 'tactical_empathy', name_ja: '戦術的共感', name_en: 'Tactical Empathy', academic_field: '交渉心理学' },
        { id: 'foot_in_door', name_ja: 'フット・イン・ザ・ドア', name_en: 'Foot-in-the-Door', academic_field: '影響力理論' },
        { id: 'door_in_face', name_ja: 'ドア・イン・ザ・フェイス', name_en: 'Door-in-the-Face', academic_field: '影響力理論' },
        { id: 'negotiation_anchoring', name_ja: '交渉アンカリング', name_en: 'Negotiation Anchoring', academic_field: '交渉戦術' }
      ],
      'strategy': [
        { id: 'five_forces', name_ja: 'ファイブフォース分析', name_en: 'Porter\'s Five Forces', academic_field: '競争戦略論' },
        { id: 'value_chain', name_ja: 'バリューチェーン分析', name_en: 'Value Chain Analysis', academic_field: '競争戦略論' },
        { id: 'generic_strategies', name_ja: '基本戦略', name_en: 'Generic Strategies', academic_field: '競争戦略論' },
        { id: 'blue_ocean', name_ja: 'ブルーオーシャン戦略', name_en: 'Blue Ocean Strategy', academic_field: 'イノベーション戦略' },
        { id: 'rbv', name_ja: '資源ベース理論', name_en: 'Resource-Based View', academic_field: '競争戦略論' },
        { id: 'core_competence', name_ja: 'コア・コンピタンス', name_en: 'Core Competence', academic_field: '競争戦略論' },
        { id: 'swot', name_ja: 'SWOT分析', name_en: 'SWOT Analysis', academic_field: '戦略分析' },
        { id: 'pestel', name_ja: 'PESTEL分析', name_en: 'PESTEL Analysis', academic_field: '環境分析' },
        { id: 'balanced_scorecard', name_ja: 'バランススコアカード', name_en: 'Balanced Scorecard', academic_field: '経営管理' },
        { id: 'okr', name_ja: 'OKR', name_en: 'Objectives and Key Results', academic_field: '目標管理' }
      ],
      'innovation': [
        { id: 'design_thinking', name_ja: 'デザイン思考', name_en: 'Design Thinking', academic_field: 'イノベーション手法' },
        { id: 'lean_startup', name_ja: 'リーンスタートアップ', name_en: 'Lean Startup', academic_field: '起業手法' },
        { id: 'jobs_to_be_done', name_ja: 'ジョブ理論', name_en: 'Jobs to Be Done', academic_field: 'マーケティング理論' },
        { id: 'kano_model', name_ja: 'KANOモデル', name_en: 'Kano Model', academic_field: '品質管理' },
        { id: 'diffusion_innovations', name_ja: 'イノベーション普及理論', name_en: 'Diffusion of Innovations', academic_field: '普及理論' },
        { id: 'aarrr_funnel', name_ja: 'AARRRファネル', name_en: 'AARRR Funnel', academic_field: 'グロースハッキング' },
        { id: 'north_star_metric', name_ja: 'ノーススターメトリクス', name_en: 'North Star Metric', academic_field: 'KPI設計' },
        { id: 'rice_scoring', name_ja: 'RICEスコアリング', name_en: 'RICE Scoring', academic_field: '優先度評価' },
        { id: 'moscow', name_ja: 'MoSCoW法', name_en: 'MoSCoW Method', academic_field: '要件定義' },
        { id: 'mvp', name_ja: 'MVP', name_en: 'Minimum Viable Product', academic_field: 'プロダクト開発' }
      ],
      'operations': [
        { id: 'kanban', name_ja: 'カンバン', name_en: 'Kanban', academic_field: 'プロジェクト管理' },
        { id: 'scrum', name_ja: 'スクラム', name_en: 'Scrum', academic_field: 'アジャイル開発' },
        { id: 'lean', name_ja: 'リーン', name_en: 'Lean', academic_field: '業務改善' },
        { id: 'six_sigma', name_ja: 'シックスシグマ', name_en: 'Six Sigma', academic_field: '品質管理' },
        { id: 'tqm', name_ja: 'TQM', name_en: 'Total Quality Management', academic_field: '品質管理' },
        { id: 'critical_path', name_ja: 'クリティカルパス', name_en: 'Critical Path Method', academic_field: 'プロジェクト管理' },
        { id: 'pert', name_ja: 'PERT', name_en: 'Program Evaluation Review Technique', academic_field: 'プロジェクト管理' },
        { id: 'gantt_chart', name_ja: 'ガントチャート', name_en: 'Gantt Chart', academic_field: 'プロジェクト管理' },
        { id: 'agile', name_ja: 'アジャイル', name_en: 'Agile', academic_field: 'プロジェクト管理' },
        { id: 'waterfall', name_ja: 'ウォーターフォール', name_en: 'Waterfall', academic_field: 'プロジェクト管理' }
      ],
      'finance_metrics': [
        { id: 'roi', name_ja: 'ROI分析', name_en: 'Return on Investment', academic_field: '財務分析' },
        { id: 'npv', name_ja: 'NPV', name_en: 'Net Present Value', academic_field: '財務分析' },
        { id: 'irr', name_ja: 'IRR', name_en: 'Internal Rate of Return', academic_field: '財務分析' },
        { id: 'payback_period', name_ja: '回収期間', name_en: 'Payback Period', academic_field: '財務分析' },
        { id: 'break_even', name_ja: '損益分岐点', name_en: 'Break-Even Point', academic_field: '財務分析' },
        { id: 'customer_lifetime_value', name_ja: '顧客生涯価値', name_en: 'Customer Lifetime Value', academic_field: 'マーケティング指標' },
        { id: 'churn_rate', name_ja: 'チャーン率', name_en: 'Churn Rate', academic_field: 'マーケティング指標' },
        { id: 'conversion_rate', name_ja: 'コンバージョン率', name_en: 'Conversion Rate', academic_field: 'マーケティング指標' },
        { id: 'cac', name_ja: '顧客獲得コスト', name_en: 'Customer Acquisition Cost', academic_field: 'マーケティング指標' },
        { id: 'ltv_cac_ratio', name_ja: 'LTV/CAC比率', name_en: 'LTV/CAC Ratio', academic_field: 'マーケティング指標' }
      ],
      'communication_sales': [
        { id: 'active_listening', name_ja: 'アクティブリスニング', name_en: 'Active Listening', academic_field: 'コミュニケーション' },
        { id: 'nonviolent_communication', name_ja: '非暴力コミュニケーション', name_en: 'Nonviolent Communication', academic_field: 'コミュニケーション' },
        { id: 'feedback_sandwich', name_ja: 'フィードバックサンドイッチ', name_en: 'Feedback Sandwich', academic_field: 'フィードバック技法' },
        { id: 'spin_selling', name_ja: 'SPINセリング', name_en: 'SPIN Selling', academic_field: '営業手法' },
        { id: 'solution_selling', name_ja: 'ソリューションセリング', name_en: 'Solution Selling', academic_field: '営業手法' },
        { id: 'consultative_selling', name_ja: 'コンサルティブセリング', name_en: 'Consultative Selling', academic_field: '営業手法' },
        { id: 'challenger_sale', name_ja: 'チャレンジャーセール', name_en: 'The Challenger Sale', academic_field: '営業手法' },
        { id: 'sandler_selling', name_ja: 'サンドラーセリング', name_en: 'Sandler Selling', academic_field: '営業手法' },
        { id: 'neil_rackham', name_ja: 'ニール・ラッカム理論', name_en: 'Neil Rackham Theory', academic_field: '営業研究' },
        { id: 'sales_funnel', name_ja: 'セールスファネル', name_en: 'Sales Funnel', academic_field: '営業プロセス' }
      ]
    };

    return theoryMap[category] || [];
  };

  // カテゴリータイトルを取得
  const getCategoryTitle = (category: string) => {
    const titleMap: { [key: string]: string } = {
      'behavioral_economics': '行動経済学',
      'leadership_psychology': 'リーダーシップ・組織心理',
      'negotiation': '交渉術・影響力',
      'strategy': '経営戦略',
      'innovation': 'イノベーション・プロダクト',
      'operations': 'オペレーション・プロジェクト管理',
      'finance_metrics': 'ファイナンス・メトリクス',
      'communication_sales': 'コミュニケーション・営業'
    };
    return titleMap[category] || '理論一覧';
  };

  // シーンアイコンを取得
  const getSceneIcon = (sceneId: string) => {
    const iconMap: { [key: string]: string } = {
      'meeting': '📅',
      'presentation': '🎤',
      'interview': '👥',
      'team-building': '🤝',
      'sales': '💰',
      'negotiation': '⚖️'
    };
    return iconMap[sceneId] || '📋';
  };

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

          {/* 基本設定（上に配置） */}
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
                          participants === participantOption && participants !== 0 && styles.selectedOption
                        ]}
                        onPress={() => setParticipants(participantOption)}
                      >
                        <Text style={[
                          styles.optionText,
                          participants === participantOption && participants !== 0 && styles.selectedOptionText
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

          {/* シーン固有の詳細設定（下に配置） */}
          {scene === 'meeting' && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>会議の詳細設定</Text>
              
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
              <Text style={styles.detailSectionTitle}>営業の詳細設定</Text>
              
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
              <Text style={styles.detailSectionTitle}>プレゼンテーションの詳細設定</Text>
              
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
              <Text style={styles.detailSectionTitle}>面談の詳細設定</Text>
              
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

          {scene === 'team-building' && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>チーム構築の詳細設定</Text>
              
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
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.adviceScrollContent}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        ref={adviceScrollViewRef}
      >
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
            
            {advice.expected_effect && (
              <>
                <Text style={styles.adviceSubtitle}>期待される効果</Text>
                <Text style={styles.adviceDescription}>{advice.expected_effect}</Text>
              </>
            )}
            
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

        {/* エラーが発生した場合の表示 */}
        {advices.length === 0 && (
          <View style={styles.noAdviceContainer}>
            <Text style={styles.noAdviceText}>アドバイスが表示されていません</Text>
            <Text style={styles.noAdviceSubtext}>シーンと目標を選択して、再度アドバイスを取得してください</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => setCurrentView('input')}
            >
              <Text style={styles.retryButtonText}>入力画面に戻る</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  // 理論表示画面
  const renderTheory = () => {
    if (!currentTheory) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.adviceScrollContent}
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
          >
            <View style={styles.adviceHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentView('advices')}
              >
                <Text style={styles.backButtonText}>← 戻る</Text>
              </TouchableOpacity>
              <Text style={styles.adviceHeaderTitle}>理論</Text>
            </View>
            
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>理論データが見つかりませんでした</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setCurrentView('advices')}
              >
                <Text style={styles.retryButtonText}>アドバイス画面に戻る</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView 
          ref={theoryScrollViewRef}
          style={styles.scrollView} 
          contentContainerStyle={styles.adviceScrollContent}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          contentOffset={{ x: 0, y: 0 }}
        >
          <View style={[styles.adviceHeader, { marginTop: 0, paddingTop: 0 }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentView('advices')}
            >
              <Text style={styles.backButtonText}>← 戻る</Text>
            </TouchableOpacity>
            <Text style={styles.adviceHeaderTitle}>
              {currentTheory.name || '関連理論'}
            </Text>
          </View>

          {isLoadingTheory ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>AIが関連理論を検索中...</Text>
              <Text style={styles.loadingSubtext}>しばらくお待ちください</Text>
            </View>
          ) : (
            <>
              <View style={styles.adviceCard}>
                {/* メインの理論（一番上）を表示 */}
                <Text style={styles.adviceTitle}>メイン理論</Text>
                <Text style={styles.adviceText}>
                  {currentTheory.description || '理論の説明がありません'}
                </Text>
                  
                {currentTheory.key_concepts && currentTheory.key_concepts.length > 0 && (
                  <>
                    <Text style={styles.adviceSubtitle}>主要概念</Text>
                    {currentTheory.key_concepts.map((concept, conceptIndex) => (
                      <Text key={conceptIndex} style={styles.adviceStep}>• {concept}</Text>
                    ))}
                  </>
                )}
                
                {currentTheory.when_to_use && currentTheory.when_to_use.length > 0 && (
                  <>
                    <Text style={styles.adviceSubtitle}>使用場面</Text>
                    {currentTheory.when_to_use.map((use, useIndex) => (
                      <Text key={useIndex} style={styles.adviceStep}>• {use}</Text>
                    ))}
                  </>
                )}
                
                {currentTheory.examples && currentTheory.examples.length > 0 && (
                  <>
                    <Text style={styles.adviceSubtitle}>具体例</Text>
                    {currentTheory.examples.map((example, exampleIndex) => (
                      <Text key={exampleIndex} style={styles.adviceStep}>• {example}</Text>
                    ))}
                  </>
                )}
                
                {currentTheory.practical_tips && currentTheory.practical_tips.length > 0 && (
                  <>
                    <Text style={styles.adviceSubtitle}>実践のコツ</Text>
                    {currentTheory.practical_tips.map((tip, tipIndex) => (
                      <Text key={tipIndex} style={styles.adviceStep}>• {tip}</Text>
                    ))}
                  </>
                )}
              </View>

              {/* 関連理論がある場合はリストアップ */}
              {currentTheory.related_theories && currentTheory.related_theories.length > 1 && (
                <>
                  {currentTheory.related_theories.slice(1).map((theory, index) => (
                    <View key={index} style={styles.adviceCard}>
                      <Text style={styles.adviceTitle}>
                        {theory.name || `理論 ${index + 2}`}
                      </Text>
                      <Text style={styles.adviceText}>
                        {theory.description || '理論の説明がありません'}
                      </Text>
                      
                      {theory.key_concepts && theory.key_concepts.length > 0 && (
                        <>
                          <Text style={styles.adviceSubtitle}>主要概念</Text>
                          {theory.key_concepts.map((concept, conceptIndex) => (
                            <Text key={conceptIndex} style={styles.adviceStep}>• {concept}</Text>
                          ))}
                        </>
                      )}
                      
                      {theory.when_to_use && theory.when_to_use.length > 0 && (
                        <>
                          <Text style={styles.adviceSubtitle}>使用場面</Text>
                          {theory.when_to_use.map((use, useIndex) => (
                            <Text key={useIndex} style={styles.adviceStep}>• {use}</Text>
                          ))}
                        </>
                      )}
                      
                      {theory.examples && theory.examples.length > 0 && (
                        <>
                          <Text style={styles.adviceSubtitle}>具体例</Text>
                          {theory.examples.map((example, exampleIndex) => (
                            <Text key={exampleIndex} style={styles.adviceStep}>• {example}</Text>
                          ))}
                        </>
                      )}
                      
                      {theory.practical_tips && theory.practical_tips.length > 0 && (
                        <>
                          <Text style={styles.adviceSubtitle}>実践のコツ</Text>
                          {theory.practical_tips.map((tip, tipIndex) => (
                            <Text key={tipIndex} style={styles.adviceStep}>• {tip}</Text>
                          ))}
                        </>
                      )}
                    </View>
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  };

  // 理論詳細を表示
  const showTheoryDetail = async (theoryId: string) => {
    console.log('showTheoryDetail called with theoryId:', theoryId);
    setIsLoadingTheory(true);
    
    try {
      // エッジファンクションから理論詳細を取得
      const response = await fetch('https://eqiqthlfjcbyqfudziar.supabase.co/functions/v1/theory-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theory_id: theoryId })
      });

      if (response.ok) {
        const theoryData = await response.json();
        console.log('Theory data fetched from API:', theoryData);
        setSelectedTheoryData(theoryData);
        setCurrentView('theoryDetail'); // 理論詳細画面に移動
      } else {
        console.error('Failed to fetch theory data from API:', response.status);
        // フォールバック: ハードコードされた情報を使用
        const theoryInfo = await getTheoryInfo(theoryId);
        setSelectedTheoryData(theoryInfo);
        setCurrentView('theoryDetail'); // 理論詳細画面に移動
      }
    } catch (error) {
      console.error('Error fetching theory data from API:', error);
      // フォールバック: ハードコードされた情報を使用
      const theoryInfo = await getTheoryInfo(theoryId);
      setSelectedTheoryData(theoryInfo);
      setCurrentView('theoryDetail'); // 理論詳細画面に移動
    } finally {
      setIsLoadingTheory(false);
    }
  };

  // 理論IDから基本情報を取得する関数
  const getTheoryInfo = async (theoryId: string) => {
    try {
      // エッジファンクションから理論詳細を取得
      const response = await fetch('https://eqiqthlfjcbyqfudziar.supabase.co/functions/v1/theory-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theory_id: theoryId })
      });

      if (response.ok) {
        const theoryData = await response.json();
        console.log('Theory data fetched:', theoryData);
        return theoryData;
      } else {
        console.error('Failed to fetch theory data:', response.status);
        // フォールバック: ハードコードされた情報を使用
        return getFallbackTheoryInfo(theoryId);
      }
    } catch (error) {
      console.error('Error fetching theory data:', error);
      // フォールバック: ハードコードされた情報を使用
      return getFallbackTheoryInfo(theoryId);
    }
  };

  // フォールバック用の理論情報（ハードコード）
  const getFallbackTheoryInfo = (theoryId: string) => {
    const theoryMap: { [key: string]: any } = {
      'anchoring_effect': {
        name_ja: 'アンカリング効果',
        name_en: 'Anchoring Effect',
        academic_field: '行動経済学',
        one_liner: '冒頭の基準提示で判断の軸を作る',
        definition: '最初に提示された基準がその後の判断を左右する心理効果',
        content: '価格や条件の初提示は、その後の交渉や評価の基準点として強く影響を与える',
        applicable_scenarios: ['価格交渉', '予算策定', 'KPI設定', '評価面談'],
        key_concepts: ['基準点の設定', '比較効果', '認知バイアス', '意思決定の歪み'],
        practical_tips: ['複数の選択肢を同時提示', '客観的な基準を事前に設定', 'アンカーの影響を認識する'],
        examples: ['価格交渉での初期提示', '予算会議での基準値', '人事評価での基準設定']
      },
      'framing_effect': {
        name_ja: 'フレーミング効果',
        name_en: 'Framing Effect',
        academic_field: '行動経済学',
        one_liner: '同じ事実でも見せ方で選好が変わる',
        definition: '同じ情報でも提示の仕方によって受け取られ方や選好が変わる',
        content: '利得枠と損失枠の両面から事実を提示することで意思決定をコントロールする',
        applicable_scenarios: ['企画提案', '稟議承認', '営業トーク', '変更提案'],
        key_concepts: ['表現方法', '認知フレーム', '意思決定バイアス', 'コミュニケーション効果'],
        practical_tips: ['ポジティブな表現を心がける', '具体的な数値を示す', '相手の立場に立って表現する'],
        examples: ['成功率90% vs 失敗率10%', '節約効果 vs コスト削減', '成長機会 vs リスク回避']
      },
      'loss_aversion': {
        name_ja: '損失回避',
        name_en: 'Loss Aversion',
        academic_field: '行動経済学',
        one_liner: '導入しない損失を可視化して行動を促す',
        definition: '人は利益を得るより損失を避けることを優先する傾向がある',
        content: '未導入時の損失額を明示することで行動を促す',
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

        {/* シーン選択（軽量なカード表示） */}
        <View style={styles.sceneSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>シーンを選択</Text>
            <Text style={styles.sectionSubtitle}>ビジネスシーンに応じたアドバイスを取得</Text>
          </View>
          
          <View style={styles.sceneGrid}>
            {sceneConfigs.map((sceneConfig) => (
              <TouchableOpacity
                key={sceneConfig.id}
                style={styles.sceneCard}
                onPress={() => handleSceneChange(sceneConfig.id)}
              >
                <View style={styles.sceneIconContainer}>
                  <Text style={styles.sceneIcon}>{getSceneIcon(sceneConfig.id)}</Text>
                </View>
                <View style={styles.sceneContent}>
                  <Text style={styles.sceneCardTitle}>{sceneConfig.name}</Text>
                  <Text style={styles.sceneCardDescription} numberOfLines={2}>
                    {sceneConfig.description}
                  </Text>
                </View>
                <Text style={styles.sceneArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 理論メモ（軽量なカード表示） */}
        <View style={styles.theoryMemoSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📚 理論メモ</Text>
            <Text style={styles.sectionSubtitle}>100の理論をカテゴリー別に学習</Text>
          </View>
          
          <View style={styles.theoryCategoriesGrid}>
            <TouchableOpacity 
              style={styles.theoryCategoryCard} 
              onPress={() => {
                setSelectedCategory('behavioral_economics');
                setCurrentView('theoryMemo');
              }}
            >
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>🧠</Text>
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>行動経済学</Text>
                <Text style={styles.categoryDescription}>20件の理論</Text>
              </View>
              <Text style={styles.categoryArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.theoryCategoryCard} 
              onPress={() => {
                setSelectedCategory('leadership_psychology');
                setCurrentView('theoryMemo');
              }}
            >
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>👥</Text>
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>リーダーシップ・組織心理</Text>
                <Text style={styles.categoryDescription}>20件の理論</Text>
              </View>
              <Text style={styles.categoryArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.theoryCategoryCard} 
              onPress={() => {
                setSelectedCategory('negotiation');
                setCurrentView('theoryMemo');
              }}
            >
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>🤝</Text>
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>交渉術・影響力</Text>
                <Text style={styles.categoryDescription}>10件の理論</Text>
              </View>
              <Text style={styles.categoryArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.theoryCategoryCard} 
              onPress={() => {
                setSelectedCategory('strategy');
                setCurrentView('theoryMemo');
              }}
            >
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>🎯</Text>
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>経営戦略</Text>
                <Text style={styles.categoryDescription}>10件の理論</Text>
              </View>
              <Text style={styles.categoryArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.theoryCategoryCard} 
              onPress={() => {
                setSelectedCategory('innovation');
                setCurrentView('theoryMemo');
              }}
            >
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>💡</Text>
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>イノベーション・プロダクト</Text>
                <Text style={styles.categoryDescription}>10件の理論</Text>
              </View>
              <Text style={styles.categoryArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.theoryCategoryCard} 
              onPress={() => {
                setSelectedCategory('operations');
                setCurrentView('theoryMemo');
              }}
            >
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>⚙️</Text>
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>オペレーション・プロジェクト管理</Text>
                <Text style={styles.categoryDescription}>10件の理論</Text>
              </View>
              <Text style={styles.categoryArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.theoryCategoryCard} 
              onPress={() => {
                setSelectedCategory('finance_metrics');
                setCurrentView('theoryMemo');
              }}
            >
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>📊</Text>
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>ファイナンス・メトリクス</Text>
                <Text style={styles.categoryDescription}>10件の理論</Text>
              </View>
              <Text style={styles.categoryArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.theoryCategoryCard} 
              onPress={() => {
                setSelectedCategory('communication_sales');
                setCurrentView('theoryMemo');
              }}
            >
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>💬</Text>
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>コミュニケーション・営業</Text>
                <Text style={styles.categoryDescription}>10件の理論</Text>
              </View>
              <Text style={styles.categoryArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
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
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 20,
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
    paddingTop: 0,
  },
  theoryContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 0,
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
  categoryCard: {
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
    minHeight: 120,
  },
  categoryCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  categoryCardDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
    lineHeight: 18,
  },
  categoryCardCount: {
    fontSize: 12,
    color: '#007bff',
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  theoryList: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  theoryListItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    marginBottom: 12,
  },
  theoryListItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  theoryListItemSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  theoryListItemField: {
    fontSize: 12,
    color: '#495057',
    marginBottom: 4,
  },
  theoryCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  theoryCategoryCard: {
    width: '48%',
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
    minHeight: 120,
  },
  categoryIconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 24,
    color: '#007bff',
  },
  categoryContent: {
    flex: 1,
  },
  categoryArrow: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'right',
  },
  sectionHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
    lineHeight: 18,
  },
  sceneCategoryRow: {
    marginBottom: 20,
  },
  sceneCategoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  sceneScrollView: {
    marginHorizontal: -20,
  },
  sceneScrollContent: {
    paddingHorizontal: 20,
  },
  theoryCategoryRow: {
    marginBottom: 20,
  },
  theoryCategoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  sceneIconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  sceneIcon: {
    fontSize: 24,
    color: '#007bff',
  },
  sceneContent: {
    flex: 1,
  },
  sceneArrow: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'right',
  },
  adviceScrollContent: {
    paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  noAdviceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noAdviceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noAdviceSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  mainTheoryCard: {
    marginBottom: 20,
  },
  mainTheoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
});