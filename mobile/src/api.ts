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

// Supabase認証情報を取得
const getAuthHeaders = (): Record<string, string> => {
  // Expo環境変数から認証情報を取得
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('=== Environment Variables Debug ===');
  console.log('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'missing');
  console.log('All env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  console.log('=== End Environment Variables Debug ===');
  
  // 環境変数が読み込めない場合のフォールバック
  if (!supabaseAnonKey) {
    console.warn('Supabase anon key not found in environment variables, using hardcoded fallback');
    
    // フォールバック用の認証情報（本番環境のキー）
    const fallbackKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXF0aGxmamNieXFmdWR6aWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNzcxNzQsImV4cCI6MjA3MDc1MzE3NH0.chIYPG-jQty4Juev6ldx3382G4kl_KYfu-Dqb5JzV1Y";
    
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${fallbackKey}`
    };
  }
  
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${supabaseAnonKey}`
  };
  
  console.log('Generated headers:', {
    "Content-Type": headers["Content-Type"],
    "Authorization": headers["Authorization"] ? headers["Authorization"].substring(0, 20) + '...' : 'missing'
  });
  
  return headers;
};

export async function createSession(payload: SessionPayload) {
  try {
    console.log('API: createSession called with payload:', payload);
    
    const headers = getAuthHeaders();
    console.log('API: Using headers:', headers);
    
    const r = await fetch(`${BASE}/advice`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    
    console.log('API: Response status:', r.status);
    console.log('API: Response headers:', Object.fromEntries(r.headers.entries()));
    
    if (!r.ok) {
      const errorText = await r.text();
      console.error('API: HTTP error response:', errorText);
      
      // 500エラーの場合は詳細な情報を出力
      if (r.status === 500) {
        console.error('API: 500 Internal Server Error detected');
        console.error('API: Full error response:', errorText);
        
        // エラーレスポンスがJSONの場合は解析
        try {
          const errorJson = JSON.parse(errorText);
          console.error('API: Parsed error JSON:', errorJson);
        } catch (parseError) {
          console.error('API: Error response is not JSON:', parseError);
        }
      }
      
      throw new Error(`HTTP error! status: ${r.status}, body: ${errorText}`);
    }
    
    const responseData = await r.json();
    console.log('API: Response data:', responseData);
    return responseData;
  } catch (error) {
    console.error('Create session error:', error);
    
    // エラーの詳細情報をログに出力
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
    } else {
      console.error('Unknown error type:', typeof error);
      console.error('Error value:', error);
    }
    
    throw error;
  }
}

export async function getTheory(id: string, theoryName?: string, theoryNameJa?: string) {
  try {
    const headers = getAuthHeaders();
    
    // theory-detailエンドポイントを使用し、theory_idパラメータを送信
    const r = await fetch(`${BASE}/theory-detail`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        theory_id: id
      })
    });
    
    if (!r.ok) {
      throw new Error(`HTTP error! status: ${r.status}`);
    }
    
    return await r.json();
  } catch (error) {
    console.error('Get theory error:', error);
    
    // エラーの詳細情報をログに出力
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
    } else {
      console.error('Unknown error type:', typeof error);
      console.error('Error value:', error);
    }
    
    throw error;
  }
}

// アドバイスのコンテキストに基づいて関連理論を取得
export async function getRelatedTheories(adviceContext: {
  scene: string;
  goal: string;
  shortAdvice: string;
  additionalContext?: string;
  adviceId?: string; // アドバイスIDを追加
}) {
  try {
    console.log('getRelatedTheories API call with context:', adviceContext);
    
    const requestBody = {
      scene: adviceContext.scene,
      goal: adviceContext.goal,
      short_advice: adviceContext.shortAdvice,
      ...(adviceContext.additionalContext && { advice_context: adviceContext.additionalContext }),
      ...(adviceContext.adviceId && { advice_id: adviceContext.adviceId }) // アドバイスIDを追加
    };
    
    console.log('Request body:', requestBody);
    console.log('Request URL:', `${BASE}/theory`);
    
    const headers = getAuthHeaders();
    
    const r = await fetch(`${BASE}/theory`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody)
    });
    
    console.log('Response status:', r.status);
    console.log('Response headers:', Object.fromEntries(r.headers.entries()));
    
    if (!r.ok) {
      const errorText = await r.text();
      console.error('HTTP error response:', errorText);
      throw new Error(`HTTP error! status: ${r.status}, body: ${errorText}`);
    }
    
    const responseData = await r.json();
    console.log('Response data:', responseData);
    return responseData;
  } catch (error) {
    console.error('Get related theories error:', error);
    
    // より詳細なエラー情報をログに出力
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
    } else {
      console.error('Unknown error type:', typeof error);
      console.error('Error value:', error);
    }
    
    // ネットワークエラーの場合は特別な処理
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error detected - check internet connection');
    }
    
    throw error;
  }
}

export async function sendFeedback(body: FeedbackPayload) {
  try {
    const headers = getAuthHeaders();
    
    const r = await fetch(`${BASE}/feedback`, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    
    if (!r.ok) {
      throw new Error(`HTTP error! status: ${r.status}`);
    }
    
    return await r.json();
  } catch (error) {
    console.error('Send feedback error:', error);
    
    // エラーの詳細情報をログに出力
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
    } else {
      console.error('Unknown error type:', typeof error);
      console.error('Error value:', error);
    }
    
    throw error;
  }
}

export async function generateChecklist(payload: ChecklistPayload) {
  try {
    const headers = getAuthHeaders();
    
    const r = await fetch(`${BASE}/checklist`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    
    if (!r.ok) {
      throw new Error(`HTTP error! status: ${r.status}`);
    }
    
    return await r.json();
  } catch (error) {
    console.error('Generate checklist error:', error);
    
    // エラーの詳細情報をログに出力
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
    } else {
      console.error('Unknown error type:', typeof error);
      console.error('Error value:', error);
    }
    
    throw error;
  }
}

// 最近のアドバイスを保存
export async function saveRecentAdvice(payload: RecentAdvicePayload) {
  try {
    const headers = getAuthHeaders();
    
    const r = await fetch(`${BASE}/recent-advices`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    
    if (!r.ok) {
      throw new Error(`HTTP error! status: ${r.status}`);
    }
    
    return await r.json();
  } catch (error) {
    console.error('Save recent advice error:', error);
    
    // より詳細なエラー情報をログに出力
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
    } else {
      console.error('Unknown error type:', typeof error);
      console.error('Error value:', error);
    }
    
    // ネットワークエラーの場合は特別な処理
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error detected - check internet connection');
    }
    
    throw error;
  }
}

// 最近のアドバイスを取得
export async function getRecentAdvices() {
  try {
    const headers = getAuthHeaders();
    
    const r = await fetch(`${BASE}/recent-advices`, {
      method: "GET",
      headers
    });
    
    if (!r.ok) {
      throw new Error(`HTTP error! status: ${r.status}`);
    }
    
    return await r.json();
  } catch (error) {
    console.error('Get recent advices error:', error);
    
    // より詳細なエラー情報をログに出力
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
    } else {
      console.error('Unknown error type:', typeof error);
      console.error('Error value:', error);
    }
    
    // ネットワークエラーの場合は特別な処理
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error detected - check internet connection');
    }
    
    throw error;
  }
}

// 最近のアドバイスを削除
export async function deleteRecentAdvice(id: string) {
  try {
    const headers = getAuthHeaders();
    
    const r = await fetch(`${BASE}/recent-advices`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ id })
    });
    
    if (!r.ok) {
      throw new Error(`HTTP error! status: ${r.status}`);
    }
    
    return await r.json();
  } catch (error) {
    console.error('Delete recent advice error:', error);
    
    // エラーの詳細情報をログに出力
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
    } else {
      console.error('Unknown error type:', typeof error);
      console.error('Error value:', error);
    }
    
    throw error;
  }
}