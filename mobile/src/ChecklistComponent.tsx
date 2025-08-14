import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import * as api from './api';

interface ChecklistComponentProps {
  scene: string;
  goal: string;
  timeLimit: string;
  stakes: string;
  participants?: number;
  relationship?: string;
  onBack: () => void; // 戻るボタンのコールバックを追加
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
  specific_advice?: string;
}

interface ChecklistResponse {
  checklist: ChecklistItem[];
  summary: string;
  recommendations: string[];
  team_building_specific_tips?: string[];
  team_dynamics_tips?: string[];
  preparation_timeline?: string[];
  industry_topics?: string[];
  presentation_specific_tips?: string[];
  audience_engagement_tips?: string[];
  interview_specific_tips?: string[];
  relationship_building_tips?: string[];
}

export default function ChecklistComponent({
  scene,
  goal,
  timeLimit,
  stakes,
  participants,
  relationship,
  onBack
}: ChecklistComponentProps) {
  const [checklist, setChecklist] = useState<ChecklistResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [additionalContext, setAdditionalContext] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateDynamicChecklist();
  }, []);

  const generateDynamicChecklist = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log('Generating checklist with context:', {
        scene,
        goal,
        timeLimit,
        stakes,
        participants,
        relationship,
        additionalContext
      });

      const response = await api.generateChecklist({
        scene,
        goal,
        time_limit: timeLimit,
        stakes,
        participants,
        relationship,
        additional_context: additionalContext
      });

      console.log('Checklist generated successfully:', response);
      setChecklist(response);
    } catch (error) {
      console.error('Failed to generate checklist:', error);
      setError(error instanceof Error ? error.message : 'チェックリストの生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateChecklist = () => {
    generateDynamicChecklist();
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical':
        return '#dc3545';
      case 'important':
        return '#fd7e14';
      case 'recommended':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  const getImportanceText = (importance: string) => {
    switch (importance) {
      case 'critical':
        return '必須';
      case 'important':
        return '重要';
      case 'recommended':
        return '推奨';
      default:
        return importance;
    }
  };

  if (isGenerating) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← 戻る</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>チェックリスト生成中...</Text>
          </View>
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>AIがチェックリストを生成しています...</Text>
            
            {/* 一時的な基本チェックリスト表示 */}
            <View style={styles.tempChecklist}>
              <Text style={styles.tempTitle}>入力された情報:</Text>
              <Text style={styles.tempItem}>シーン: {scene}</Text>
              <Text style={styles.tempItem}>目標: {goal}</Text>
              <Text style={styles.tempItem}>時間制限: {timeLimit}</Text>
              <Text style={styles.tempItem}>重要度: {stakes}</Text>
              {participants && <Text style={styles.tempItem}>参加者数: {participants}人</Text>}
              {relationship && <Text style={styles.tempItem}>関係性: {relationship}</Text>}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← 戻る</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>エラーが発生しました</Text>
          </View>
          
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>チェックリストの生成に失敗しました</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            
            <View style={styles.errorDetails}>
              <Text style={styles.errorDetailsTitle}>送信されたデータ:</Text>
              <Text style={styles.errorDetail}>シーン: {scene}</Text>
              <Text style={styles.errorDetail}>目標: {goal}</Text>
              <Text style={styles.errorDetail}>時間制限: {timeLimit}</Text>
              <Text style={styles.errorDetail}>重要度: {stakes}</Text>
              {participants && <Text style={styles.errorDetail}>参加者数: {participants}人</Text>}
              {relationship && <Text style={styles.errorDetail}>関係性: {relationship}</Text>}
            </View>
            
            <View style={styles.errorActions}>
              <TouchableOpacity style={styles.retryButton} onPress={regenerateChecklist}>
                <Text style={styles.retryButtonText}>再試行</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.basicChecklistButton} onPress={onBack}>
                <Text style={styles.basicChecklistButtonText}>基本チェックリストを使用</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!checklist) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← 戻る</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>チェックリスト</Text>
          </View>
          
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>チェックリストが生成されていません</Text>
            <TouchableOpacity style={styles.generateButton} onPress={generateDynamicChecklist}>
              <Text style={styles.generateButtonText}>チェックリストを生成</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI生成チェックリスト</Text>
        </View>

        {/* 追加コンテキスト入力 */}
        <View style={styles.contextSection}>
          <Text style={styles.contextTitle}>追加情報があれば入力してください</Text>
          <TextInput
            style={styles.contextInput}
            value={additionalContext}
            onChangeText={setAdditionalContext}
            placeholder="例: 緊急の会議、初回の顧客との商談など"
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity style={styles.regenerateButton} onPress={regenerateChecklist}>
            <Text style={styles.regenerateButtonText}>チェックリストを再生成</Text>
          </TouchableOpacity>
        </View>

        {/* チェックリスト概要 */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>概要</Text>
          <Text style={styles.summaryText}>{checklist.summary}</Text>
        </View>

        {/* チェックリスト項目 */}
        <View style={styles.checklistSection}>
          <Text style={styles.checklistTitle}>チェックリスト項目</Text>
          {checklist.checklist.map((item, index) => (
            <View key={item.id || index} style={styles.checklistItem}>
              <View style={styles.itemHeader}>
                <View style={styles.itemCategory}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
                <View style={[
                  styles.importanceBadge,
                  { backgroundColor: getImportanceColor(item.importance) }
                ]}>
                  <Text style={styles.importanceText}>
                    {getImportanceText(item.importance)}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.itemQuestion}>{item.question}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
              
              <View style={styles.itemDetails}>
                <Text style={styles.detailLabel}>例:</Text>
                {item.examples.map((example, exampleIndex) => (
                  <Text key={exampleIndex} style={styles.exampleText}>• {example}</Text>
                ))}
              </View>
              
              <View style={styles.itemDetails}>
                <Text style={styles.detailLabel}>理由:</Text>
                <Text style={styles.reasoningText}>{item.reasoning}</Text>
              </View>
              
              <View style={styles.itemDetails}>
                <Text style={styles.detailLabel}>タイミング:</Text>
                <Text style={styles.timingText}>{item.timing}</Text>
              </View>
              
              {item.specific_advice && (
                <View style={styles.itemDetails}>
                  <Text style={styles.detailLabel}>具体的アドバイス:</Text>
                  <Text style={styles.adviceText}>{item.specific_advice}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* 推奨事項 */}
        {checklist.recommendations && checklist.recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.recommendationsTitle}>推奨事項</Text>
            {checklist.recommendations.map((recommendation, index) => (
              <Text key={index} style={styles.recommendationText}>• {recommendation}</Text>
            ))}
          </View>
        )}

        {/* シーン固有の追加情報 */}
        {checklist.team_building_specific_tips && (
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>チーム構築特有のコツ</Text>
            {checklist.team_building_specific_tips.map((tip, index) => (
              <Text key={index} style={styles.tipText}>• {tip}</Text>
            ))}
          </View>
        )}

        {checklist.industry_topics && (
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>業界トピック</Text>
            {checklist.industry_topics.map((topic, index) => (
              <Text key={index} style={styles.tipText}>• {topic}</Text>
            ))}
          </View>
        )}

        {checklist.presentation_specific_tips && (
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>プレゼンテーション特有のコツ</Text>
            {checklist.presentation_specific_tips.map((tip, index) => (
              <Text key={index} style={styles.tipText}>• {tip}</Text>
            ))}
          </View>
        )}

        {checklist.audience_engagement_tips && (
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>聴衆エンゲージメントのコツ</Text>
            {checklist.audience_engagement_tips.map((tip, index) => (
              <Text key={index} style={styles.tipText}>• {tip}</Text>
            ))}
          </View>
        )}

        {checklist.interview_specific_tips && (
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>面談特有のコツ</Text>
            {checklist.interview_specific_tips.map((tip, index) => (
              <Text key={index} style={styles.tipText}>• {tip}</Text>
            ))}
          </View>
        )}

        {checklist.relationship_building_tips && (
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>関係構築のコツ</Text>
            {checklist.relationship_building_tips.map((tip, index) => (
              <Text key={index} style={styles.tipText}>• {tip}</Text>
            ))}
          </View>
        )}

        {checklist.team_dynamics_tips && (
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>チームダイナミクスのコツ</Text>
            {checklist.team_dynamics_tips.map((tip, index) => (
              <Text key={index} style={styles.tipText}>• {tip}</Text>
            ))}
          </View>
        )}

        {checklist.preparation_timeline && (
          <View style={styles.timelineSection}>
            <Text style={styles.timelineTitle}>準備タイムライン</Text>
            {checklist.preparation_timeline.map((timeline, index) => (
              <Text key={index} style={styles.timelineText}>• {timeline}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  contextSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  contextInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#495057',
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  regenerateButton: {
    backgroundColor: '#6f42c1',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  regenerateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  summarySection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  checklistSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  checklistTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  checklistItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemCategory: {
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007bff',
  },
  importanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  importanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  itemQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
    lineHeight: 22,
  },
  itemDescription: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 12,
    lineHeight: 20,
  },
  itemDetails: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
    lineHeight: 20,
  },
  reasoningText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  timingText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  adviceText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  recommendationsSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  tipsSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  timelineSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
    marginBottom: 20,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  timelineText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 16,
    marginBottom: 24,
  },
  tempChecklist: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    width: '100%',
  },
  tempTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  tempItem: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
  },
  errorContainer: {
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc3545',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorDetails: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  retryButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  basicChecklistButton: {
    backgroundColor: '#6c757d',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  basicChecklistButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 24,
  },
  generateButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 24,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
