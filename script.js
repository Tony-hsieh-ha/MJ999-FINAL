// MJ999 智能配對系統 - 完全修復版
// 版本: 20260402

// 全域變數
let liffInitialized = false;
let userData = null;
let isLoggedInState = false;
let gameStats = {
    totalTables: 12,
    availableTables: 0,
    waitingPlayers: 0,
    activeGames: []
};

// Supabase 配置
const SUPABASE_URL = 'https://fzthllltvxdxqtgjmazq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_l4rasKEMGgqD7yeFtSbLlA_WmZrPxSA';

// 私有 Supabase 客戶端 - 避免與 window.supabase 衝突
let mjClient = null; 

// 初始化 Supabase 客戶端
function initializeSupabase() {
    if (typeof window.supabase !== 'undefined') {
        mjClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('[MJ999] 資料庫連線成功');
    } else {
        console.error('[MJ999] 找不到 Supabase SDK');
    }
}

// UI 控制函數
function hideLoading() {
    const el = document.getElementById('loading-section');
    if (el) el.style.display = 'none';
}

function showLobbySection() {
    hideLoading();
    const loginSection = document.getElementById('login-section');
    const lobbySection = document.getElementById('lobby-section');
    if (loginSection) loginSection.style.display = 'none';
    if (lobbySection) lobbySection.style.display = 'block';
}

function showLoginSection() {
    hideLoading();
    const loginSection = document.getElementById('login-section');
    const lobbySection = document.getElementById('lobby-section');
    if (loginSection) loginSection.style.display = 'flex';
    if (lobbySection) lobbySection.style.display = 'none';
}

// LIFF 初始化
async function initializeLiff() {
    try {
        console.log('[MJ999] LIFF 初始化...');
        await liff.init({ liffId: '2009653134-Sbasqpf7', withLoginOnExternalBrowser: true });
        liffInitialized = true;

        if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            userData = { 
                displayName: profile.displayName, 
                pictureUrl: profile.pictureUrl 
            };
            
            const playerName = document.getElementById('player-name');
            const playerAvatar = document.getElementById('player-avatar');
            if (playerName) playerName.textContent = userData.displayName;
            if (playerAvatar) playerAvatar.src = userData.pictureUrl;

            showLobbySection();
            initializeGameStats();
        } else {
            showLoginSection();
        }
    } catch (error) {
        console.error('LIFF 錯誤:', error);
        showLoginSection();
    }
}

// 初始化遊戲統計
async function initializeGameStats() {
    initializeSupabase();
    initializeTimeOptions();
    setInterval(loadRealTimeStats, 30000);
    await loadRealTimeStats();
}

// 讀取資料
async function loadRealTimeStats() {
    if (!mjClient) return;
    try {
        const { data, error } = await mjClient
            .from('matches')
            .select('*')
            .eq('status', 'waiting')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        gameStats.activeGames = data || [];
        updateUI();
    } catch (err) {
        console.error('更新失敗:', err);
    }
}

// 更新 UI
function updateUI() {
    const availableTables = document.getElementById('available-tables');
    const waitingPlayers = document.getElementById('waiting-players');
    const container = document.getElementById('room-cards');
    const statusMsg = document.getElementById('room-status');
    
    if (availableTables) {
        availableTables.textContent = gameStats.totalTables - gameStats.activeGames.length;
    }
    if (waitingPlayers) {
        waitingPlayers.textContent = gameStats.activeGames.length;
    }
    
    if (!container || !statusMsg) return;
    
    if (gameStats.activeGames.length === 0) {
        container.style.display = 'none';
        statusMsg.style.display = 'block';
    } else {
        container.style.display = 'grid';
        statusMsg.style.display = 'none';
        container.innerHTML = '';
        gameStats.activeGames.forEach(game => {
            const isMyGame = userData && game.creator_name === userData.displayName;
            const card = document.createElement('div');
            card.className = 'room-card';
            card.setAttribute('data-game-id', game.id);
            card.innerHTML = `
                <div class="room-header">
                    <h3>${game.creator_name}的局</h3>
                    ${isMyGame ? '<span class="my-game-badge">我的牌局</span>' : ''}
                </div>
                <div class="room-info">底: ${game.score_type} | 時間: ${game.appointment_time}</div>
                ${isMyGame 
                    ? `<button class="cancel-btn" onclick="cancelMatch('${game.id}')">取消開局</button>`
                    : `<button class="join-btn" onclick="quickJoinGame('${game.id}')">快速加入</button>`}
            `;
            container.appendChild(card);
        });
    }
}

// 刪除功能 - 前端優先更新
async function cancelMatch(matchId) {
    if (!confirm('確定取消？')) return;
    
    try {
        // 前端優先：立即移除卡片
        const card = document.querySelector(`[data-game-id="${matchId}"]`);
        if (card) {
            card.remove();
            // 同時更新本地資料
            gameStats.activeGames = gameStats.activeGames.filter(g => g.id !== matchId);
            updateUI();
        }
        
        // 後台刪除
        if (mjClient) {
            const { error } = await mjClient.from('matches').delete().eq('id', matchId);
            if (error) throw error;
        }
        
        alert('已取消');
    } catch (error) {
        alert('刪除失敗，請重新整理');
        loadRealTimeStats();
    }
}

// 創建新局
async function createNewGame() {
    if (!userData) {
        alert('請先登入');
        return;
    }
    
    try {
        const stakes = document.getElementById('game-stakes').value;
        const time = document.getElementById('game-time').value;
        
        console.log('[MJ999] 創建新局:', {
            creator_name: userData.displayName,
            score_type: stakes,
            appointment_time: time,
            status: 'waiting'
        });
        
        const { data, error } = await mjClient.from('matches').insert([{
            creator_name: userData.displayName,
            score_type: stakes,
            appointment_time: time,
            status: 'waiting'
        }]);
        
        if (error) {
            console.error('[MJ999] 創建失敗 - 完整錯誤訊息:', error);
            console.error('[MJ999] 錯誤詳情:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            alert(`創建失敗：${error.message || '未知錯誤'}`);
            return;
        }
        
        console.log('[MJ999] 創建成功:', data);
        alert('成功');
        loadRealTimeStats();
    } catch (error) {
        console.error('[MJ999] 創建異常:', error);
        alert(`創建失敗：${error.message || '網路錯誤'}`);
    }
}

// 快速加入
async function quickJoinGame(gameId) {
    if (!userData) {
        alert('請先登入');
        return;
    }
    
    alert('正在加入遊戲...');
    // TODO: 實際加入邏輯
}

// 時間選項
function initializeTimeOptions() {
    const select = document.getElementById('game-time');
    if (!select) return;
    
    select.innerHTML = '<option value="full">滿開 (人滿即開)</option>';
    const now = new Date();
    for(let i=1; i<=8; i++) {
        const t = new Date(now.getTime() + i * 30 * 60000);
        const tStr = `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
        select.innerHTML += `<option value="${tStr}">${tStr}</option>`;
    }
}

// 登入處理
function handleLogin() {
    if (!liffInitialized) {
        console.log('LIFF 尚未初始化');
        return;
    }
    liff.login();
}

// 登出處理
function handleLogout() {
    if (liff.isLoggedIn()) {
        liff.logout();
    }
    location.reload();
}

// 頁面載入完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('[MJ999] DOM 載入完成');
    
    // 強制解除 Loading - 5秒後必定顯示登入畫面
    setTimeout(() => {
        if (!liffInitialized) {
            console.log('[MJ999] 5秒超時，強制顯示登入畫面');
            hideLoading();
            showLoginSection();
        }
    }, 5000);
    
    // 開始 LIFF 初始化
    initializeLiff();
});

// 全域函數綁定 - 直接綁定到 window 層級
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.cancelMatch = cancelMatch;
window.createNewGame = createNewGame;
window.quickJoinGame = quickJoinGame;

console.log('[MJ999] MJ999 智能配對系統腳本載入完成');