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
  ActivityIndicator,
  TextInput
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
  name_ja: string;
  name_en: string;
  domain: string;
  academic_field: string;
  one_liner: string;
  definition: string;
  content: string;
  applicable_scenarios: string;
  key_concepts: string[];
  examples: string[];
  practical_tips: string[];
  mechanism: string;
  how_to: string[];
  tags: string[];
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

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function App() {
  // Supabase設定
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

  const [currentView, setCurrentView] = useState<'main' | 'input' | 'checklist' | 'advices' | 'theory' | 'theoryMemo' | 'theoryDetail' | 'aiChat'>('main');
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
  const [teamGoals, setTeamGoals] = useState<string>('');
  const [teamActivities, setTeamActivities] = useState<string>('');
  const [teamTools, setTeamTools] = useState<string>('');
  const [teamSuccessMetrics, setTeamSuccessMetrics] = useState<string>('');
  const [teamTimeframe, setTeamTimeframe] = useState<string>('');
  const [teamBudget, setTeamBudget] = useState<string>('');
  const [advices, setAdvices] = useState<Advice[]>([]);
  const [currentTheory, setCurrentTheory] = useState<Theory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentAdvices, setRecentAdvices] = useState<RecentAdvice[]>([]);
  const [isLoadingRecentAdvices, setIsLoadingRecentAdvices] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [theoriesList, setTheoriesList] = useState<Theory[]>([]);
  const [isLoadingTheories, setIsLoadingTheories] = useState(false);
  const [relatedTheories, setRelatedTheories] = useState<Theory[]>([]);
  const [theoryCounts, setTheoryCounts] = useState<{ [key: string]: number }>({
    behavioral_econ: 25,
    leadership: 15,
    communication: 20,
    strategy: 10,
    innovation: 20,
    operations: 10,
    finance: 10,
    sales_marketing: 10
  });

  // ScrollViewのref
  const adviceScrollViewRef = useRef<ScrollView>(null);
  const theoryScrollViewRef = useRef<ScrollView>(null);
  const chatScrollViewRef = useRef<ScrollView>(null);

  // AIチャット用の状態
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const [chatContext, setChatContext] = useState<{
    scene: string;
    goal: string;
    currentAdvice?: Advice;
    currentTheory?: Theory;
  } | null>(null);

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

      // 既存のアドバイスをチェックして重複を避ける
      const existingIndex = recentAdvices.findIndex(ra => ra.id === theoryId);
      if (existingIndex !== -1) {
        // 既存のアドバイスを更新
        const updatedAdvices = [...recentAdvices];
        updatedAdvices[existingIndex] = newRecentAdvice;
        setRecentAdvices(updatedAdvices);
      } else {
        // 新しいアドバイスを追加（最大10件まで保持）
        const updatedAdvices = [newRecentAdvice, ...recentAdvices].slice(0, 10);
        setRecentAdvices(updatedAdvices);
      }
    } catch (error) {
      console.error('Error saving recent advice:', error);
    }
  };

  // AIチャットメッセージを送信
  const sendChatMessage = async () => {
    if (!chatInput.trim() || isLoadingChat) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    };

    // ユーザーメッセージを追加
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoadingChat(true);

    try {
      // シーンに応じたAIチャット関数を選択
      let chatEndpoint = 'ai-chat'; // デフォルト
      
      if (scene === 'meeting') {
        chatEndpoint = 'ai-chat-meeting';
      } else if (scene === 'sales') {
        chatEndpoint = 'ai-chat-sales';
      } else if (scene === 'presentation') {
        chatEndpoint = 'ai-chat-presentation';
      } else if (scene === 'interview') {
        chatEndpoint = 'ai-chat-interview';
      } else if (scene === 'team_building') {
        chatEndpoint = 'ai-chat-team-building';
      }

      // AIチャットAPIを呼び出し
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${chatEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          context: chatContext,
          chatHistory: chatMessages.slice(-5) // 直近5件の履歴を送信
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const aiResponse = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: aiResponse.response || '申し訳ございません。回答を生成できませんでした。',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: '申し訳ございません。エラーが発生しました。しばらく時間をおいて再度お試しください。',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  // アプリ起動時に最近のアドバイスを復元
  useEffect(() => {
    const loadRecentAdvices = async () => {
      try {
        setIsLoadingRecentAdvices(true);
        console.log('Loading recent advices...');
        const response = await api.getRecentAdvices();
        console.log('Recent advices response:', response);
        
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
          console.log('Loaded recent advices:', loadedAdvices);
          // 最新の10件まで表示
          const limitedAdvices = loadedAdvices.slice(0, 10);
          setRecentAdvices(limitedAdvices);
        } else {
          console.log('No recent advices found');
          // サンプルのアドバイスを表示（テスト用）
          const sampleAdvices: RecentAdvice[] = [
            {
              id: 'sample_1',
              scene: 'meeting',
              goal: '会議を効率的に進行する',
              timeLimit: '30分',
              stakes: '中',
              participants: 8,
              relationship: 'チーム内',
              advice: {
                theory_id: 'sample_theory_1',
                short_advice: 'アジェンダを事前に共有し、時間配分を明確にする',
                expected_effect: '会議時間の短縮と成果の向上',
                caution: '参加者の意見を十分に聞く時間を確保する',
                tips: 'タイマーを使用して時間管理を徹底する',
                related_theory: '時間管理理論',
                implementation_steps: ['1.アジェンダ作成', '2.時間配分設定', '3.進行役の決定'],
                success_indicators: ['会議時間内での議題完了'],
                common_mistakes: ['時間配分の甘い見積もり']
              },
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1日前
            },
            {
              id: 'sample_2',
              scene: 'presentation',
              goal: 'プレゼンテーションで聴衆の関心を引く',
              timeLimit: '15分',
              stakes: '高',
              participants: 25,
              relationship: '顧客・上司',
              advice: {
                theory_id: 'sample_theory_2',
                short_advice: 'ストーリーテリングを活用して物語性を持たせる',
                expected_effect: '聴衆の理解度と記憶の向上',
                caution: '過度に感情的な表現は避ける',
                tips: '具体的な事例や数字で裏付ける',
                related_theory: 'ストーリーテリング理論',
                implementation_steps: ['1.ストーリー構成', '2.事例収集', '3.練習・リハーサル'],
                success_indicators: ['聴衆からの質問や反応'],
                common_mistakes: ['長すぎる導入部']
              },
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2日前
            },
            {
              id: 'sample_3',
              scene: 'sales',
              goal: '顧客のニーズを正確に把握する',
              timeLimit: '45分',
              stakes: '高',
              participants: 2,
              relationship: '顧客',
              advice: {
                theory_id: 'sample_theory_3',
                short_advice: 'オープンクエスチョンで深掘りし、顧客の本音を聞き出す',
                expected_effect: '顧客満足度と成約率の向上',
                caution: '押し売りにならないよう注意する',
                tips: '顧客の話を最後まで聞き、相槌を打つ',
                related_theory: '傾聴理論',
                implementation_steps: ['1.関係構築', '2.ニーズ探り', '3.ソリューション提案'],
                success_indicators: ['顧客からの詳細な情報開示'],
                common_mistakes: ['早すぎる提案']
              },
              timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3日前
            },
            {
              id: 'sample_4',
              scene: 'interview',
              goal: '面接で良い印象を与える',
              timeLimit: '60分',
              stakes: '高',
              participants: 3,
              relationship: '面接官',
              advice: {
                theory_id: 'sample_theory_4',
                short_advice: 'STAR法で具体的な経験を説明する',
                expected_effect: '面接官の理解と評価の向上',
                caution: '嘘や誇張は避ける',
                tips: '事前に練習し、時間配分を意識する',
                related_theory: 'STAR法',
                implementation_steps: ['1.状況整理', '2.タスク明確化', '3.行動説明', '4.結果提示'],
                success_indicators: ['面接官からの詳細な質問'],
                common_mistakes: ['抽象的な回答']
              },
              timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4日前
            },
            {
              id: 'sample_5',
              scene: 'team-building',
              goal: 'チームの結束力を高める',
              timeLimit: '120分',
              stakes: '中',
              participants: 12,
              relationship: 'チームメンバー',
              advice: {
                theory_id: 'sample_theory_5',
                short_advice: '共通の目標設定と相互理解を促進する',
                expected_effect: 'チームワークと生産性の向上',
                caution: '強制的な参加は避ける',
                tips: '楽しい要素を取り入れて自然な交流を促す',
                related_theory: 'チームビルディング理論',
                implementation_steps: ['1.アイスブレイク', '2.目標共有', '3.協力活動', '4.振り返り'],
                success_indicators: ['メンバー間の自然な交流'],
                common_mistakes: ['形式的な活動']
              },
              timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5日前
            }
          ];
          console.log('Setting sample advices:', sampleAdvices);
          setRecentAdvices(sampleAdvices);
        }
      } catch (error) {
        console.error('Failed to load recent advices:', error);
        // エラーが発生した場合、空の配列を設定
        setRecentAdvices([]);
      } finally {
        setIsLoadingRecentAdvices(false);
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

  // チャットメッセージが更新された時に自動スクロール
  useEffect(() => {
    if (chatMessages.length > 0 && chatScrollViewRef.current) {
      setTimeout(() => {
        chatScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages]);

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

  // 理論メモ画面に移動した時に理論数を取得
  useEffect(() => {
    if (currentView === 'theoryMemo') {
      try {
        getAllTheoryCounts();
      } catch (error) {
        console.error('Error in theory memo useEffect:', error);
        // エラーが発生しても、デフォルト値で画面を表示
      }
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
        if (teamGoals) payload.team_goals = teamGoals;
        if (teamActivities) payload.team_activities = teamActivities;
        if (teamTools) payload.team_tools = teamTools;
        if (teamSuccessMetrics) payload.team_success_metrics = teamSuccessMetrics;
        if (teamTimeframe) payload.team_timeframe = teamTimeframe;
        if (teamBudget) payload.team_budget = teamBudget;
      }

      console.log('Sending request with payload:', payload);

      const response = await api.createSession(payload);

      console.log('API response:', response);

      if (response.advices && response.advices.length > 0) {
        setAdvices(response.advices);
        setCurrentView('advices');
        // 全てのアドバイスを最近使用に保存（重複を防ぎながら）
        console.log(`Saving ${response.advices.length} advices to recent advices...`);
        
        for (const advice of response.advices) {
          try {
            await saveRecentAdvice(advice);
            console.log(`Successfully saved advice: ${advice.theory_id || 'unknown'}`);
          } catch (error) {
            console.error(`Failed to save advice ${advice.theory_id}:`, error);
          }
        }
        
        console.log(`Completed saving ${response.advices.length} advices to recent advices`);
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
        
        // 3個の理論をrelatedTheories状態に保存
        const theories = response.related_theories.map((theory: any) => ({
          id: theory.id,
          name_ja: theory.name || '関連理論',
          name_en: theory.name || 'Related Theory',
          domain: theory.domain || 'Theory',
          academic_field: theory.academic_field || 'Theory',
          one_liner: theory.description || 'No one-liner available',
          definition: theory.description || 'No definition available',
          content: theory.description || 'No content available',
          applicable_scenarios: theory.when_to_use || 'No scenarios available',
          key_concepts: theory.key_concepts || [],
          examples: theory.examples || [],
          practical_tips: theory.practical_tips || [],
          mechanism: 'No mechanism',
          how_to: [],
          tags: []
        }));
        
        setRelatedTheories(theories);
        
        // 一番上の理論をメインとして表示し、関連理論も含める
        const topTheory = theories[0];
        console.log('Top theory to display:', topTheory);
        
        setCurrentTheory({
          id: 'related_theories',
          name_ja: topTheory.name_ja || '関連理論',
          name_en: topTheory.name_en || 'Related Theory',
          domain: topTheory.domain || 'Theory',
          academic_field: topTheory.academic_field || 'Theory',
          one_liner: topTheory.one_liner || 'No one-liner available',
          definition: topTheory.definition || 'No definition available',
          content: topTheory.content || 'No content available',
          applicable_scenarios: topTheory.applicable_scenarios || 'No scenarios available',
          key_concepts: topTheory.key_concepts || [],
          examples: topTheory.examples || [],
          practical_tips: topTheory.practical_tips || [],
          mechanism: topTheory.mechanism || 'No mechanism',
          how_to: topTheory.how_to || [],
          tags: topTheory.tags || []
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
      name_ja: advice.theory_name_ja || 'アドバイス理論',
      name_en: 'Advice Theory',
      domain: 'advice',
      academic_field: 'アドバイス',
      one_liner: advice.short_advice,
      definition: advice.short_advice,
      content: advice.short_advice,
      applicable_scenarios: `${scene} - ${goal}`,
      key_concepts: [advice.expected_effect],
      examples: [advice.short_advice],
      practical_tips: [],
      mechanism: '',
      how_to: [],
      tags: []
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
    setTeamGoals('');
    setTeamActivities('');
    setTeamTools('');
    setTeamSuccessMetrics('');
    setTeamTimeframe('');
    setTeamBudget('');
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
              onPress={() => {
                setSelectedCategory('behavioral_econ');
                getTheoriesByCategory('behavioral_econ');
              }}
            >
              <Text style={styles.categoryCardTitle}>行動経済学</Text>
              <Text style={styles.categoryCardDescription}>人間の意思決定と行動に関する理論</Text>
              <Text style={styles.categoryCardCount}>{theoryCounts.behavioral_econ || 20}件の理論</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.categoryCard} 
              onPress={() => {
                setSelectedCategory('leadership');
                getTheoriesByCategory('leadership');
              }}
            >
              <Text style={styles.categoryCardTitle}>リーダーシップ・組織心理</Text>
              <Text style={styles.categoryCardDescription}>リーダーシップと組織開発の理論</Text>
              <Text style={styles.categoryCardCount}>{theoryCounts.leadership || 15}件の理論</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.categoryCard} 
              onPress={() => {
                setSelectedCategory('communication');
                getTheoriesByCategory('communication');
              }}
            >
              <Text style={styles.categoryCardTitle}>交渉・コミュニケーション・営業</Text>
              <Text style={styles.categoryCardDescription}>交渉、コミュニケーション、営業の理論</Text>
              <Text style={styles.categoryCardCount}>{theoryCounts.communication || 20}件の理論</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.categoryCard} 
              onPress={() => {
                setSelectedCategory('innovation');
                getTheoriesByCategory('innovation');
              }}
            >
              <Text style={styles.categoryCardTitle}>経営戦略・イノベーション</Text>
              <Text style={styles.categoryCardDescription}>経営戦略とイノベーションの理論</Text>
              <Text style={styles.categoryCardCount}>{theoryCounts.innovation || 20}件の理論</Text>
            </TouchableOpacity>



            <TouchableOpacity 
              style={styles.categoryCard} 
              onPress={() => {
                setSelectedCategory('operations');
                getTheoriesByCategory('operations');
              }}
            >
              <Text style={styles.categoryCardTitle}>オペレーション・プロジェクト管理</Text>
              <Text style={styles.categoryCardDescription}>業務効率化とプロジェクト管理の理論</Text>
              <Text style={styles.categoryCardCount}>{theoryCounts.operations || 10}件の理論</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.categoryCard} 
              onPress={() => {
                setSelectedCategory('finance');
                getTheoriesByCategory('finance');
              }}
            >
              <Text style={styles.categoryCardTitle}>ファイナンス・メトリクス</Text>
              <Text style={styles.categoryCardDescription}>財務分析と指標の理論</Text>
              <Text style={styles.categoryCardCount}>{theoryCounts.finance || 10}件の理論</Text>
            </TouchableOpacity>


          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // 理論一覧表示
  const renderTheoryList = () => {
    if (!selectedCategory) return null;
    
    if (isLoadingTheories) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.theoryMemoHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={styles.backButtonText}>← 戻る</Text>
            </TouchableOpacity>
            <Text style={styles.theoryMemoHeaderTitle}>{getCategoryTitle(selectedCategory)}</Text>
          </View>
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>理論一覧を読み込み中...</Text>
          </View>
        </SafeAreaView>
      );
    }
    
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
            {theoriesList.map((theory) => (
              <TouchableOpacity 
                key={theory.id}
                style={styles.theoryListItem} 
                onPress={() => showTheoryDetail(theory.id)}
              >
                <Text style={styles.theoryListItemTitle}>{theory.name_ja}</Text>
                <Text style={styles.theoryListItemSubtitle}>{theory.name_en}</Text>
                <Text style={styles.theoryListItemField}>{theory.academic_field}</Text>
                {theory.one_liner && (
                  <Text style={styles.theoryListItemSubtitle}>{theory.one_liner}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  // カテゴリー別理論データを取得
  const getTheoriesByCategory = async (category: string) => {
    try {
      setIsLoadingTheories(true);
      const response = await fetch(`${SUPABASE_URL}/functions/v1/theory-memo?action=list&domain=${category}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 理論データの整合性チェック
      const validatedTheories = (data.theories || []).map((theory: any) => ({
        ...theory,
        applicable_scenarios: Array.isArray(theory.applicable_scenarios) ? theory.applicable_scenarios : 
                             (typeof theory.applicable_scenarios === 'string' ? [theory.applicable_scenarios] : []),
        key_concepts: Array.isArray(theory.key_concepts) ? theory.key_concepts : 
                     (typeof theory.key_concepts === 'string' ? [theory.key_concepts] : []),
        examples: Array.isArray(theory.examples) ? theory.examples : 
                 (typeof theory.examples === 'string' ? [theory.examples] : []),
        practical_tips: Array.isArray(theory.practical_tips) ? theory.practical_tips : 
                       (typeof theory.practical_tips === 'string' ? [theory.practical_tips] : [])
      }));
      
      setTheoriesList(validatedTheories);
      
      // 理論数を更新
      setTheoryCounts(prev => ({
        ...prev,
        [category]: validatedTheories.length
      }));
    } catch (error) {
      console.error('Error fetching theories:', error);
      setTheoriesList([]);
      
      // ユーザーにエラーを通知
      Alert.alert(
        'エラー',
        '理論一覧を読み込めませんでした。しばらく時間をおいて再度お試しください。',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingTheories(false);
    }
  };

  // 全カテゴリーの理論数を取得
  const getAllTheoryCounts = async () => {
    const categories = ['behavioral_econ', 'leadership', 'communication', 'strategy', 'innovation', 'operations', 'finance', 'sales_marketing'];
    
    // デフォルトの理論数を設定（実際のJSONファイルの理論数に基づく）
    const defaultCounts = {
      behavioral_econ: 25,  // behavioral_economics_theories.json: 25個
      leadership: 15,        // leadership_theories.sql: 15個
      communication: 20,     // communication + negotiation: 20個
      strategy: 10,          // strategy_theories.json: 10個
      innovation: 20,        // strategy + innovation: 20個
      operations: 10,        // operations_theories.json: 10個
      finance: 10,           // finance_theories.json: 10個
      sales_marketing: 10    // sales_marketing_theories.json: 10個
    };
    
    // まずデフォルト値を設定
    setTheoryCounts(defaultCounts);
    
    // データベースから実際の理論数を取得
    for (const category of categories) {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/theory-memo?action=list&domain=${category}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const actualCount = data.theories?.length || 0;
          
          console.log(`Category ${category}: Found ${actualCount} theories in database`);
          
          // 実際の理論数が0より大きい場合のみ更新
          if (actualCount > 0) {
            setTheoryCounts(prev => ({
              ...prev,
              [category]: actualCount
            }));
          } else {
            console.log(`Category ${category}: No theories found in database, using default count`);
          }
        }
      } catch (error) {
        console.error(`Error fetching theory count for ${category}:`, error);
      }
    }
  };

  // 理論詳細を表示
  const showTheoryDetail = async (theoryId: string) => {
    try {
      setIsLoadingTheory(true);
      setSelectedTheoryId(theoryId);
      setCurrentView('theoryDetail');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/theory-memo?action=get&theory_id=${theoryId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const theoryData = await response.json();
      
      // データの整合性チェックと正規化
      const normalizedTheoryData = {
        ...theoryData,
        applicable_scenarios: Array.isArray(theoryData.applicable_scenarios) ? theoryData.applicable_scenarios : 
                             (typeof theoryData.applicable_scenarios === 'string' ? [theoryData.applicable_scenarios] : []),
        key_concepts: Array.isArray(theoryData.key_concepts) ? theoryData.key_concepts : 
                     (typeof theoryData.key_concepts === 'string' ? [theoryData.key_concepts] : []),
        examples: Array.isArray(theoryData.examples) ? theoryData.examples : 
                 (typeof theoryData.examples === 'string' ? [theoryData.examples] : []),
        practical_tips: Array.isArray(theoryData.practical_tips) ? theoryData.practical_tips : 
                       (typeof theoryData.practical_tips === 'string' ? [theoryData.practical_tips] : []),
        how_to: Array.isArray(theoryData.how_to) ? theoryData.how_to : 
                (typeof theoryData.how_to === 'string' ? [theoryData.how_to] : []),
        templates: Array.isArray(theoryData.templates) ? theoryData.templates : 
                  (typeof theoryData.templates === 'string' ? [theoryData.templates] : [])
      };
      
      setSelectedTheoryData(normalizedTheoryData);
    } catch (error) {
      console.error('Error fetching theory detail:', error);
      setSelectedTheoryData(null);
      
      // ユーザーにエラーを通知
      Alert.alert(
        'エラー',
        '理論の詳細情報を読み込めませんでした。しばらく時間をおいて再度お試しください。',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingTheory(false);
    }
  };

  // カテゴリータイトルを取得
  const getCategoryTitle = (category: string) => {
    const titles: { [key: string]: string } = {
      'behavioral_econ': '行動経済学',
              'leadership': 'リーダーシップ・組織心理',
      'communication': '交渉・コミュニケーション・営業',
      'innovation': '経営戦略・イノベーション',
      'operations': 'オペレーション・プロジェクト管理',
      'finance': 'ファイナンス・メトリクス',
      'negotiation': '交渉術・影響力'
    };
    return titles[category] || category;
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
              {/* チームの目標 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>チームの目標:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.teamGoals?.map((goal) => (
                      <TouchableOpacity
                        key={goal}
                        style={[
                          styles.detailOption,
                          teamGoals === goal && styles.selectedDetailOption
                        ]}
                        onPress={() => setTeamGoals(goal)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          teamGoals === goal && styles.selectedDetailOptionText
                        ]}>
                          {goal}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              {/* チームの活動 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>チームの活動:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.teamActivities?.map((activity) => (
                      <TouchableOpacity
                        key={activity}
                        style={[
                          styles.detailOption,
                          teamActivities === activity && styles.selectedDetailOption
                        ]}
                        onPress={() => setTeamActivities(activity)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          teamActivities === activity && styles.selectedDetailOptionText
                        ]}>
                          {activity}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              {/* チームのツール */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>チームのツール:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.teamTools?.map((tool) => (
                      <TouchableOpacity
                        key={tool}
                        style={[
                          styles.detailOption,
                          teamTools === tool && styles.selectedDetailOption
                        ]}
                        onPress={() => setTeamTools(tool)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          teamTools === tool && styles.selectedDetailOptionText
                        ]}>
                          {tool}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              {/* チームの成功指標 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>チームの成功指標:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.teamSuccessMetrics?.map((metric) => (
                      <TouchableOpacity
                        key={metric}
                        style={[
                          styles.detailOption,
                          teamSuccessMetrics === metric && styles.selectedDetailOption
                        ]}
                        onPress={() => setTeamSuccessMetrics(metric)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          teamSuccessMetrics === metric && styles.selectedDetailOptionText
                        ]}>
                          {metric}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              {/* チームの時間枠 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>チームの時間枠:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.teamTimeframe?.map((timeframe) => (
                      <TouchableOpacity
                        key={timeframe}
                        style={[
                          styles.detailOption,
                          teamTimeframe === timeframe && styles.selectedDetailOption
                        ]}
                        onPress={() => setTeamTimeframe(timeframe)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          teamTimeframe === timeframe && styles.selectedDetailOptionText
                        ]}>
                          {timeframe}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              {/* チームの予算 */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>チームの予算:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.detailOptions}>
                    {sceneConfig.teamBudget?.map((budget) => (
                      <TouchableOpacity
                        key={budget}
                        style={[
                          styles.detailOption,
                          teamBudget === budget && styles.selectedDetailOption
                        ]}
                        onPress={() => setTeamBudget(budget)}
                      >
                        <Text style={[
                          styles.detailOptionText,
                          teamBudget === budget && styles.selectedDetailOptionText
                        ]}>
                          {budget}
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
                  <Text key={indicatorIndex} style={styles.adviceStep}>
                    • {indicator}
                  </Text>
                ))}
              </>
            )}
            
            {advice.common_mistakes && advice.common_mistakes.length > 0 && (
              <>
                <Text style={styles.adviceSubtitle}>よくある失敗</Text>
                {advice.common_mistakes.map((mistake, mistakeIndex) => (
                  <Text key={mistakeIndex} style={styles.adviceStep}>
                    • {mistake}
                  </Text>
                ))}
              </>
            )}
            
            {/* AIチャットボタン */}
            <TouchableOpacity
              style={styles.aiChatButton}
              onPress={() => openAiChat(advice)}
            >
              <Text style={styles.aiChatButtonText}>🤖 AIに追加で相談する</Text>
            </TouchableOpacity>
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
              理論
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
                <Text style={styles.theoryName}>{currentTheory.name_ja}</Text>
                <Text style={styles.adviceText}>
                  {currentTheory.one_liner || '理論の説明がありません'}
                </Text>
                  
                {currentTheory.key_concepts && Array.isArray(currentTheory.key_concepts) && currentTheory.key_concepts.length > 0 && (
                  <>
                    <Text style={styles.adviceSubtitle}>主要概念</Text>
                    {currentTheory.key_concepts.map((concept, conceptIndex) => (
                      <Text key={conceptIndex} style={styles.adviceStep}>• {concept}</Text>
                    ))}
                  </>
                )}
                
                {currentTheory.applicable_scenarios && (
                  <>
                    <Text style={styles.adviceSubtitle}>適用場面</Text>
                    <Text style={styles.adviceStep}>• {currentTheory.applicable_scenarios}</Text>
                  </>
                )}
                
                {currentTheory.examples && Array.isArray(currentTheory.examples) && currentTheory.examples.length > 0 && (
                  <>
                    <Text style={styles.adviceSubtitle}>具体例</Text>
                    {currentTheory.examples.map((example, exampleIndex) => (
                      <Text key={exampleIndex} style={styles.adviceStep}>• {example}</Text>
                    ))}
                  </>
                )}
                
                {currentTheory.practical_tips && Array.isArray(currentTheory.practical_tips) && currentTheory.practical_tips.length > 0 && (
                  <>
                    <Text style={styles.adviceSubtitle}>実践のコツ</Text>
                    {currentTheory.practical_tips.map((tip, tipIndex) => (
                      <Text key={tipIndex} style={styles.adviceStep}>• {tip}</Text>
                    ))}
                  </>
                )}
              </View>

              {/* 関連理論の表示 */}
              {relatedTheories.length > 1 && (
                <View style={styles.adviceCard}>
                  <Text style={styles.adviceTitle}>関連理論</Text>
                  {relatedTheories.slice(1).map((theory, index) => (
                    <View key={theory.id} style={styles.relatedTheoryCard}>
                      <Text style={styles.relatedTheoryTitle}>
                        {theory.name_ja}
                      </Text>
                      <Text style={styles.adviceText}>
                        {theory.one_liner || '理論の説明がありません'}
                      </Text>
                      
                      {theory.key_concepts && Array.isArray(theory.key_concepts) && theory.key_concepts.length > 0 && (
                        <>
                          <Text style={styles.adviceSubtitle}>主要概念</Text>
                          {theory.key_concepts.map((concept, conceptIndex) => (
                            <Text key={conceptIndex} style={styles.adviceStep}>• {concept}</Text>
                          ))}
                        </>
                      )}
                      
                      {theory.applicable_scenarios && (
                        <>
                          <Text style={styles.adviceSubtitle}>適用場面</Text>
                          <Text style={styles.adviceStep}>• {theory.applicable_scenarios}</Text>
                        </>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
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
            
            {selectedTheoryData.applicable_scenarios && Array.isArray(selectedTheoryData.applicable_scenarios) && selectedTheoryData.applicable_scenarios.length > 0 && (
              <View style={styles.theorySection}>
                <Text style={styles.theorySectionTitle}>適用場面</Text>
                {selectedTheoryData.applicable_scenarios.map((scenario: string, index: number) => (
                  <Text key={index} style={styles.theoryListItem}>
                    • {scenario}
                  </Text>
                ))}
              </View>
            )}
            
            {selectedTheoryData.key_concepts && Array.isArray(selectedTheoryData.key_concepts) && selectedTheoryData.key_concepts.length > 0 && (
              <View style={styles.theorySection}>
                <Text style={styles.theorySectionTitle}>キーコンセプト</Text>
                {selectedTheoryData.key_concepts.map((concept: string, index: number) => (
                  <Text key={index} style={styles.theoryListItem}>
                    • {concept}
                  </Text>
                ))}
              </View>
            )}
            
            {selectedTheoryData.practical_tips && Array.isArray(selectedTheoryData.practical_tips) && selectedTheoryData.practical_tips.length > 0 && (
              <View style={styles.theorySection}>
                <Text style={styles.theorySectionTitle}>実践的なヒント</Text>
                {selectedTheoryData.practical_tips.map((tip: string, index: number) => (
                  <Text key={index} style={styles.theoryListItem}>
                    • {tip}
                  </Text>
                ))}
              </View>
            )}
            
            {selectedTheoryData.examples && Array.isArray(selectedTheoryData.examples) && selectedTheoryData.examples.length > 0 && (
              <View style={styles.theorySection}>
                <Text style={styles.theorySectionTitle}>具体例</Text>
                {selectedTheoryData.examples.map((example: string, index: number) => (
                  <Text key={index} style={styles.theoryListItem}>
                    • {example}
                  </Text>
                ))}
              </View>
            )}
            
            {selectedTheoryData.how_to && Array.isArray(selectedTheoryData.how_to) && selectedTheoryData.how_to.length > 0 && (
              <View style={styles.theorySection}>
                <Text style={styles.theorySectionTitle}>実践方法</Text>
                {selectedTheoryData.how_to.map((step: string, index: number) => (
                  <Text key={index} style={styles.theoryListItem}>
                    {index + 1}. {step}
                  </Text>
                ))}
              </View>
            )}
            
            {selectedTheoryData.templates && Array.isArray(selectedTheoryData.templates) && selectedTheoryData.templates.length > 0 && (
              <View style={styles.theorySection}>
                <Text style={styles.theorySectionTitle}>テンプレート</Text>
                {selectedTheoryData.templates.map((template: string, index: number) => (
                  <Text key={index} style={styles.theoryListItem}>
                    • {template}
                  </Text>
                ))}
              </View>
            )}
            
            {/* AIチャットボタン */}
            <TouchableOpacity
              style={styles.aiChatButton}
              onPress={() => openAiChat(undefined, selectedTheoryData)}
            >
              <Text style={styles.aiChatButtonText}>🤖 この理論についてAIに相談する</Text>
            </TouchableOpacity>
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
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>
            最近使用したアドバイス (最大10件)
          </Text>
          {isLoadingRecentAdvices ? (
            <View style={styles.loadingRecentSection}>
              <ActivityIndicator size="small" color="#007bff" />
              <Text style={styles.loadingRecentText}>読み込み中...</Text>
            </View>
          ) : recentAdvices.length > 0 ? (
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
          ) : (
            <View style={styles.emptyRecentSection}>
              <Text style={styles.emptyRecentText}>
                まだアドバイスを使用していません
              </Text>
              <Text style={styles.emptyRecentSubtext}>
                シーンを選択してアドバイスを取得してみましょう
              </Text>
            </View>
          )}
        </View>

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

        {/* 理論メモ */}
        <View style={styles.theoryMemoSection}>
          <TouchableOpacity 
            style={styles.theoryMemoButton}
            onPress={() => setCurrentView('theoryMemo')}
          >
            <View style={styles.theoryMemoButtonContent}>
              <Text style={styles.theoryMemoIcon}>📚</Text>
              <Text style={styles.theoryMemoButtonText}>理論メモ</Text>
              <Text style={styles.theoryMemoButtonSubtext}>100の理論をカテゴリー別に学習</Text>
            </View>
            <Text style={styles.theoryMemoButtonArrow}>›</Text>
          </TouchableOpacity>
        </View>


      </ScrollView>
    </SafeAreaView>
  );

  // AIチャット画面
  const renderAiChat = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.chatHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentView('advices')}
        >
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.chatHeaderTitle}>AIチャット</Text>
      </View>

      {/* チャットコンテキスト表示 */}
      {chatContext && (
        <View style={styles.chatContextCard}>
          <Text style={styles.chatContextTitle}>現在の状況</Text>
          <Text style={styles.chatContextText}>
            シーン: {getSceneName(chatContext.scene)} | 目標: {chatContext.goal}
          </Text>
          {chatContext.currentAdvice && (
            <Text style={styles.chatContextText}>
              アドバイス: {chatContext.currentAdvice.short_advice}
            </Text>
          )}
          {chatContext.currentTheory && (
            <Text style={styles.chatContextText}>
              理論: {chatContext.currentTheory.name_ja}
            </Text>
          )}
        </View>
      )}

      {/* チャット入力 - 上部に配置 */}
      <View style={styles.chatInputContainerTop}>
        <TextInput
          style={styles.chatInput}
          value={chatInput}
          onChangeText={setChatInput}
          placeholder="気軽に相談してみてください..."
          multiline
          maxLength={200}
        />
        <TouchableOpacity
          style={[
            styles.chatSendButton,
            (!chatInput.trim() || isLoadingChat) && styles.chatSendButtonDisabled
          ]}
          onPress={sendChatMessage}
          disabled={!chatInput.trim() || isLoadingChat}
        >
          <Text style={styles.chatSendButtonText}>送信</Text>
        </TouchableOpacity>
      </View>

      {/* 気軽に相談できる例文ヒント */}
      <View style={styles.chatHintSection}>
        <Text style={styles.chatHintTitle}>💡 こんな感じで相談してみてください</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.chatHintScrollView}
          contentContainerStyle={styles.chatHintContent}
        >
          <TouchableOpacity
            style={styles.chatHintCard}
            onPress={() => setChatInput("今日の会議で気をつけるべきことは？")}
          >
            <Text style={styles.chatHintText}>今日の会議で気をつけるべきことは？</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chatHintCard}
            onPress={() => setChatInput("営業で使えるテクニックは？")}
          >
            <Text style={styles.chatHintText}>営業で使えるテクニックは？</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chatHintCard}
            onPress={() => setChatInput("プレゼンのコツを教えて")}
          >
            <Text style={styles.chatHintText}>プレゼンのコツを教えて</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chatHintCard}
            onPress={() => setChatInput("チームビルディングのアイデア")}
          >
            <Text style={styles.chatHintText}>チームビルディングのアイデア</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* チャットメッセージ表示 */}
      <ScrollView 
        style={styles.chatMessagesContainer}
        showsVerticalScrollIndicator={true}
        ref={chatScrollViewRef}
        nestedScrollEnabled={true}
      >
        {chatMessages.length === 0 ? (
          <View style={styles.emptyChatContainer}>
            <Text style={styles.emptyChatText}>
              AIに質問や相談をしてみましょう！
            </Text>
            <Text style={styles.emptyChatSubtext}>
              理論の実践方法や具体例について詳しく聞くことができます。
            </Text>
          </View>
        ) : (
          chatMessages.map((message) => (
            <View 
              key={message.id} 
              style={[
                styles.chatMessage,
                message.role === 'user' ? styles.userMessage : styles.assistantMessage
              ]}
            >
              <ScrollView 
                style={styles.chatMessageContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                <Text style={[
                  styles.chatMessageText,
                  message.role === 'user' ? styles.userMessageText : styles.assistantMessageText
                ]}>
                  {message.content}
                </Text>
              </ScrollView>
              <Text style={styles.chatMessageTime}>
                {message.timestamp.toLocaleTimeString('ja-JP', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
          ))
        )}
        {isLoadingChat && (
          <View style={styles.loadingMessage}>
            <ActivityIndicator size="small" color="#007bff" />
            <Text style={styles.loadingMessageText}>AIが考え中...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  // AIチャット画面に移動
  const openAiChat = (advice?: Advice, theory?: Theory) => {
    // シーン固有の詳細設定を取得
    let sceneSpecificContext: any = {};
    
    if (scene === 'meeting') {
      sceneSpecificContext = {
        meetingType,
        meetingFormat,
        meetingUrgency,
        meetingFrequency,
        meetingParticipants,
        meetingTools,
        meetingChallenges
      };
    } else if (scene === 'sales') {
      sceneSpecificContext = {
        customerType,
        industry,
        customerPosition,
        companySize,
        salesStage,
        dealSize,
        competitionLevel,
        customerPainPoints
      };
    } else if (scene === 'presentation') {
      sceneSpecificContext = {
        presentationPurpose,
        audienceType,
        presentationFormat,
        presentationTopics,
        audienceExpertise,
        presentationConstraints
      };
    } else if (scene === 'interview') {
      sceneSpecificContext = {
        interviewType,
        interviewRelationship,
        interviewPurpose,
        interviewContext,
        interviewOutcomes
      };
    } else if (scene === 'team_building') {
      sceneSpecificContext = {
        teamBuildingType,
        teamMaturity,
        teamContext,
        teamSize,
        teamDiversity,
        teamChallenges,
        teamGoals,
        teamActivities,
        teamTools,
        teamSuccessMetrics,
        teamTimeframe,
        teamBudget
      };
    }

    // チャットコンテキストを設定
    setChatContext({
      scene,
      goal,
      currentAdvice: advice,
      currentTheory: theory,
      ...sceneSpecificContext
    });
    
    // チャットメッセージをリセット
    setChatMessages([]);
    setChatInput('');
    
    // AIチャット画面に移動
    setCurrentView('aiChat');
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
    case 'aiChat':
      return renderAiChat();
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
  emptyRecentSection: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginHorizontal: 20,
  },
  emptyRecentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyRecentSubtext: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
  },
  loadingRecentSection: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginHorizontal: 20,
  },
  loadingRecentText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
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
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  relatedTheoryTitle: {
    fontSize: 16,
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  theoryMemoButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  theoryMemoButtonSubtext: {
    fontSize: 14,
    color: '#6c757d',
  },
  theoryMemoButtonContent: {
    flex: 1,
    alignItems: 'center',
  },
  theoryMemoIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  theoryMemoButtonArrow: {
    fontSize: 18,
    color: '#007bff',
    fontWeight: 'bold',
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
  theoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  chatHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  chatContextCard: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatContextTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  chatContextText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
    lineHeight: 18,
  },
  chatMessagesContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
    marginTop: 8,
    paddingBottom: 20,
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyChatSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  chatMessage: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    marginBottom: 12,
    maxHeight: 300,
  },
  chatMessageContent: {
    maxHeight: 250,
    paddingRight: 8,
  },
  chatMessageText: {
    fontSize: 14,
    color: '#212529',
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  userMessage: {
    backgroundColor: '#e7f3ff',
  },
  userMessageText: {
    color: '#007bff',
  },
  assistantMessage: {
    backgroundColor: '#f8f9fa',
  },
  assistantMessageText: {
    color: '#212529',
  },
  chatMessageTime: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  chatInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#212529',
    marginRight: 16,
  },
  chatSendButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  chatSendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  chatSendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loadingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  loadingMessageText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
  },
  aiChatButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  aiChatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  chatInputContainerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    marginBottom: 8,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  chatHintSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  chatHintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 12,
    textAlign: 'center',
  },
  chatHintScrollView: {
    marginHorizontal: -16,
  },
  chatHintContent: {
    paddingHorizontal: 16,
  },
  chatHintCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 120,
  },
  chatHintText: {
    fontSize: 12,
    color: '#495057',
    textAlign: 'center',
    lineHeight: 16,
  },
});

