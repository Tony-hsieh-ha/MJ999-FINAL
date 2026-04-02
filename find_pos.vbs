' MJ999 滑鼠座標定位器 - VBScript 版本
' 功能: 顯示目前滑鼠的座標位置

Option Explicit

' 宣告變數
Dim shell, xPos, yPos

' 創建 Shell 物件
Set shell = CreateObject("WScript.Shell")

' 顯示說明
WScript.Echo "MJ999 滑鼠座標定位器"
WScript.Echo "====================="
WScript.Echo "請將滑鼠移動到目標按鈕位置"
WScript.Echo "3 秒後將顯示滑鼠座標..."

' 等待 3 秒讓使用者移動滑鼠
WScript.Sleep 3000

' 使用 PowerShell 獲取滑鼠座標
Dim psCommand
psCommand = "powershell -Command ""Add-Type -Name User32 -Namespace Win32 -MemberDefinition '[DllImport(\"" & Chr(34) & "user32.dll" & Chr(34) & "")] public static extern bool GetCursorPos(out POINT lpPoint); public struct POINT { public int X; public int Y; }' -Pass; $point = New-Object Win32.POINT; [Win32.User32]::GetCursorPos([ref]$point); Write-Host ($point.X.ToString() + ',' + $point.Y.ToString())"""

' 執行 PowerShell 命令並獲取輸出
Dim exec, output
Set exec = shell.Exec(psCommand)

' 等待執行完成
Do While exec.Status = 0
    WScript.Sleep 100
Loop

' 獲取輸出
output = exec.StdOut.ReadAll

' 顯示座標
WScript.Echo ""
WScript.Echo "====================="
WScript.Echo "滑鼠座標定位完成"
WScript.Echo "====================="
WScript.Echo "目前滑鼠座標: " & Trim(output)
WScript.Echo ""
WScript.Echo "請將這個座標複製到 clicker.vbs 中："
WScript.Echo "x1 = " & Split(output, ",")(0) & "  ' Accept All 按鈕 X 座標"
WScript.Echo "y1 = " & Split(output, ",")(1) & "  ' Accept All 按鈕 Y 座標"
WScript.Echo "x2 = " & Split(output, ",")(0) & "  ' Run 按鈕 X 座標"
WScript.Echo "y2 = " & Split(output, ",")(1) & "  ' Run 按鈕 Y 座標"
WScript.Echo ""
WScript.Echo "按確定關閉此視窗"

' 顯示訊息框
shell.Popup "滑鼠座標: " & Trim(output) & vbCrLf & vbCrLf & "請將座標更新到 clicker.vbs 中", 10, "座標定位完成", 64
