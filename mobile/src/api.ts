// 型定義
interface SessionPayload {
  scene: string;
  goal: string;
  participants?: number;
  relationship?: string;
  time_limit: string;
  stakes: string;
}

interface ChecklistPayload {
  scene: string;
  goal: string;
  participants?: number;
  relationship?: string;
  time_limit: string;
  stakes: string;
  additional_context?: string;
}

interface FeedbackPayload {
  session_id: string;
  result: string;
  comment: string;
  executed_theory_ids: string[];
}

interface RecentAdvicePayload {
  scene_id: string;
  goal: string;
  time_limit: string;
  stakes: string;
  participants?: number;
  relationship?: string;
  theory_id: string;
  short_advice: string;
  expected_effect: string;
  caution?: string;
  tips?: string;
  related_theory?: string;
  implementation_steps: string[];
  success_indicators: string[];
  common_mistakes: string[];
}

const BASE = "https://eqiqthlfjcbyqfudziar.supabase.co/functions/v1"

export async function createSession(payload: SessionPayload) {
  try {
    console.log('API: createSession called with payload:', payload);
    
    const r = await fetch(`${BASE}/advice`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    
    console.log('API: Response status:', r.status);
    console.log('API: Response headers:', Object.fromEntries(r.headers.entries()));
    
    if (!r.ok) {
      const errorText = await r.text();
      console.error('API: HTTP error response:', errorText);
      throw new Error(`HTTP error! status: ${r.status}, body: ${errorText}`);
    }
    
    const responseData = await r.json();
    console.log('API: Response data:', responseData);
    return responseData;
  } catch (error) {
    console.error('Create session error:', error);
    throw error;
  }
}

export async function getTheory(id: string, theoryName?: string, theoryNameJa?: string) {
  try {
    // POSTリクエストで理論名も送信
    const r = await fetch(`${BASE}/theory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        theory_name: theoryName,
        theory_name_ja: theoryNameJa
      })
    });
    
    if (!r.ok) {
      throw new Error(`HTTP error! status: ${r.status}`);
    }
    
    return await r.json();
  } catch (error) {
    console.error('Get theory error:', error);
    throw error;
  }
}

export async function sendFeedback(body: FeedbackPayload) {
  try {
    const r = await fetch(`${BASE}/feedback`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(body)
    });
    
    if (!r.ok) {
      throw new Error(`HTTP error! status: ${r.status}`);
    }
    
    return await r.json();
  } catch (error) {
    console.error('Send feedback error:', error);
    throw error;
  }
}

export async function generateChecklist(payload: ChecklistPayload) {
  try {
    const r = await fetch(`${BASE}/checklist`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    
    if (!r.ok) {
      throw new Error(`HTTP error! status: ${r.status}`);
    }
    
    return await r.json();
  } catch (error) {
    console.error('Generate checklist error:', error);
    throw error;
  }
}

// 最近のアドバイスを保存
export async function saveRecentAdvice(payload: RecentAdvicePayload) {
  try {
    const r = await fetch(`${BASE}/recent-advices`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    if (!r.ok) {
      throw new Error(`HTTP error! status: ${r.status}`);
    }
    
    return await r.json();
  } catch (error) {
    console.error('Save recent advice error:', error);
    throw error;
  }
}

// 最近のアドバイスを取得
export async function getRecentAdvices() {
  try {
    const r = await fetch(`${BASE}/recent-advices`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json"
      }
    });
    
    if (!r.ok) {
      throw new Error(`HTTP error! status: ${r.status}`);
    }
    
    return await r.json();
  } catch (error) {
    console.error('Get recent advices error:', error);
    throw error;
  }
}

// 最近のアドバイスを削除
export async function deleteRecentAdvice(id: string) {
  try {
    const r = await fetch(`${BASE}/recent-advices`, {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id })
    });
    
    if (!r.ok) {
      throw new Error(`HTTP error! status: ${r.status}`);
    }
    
    return await r.json();
  } catch (error) {
    console.error('Delete recent advice error:', error);
    throw error;
  }
}