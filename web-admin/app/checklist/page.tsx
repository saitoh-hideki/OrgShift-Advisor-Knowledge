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
import { Checklist as ChecklistIcon } from '@mui/icons-material'

// チェックリストデータ（モック）
const checklistStats = {
  totalCompleted: 2340,
  thisMonth: 156,
  completionRate: 78,
  averageScore: 4.2
}

const popularChecklists = [
  { name: '会議準備チェックリスト', category: 'meeting', usage: 456, rating: 4.5 },
  { name: 'プレゼン準備チェックリスト', category: 'presentation', usage: 389, rating: 4.3 },
  { name: '交渉準備チェックリスト', category: 'negotiation', usage: 234, rating: 4.1 }
]

export default function ChecklistPage() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        チェックリスト分析
      </Typography>
      
      {/* 統計カード */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                完了チェックリスト数
              </Typography>
              <Typography variant="h4">
                {checklistStats.totalCompleted.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                今月の完了数
              </Typography>
              <Typography variant="h4">
                {checklistStats.thisMonth}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                完了率
              </Typography>
              <Typography variant="h4">
                {checklistStats.completionRate}%
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
                {checklistStats.averageScore}/5.0
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 人気チェックリスト */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          人気のチェックリスト
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>チェックリスト名</TableCell>
                <TableCell>カテゴリー</TableCell>
                <TableCell>使用回数</TableCell>
                <TableCell>評価</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {popularChecklists.map((checklist) => (
                <TableRow key={checklist.name} hover>
                  <TableCell>{checklist.name}</TableCell>
                  <TableCell>
                    <Chip label={checklist.category} size="small" />
                  </TableCell>
                  <TableCell>{checklist.usage}</TableCell>
                  <TableCell>{checklist.rating}/5.0</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* カテゴリー別分析 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              カテゴリー別完了率
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">会議・ミーティング</Typography>
                <Typography variant="body2">82%</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">プレゼンテーション</Typography>
                <Typography variant="body2">76%</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">交渉・営業</Typography>
                <Typography variant="body2">71%</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              月別完了数推移
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">12月</Typography>
                <Typography variant="body2">189件</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">1月</Typography>
                <Typography variant="body2">156件</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">2月（予測）</Typography>
                <Typography variant="body2">180件</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
