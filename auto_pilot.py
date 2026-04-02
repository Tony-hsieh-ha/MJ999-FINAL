#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MJ999 全自動開發閉環系統
版本: 1.0
作者: Windsurf
功能: 自動偵測按鈕、點擊、存檔、上傳 Git
"""

import pyautogui
import time
import os
import subprocess
import threading
from datetime import datetime

# 設定 pyautogui 安全機制
pyautogui.FAILSAFE = True  # 移動滑鼠到角落停止腳本
pyautogui.PAUSE = 0.5  # 每個操作間隔 0.5 秒

class AutoPilot:
    def __init__(self):
        self.running = True
        self.project_path = r"c:\Users\HsiehTony\Desktop\MJ999 FINAL"
        
        # 按鈕圖片路徑 (請確保這些圖片存在)
        self.accept_button_path = "accept_button.png"
        self.run_button_path = "run_button.png"
        
        print("🚀 MJ999 自動駕駛系統啟動")
        print("📍 Fail-safe: 移動滑鼠到螢幕角落即可停止")
        print("=" * 50)
    
    def log_status(self, message):
        """即時回報狀態"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")
    
    def check_fail_safe(self):
        """檢查是否觸發 Fail-safe"""
        mouse_x, mouse_y = pyautogui.position()
        screen_width, screen_height = pyautogui.size()
        
        # 檢查四個角落 (容差 50px)
        corner_threshold = 50
        
        if (mouse_x < corner_threshold and mouse_y < corner_threshold) or \
           (mouse_x > screen_width - corner_threshold and mouse_y < corner_threshold) or \
           (mouse_x < corner_threshold and mouse_y > screen_height - corner_threshold) or \
           (mouse_x > screen_width - corner_threshold and mouse_y > screen_height - corner_threshold):
            return True
        return False
    
    def find_and_click_button(self):
        """偵測並點擊按鈕"""
        try:
            # 偵測 Accept All 按鈕
            accept_location = pyautogui.locateOnScreen(self.accept_button_path, confidence=0.8)
            if accept_location:
                self.log_status("🎯 發現 Accept All 按鈕")
                center = pyautogui.center(accept_location)
                pyautogui.moveTo(center.x, center.y, duration=0.3)
                pyautogui.click()
                self.log_status("✅ 已點擊 Accept All")
                return True
            
            # 偵測 Run 按鈕
            run_location = pyautogui.locateOnScreen(self.run_button_path, confidence=0.8)
            if run_location:
                self.log_status("🎯 發現 Run 按鈕")
                center = pyautogui.center(run_location)
                pyautogui.moveTo(center.x, center.y, duration=0.3)
                pyautogui.click()
                self.log_status("✅ 已點擊 Run")
                return True
                
        except Exception as e:
            self.log_status(f"⚠️ 偵測錯誤: {e}")
        
        return False
    
    def save_file(self):
        """執行 Ctrl+S 存檔"""
        try:
            pyautogui.hotkey('ctrl', 's')
            self.log_status("💾 執行存檔 (Ctrl+S)")
            time.sleep(2)  # 等待 2 秒確保存檔完成
            return True
        except Exception as e:
            self.log_status(f"❌ 存檔失敗: {e}")
            return False
    
    def git_operations(self):
        """執行 Git 操作"""
        try:
            self.log_status("🔄 開始 Git 操作")
            
            # 切換到專案目錄
            os.chdir(self.project_path)
            
            # Git add
            self.log_status("📦 執行 git add .")
            subprocess.run(['git', 'add', '.'], check=True, capture_output=True, text=True)
            
            # Git commit
            self.log_status("📝 執行 git commit")
            commit_result = subprocess.run(
                ['git', 'commit', '-m', 'Auto-fix from Pilot'], 
                check=True, 
                capture_output=True, 
                text=True
            )
            
            # Git push
            self.log_status("🚀 執行 git push")
            push_result = subprocess.run(['git', 'push', 'origin', 'main'], check=True, capture_output=True, text=True)
            
            self.log_status("✅ Git 操作完成")
            return True
            
        except subprocess.CalledProcessError as e:
            self.log_status(f"❌ Git 操作失敗: {e}")
            if e.stdout:
                self.log_status(f"輸出: {e.stdout}")
            if e.stderr:
                self.log_status(f"錯誤: {e.stderr}")
            return False
        except Exception as e:
            self.log_status(f"❌ Git 異常: {e}")
            return False
    
    def main_loop(self):
        """主循環"""
        while self.running:
            try:
                # 檢查 Fail-safe
                if self.check_fail_safe():
                    self.log_status("🛑 觸發 Fail-safe，停止腳本")
                    break
                
                # 步驟 A: 偵測按鈕
                self.log_status("🔍 正在尋找按鈕...")
                
                if self.find_and_click_button():
                    # 步驟 B: 已點擊
                    time.sleep(1)
                    
                    # 步驟 C: 存檔
                    if self.save_file():
                        time.sleep(1)
                        
                        # 步驟 D: 上傳
                        self.git_operations()
                        time.sleep(5)  # 等待 5 秒後繼續偵測
                    else:
                        time.sleep(2)
                else:
                    # 沒找到按鈕，等待 1 秒後繼續
                    time.sleep(1)
                    
            except KeyboardInterrupt:
                self.log_status("🛑 使用者中斷，停止腳本")
                break
            except Exception as e:
                self.log_status(f"❌ 主循環錯誤: {e}")
                time.sleep(2)
    
    def start(self):
        """啟動自動駕駛"""
        self.log_status("🎮 自動駕駛系統開始運行")
        
        # 檢查必要檔案
        if not os.path.exists(self.accept_button_path):
            self.log_status(f"⚠️ 警告: 找不到 {self.accept_button_path}")
        
        if not os.path.exists(self.run_button_path):
            self.log_status(f"⚠️ 警告: 找不到 {self.run_button_path}")
        
        # 檢查專案路徑
        if not os.path.exists(self.project_path):
            self.log_status(f"❌ 錯誤: 找不到專案路徑 {self.project_path}")
            return
        
        # 開始主循環
        self.main_loop()
        
        self.log_status("🏁 自動駕駛系統結束")

if __name__ == "__main__":
    pilot = AutoPilot()
    pilot.start()
