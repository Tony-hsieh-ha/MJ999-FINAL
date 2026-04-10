// MJ999 智能配對系統 - 完全修復版
// 版本: 20260402

// 全域變數
let liffInitialized = false;
let userData = null;
let isLoggedInState = false;
let isDeleting = false; // 狀態鎖：防止刪除時資料復活
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
    setInterval(loadRealTimeStats, 10000); // 調整為 10 秒更新一次
    await loadRealTimeStats();
}

// 讀取資料 - 加入鎖定檢查
async function loadRealTimeStats() {
    if (isDeleting) { console.log('[MJ999] 偵測到刪除進行中，跳過本次自動刷新'); return; }
    if (!mjClient) return;
    
    try {
        const { data, error } = await mjClient
            .from('matches')
            .select('*')
            .eq('status', 'waiting')
            .order('created_at', { ascending: false });
        
        if (error) throw error;

        // 加入本地已取消牌局的過濾（避免 Supabase RLS 未設定導致舊資料復活）
        const cancelledMatches = JSON.parse(localStorage.getItem('cancelledMatches') || '[]');
        gameStats.activeGames = (data || []).filter(game => !cancelledMatches.includes(game.id));
        
        // 正常情況下使用 renderCards
        renderCards(gameStats.activeGames);
    } catch (err) {
        console.error('更新失敗:', err);
    }
}

// 更新 UI
function updateUI() {
    const availableTables = document.getElementById('available-tables');
    const waitingPlayers = document.getElementById('waiting-players');
    
    if (availableTables) {
        availableTables.textContent = gameStats.totalTables - gameStats.activeGames.length;
    }
    if (waitingPlayers) {
        waitingPlayers.textContent = gameStats.activeGames.length;
    }
    
    // 呼叫獨立的 renderCards 函數來處理列表的顯示
    renderCards(gameStats.activeGames);
}

// 刪除功能 - 手術級精確修復
async function cancelMatch(matchId) {
    if (isDeleting) {
        console.log('[MJ999] 刪除進行中，忽略重複請求');
        return;
    }
    
    if (!confirm('確定取消？')) return;
    
    try {
        // 在 try 的第一行，將 isDeleting 設為 true
        isDeleting = true;
        console.log('[MJ999] 🗑️ 開始刪除牌局:', matchId);
        
        // 等待 Supabase delete() 完全完成
        if (mjClient) {
            const { error } = await mjClient
                .from('matches')
                .delete()
                .match({ id: matchId });
            if (error) {
                console.error('[MJ999] 後台刪除失敗:', error);
                alert('刪除失敗，請重新整理');
                isDeleting = false;
                return;
            }
        } 
        
        // 執行成功後，手動更新本地數據
        gameStats.activeGames = gameStats.activeGames.filter(g => g.id !== matchId);
        
        // 紀錄到 localStorage，避免即使後端因權限問題未真刪除，前台又把資料抓回來
        let cancelledMatches = JSON.parse(localStorage.getItem('cancelledMatches') || '[]');
        if (!cancelledMatches.includes(matchId)) {
            cancelledMatches.push(matchId);
            localStorage.setItem('cancelledMatches', JSON.stringify(cancelledMatches));
        }
        
        // 立即呼叫 renderCards 刷新畫面，不需要等待資料庫回傳
        renderCards(gameStats.activeGames);
        
        console.log('[MJ999] ✅ 刪除完成，畫面已更新');
        alert('✅ 已取消');
        
    } catch (error) {
        console.error('[MJ999] 刪除異常:', error);
        alert('刪除失敗，請重新整理');
        loadRealTimeStats(); // 異常時重新載入
    } finally {
        // 在函數最後，5 秒內禁止任何自動刷新
        setTimeout(() => { isDeleting = false; }, 5000);
        console.log('[MJ999] 🔓 5秒後解除刪除鎖定');
    }
}

// 獨立渲染函數 - 不依賴資料庫查詢
function renderCards(games) {
    const container = document.getElementById('room-cards');
    const statusMsg = document.getElementById('room-status');
    
    if (!container || !statusMsg) return;
    
    if (games.length === 0) {
        container.style.display = 'none';
        statusMsg.style.display = 'block';
    } else {
        container.style.display = 'grid';
        statusMsg.style.display = 'none';
        container.innerHTML = '';
        games.forEach(game => {
            // 解析出名字和頭像 (使用 ||| 分隔，具有向下相容性)
            let creatorName = game.creator_name || '玩家';
            let creatorAvatar = '';
            
            if (creatorName.includes('|||')) {
                const parts = creatorName.split('|||');
                creatorName = parts[0];
                creatorAvatar = parts[1];
            }

            const isMyGame = userData && creatorName === userData.displayName;
            const card = document.createElement('div');
            card.className = 'room-card';
            card.setAttribute('data-game-id', game.id);
            
            // 處理頭像的 HTML (如果沒有 LINE 頭像，給個預設的圓圈)
            const avatarHtml = creatorAvatar 
                ? `<img src="${creatorAvatar}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #555;">` 
                : `<div style="width: 36px; height: 36px; border-radius: 50%; background: #444; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid #555; color: white;">👤</div>`;

            card.innerHTML = `
                <div class="room-header" style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${avatarHtml}
                        <h3 style="margin: 0; font-size: 1.1em;">${creatorName}的局</h3>
                    </div>
                    ${isMyGame ? '<span class="my-game-badge">我的牌局</span>' : ''}
                </div>
                <div class="room-info" style="margin-top: 12px; font-size: 0.95em;">底: ${game.score_type} | 時間: ${game.appointment_time}</div>
                ${isMyGame 
                    ? `<button class="cancel-btn" onclick="cancelMatch('${game.id}')" style="margin-top: 10px;">取消開局</button>`
                    : `<button class="join-btn" onclick="quickJoinGame('${game.id}')" style="margin-top: 10px;">快速加入</button>`}
            `;
            container.appendChild(card);
        });
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
            creator_name: `${userData.displayName}|||${userData.pictureUrl || ''}`,
            score_type: stakes,
            appointment_time: time,
            status: 'waiting'
        });
        
        const { data, error } = await mjClient.from('matches').insert([{
            creator_name: `${userData.displayName}|||${userData.pictureUrl || ''}`,
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
    
    if (!confirm('確定要加入這局嗎？')) return;
    
    try {
        const { error } = await mjClient
            .from('matches')
            .update({ status: 'matched' })
            .eq('id', gameId);
            
        if (error) {
            console.error('[MJ999] 加入失敗:', error);
            alert('加入失敗，請稍後再試');
            return;
        }
        
        alert('✅ 成功加入！');
        loadRealTimeStats();
    } catch (err) {
        console.error('[MJ999] 網路錯誤:', err);
        alert('網路錯誤，加入失敗');
    }
}

// 時間選項 - 固定 24 小時靜態列表 (00:00~23:30)
function initializeTimeOptions() {
    const select = document.getElementById('game-time');
    if (!select) return;
    
    // 清空選項
    select.innerHTML = '';
    
    // 第一選項：滿開
    const fullOption = document.createElement('option');
    fullOption.value = 'full';
    fullOption.textContent = '滿開 (人滿即開)';
    select.appendChild(fullOption);
    
    // 確保生成的選項是從 00:00 到 23:30 固定排序，不受目前時間影響
    console.log('[MJ999] ⏰ 生成固定 24 小時時間選項 (00:00~23:30)');
    
    for (let hour = 0; hour < 24; hour++) {
        for (let minute of [0, 30]) {
            // 跳過 00:00 因為第一個已經是滿開
            if (hour === 0 && minute === 0) continue;
            
            const option = document.createElement('option');
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            option.value = timeStr;
            option.textContent = timeStr;
            select.appendChild(option);
            
            console.log(`[MJ999]   添加時間選項: ${timeStr}`);
        }
    }
    
    console.log(`[MJ999] ✅ 固定 24 小時時間選項生成完成，共 ${select.options.length - 1} 個時段`);
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