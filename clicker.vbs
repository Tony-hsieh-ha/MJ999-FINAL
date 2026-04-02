' MJ999 自動點擊器 - VBScript 版本
' 功能: 每隔 5 秒自動點擊 Accept All 和 Run 按鈕，然後存檔

Option Explicit

' 宣告變數
Dim shell, x1, y1, x2, y2

' 請根據實際按鈕位置修改這些座標
x1 = 100  ' Accept All 按鈕 X 座標 (請修改)
y1 = 300  ' Accept All 按鈕 Y 座標 (請修改)
x2 = 200  ' Run 按鈕 X 座標 (請修改)
y2 = 300  ' Run 按鈕 Y 座標 (請修改)

' 創建 Shell 物件
Set shell = CreateObject("WScript.Shell")

' 顯示啟動訊息
WScript.Echo "MJ999 自動點擊器啟動"
WScript.Echo "Accept All 按鈕座標: (" & x1 & ", " & y1 & ")"
WScript.Echo "Run 按鈕座標: (" & x2 & ", " & y2 & ")"
WScript.Echo "每 5 秒執行一次點擊循環"
WScript.Echo "按 Ctrl+C 停止腳本"

' 無限循環
Do While True
    ' 等待 5 秒
    WScript.Sleep 5000
    
    ' 點擊 Accept All 按鈕
    ClickAt x1, y1
    WScript.Sleep 1000 ' 等待 1 秒
    
    ' 點擊 Run 按鈕
    ClickAt x2, y2
    WScript.Sleep 1000 ' 等待 1 秒
    
    ' 模擬按下 Ctrl + S 存檔
    shell.SendKeys "^s"
    
    ' 顯示執行訊息
    WScript.Echo "執行點擊循環: " & Now()
Loop

' 點擊函數
Sub ClickAt(x, y)
    ' 使用 Windows API 點擊
    CreateObject("WScript.Shell").Run "powershell -Command ""Add-Type -Name User32 -Namespace Win32 -MemberDefinition '[DllImport(\"" & Chr(34) & "user32.dll" & Chr(34) & "")] public static extern IntPtr SetCursorPos(int x, int y); [DllImport(\"" & Chr(34) & "user32.dll" & Chr(34) & "")] public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);' -Pass; $pos = [Win32.User32]::SetCursorPos(" & x & ", " & y & "); [Win32.User32]::mouse_event(0x02, 0, 0, 0, 0); [Win32.User32]::mouse_event(0x04, 0, 0, 0, 0)""", 0, True
End Sub
