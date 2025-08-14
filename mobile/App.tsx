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
  const [currentView, setCurrentView] = useState<'main' | 'input' | 'checklist' | 'advices' | 'theory'>('main');
  const [scene, setScene] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [timeLimit, setTimeLimit] = useState<string>('');
  const [stakes, setStakes] = useState<string>('');
  const [participants, setParticipants] = useState<number>(2);
  const [relationship, setRelationship] = useState<string>('');
  // シーン固有の詳細設定を独立したフィールドとして管理
  const [meetingType, setMeetingType] = useState<string>('');
  const [meetingFormat, setMeetingFormat] = useState<string>('');
  const [customerType, setCustomerType] = useState<string>('');
  const [industry, setIndustry] = useState<string>('');
  const [customerPosition, setCustomerPosition] = useState<string>('');
  const [companySize, setCompanySize] = useState<string>('');
  const [salesStage, setSalesStage] = useState<string>('');
  const [presentationPurpose, setPresentationPurpose] = useState<string>('');
  const [audienceType, setAudienceType] = useState<string>('');
  const [presentationFormat, setPresentationFormat] = useState<string>('');
  const [interviewType, setInterviewType] = useState<string>('');
  const [interviewRelationship, setInterviewRelationship] = useState<string>('');
  const [interviewPurpose, setInterviewPurpose] = useState<string>('');
  const [teamBuildingType, setTeamBuildingType] = useState<string>('');
  const [teamMaturity, setTeamMaturity] = useState<string>('');
  const [teamContext, setTeamContext] = useState<string>('');
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
      // データベース保存に失敗してもローカル状態は保持
      // ユーザーには静かに失敗を隠す（UXを損なわないため）
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
        // データベースからの読み込みに失敗してもアプリは動作する
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
      } else if (scene === 'sales') {
        if (customerType) payload.customer_type = customerType;
        if (industry) payload.industry = industry;
        if (customerPosition) payload.customer_position = customerPosition;
        if (companySize) payload.company_size = companySize;
        if (salesStage) payload.sales_stage = salesStage;
      } else if (scene === 'presentation') {
        if (presentationPurpose) payload.presentation_purpose = presentationPurpose;
        if (audienceType) payload.audience_type = audienceType;
        if (audienceType) payload.audience_count = participants;
        if (presentationFormat) payload.presentation_format = presentationFormat;
      } else if (scene === 'interview') {
        if (interviewType) payload.interview_type = interviewType;
        if (interviewPurpose) payload.interview_purpose = interviewPurpose;
        if (interviewRelationship) payload.interview_relationship = interviewRelationship;
      } else if (scene === 'team_building') {
        if (teamBuildingType) payload.team_building_type = teamBuildingType;
        if (teamMaturity) payload.team_maturity = teamMaturity;
        if (teamContext) payload.team_context = teamContext;
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
      
      if (error instanceof Error) {
        errorMessage = `エラー: ${error.message}`;
      }
      
      Alert.alert('エラー', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 理論を取得
  const getTheory = async (theoryId: string, theoryName: string, theoryNameJa: string) => {
    try {
      const response = await api.getTheory(theoryId);
      setCurrentTheory(response);
      setCurrentView('theory');
    } catch (error) {
      console.error('Error getting theory:', error);
      Alert.alert('エラー', '理論の取得に失敗しました');
    }
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
    setMeetingType('');
    setMeetingFormat('');
    setCustomerType('');
    setIndustry('');
    setCustomerPosition('');
    setCompanySize('');
    setSalesStage('');
    setPresentationPurpose('');
    setAudienceType('');
    setPresentationFormat('');
    setInterviewType('');
    setInterviewRelationship('');
    setInterviewPurpose('');
    setTeamBuildingType('');
    setTeamMaturity('');
    setTeamContext('');
  };

  // シーン変更時に詳細設定をリセット
  const handleSceneChange = (newScene: string) => {
    setScene(newScene);
    resetSceneDetails();
    setCurrentView('input');
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

        {/* クイックスタート */}
        <View style={styles.quickStartSection}>
          <Text style={styles.sectionTitle}>クイックスタート</Text>
          <TouchableOpacity
            style={styles.quickStartButton}
            onPress={() => {
              setScene('meeting');
              setGoal('議題の明確化と合意形成');
              setTimeLimit('1時間以内');
              setStakes('中');
              setParticipants(5);
              setRelationship('同僚');
              resetSceneDetails();
              getAdvice();
            }}
          >
            <Text style={styles.quickStartButtonText}>会議の効率化</Text>
            <Text style={styles.quickStartButtonSubtext}>すぐにアドバイスを取得</Text>
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
            </View>
          )}

          {scene === 'sales' && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>営業の詳細</Text>
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
                style={styles.theoryButton}
                onPress={() => getTheory(advice.theory_id, advice.theory_id, advice.theory_name_ja || '')}
              >
                <Text style={styles.theoryButtonText}>理論を学ぶ</Text>
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
            <Text style={styles.theoryHeaderTitle}>理論: {currentTheory.name}</Text>
          </View>

          <View style={styles.theoryCard}>
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
});