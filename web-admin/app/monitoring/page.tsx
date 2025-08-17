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
  Alert,
  LinearProgress
} from '@mui/material'
import { Monitor as MonitorIcon, CheckCircle as CheckIcon, Warning as WarningIcon, Error as ErrorIcon } from '@mui/icons-material'

// システムデータ（モック）
const systemStatus = {
  overall: 'healthy',
  uptime: '99.8%',
  responseTime: '120ms',
  activeUsers: 234
}

const services = [
  { name: 'Web API', status: 'healthy', responseTime: '45ms', uptime: '99.9%' },
  { name: 'Database', status: 'healthy', responseTime: '12ms', uptime: '99.8%' },
  { name: 'AI Service', status: 'warning', responseTime: '280ms', uptime: '98.5%' },
  { name: 'File Storage', status: 'healthy', responseTime: '89ms', uptime: '99.7%' }
]

const alerts = [
  { level: 'warning', message: 'AI Service response time is above normal threshold', time: '2分前' },
  { level: 'info', message: 'Database backup completed successfully', time: '1時間前' },
  { level: 'info', message: 'System maintenance scheduled for tonight', time: '3時間前' }
]

export default function MonitoringPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success'
      case 'warning': return 'warning'
      case 'error': return 'error'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckIcon />
      case 'warning': return <WarningIcon />
      case 'error': return <ErrorIcon />
      default: return <CheckIcon />
    }
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        システム監視
      </Typography>
      
      {/* システム概要 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                システムステータス
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip 
                  icon={getStatusIcon(systemStatus.overall)}
                  label={systemStatus.overall === 'healthy' ? '正常' : '警告'} 
                  color={getStatusColor(systemStatus.overall)}
                  sx={{ mr: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                稼働率
              </Typography>
              <Typography variant="h4">
                {systemStatus.uptime}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                平均応答時間
              </Typography>
              <Typography variant="h4">
                {systemStatus.responseTime}
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
                {systemStatus.activeUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* サービス監視 */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          サービス監視
        </Typography>
        <Grid container spacing={2}>
          {services.map((service) => (
            <Grid item xs={12} md={6} key={service.name}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">{service.name}</Typography>
                    <Chip 
                      icon={getStatusIcon(service.status)}
                      label={service.status === 'healthy' ? '正常' : service.status === 'warning' ? '警告' : 'エラー'} 
                      color={getStatusColor(service.status)}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      応答時間: {service.responseTime}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      稼働率: {service.uptime}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={parseFloat(service.uptime)} 
                    color={getStatusColor(service.status)}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* アラート */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          システムアラート
        </Typography>
        <Box sx={{ mt: 2 }}>
          {alerts.map((alert, index) => (
            <Alert 
              key={index}
              severity={alert.level as any}
              sx={{ mb: 2 }}
              action={
                <Typography variant="caption" color="textSecondary">
                  {alert.time}
                </Typography>
              }
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      </Paper>

      {/* リソース使用状況 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              CPU使用率
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">現在</Typography>
                <Typography variant="body2">45%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={45} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              メモリ使用率
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">現在</Typography>
                <Typography variant="body2">62%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={62} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
