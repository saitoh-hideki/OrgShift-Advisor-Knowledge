'use client'

import React from 'react'
import { 
  Container, 
  Typography, 
  Paper,
  Grid,
  Card,
  CardContent,
  Box,
  LinearProgress
} from '@mui/material'
import { School as SchoolIcon } from '@mui/icons-material'

// 学習データ（モック）
const learningStats = {
  behavioralEconomics: { completed: 85, total: 25, percentage: 85, name: '行動経済学' },
  leadership: { completed: 72, total: 15, percentage: 72, name: 'リーダーシップ・組織心理' },
  communication: { completed: 78, total: 20, percentage: 78, name: '交渉・コミュニケーション・営業' },
  strategy: { completed: 65, total: 20, percentage: 65, name: '経営戦略・イノベーション' },
  operations: { completed: 82, total: 10, percentage: 82, name: 'オペレーション・プロジェクト管理' },
  finance: { completed: 75, total: 10, percentage: 75, name: 'ファイナンス・メトリクス' }
}

export default function LearningPage() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        学習分析
      </Typography>
      
      {/* 統計カード */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                総学習理論数
              </Typography>
              <Typography variant="h4">
                100
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                平均完了率
              </Typography>
              <Typography variant="h4">
                76%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                今月の学習者数
              </Typography>
              <Typography variant="h4">
                234
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                学習時間（総計）
              </Typography>
              <Typography variant="h4">
                1,250h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* カテゴリー別学習進捗 */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          カテゴリー別学習進捗
        </Typography>
        {Object.entries(learningStats).map(([category, stats]) => (
          <Box key={category} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {stats.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {stats.completed}/{stats.total} ({stats.percentage}%)
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={stats.percentage} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        ))}
      </Paper>

      {/* 学習傾向分析 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              人気の学習カテゴリー
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              ユーザーが最も興味を持っている学習分野
            </Typography>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                1. 行動経済学 - 45%のユーザーが学習中
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                2. リーダーシップ - 38%のユーザーが学習中
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                3. コミュニケーション - 32%のユーザーが学習中
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              学習完了率の傾向
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              月別の学習完了率の推移
            </Typography>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                12月: 78% → 1月: 82%
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                学習完了率が向上傾向
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                特に行動経済学分野で高い完了率
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
