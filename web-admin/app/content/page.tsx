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
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import { Settings as SettingsIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'

// コンテンツデータ（モック）
const contentStats = {
  totalTheories: 100,
  publishedTheories: 85,
  draftTheories: 15,
  totalChecklists: 50
}

const theories = [
  { id: 1, name: 'プロスペクト理論', category: '行動経済学', status: 'published', views: 1234, rating: 4.5 },
  { id: 2, name: 'リーダーシップ・メンバーシップ理論', category: 'リーダーシップ', status: 'published', views: 987, rating: 4.2 },
  { id: 3, name: 'コミュニケーション・モデル', category: 'コミュニケーション', status: 'draft', views: 0, rating: 0 }
]

export default function ContentPage() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        コンテンツ管理
      </Typography>
      
      {/* 統計カード */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                総理論数
              </Typography>
              <Typography variant="h4">
                {contentStats.totalTheories}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                公開済み理論
              </Typography>
              <Typography variant="h4">
                {contentStats.publishedTheories}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                下書き理論
              </Typography>
              <Typography variant="h4">
                {contentStats.draftTheories}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                チェックリスト数
              </Typography>
              <Typography variant="h4">
                {contentStats.totalChecklists}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* アクションボタン */}
      <Box sx={{ mb: 4 }}>
        <Button variant="contained" startIcon={<AddIcon />} sx={{ mr: 2 }}>
          新規理論追加
        </Button>
        <Button variant="outlined" startIcon={<AddIcon />}>
          新規チェックリスト追加
        </Button>
      </Box>

      {/* 理論一覧 */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          理論一覧
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>理論名</TableCell>
                <TableCell>カテゴリー</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>閲覧数</TableCell>
                <TableCell>評価</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {theories.map((theory) => (
                <TableRow key={theory.id} hover>
                  <TableCell>{theory.name}</TableCell>
                  <TableCell>
                    <Chip label={theory.category} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={theory.status === 'published' ? '公開済み' : '下書き'} 
                      color={theory.status === 'published' ? 'success' : 'default'}
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{theory.views}</TableCell>
                  <TableCell>{theory.rating > 0 ? `${theory.rating}/5.0` : '未評価'}</TableCell>
                  <TableCell>
                    <Button size="small" startIcon={<EditIcon />} sx={{ mr: 1 }}>
                      編集
                    </Button>
                    <Button size="small" startIcon={<DeleteIcon />} color="error">
                      削除
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* カテゴリー管理 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              カテゴリー管理
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">行動経済学</Typography>
                <Typography variant="body2">25件</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">リーダーシップ・組織心理</Typography>
                <Typography variant="body2">15件</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">交渉・コミュニケーション・営業</Typography>
                <Typography variant="body2">20件</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              最近の更新
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                プロスペクト理論 - 1日前に更新
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                リーダーシップ・メンバーシップ理論 - 3日前に更新
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                コミュニケーション・モデル - 1週間前に作成
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
