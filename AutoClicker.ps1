# MJ999 自動點擊器 - PowerShell 版本
# 功能: 無限循環點擊器

Add-Type -AssemblyName System.Windows.Forms
Add-Type -Name User32 -Namespace Win32 -MemberDefinition @"
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
"@

# --- 請在這裡填入剛抓到的座標 ---
$acceptX = 1500  # 修改這裡
$acceptY = 450   # 修改這裡
# ----------------------------

$MOUSEEVENTF_LEFTDOWN = 0x02
$MOUSEEVENTF_LEFTUP = 0x04

Write-Host "🚀 按鍵精靈啟動！每 5 秒點擊一次..." -ForegroundColor Cyan
Write-Host "按下 Ctrl+C 即可停止。" -ForegroundColor Yellow

try {
    while($true) {
        # 移動滑鼠到指定座標
        [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($acceptX, $acceptY)
        Start-Sleep -Milliseconds 200
        
        # 執行點擊 (按下 + 釋放)
        [Win32.User32]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
        Start-Sleep -Milliseconds 100
        [Win32.User32]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
        
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 點擊 Accept 並存檔..." -ForegroundColor Green
        Start-Sleep -Milliseconds 500
        
        # 自動按下 Ctrl+S
        [System.Windows.Forms.SendKeys]::SendWait("^s")
        Start-Sleep -Milliseconds 1000
        
        # 執行 Git 自動上傳
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 執行 Git 自動上傳..." -ForegroundColor Blue
        
        try {
            # Git add script.js
            Write-Host "  -> git add script.js" -ForegroundColor Gray
            $gitAdd = git add script.js 2>&1
            
            # Git commit
            Write-Host "  -> git commit -m 'Auto Fix Bug'" -ForegroundColor Gray
            $gitCommit = git commit -m "Auto Fix Bug" 2>&1
            
            # Git push (使用 --force 確保上傳成功)
            Write-Host "  -> git push origin main --force" -ForegroundColor Gray
            $gitPush = git push origin main --force 2>&1
            
            Write-Host "  -> Git 上傳完成！" -ForegroundColor Green
        } catch {
            Write-Host "  -> Git 操作失敗: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Start-Sleep -Seconds 5
    }
} finally {
    Write-Host "停止運行。" -ForegroundColor Red
}
