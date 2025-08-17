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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import { BarChart as ChartIcon, TrendingUp as TrendingIcon, Analytics as AnalyticsIcon } from '@mui/icons-material'

// 分析データ（モック）
const analyticsStats = {
  totalDataPoints: 125000,
  dataQuality: 98.5,
  lastUpdated: '2024-01-15 14:30',
  dataSources: 8
}

const topPerformers = [
  { name: '田中太郎', completionRate: 95, avgRating: 4.8, theoriesCompleted: 18 },
  { name: '佐藤花子', completionRate: 92, avgRating: 4.6, theoriesCompleted: 16 },
  { name: '鈴木一郎', completionRate: 89, avgRating: 4.4, theoriesCompleted: 15 },
  { name: '高橋美咲', completionRate: 87, avgRating: 4.3, theoriesCompleted: 14 }
]

const trends = [
  { metric: 'ユーザー登録数', current: 1250, previous: 1100, change: '+13.6%', trend: 'up' },
  { metric: '学習完了率', current: 76, previous: 72, change: '+5.6%', trend: 'up' },
  { metric: 'アドバイス生成数', current: 5670, previous: 4890, change: '+15.9%', trend: 'up' },
  { metric: '平均学習時間', current: 45, previous: 42, change: '+7.1%', trend: 'up' }
]

export default function AnalyticsPage() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        データ分析
      </Typography>
      
      {/* 分析概要 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                総データポイント
              </Typography>
              <Typography variant="h4">
                {analyticsStats.totalDataPoints.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                データ品質
              </Typography>
              <Typography variant="h4">
                {analyticsStats.dataQuality}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                データソース数
              </Typography>
              <Typography variant="h4">
                {analyticsStats.dataSources}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                最終更新
              </Typography>
              <Typography variant="body2">
                {analyticsStats.lastUpdated}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* トレンド分析 */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          主要指標のトレンド
        </Typography>
        <Grid container spacing={2}>
          {trends.map((trend) => (
            <Grid item xs={12} sm={6} md={3} key={trend.metric}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {trend.metric}
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {trend.current.toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip 
                      label={trend.change}
                      color={trend.trend === 'up' ? 'success' : 'error'}
                      size="small"
                      icon={<TrendingIcon />}
                    />
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      前月比
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* トップパフォーマー */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          トップパフォーマー
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ユーザー名</TableCell>
                <TableCell>完了率</TableCell>
                <TableCell>平均評価</TableCell>
                <TableCell>完了理論数</TableCell>
                <TableCell>パフォーマンス</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topPerformers.map((user) => (
                <TableRow key={user.name} hover>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.completionRate}%</TableCell>
                  <TableCell>{user.avgRating}/5.0</TableCell>
                  <TableCell>{user.theoriesCompleted}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.completionRate >= 90 ? '優秀' : user.completionRate >= 80 ? '良好' : '標準'}
                      color={user.completionRate >= 90 ? 'success' : user.completionRate >= 80 ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 詳細分析 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              学習パターン分析
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              ユーザーの学習行動パターンの分析結果
            </Typography>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • 最も学習が活発な時間帯: 19:00-21:00
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • 平均学習セッション時間: 45分
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • 週末の学習完了率: 平日より15%高い
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              コンテンツ効果分析
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              理論・コンテンツの効果測定結果
            </Typography>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • 最も効果的な理論: プロスペクト理論
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • 平均学習効果: 4.2/5.0
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • 実践応用率: 78%
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
