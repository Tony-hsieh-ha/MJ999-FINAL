#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
環境檢查檢查腳本
檢查 pyautogui 和必要的圖片檔案
"""

import sys
import os

def check_python_version():
    """檢查 Python 版本"""
    print("🐍 Python 版本檢查:")
    print(f"   版本: {sys.version}")
    print(f"   路徑: {sys.executable}")
    print()

def check_pyautogui():
    """檢查 pyautogui 安裝"""
    print("📦 pyautogui 檢查:")
    try:
        import pyautogui
        print("   ✅ pyautogui 匯入成功")
        print(f"   版本: {pyautogui.__version__}")
        
        # 測試基本功能
        print("   🔍 測試基本功能...")
        screen_size = pyautogui.size()
        print(f"   螢幕解析度: {screen_size}")
        
        # 測試圖片識別功能
        print("   🖼️ 測試圖片識別功能...")
        try:
            # 這會失敗因為沒有圖片，但可以測試功能是否可用
            pyautogui.locateOnScreen('nonexistent.png', confidence=0.8)
        except Exception as e:
            if "image" in str(e).lower() or "file" in str(e).lower():
                print("   ✅ 圖片識別功能可用 (預期的檔案不存在錯誤)")
            else:
                print(f"   ⚠️ 圖片識別可能有問題: {e}")
        
        return True
    except ImportError as e:
        print(f"   ❌ pyautogui 匯入失敗: {e}")
        print("   💡 請執行: pip install pyautogui")
        return False
    except Exception as e:
        print(f"   ❌ pyautogui 測試失敗: {e}")
        return False

def check_image_files():
    """檢查必要的圖片檔案"""
    print("\n🖼️ 圖片檔案檢查:")
    
    required_files = [
        'accept_button.png',
        'run_button.png'
    ]
    
    all_exist = True
    for filename in required_files:
        if os.path.exists(filename):
            print(f"   ✅ {filename} 存在")
            size = os.path.getsize(filename)
            print(f"      大小: {size} bytes")
        else:
            print(f"   ❌ {filename} 不存在")
            all_exist = False
    
    if not all_exist:
        print("\n   💡 請截圖對應按鈕並命名為:")
        for filename in required_files:
            if not os.path.exists(filename):
                print(f"      - {filename}")
    
    return all_exist

def check_project_directory():
    """檢查專案目錄"""
    print("📁 專案目錄檢查:")
    current_dir = os.getcwd()
    print(f"   目前目錄: {current_dir}")
    
    # 檢查關鍵檔案
    key_files = ['auto_pilot.py', 'script.js', 'index.html']
    for filename in key_files:
        if os.path.exists(filename):
            print(f"   ✅ {filename} 存在")
        else:
            print(f"   ❌ {filename} 不存在")

def main():
    """主檢查函數"""
    print("=" * 50)
    print("🚀 MJ999 自動駕駛環境檢查")
    print("=" * 50)
    
    check_python_version()
    check_project_directory()
    
    pyautogui_ok = check_pyautogui()
    images_ok = check_image_files()
    
    print("\n" + "=" * 50)
    print("📋 檢查結果總結:")
    print("=" * 50)
    
    if pyautogui_ok and images_ok:
        print("🎉 環境檢查通過！可以啟動自動駕駛系統")
        print("\n🚀 啟動指令:")
        print("   python auto_pilot.py")
    else:
        print("⚠️ 環境檢查未完全通過")
        if not pyautogui_ok:
            print("   - 請先安裝 pyautogui")
        if not images_ok:
            print("   - 請準備按鈕圖片檔案")
    
    print("\n🛑 停止自動駕駛:")
    print("   - 移動滑鼠到螢幕四個角落")
    print("   - 或按 Ctrl+C")

if __name__ == "__main__":
    main()
