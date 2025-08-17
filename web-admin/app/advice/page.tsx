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
  Chip
} from '@mui/material'
import { Lightbulb as AdviceIcon } from '@mui/icons-material'

// アドバイスデータ（モック）
const adviceStats = {
  totalGenerated: 5670,
  thisMonth: 234,
  successRate: 89,
  popularScenes: ['meeting', 'presentation', 'negotiation']
}

const recentAdvice = [
  { id: 1, scene: 'meeting', goal: 'decision', theory: '行動経済学', rating: 5, user: '田中太郎' },
  { id: 2, scene: 'presentation', goal: 'persuasion', theory: 'コミュニケーション理論', rating: 4, user: '佐藤花子' },
  { id: 3, scene: 'negotiation', goal: 'compromise', theory: '交渉理論', rating: 5, user: '鈴木一郎' }
]

export default function AdvicePage() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        アドバイス分析
      </Typography>
      
      {/* 統計カード */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                総生成アドバイス数
              </Typography>
              <Typography variant="h4">
                {adviceStats.totalGenerated.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                今月の生成数
              </Typography>
              <Typography variant="h4">
                {adviceStats.thisMonth}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                満足度
              </Typography>
              <Typography variant="h4">
                {adviceStats.successRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                平均評価
              </Typography>
              <Typography variant="h4">
                4.2/5.0
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* シーン別分析 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              シーン別アドバイス生成数
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">会議・ミーティング</Typography>
                <Typography variant="body2">2,340件</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">プレゼンテーション</Typography>
                <Typography variant="body2">1,890件</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">交渉・営業</Typography>
                <Typography variant="body2">1,440件</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              理論別使用頻度
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">行動経済学</Typography>
                <Typography variant="body2">35%</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">リーダーシップ理論</Typography>
                <Typography variant="body2">28%</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">コミュニケーション理論</Typography>
                <Typography variant="body2">22%</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 最近のアドバイス */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          最近生成されたアドバイス
        </Typography>
        <Grid container spacing={2}>
          {recentAdvice.map((advice) => (
            <Grid item xs={12} md={4} key={advice.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Chip label={advice.scene} size="small" />
                    <Typography variant="body2" color="textSecondary">
                      評価: {advice.rating}/5
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    目標: {advice.goal}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    理論: {advice.theory}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    ユーザー: {advice.user}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  )
}
