// OrgShift AI チャット SPA アプリケーション
class AIChatApp {
    constructor() {
        this.supabaseUrl = 'https://eqiqthlfjcbyqfudziar.supabase.co';
        this.supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
        this.chatHistory = [];
        this.currentScene = 'interview';
        this.currentGoal = '';
        
        this.initializeApp();
    }

    initializeApp() {
        this.bindEvents();
        this.setupDefaultGoal();
    }

    bindEvents() {
        // シーン選択の変更
        document.getElementById('sceneSelect').addEventListener('change', (e) => {
            this.currentScene = e.target.value;
            this.updateChatInterface();
        });

        // 目標入力の変更
        document.getElementById('goalInput').addEventListener('input', (e) => {
            this.currentGoal = e.target.value;
            this.updateChatInterface();
        });

        // 送信ボタンのクリック
        document.getElementById('sendButton').addEventListener('click', () => {
            this.sendMessage();
        });

        // Enterキーでの送信
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    setupDefaultGoal() {
        const defaultGoals = {
            'interview': '効果的な面接での自己PR',
            'meeting': '生産的な会議の進行',
            'presentation': '魅力的なプレゼンテーション',
            'sales': '顧客ニーズの把握と提案',
            'team-building': 'チームの結束力向上'
        };
        
        this.currentGoal = defaultGoals[this.currentScene];
        document.getElementById('goalInput').value = this.currentGoal;
    }

    updateChatInterface() {
        // チャット履歴をクリア
        this.chatHistory = [];
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="text-center text-gray-500">
                <p>シーン「${this.getSceneDisplayName(this.currentScene)}」、目標「${this.currentGoal}」でチャットを開始してください</p>
            </div>
        `;
    }

    getSceneDisplayName(scene) {
        const sceneNames = {
            'interview': '面接',
            'meeting': '会議',
            'presentation': 'プレゼンテーション',
            'sales': '営業',
            'team-building': 'チームビルディング'
        };
        return sceneNames[scene] || scene;
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message) return;
        
        if (!this.currentGoal.trim()) {
            alert('目標を設定してください');
            return;
        }

        // ユーザーメッセージを表示
        this.addMessage(message, 'user');
        messageInput.value = '';

        // 送信ボタンを無効化
        const sendButton = document.getElementById('sendButton');
        sendButton.disabled = true;
        sendButton.textContent = '送信中...';

        // タイピングインジケーターを表示
        this.showTypingIndicator();

        try {
            // AIチャットAPIを呼び出し
            const response = await this.callAIChat(message);
            
            // AIの応答を表示
            this.addMessage(response, 'ai');
            
            // チャット履歴に追加
            this.chatHistory.push(
                { role: 'user', content: message },
                { role: 'assistant', content: response }
            );
            
        } catch (error) {
            console.error('AIチャットエラー:', error);
            this.addMessage('申し訳ございません。エラーが発生しました。しばらく時間をおいてから再度お試しください。', 'ai');
        } finally {
            // 送信ボタンを再有効化
            sendButton.disabled = false;
            sendButton.textContent = '送信';
            
            // タイピングインジケーターを非表示
            this.hideTypingIndicator();
        }
    }

    async callAIChat(message) {
        const functionName = `ai-chat-${this.currentScene}`;
        const url = `${this.supabaseUrl}/functions/v1/${functionName}`;
        
        const requestBody = {
            message: message,
            context: {
                scene: this.currentScene,
                goal: this.currentGoal
            },
            chatHistory: this.chatHistory
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.supabaseAnonKey}`,
                'apikey': this.supabaseAnonKey
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.response || '申し訳ございません。適切な応答を生成できませんでした。';
    }

    addMessage(content, role) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        
        messageDiv.className = `message ${role === 'user' ? 'user-message ml-auto' : 'ai-message'} rounded-lg p-3`;
        messageDiv.textContent = content;
        
        chatMessages.appendChild(messageDiv);
        
        // チャットエリアを最下部にスクロール
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.classList.add('show');
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.classList.remove('show');
    }
}

// アプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
    new AIChatApp();
});
