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
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Lightbulb as AdviceIcon,
  Checklist as ChecklistIcon,
  Settings as SettingsIcon,
  BarChart as ChartIcon,
  Monitor as MonitorIcon
} from '@mui/icons-material'

// ダッシュボードの統計データ
const dashboardStats = {
  totalUsers: 1250,
  activeUsers: 890,
  newUsers: 45,
  totalTheories: 100,
  completedChecklists: 2340,
  generatedAdvice: 5670
}

// メニュー項目
const menuItems = [
  { id: 'dashboard', label: 'ダッシュボード', icon: <DashboardIcon />, path: '/' },
  { id: 'users', label: 'ユーザー管理', icon: <PeopleIcon />, path: '/users' },
  { id: 'learning', label: '学習分析', icon: <SchoolIcon />, path: '/learning' },
  { id: 'advice', label: 'アドバイス分析', icon: <AdviceIcon />, path: '/advice' },
  { id: 'checklist', label: 'チェックリスト分析', icon: <ChecklistIcon />, path: '/checklist' },
  { id: 'content', label: 'コンテンツ管理', icon: <SettingsIcon />, path: '/content' },
  { id: 'analytics', label: 'データ分析', icon: <ChartIcon />, path: '/analytics' },
  { id: 'monitoring', label: 'システム監視', icon: <MonitorIcon />, path: '/monitoring' }
]

export default function AdminDashboard() {
  return (
    <Box sx={{ display: 'flex' }}>
      {/* サイドバー */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider'
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem 
                key={item.id}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: 400
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* メインコンテンツ */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
          }}
        >
          <Toolbar>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
              OrgShift 管理者ダッシュボード
            </Typography>
          </Toolbar>
        </AppBar>
        <Toolbar />
        
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            OrgShift 管理者ダッシュボード
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
                    {dashboardStats.totalUsers.toLocaleString()}
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
                    {dashboardStats.activeUsers.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    新規ユーザー（今月）
                  </Typography>
                  <Typography variant="h4">
                    {dashboardStats.newUsers.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    総理論数
                  </Typography>
                  <Typography variant="h4">
                    {dashboardStats.totalTheories.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 追加統計カード */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    完了チェックリスト
                  </Typography>
                  <Typography variant="h4">
                    {dashboardStats.completedChecklists.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    生成アドバイス
                  </Typography>
                  <Typography variant="h4">
                    {dashboardStats.generatedAdvice.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 学習状況 */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  カテゴリー別学習進捗
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  行動経済学、リーダーシップ、コミュニケーションなどの学習進捗を表示します
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  最近のアクティビティ
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  ユーザーの学習活動やアドバイス生成の履歴がここに表示されます
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  )
}