'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalTheories: 0,
    totalFeedbacks: 0,
    successRate: 0,
  })
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [theories, setTheories] = useState<any[]>([])

  useEffect(() => {
    fetchStats()
    fetchRecentSessions()
    fetchTheories()
  }, [])

  const fetchStats = async () => {
    const [sessions, theories, feedbacks] = await Promise.all([
      supabase.from('sessions').select('id', { count: 'exact' }),
      supabase.from('theories').select('id', { count: 'exact' }),
      supabase.from('feedbacks').select('result'),
    ])

    const successCount = feedbacks.data?.filter(f => f.result === 'success').length || 0
    const totalFeedbacks = feedbacks.data?.length || 0

    setStats({
      totalSessions: sessions.count || 0,
      totalTheories: theories.count || 0,
      totalFeedbacks: totalFeedbacks,
      successRate: totalFeedbacks > 0 ? (successCount / totalFeedbacks) * 100 : 0,
    })
  }

  const fetchRecentSessions = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*, session_advices(theory_id)')
      .order('created_at', { ascending: false })
      .limit(10)

    setRecentSessions(data || [])
  }

  const fetchTheories = async () => {
    const { data } = await supabase
      .from('theories')
      .select('*')
      .order('name_ja')

    setTheories(data || [])
  }

  const testAdviceAPI = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene: 'meeting',
          goal: 'decide',
          time_limit: 'short',
          stakes: 'high',
        }),
      })
      const data = await response.json()
      alert('API Test Success: ' + JSON.stringify(data, null, 2))
      fetchRecentSessions()
      fetchStats()
    } catch (err) {
      alert('API Test Failed: ' + err)
    }
  }

  return (
    <div className="container">
      <h1 className="title">OrgShift Admin Dashboard</h1>

      <div className="stats">
        <div className="stat">
          <div className="stat-label">Total Sessions</div>
          <div className="stat-value">{stats.totalSessions}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Total Theories</div>
          <div className="stat-value">{stats.totalTheories}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Total Feedbacks</div>
          <div className="stat-value">{stats.totalFeedbacks}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Success Rate</div>
          <div className="stat-value">{stats.successRate.toFixed(1)}%</div>
        </div>
      </div>

      <button className="button" onClick={testAdviceAPI}>
        Test Advice API
      </button>

      <div className="grid">
        <div className="card">
          <h2 style={{ marginBottom: '16px' }}>Recent Sessions</h2>
          {recentSessions.map((session) => (
            <div key={session.id} style={{ marginBottom: '12px', padding: '12px', background: '#f9f9f9', borderRadius: '4px' }}>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {new Date(session.created_at).toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>
                Scene: {session.scene_id} | Goal: {session.goal || 'N/A'}
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px', color: '#007AFF' }}>
                {session.session_advices?.length || 0} advices generated
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '16px' }}>Available Theories</h2>
          {theories.map((theory) => (
            <div key={theory.id} style={{ marginBottom: '12px', padding: '12px', background: '#f9f9f9', borderRadius: '4px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>
                {theory.name_ja}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {theory.one_liner}
              </div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>
                {theory.tags?.join(', ') || 'No tags'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}