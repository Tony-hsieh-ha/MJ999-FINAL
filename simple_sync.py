#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MJ999 存檔自動同步系統
版本: 1.0
功能: 監控 script.js 修改時間，自動 Git 同步
"""

import os
import time
import subprocess
from datetime import datetime

class SimpleSync:
    def __init__(self):
        self.project_path = r"c:\Users\HsiehTony\Desktop\MJ999 FINAL"
        self.script_file = os.path.join(self.project_path, "script.js")
        self.last_modified = 0
        
        # 切換到專案目錄
        os.chdir(self.project_path)
        
        # 獲取初始修改時間
        if os.path.exists(self.script_file):
            self.last_modified = os.path.getmtime(self.script_file)
        
        print("🚀 MJ999 存檔自動同步系統啟動")
        print(f"📁 監控檔案: {self.script_file}")
        print(f"🕐 初始修改時間: {datetime.fromtimestamp(self.last_modified)}")
        print("=" * 50)
    
    def log_status(self, message):
        """即時回報狀態"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")
    
    def check_file_modified(self):
        """檢查檔案是否被修改"""
        if not os.path.exists(self.script_file):
            return False
        
        current_modified = os.path.getmtime(self.script_file)
        
        if current_modified > self.last_modified:
            self.last_modified = current_modified
            return True
        
        return False
    
    def git_operations(self):
        """執行 Git 操作"""
        try:
            self.log_status("🔄 開始 Git 同步")
            
            # Git add
            self.log_status("📦 執行 git add .")
            result = subprocess.run(['git', 'add', '.'], 
                                  capture_output=True, 
                                  text=True, 
                                  timeout=30)
            
            if result.returncode != 0:
                self.log_status(f"⚠️ git add 警告: {result.stderr}")
            
            # Git commit
            self.log_status("📝 執行 git commit")
            result = subprocess.run(['git', 'commit', '-m', 'Auto-fix'], 
                                  capture_output=True, 
                                  text=True, 
                                  timeout=30)
            
            if result.returncode != 0:
                if "nothing to commit" in result.stdout or "nothing to commit" in result.stderr:
                    self.log_status("ℹ️ 沒有變更需要提交")
                    return True
                else:
                    self.log_status(f"⚠️ git commit 警告: {result.stderr}")
                    return False
            
            # Git push
            self.log_status("🚀 執行 git push")
            result = subprocess.run(['git', 'push', 'origin', 'main'], 
                                  capture_output=True, 
                                  text=True, 
                                  timeout=60)
            
            if result.returncode == 0:
                self.log_status("✅ Git 同步完成")
                return True
            else:
                self.log_status(f"❌ Git push 失敗: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            self.log_status("❌ Git 操作超時")
            return False
        except Exception as e:
            self.log_status(f"❌ Git 操作異常: {e}")
            return False
    
    def main_loop(self):
        """主循環"""
        self.log_status("👀 開始監控 script.js 修改...")
        
        while True:
            try:
                if self.check_file_modified():
                    self.log_status("📝 偵測到 script.js 修改")
                    
                    # 等待 1 秒確保存檔完成
                    time.sleep(1)
                    
                    # 執行 Git 同步
                    self.git_operations()
                    
                    # 等待 3 秒避免重複觸發
                    time.sleep(3)
                else:
                    # 沒有修改，等待 2 秒後繼續檢查
                    time.sleep(2)
                    
            except KeyboardInterrupt:
                self.log_status("🛑 使用者中斷，停止同步")
                break
            except Exception as e:
                self.log_status(f"❌ 主循環錯誤: {e}")
                time.sleep(2)
    
    def start(self):
        """啟動同步系統"""
        try:
            self.main_loop()
        finally:
            self.log_status("🏁 存檔自動同步系統結束")

if __name__ == "__main__":
    sync = SimpleSync()
    sync.start()
