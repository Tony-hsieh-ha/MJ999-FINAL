// MJ999 智能配對系統 - Debug 修復版
// 版本: 20260508

// 全域變數
let liffInitialized = false;
let userData = null;
let userLineId = null; // 用 LINE userId 作為身份識別，取代名字比對
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
        showDbOfflineBanner();
    }
}

// 顯示資料庫離線提示橫幅
function showDbOfflineBanner() {
    if (document.getElementById('db-offline-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'db-offline-banner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(135deg,#b71c1c,#e53935);color:#fff;padding:10px 20px;text-align:center;font-size:14px;font-weight:bold;';
    banner.innerHTML = '⚠️ 資料庫連線失敗 — 請前往 <a href="https://supabase.com/dashboard" target="_blank" style="color:#FFD700;">Supabase Dashboard</a> 確認專案是否已暫停或被刪除';
    document.body.prepend(banner);
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
            // [BUG FIX #4] 使用 LINE userId 作為唯一身份識別，取代名字比對
            userLineId = profile.userId;

            const playerName = document.getElementById('player-name');
            const playerAvatar = document.getElementById('player-avatar');
            if (playerName) playerName.textContent = userData.displayName;
            // [BUG FIX #8] 頭像載入失敗時使用 CSS 備用顯示
            if (playerAvatar) {
                playerAvatar.src = userData.pictureUrl;
                playerAvatar.onerror = function() {
                    this.style.display = 'none';
                    this.parentElement.insertAdjacentHTML('afterbegin',
                        '<div class="avatar-fallback">👤</div>'
                    );
                };
            }

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
    setInterval(loadRealTimeStats, 10000); // 10 秒更新一次
    await loadRealTimeStats();
}

// 讀取資料 - 加入鎖定檢查
async function loadRealTimeStats() {
    if (isDeleting) { console.log('[MJ999] 偵測到刪除進行中，跳過本次自動刷新'); return; }
    if (!mjClient) {
        showDbOfflineBanner();
        showDbOfflineStats();
        return;
    }

    try {
        const { data, error } = await mjClient
            .from('matches')
            .select('*')
            .eq('status', 'waiting')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 成功連線，移除離線橫幅
        const banner = document.getElementById('db-offline-banner');
        if (banner) banner.remove();

        // 加入本地已取消牌局的過濾（避免 Supabase RLS 未設定導致舊資料復活）
        const cancelledMatches = JSON.parse(localStorage.getItem('cancelledMatches') || '[]');
        gameStats.activeGames = (data || []).filter(game => !cancelledMatches.includes(game.id));

        updateUI();
    } catch (err) {
        console.error('[MJ999] 更新失敗:', err);
        // 網路或 Supabase 問題 → 顯示離線提示
        showDbOfflineBanner();
        showDbOfflineStats();
    }
}

// 資料庫離線時更新統計 UI
function showDbOfflineStats() {
    const availableTablesEl = document.getElementById('available-tables');
    const waitingPlayersEl = document.getElementById('waiting-players');
    if (availableTablesEl) availableTablesEl.textContent = '⚠️';
    if (waitingPlayersEl) waitingPlayersEl.textContent = '⚠️';

    const statusMsg = document.getElementById('room-status');
    const container = document.getElementById('room-cards');
    if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.innerHTML = '<p>⚠️ 資料庫連線失敗，無法讀取揪團資訊</p>';
    }
    if (container) container.style.display = 'none';
}

// 更新 UI
function updateUI() {
    const availableTablesEl = document.getElementById('available-tables');
    const waitingPlayersEl = document.getElementById('waiting-players');

    if (availableTablesEl) {
        // [BUG FIX #5] 防止顯示負數空桌
        const available = Math.max(0, gameStats.totalTables - gameStats.activeGames.length);
        availableTablesEl.textContent = available;
    }
    if (waitingPlayersEl) {
        waitingPlayersEl.textContent = gameStats.activeGames.length;
    }

    renderCards(gameStats.activeGames);
}

// 刪除功能
async function cancelMatch(matchId) {
    if (isDeleting) {
        console.log('[MJ999] 刪除進行中，忽略重複請求');
        return;
    }

    if (!confirm('確定取消這場牌局？')) return;

    // [BUG FIX #2] 若 mjClient 未初始化，直接提示並中斷，不繼續執行成功邏輯
    if (!mjClient) {
        alert('資料庫未連線，無法取消，請重新整理頁面。');
        return;
    }

    try {
        isDeleting = true;
        console.log('[MJ999] 🗑️ 開始刪除牌局:', matchId);

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

        // 執行成功後，手動更新本地數據
        gameStats.activeGames = gameStats.activeGames.filter(g => g.id !== matchId);

        // 紀錄到 localStorage，避免後端因權限問題未真刪除時前台把資料抓回來
        let cancelledMatches = JSON.parse(localStorage.getItem('cancelledMatches') || '[]');
        if (!cancelledMatches.includes(matchId)) {
            cancelledMatches.push(matchId);
            localStorage.setItem('cancelledMatches', JSON.stringify(cancelledMatches));
        }

        renderCards(gameStats.activeGames);
        updateUI();

        console.log('[MJ999] ✅ 刪除完成，畫面已更新');
        alert('✅ 已成功取消牌局');

    } catch (error) {
        console.error('[MJ999] 刪除異常:', error);
        alert('刪除失敗，請重新整理');
        loadRealTimeStats();
    } finally {
        // 5 秒內禁止任何自動刷新，防止被刪除的資料復活
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
            let creatorLineId = game.creator_line_id || null;

            if (creatorName.includes('|||')) {
                const parts = creatorName.split('|||');
                creatorName = parts[0];
                creatorAvatar = parts[1] || '';
            }

            // [BUG FIX #4] 優先用 LINE userId 比對，若無則退回名字比對
            let isMyGame = false;
            if (userLineId && creatorLineId) {
                isMyGame = userLineId === creatorLineId;
            } else if (userData) {
                isMyGame = creatorName === userData.displayName;
            }

            const card = document.createElement('div');
            card.className = 'room-card';
            card.setAttribute('data-game-id', game.id);

            // 處理頭像的 HTML
            const avatarHtml = creatorAvatar
                ? `<img src="${creatorAvatar}" onerror="this.outerHTML='<div style=\\'width:36px;height:36px;border-radius:50%;background:#444;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #555;color:white;\\'>👤</div>'" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #555;">`
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

    if (!mjClient) {
        console.error('[MJ999] 建立失敗：資料庫未連線');
        alert('系統尚未準備完成，請稍後再試。');
        return;
    }

    try {
        const stakes = document.getElementById('game-stakes').value;
        const time = document.getElementById('game-time').value;

        console.log('[MJ999] 創建新局:', {
            creator_name: `${userData.displayName}|||${userData.pictureUrl || ''}`,
            creator_line_id: userLineId,
            score_type: stakes,
            appointment_time: time,
            status: 'waiting'
        });

        const { data, error } = await mjClient.from('matches').insert([{
            creator_name: `${userData.displayName}|||${userData.pictureUrl || ''}`,
            creator_line_id: userLineId, // [BUG FIX #4] 儲存 LINE userId 以便精確識別
            score_type: stakes,
            appointment_time: time,
            status: 'waiting'
        }]).select();

        if (error) {
            console.error('[MJ999] 創建失敗 - 完整錯誤訊息:', error);
            // 若 creator_line_id 欄位不存在則退回不含該欄位的寫入
            if (error.code === 'PGRST204' || error.message?.includes('creator_line_id')) {
                console.warn('[MJ999] creator_line_id 欄位不存在，改用相容模式寫入');
                const { data: data2, error: error2 } = await mjClient.from('matches').insert([{
                    creator_name: `${userData.displayName}|||${userData.pictureUrl || ''}`,
                    score_type: stakes,
                    appointment_time: time,
                    status: 'waiting'
                }]).select();
                if (error2) {
                    alert(`創建失敗：${error2.message || '未知錯誤'}`);
                    return;
                }
                console.log('[MJ999] 相容模式創建成功:', data2);
            } else {
                alert(`創建失敗：${error.message || '未知錯誤'}`);
                return;
            }
        } else {
            console.log('[MJ999] 創建成功:', data);
        }

        // [BUG FIX #7] 更有意義的成功訊息
        alert('🎲 已成功發起新局！等待玩家加入中...');
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

    if (!mjClient) {
        alert('系統尚未準備完成，請稍後再試。');
        return;
    }

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

        alert('✅ 成功加入！開局資訊已通知開局者。');
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

    select.innerHTML = '';

    // 第一選項：滿開
    const fullOption = document.createElement('option');
    fullOption.value = 'full';
    fullOption.textContent = '滿開 (人滿即開)';
    select.appendChild(fullOption);

    // [BUG FIX #6] 移除每個時間選項的 console.log，只保留摘要 log
    for (let hour = 0; hour < 24; hour++) {
        for (let minute of [0, 30]) {
            if (hour === 0 && minute === 0) continue;
            const option = document.createElement('option');
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            option.value = timeStr;
            option.textContent = timeStr;
            select.appendChild(option);
        }
    }

    console.log(`[MJ999] ✅ 時間選項生成完成，共 ${select.options.length} 個選項`);
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
    // [BUG FIX #3] 登出時清除 cancelledMatches，防止多帳號殘留問題
    localStorage.removeItem('cancelledMatches');
    console.log('[MJ999] 已清除本地快取，準備登出');

    if (liff.isLoggedIn()) {
        liff.logout();
    }
    location.reload();
}

// 給店家留言功能
async function leaveMessage() {
    if (!userData) {
        alert('請先登入');
        return;
    }

    // [BUG FIX #1] 加入 mjClient null 檢查，防止 crash
    if (!mjClient) {
        alert('資料庫未連線，請稍後再試。');
        return;
    }

    const msg = prompt('請輸入你想對店家說的話：');
    if (!msg || msg.trim() === '') return;

    try {
        const { error } = await mjClient.from('feedbacks').insert([{
            sender_name: userData.displayName,
            message: msg.trim()
        }]);

        if (error) {
            console.error('[MJ999] 留言異常:', error);
            alert('留言失敗，請稍後再試。');
        } else {
            alert('✅ 留言已成功送出給店家！');
        }
    } catch (err) {
        console.error('[MJ999] 網路錯誤:', err);
        alert('網路連線異常，留言失敗。');
    }
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

    initializeLiff();
});

// 全域函數綁定 - 直接綁定到 window 層級
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.cancelMatch = cancelMatch;
window.createNewGame = createNewGame;
window.quickJoinGame = quickJoinGame;
window.leaveMessage = leaveMessage;

console.log('[MJ999] MJ999 智能配對系統腳本載入完成 v20260508');