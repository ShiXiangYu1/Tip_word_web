/**
 * 测试脚本，用于检查双语文件的结构
 */

// 直接加载并显示双语文件结构
async function testBilingualFile() {
    try {
        console.log('开始测试 rules_bilingual.json 文件...');
        
        // 添加时间戳防止缓存
        const timestamp = new Date().getTime();
        const url = `data/rules_bilingual.json?t=${timestamp}`;
        console.log('请求URL:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 输出基本信息
        console.log('数据类型:', typeof data);
        console.log('是否为数组:', Array.isArray(data));
        console.log('数据长度:', Array.isArray(data) ? data.length : '非数组');
        
        // 如果是数组，检查前5个元素的结构
        if (Array.isArray(data) && data.length > 0) {
            console.log('===== 前5个元素的结构 =====');
            for (let i = 0; i < Math.min(5, data.length); i++) {
                const item = data[i];
                console.log(`--- 第 ${i+1} 个元素 ---`);
                console.log('有id属性:', !!item.id);
                console.log('有content属性:', !!item.content);
                console.log('有content_zh属性:', !!item.content_zh);
                
                // 显示content和content_zh的前20个字符
                if (item.content) {
                    console.log('content前20个字符:', item.content.substring(0, 20));
                }
                if (item.content_zh) {
                    console.log('content_zh前20个字符:', item.content_zh.substring(0, 20));
                }
            }
        }
        
        // 如果有实际提示词数据，尝试检查ID匹配
        if (window.promptDataManager && window.promptDataManager.prompts) {
            const prompts = window.promptDataManager.prompts;
            if (prompts.length > 0) {
                console.log('===== 测试实际提示词ID匹配 =====');
                for (let i = 0; i < Math.min(5, prompts.length); i++) {
                    const prompt = prompts[i];
                    console.log(`--- 提示词 ID ${prompt.id} ---`);
                    console.log('提示词中文内容前20个字符:', prompt.content.substring(0, 20));
                    
                    // 检查第一种匹配方法：通过ID直接匹配
                    const matchById = Array.isArray(data) ? 
                        data[parseInt(prompt.id) - 1] : null;
                    console.log('通过ID直接匹配:', !!matchById);
                    
                    // 检查第二种匹配方法：通过中文内容匹配
                    const matchByContent = Array.isArray(data) ?
                        data.find(item => item.content_zh && 
                              item.content_zh.substring(0, 20) === prompt.content.substring(0, 20)) : null;
                    console.log('通过中文内容匹配:', !!matchByContent);
                }
            }
        }
        
        // 显示结果消息
        const resultDiv = document.createElement('div');
        resultDiv.style.position = 'fixed';
        resultDiv.style.top = '10px';
        resultDiv.style.right = '10px';
        resultDiv.style.background = '#4CAF50';
        resultDiv.style.color = 'white';
        resultDiv.style.padding = '10px';
        resultDiv.style.borderRadius = '5px';
        resultDiv.style.zIndex = '9999';
        resultDiv.textContent = '测试完成，请查看控制台输出';
        document.body.appendChild(resultDiv);
        
        setTimeout(() => {
            document.body.removeChild(resultDiv);
        }, 5000);
        
    } catch (error) {
        console.error('测试过程中发生错误:', error);
        
        // 显示错误消息
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '10px';
        errorDiv.style.right = '10px';
        errorDiv.style.background = '#F44336';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '10px';
        errorDiv.style.borderRadius = '5px';
        errorDiv.style.zIndex = '9999';
        errorDiv.textContent = `测试错误: ${error.message}`;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 5000);
    }
}

// 在页面加载完成后执行测试
window.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，等待3秒后执行测试...');
    setTimeout(testBilingualFile, 3000);
}); 