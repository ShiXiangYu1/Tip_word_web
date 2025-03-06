const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapePrompts() {
    console.log('启动浏览器...');
    const browser = await puppeteer.launch({
        headless: false, // 设置为非无头模式，方便调试
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
        defaultViewport: { width: 1366, height: 768 }, // 使用更常见的视口尺寸
        protocolTimeout: 180000 // 增加协议超时为3分钟
    });

    try {
        // 创建数据目录
        if (!fs.existsSync('data')) {
            fs.mkdirSync('data');
        }

        // 打开一个新页面
        const page = await browser.newPage();
        
        // 设置更长的导航超时
        page.setDefaultNavigationTimeout(120000);  // 2分钟
        page.setDefaultTimeout(60000);  // 1分钟
        
        // 忽略HTTPS错误
        await page.setBypassCSP(true);
        
        // 模拟真实用户行为
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        
        // 访问目标网站API直接获取全部数据
        console.log('尝试直接从API获取数据...');
        
        try {
            // 先尝试直接获取rules_bilingual.json
            await page.goto('https://anaitsc.xiaofeipandian.cn/data/rules_bilingual.json', {
                waitUntil: 'networkidle0',
                timeout: 60000
            });
            
            // 获取页面内容
            const bilingualContent = await page.content();
            const bilingualMatch = bilingualContent.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
            
            if (bilingualMatch && bilingualMatch[1]) {
                let bilingualData;
                try {
                    bilingualData = JSON.parse(bilingualMatch[1].trim());
                    console.log(`成功解析双语数据：${bilingualData.length} 条记录`);
                    
                    // 保存双语数据
                    fs.writeFileSync(
                        'data/rules_bilingual.json',
                        JSON.stringify(bilingualData, null, 2),
                        'utf-8'
                    );
                    
                    // 从双语数据中提取提示词和分类
                    const prompts = [];
                    const categoriesSet = new Set();
                    
                    // 处理数据
                    bilingualData.forEach((item, index) => {
                        // 添加到提示词列表
                        prompts.push({
                            id: item.id || String(index + 1),
                            title: item.title || "未命名提示词",
                            content: item.content_zh || item.content || "",
                            categories: [item.category]
                        });
                        
                        // 添加分类
                        if (item.category) {
                            categoriesSet.add(item.category);
                        }
                    });
                    
                    // 格式化分类
                    const categories = Array.from(categoriesSet).map(name => ({
                        name: name,
                        id: name.toLowerCase().replace(/[^a-z0-9]/g, '_')
                    }));
                    
                    // 保存提示词数据
                    fs.writeFileSync(
                        'data/prompts.json',
                        JSON.stringify({ prompts }, null, 2),
                        'utf-8'
                    );
                    
                    // 保存分类数据
                    fs.writeFileSync(
                        'data/categories.json',
                        JSON.stringify({ categories }, null, 2),
                        'utf-8'
                    );
                    
                    console.log('数据已成功保存到data目录：');
                    console.log('- data/rules_bilingual.json');
                    console.log('- data/prompts.json');
                    console.log('- data/categories.json');
                    console.log(`共处理了 ${prompts.length} 个提示词和 ${categories.length} 个分类`);
                    
                    // 直接API获取成功，无需继续爬取
                    return;
                    
                } catch (error) {
                    console.error('解析双语数据失败:', error.message);
                }
            }
        } catch (apiError) {
            console.error('通过API获取数据失败，切换到爬取模式:', apiError.message);
        }
        
        // 如果API方式失败，回退到爬取模式
        console.log('开始使用备选方案：尝试抓取已有提示词的详细内容...');

        // 先尝试从网站查看是否有网络API
        await page.goto('https://anaitsc.xiaofeipandian.cn', {
            waitUntil: 'networkidle0',
            timeout: 60000
        });
        
        console.log('正在检查网站API请求...');
        
        // 创建拦截器以查找API调用
        await page.setRequestInterception(true);
        
        // 添加一个数组来保存API URL
        const apiUrls = [];
        
        // 监听请求
        page.on('request', request => {
            const url = request.url();
            // 寻找可能是数据API的请求
            if (url.includes('/data/') || url.includes('.json') || url.includes('/api/')) {
                apiUrls.push(url);
                console.log('发现可能的API URL:', url);
            }
            request.continue();
        });
        
        // 随机浏览网站以触发可能的API调用
        await page.goto('https://anaitsc.xiaofeipandian.cn/index.html', {
            waitUntil: 'networkidle0',
            timeout: 60000
        });
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        await page.goto('https://anaitsc.xiaofeipandian.cn/categories.html', {
            waitUntil: 'networkidle0',
            timeout: 60000
        });
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 停止请求拦截
        await page.setRequestInterception(false);
        
        // 分析找到的API URL
        console.log('找到的潜在API URL:', apiUrls);
        
        // 尝试从API URL获取数据
        let dataObtained = false;
        
        for (const apiUrl of apiUrls) {
            if (dataObtained) break;
            
            try {
                console.log(`尝试从 ${apiUrl} 获取数据...`);
                
                await page.goto(apiUrl, {
                    waitUntil: 'networkidle0',
                    timeout: 60000
                });
                
                // 获取页面内容
                const content = await page.content();
                const match = content.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
                
                if (match && match[1]) {
                    try {
                        // 尝试解析JSON
                        const jsonData = JSON.parse(match[1].trim());
                        
                        if (Array.isArray(jsonData) && jsonData.length > 0 && 
                            (jsonData[0].title || jsonData[0].content || jsonData[0].category)) {
                            
                            console.log(`在 ${apiUrl} 中找到有效数据：${jsonData.length} 条记录`);
                            
                            // 保存原始数据
                            const outputPath = `data/${path.basename(apiUrl)}`;
                            fs.writeFileSync(
                                outputPath,
                                JSON.stringify(jsonData, null, 2),
                                'utf-8'
                            );
                            
                            // 如果这是rules_bilingual.json，同时生成prompts.json和categories.json
                            if (apiUrl.includes('rules_bilingual')) {
                                // 从数据中提取提示词和分类
                                const prompts = [];
                                const categoriesSet = new Set();
                                
                                // 处理数据
                                jsonData.forEach((item, index) => {
                                    // 添加到提示词列表
                                    prompts.push({
                                        id: item.id || String(index + 1),
                                        title: item.title || "未命名提示词",
                                        content: item.content_zh || item.content || "",
                                        categories: [item.category]
                                    });
                                    
                                    // 添加分类
                                    if (item.category) {
                                        categoriesSet.add(item.category);
                                    }
                                });
                                
                                // 格式化分类
                                const categories = Array.from(categoriesSet).map(name => ({
                                    name: name,
                                    id: name.toLowerCase().replace(/[^a-z0-9]/g, '_')
                                }));
                                
                                // 保存提示词数据
                                fs.writeFileSync(
                                    'data/prompts.json',
                                    JSON.stringify({ prompts }, null, 2),
                                    'utf-8'
                                );
                                
                                // 保存分类数据
                                fs.writeFileSync(
                                    'data/categories.json',
                                    JSON.stringify({ categories }, null, 2),
                                    'utf-8'
                                );
                                
                                console.log('从rules_bilingual.json成功生成prompts.json和categories.json');
                                dataObtained = true;
                                break;
                            }
                            
                        } else {
                            console.log(`在 ${apiUrl} 中找到JSON数据，但格式不符合要求`);
                        }
                    } catch (parseError) {
                        console.error(`解析 ${apiUrl} 中的JSON数据失败:`, parseError.message);
                    }
                } else {
                    console.log(`在 ${apiUrl} 中没有找到预期的JSON数据`);
                }
            } catch (error) {
                console.error(`访问 ${apiUrl} 失败:`, error.message);
            }
        }
        
        if (dataObtained) {
            console.log('已成功从API获取并处理数据');
        } else {
            console.log('从API获取数据失败，将尝试最后的备用方案...');
            
            // 如果之前所有尝试都失败，使用示例生成器创建数据
            const generateSamplePath = 'generate_sample_data.py';
            
            if (fs.existsSync(generateSamplePath)) {
                console.log('发现示例数据生成脚本，将使用它来生成数据...');
                
                // 使用子进程执行Python脚本
                const { execSync } = require('child_process');
                try {
                    execSync('python generate_sample_data.py', { stdio: 'inherit' });
                    console.log('成功使用备用方案生成示例数据');
                } catch (execError) {
                    console.error('执行示例数据生成脚本失败:', execError.message);
                }
            } else {
                console.error('无法找到任何可用的数据来源');
            }
        }

    } catch (error) {
        console.error('抓取失败:', error);
        console.error('错误堆栈:', error.stack);
    } finally {
        await browser.close();
        console.log('浏览器已关闭');
    }
}

// 检查是否已安装所需依赖
try {
    require('puppeteer');
    console.log('开始抓取提示词数据...');
    scrapePrompts();
} catch (error) {
    console.error('请先安装puppeteer依赖:');
    console.error('npm install puppeteer');
} 