# MJ999 自動點擊器 - PowerShell 版本
# 功能: 每 5 秒自動點擊 Accept All 和 Run 按鈕，然後存檔

Add-Type -AssemblyName System.Windows.Forms
Add-Type -Name User32 -Namespace Win32 -MemberDefinition @"
    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int x, int y);
    
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
"@

# ================================
# 請根據實際按鈕位置修改這些座標
# ================================

$AcceptX = 100   # Accept All 按鈕 X 座標 (請修改)
$AcceptY = 300   # Accept All 按鈕 Y 座標 (請修改)
$RunX = 200      # Run 按鈕 X 座標 (請修改)
$RunY = 300      # Run 按鈕 Y 座標 (請修改)

# 點擊常數
$MOUSEEVENTF_LEFTDOWN = 0x02
$MOUSEEVENTF_LEFTUP = 0x04

Write-Host "MJ999 自動點擊器啟動" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host "Accept All 按鈕座標: ($AcceptX, $AcceptY)" -ForegroundColor Cyan
Write-Host "Run 按鈕座標: ($RunX, $RunY)" -ForegroundColor Cyan
Write-Host "每 5 秒執行一次點擊循環" -ForegroundColor Yellow
Write-Host ""
Write-Host "按 Ctrl+C 停止腳本" -ForegroundColor Red
Write-Host ""

# 點擊函數
function Click-At($x, $y) {
    # 移動滑鼠到指定座標
    [Win32.User32]::SetCursorPos($x, $y)
    Start-Sleep -Milliseconds 200
    
    # 執行點擊 (按下 + 釋放)
    [Win32.User32]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 100
    [Win32.User32]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    
    Write-Host "點擊座標: ($x, $y)" -ForegroundColor Gray
}

# 模擬按鍵函數
function Send-Keys($keys) {
    [System.Windows.Forms.SendKeys]::SendWait($keys)
    Start-Sleep -Milliseconds 500
}

# 無限循環
try {
    while ($true) {
        Write-Host "執行點擊循環: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
        
        # 點擊 Accept All 按鈕
        Click-At $AcceptX $AcceptY
        Start-Sleep -Seconds 1
        
        # 點擊 Run 按鈕
        Click-At $RunX $RunY
        Start-Sleep -Seconds 1
        
        # 自動按下 Ctrl + S 存檔
        Write-Host "模擬按下 Ctrl+S 存檔" -ForegroundColor Yellow
        Send-Keys "^s"
        
        Write-Host "循環完成，等待 5 秒..." -ForegroundColor Blue
        Write-Host ""
        
        # 等待 5 秒
        Start-Sleep -Seconds 5
    }
}
catch [System.Management.Automation.HaltCommandException] {
    Write-Host ""
    Write-Host "自動點擊器已停止" -ForegroundColor Red
    Write-Host "========================" -ForegroundColor Red
}
catch {
    Write-Host "發生錯誤: $($_.Exception.Message)" -ForegroundColor Red
}
