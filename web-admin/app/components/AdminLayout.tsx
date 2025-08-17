'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Box, 
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
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

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === pathname)
    return currentItem ? currentItem.label : 'OrgShift 管理者ダッシュボード'
  }

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
                onClick={() => handleNavigation(item.path)}
                selected={pathname === item.path}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  cursor: 'pointer',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  },
                  '&:hover': {
                    bgcolor: pathname === item.path ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  color: pathname === item.path ? 'inherit' : 'text.primary',
                  minWidth: 40
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: pathname === item.path ? 600 : 400
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
              {getCurrentPageTitle()}
            </Typography>
          </Toolbar>
        </AppBar>
        <Toolbar />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
