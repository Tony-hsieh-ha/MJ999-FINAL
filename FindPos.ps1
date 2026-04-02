# MJ999 滑鼠座標定位器 - PowerShell 版本
# 功能: 倒數 5 秒後抓取滑鼠座標

Add-Type -AssemblyName System.Windows.Forms

Write-Host "MJ999 滑鼠座標定位器" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host "請將滑鼠移動到目標按鈕位置" -ForegroundColor Yellow
Write-Host ""

# 倒數 5 秒
for ($i = 5; $i -gt 0; $i--) {
    Write-Host "倒數: $i 秒..." -ForegroundColor Red
    Start-Sleep -Seconds 1
}

Write-Host "" 
Write-Host "抓取滑鼠座標..." -ForegroundColor Yellow

# 獲取滑鼠座標
$position = [System.Windows.Forms.Cursor]::Position
$x = $position.X
$y = $position.Y

Write-Host ""
Write-Host "========================" -ForegroundColor Green
Write-Host "滑鼠座標定位完成" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host "目前滑鼠座標: ($x, $y)" -ForegroundColor Cyan
Write-Host ""

# 生成可複製的程式碼
Write-Host "請將以下座標複製到 AutoClicker.ps1 中：" -ForegroundColor Yellow
Write-Host ""
Write-Host "`$AcceptX = $x  # Accept All 按鈕 X 座標" -ForegroundColor White
Write-Host "`$AcceptY = $y  # Accept All 按鈕 Y 座標" -ForegroundColor White
Write-Host "`$RunX = 0     # Run 按鈕 X 座標 (請修改)" -ForegroundColor Gray
Write-Host "`$RunY = 0     # Run 按鈕 Y 座標 (請修改)" -ForegroundColor Gray
Write-Host ""

# 顯示訊息框
[System.Windows.Forms.MessageBox]::Show("滑鼠座標: ($x, $y)`n`n請將座標更新到 AutoClicker.ps1 中", "座標定位完成", "OK", "Information") | Out-Null

Write-Host "按任意鍵繼續..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
