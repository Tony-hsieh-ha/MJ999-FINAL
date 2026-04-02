# MJ999 滑鼠座標定位器 - PowerShell 版本
# 功能: 倒數 5 秒後抓取滑鼠座標

Add-Type -AssemblyName System.Windows.Forms

Write-Host "--- 座標定位器 ---" -ForegroundColor Cyan
for ($i = 5; $i -gt 0; $i--) {
    Write-Host "請在 $i 秒內將滑鼠移到按鈕上..." -ForegroundColor Yellow
    Start-Sleep -Seconds 1
}

$pos = [System.Windows.Forms.Cursor]::Position
Write-Host "`n點擊座標已抓取！" -ForegroundColor Green
Write-Host "X: $($pos.X)" -ForegroundColor Yellow
Write-Host "Y: $($pos.Y)" -ForegroundColor Yellow
Write-Host "`n請將這兩個數字填入 AutoClicker.ps1 中。" -ForegroundColor White
