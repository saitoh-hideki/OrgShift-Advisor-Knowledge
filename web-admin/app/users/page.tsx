'use client'

import React from 'react'
import { 
  Box, 
  Container, 
  Typography, 
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar
} from '@mui/material'
import { Person as PersonIcon } from '@mui/icons-material'

// ユーザーデータ（モック）
const users = [
  { id: 1, name: '田中太郎', email: 'tanaka@example.com', status: 'active', lastLogin: '2024-01-15', role: 'user' },
  { id: 2, name: '佐藤花子', email: 'sato@example.com', status: 'active', lastLogin: '2024-01-14', role: 'user' },
  { id: 3, name: '鈴木一郎', email: 'suzuki@example.com', status: 'inactive', lastLogin: '2024-01-10', role: 'admin' },
  { id: 4, name: '高橋美咲', email: 'takahashi@example.com', status: 'active', lastLogin: '2024-01-13', role: 'user' },
  { id: 5, name: '渡辺健太', email: 'watanabe@example.com', status: 'active', lastLogin: '2024-01-12', role: 'user' }
]

export default function UsersPage() {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        ユーザー管理
      </Typography>
      
      {/* 統計カード */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                総ユーザー数
              </Typography>
              <Typography variant="h4">
                {users.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                アクティブユーザー
              </Typography>
              <Typography variant="h4">
                {users.filter(u => u.status === 'active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                管理者ユーザー
              </Typography>
              <Typography variant="h4">
                {users.filter(u => u.role === 'admin').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                今月の新規登録
              </Typography>
              <Typography variant="h4">
                12
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ユーザー一覧テーブル */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>ユーザー</TableCell>
                <TableCell>メールアドレス</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>最終ログイン</TableCell>
                <TableCell>ロール</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2 }}>
                        <PersonIcon />
                      </Avatar>
                      <Typography variant="body2">
                        {user.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.status === 'active' ? 'アクティブ' : '非アクティブ'}
                      color={user.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role === 'admin' ? '管理者' : '一般ユーザー'}
                      color={user.role === 'admin' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  )
}
