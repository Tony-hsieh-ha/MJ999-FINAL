#!/usr/bin/env node

/**
 * MJ999 存檔自動同步系統 - Node.js 版本
 * 功能: 監控 script.js 修改時間，自動 Git 同步
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

class SimpleSync {
    constructor() {
        this.projectPath = __dirname;
        this.scriptFile = path.join(this.projectPath, 'script.js');
        this.lastModified = 0;
        
        // 獲取初始修改時間
        if (fs.existsSync(this.scriptFile)) {
            this.lastModified = fs.statSync(this.scriptFile).mtimeMs;
        }
        
        console.log('🚀 MJ999 存檔自動同步系統啟動 (Node.js 版本)');
        console.log(`📁 監控檔案: ${this.scriptFile}`);
        console.log(`🕐 初始修改時間: ${new Date(this.lastModified).toLocaleString()}`);
        console.log('=' .repeat(50));
    }
    
    logStatus(message) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`);
    }
    
    checkFileModified() {
        if (!fs.existsSync(this.scriptFile)) {
            return false;
        }
        
        const currentModified = fs.statSync(this.scriptFile).mtimeMs;
        
        if (currentModified > this.lastModified) {
            this.lastModified = currentModified;
            return true;
        }
        
        return false;
    }
    
    async gitOperations() {
        try {
            this.logStatus('🔄 開始 Git 同步');
            
            // Git add
            this.logStatus('📦 執行 git add .');
            await execPromise('git add .', { cwd: this.projectPath });
            
            // Git commit
            this.logStatus('📝 執行 git commit -m "Auto sync"');
            try {
                await execPromise('git commit -m "Auto sync"', { cwd: this.projectPath });
            } catch (error) {
                if (error.stdout && error.stdout.includes('nothing to commit')) {
                    this.logStatus('ℹ️ 沒有變更需要提交');
                    return true;
                }
                throw error;
            }
            
            // Git push
            this.logStatus('🚀 執行 git push origin main');
            await execPromise('git push origin main', { cwd: this.projectPath });
            
            this.logStatus('✅ Git 同步完成');
            return true;
            
        } catch (error) {
            this.logStatus(`❌ Git 操作失敗: ${error.message}`);
            return false;
        }
    }
    
    async mainLoop() {
        this.logStatus('👀 開始監控 script.js 修改...');
        
        while (true) {
            try {
                if (this.checkFileModified()) {
                    this.logStatus('📝 偵測到 script.js 修改');
                    
                    // 等待 1 秒確保存檔完成
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // 執行 Git 同步
                    await this.gitOperations();
                    
                    // 等待 3 秒避免重複觸發
                    await new Promise(resolve => setTimeout(resolve, 3000));
                } else {
                    // 沒有修改，等待 2 秒後繼續檢查
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
            } catch (error) {
                this.logStatus(`❌ 主循環錯誤: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
    
    async start() {
        try {
            await this.mainLoop();
        } catch (error) {
            this.logStatus(`❌ 系統錯誤: ${error.message}`);
        } finally {
            this.logStatus('🏁 存檔自動同步系統結束');
        }
    }
}

// 處理 Ctrl+C 中斷
process.on('SIGINT', () => {
    console.log('\n🛑 收到中斷信號，正在停止同步系統...');
    process.exit(0);
});

// 啟動同步系統
const sync = new SimpleSync();
sync.start().catch(error => {
    console.error('❌ 啟動失敗:', error);
    process.exit(1);
});
