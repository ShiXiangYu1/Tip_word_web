const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * 使用无头浏览器爬取提示词内容
 */
async function scrapeWithHeadlessBrowser() {
    console.log('开始使用无头浏览器爬取提示词数据...');
    
    // 创建数据目录
    if (!fs.existsSync('data')) {
        fs.mkdirSync('data');
    }
    
    // 启动浏览器
    console.log('启动浏览器...');
    const browser = await puppeteer.launch({
        headless: "new",  // 使用新版无头模式
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
        defaultViewport: { width: 1366, height: 768 }
    });
    
    try {
        // 创建新页面
        const page = await browser.newPage();
        
        // 设置用户代理
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // 开启请求拦截，记录网络请求（可选，用于调试）
        await page.setRequestInterception(true);
        
        let apiRequests = [];
        page.on('request', request => {
            const url = request.url();
            if (url.includes('json') || url.includes('api')) {
                apiRequests.push({
                    url: url,
                    method: request.method(),
                    headers: request.headers()
                });
                console.log(`检测到API请求: ${url}`);
            }
            request.continue();
        });
        
        // 监听页面的控制台输出（调试用）
        page.on('console', msg => console.log('浏览器控制台:', msg.text()));
        
        // 访问目标网站
        console.log('正在访问页面: https://anaitsc.xiaofeipandian.cn/categories.html');
        await page.goto('https://anaitsc.xiaofeipandian.cn/categories.html', {
            waitUntil: 'networkidle2',  // 等待网络活动停止
            timeout: 60000  // 延长超时时间到60秒
        });
        
        // 等待页面加载完成
        console.log('等待页面加载完成...');
        
        // 使用 page.waitFor 而不是 page.waitForTimeout (兼容旧版本)
        await page.waitFor(5000);
        
        // 提取当前页面上显示的所有提示词
        console.log('直接提取页面上的提示词数据...');
        
        // 保存当前页面HTML
        const html = await page.content();
        fs.writeFileSync('debug_page_full.html', html);
        console.log('已保存完整页面HTML用于调试');
        
        // 提取所有分类和提示词数据
        const extractedData = await page.evaluate(() => {
            // 1. 先尝试检查是否有全局变量包含数据
            if (window.promptsData || window.categoriesData || window.prompts || window.categories) {
                return {
                    type: 'global',
                    prompts: window.promptsData || window.prompts || [],
                    categories: window.categoriesData || window.categories || []
                };
            }
            
            // 2. 提取分类列表
            const categoryElements = document.querySelectorAll('#category-list .category-item, .category-list .category-item, .category-item');
            const categories = Array.from(categoryElements).map(item => {
                const nameEl = item.querySelector('.category-name') || item;
                const countEl = item.querySelector('.category-count');
                return {
                    name: nameEl.innerText.trim(),
                    id: item.getAttribute('data-id') || item.getAttribute('data-category'),
                    count: countEl ? parseInt(countEl.innerText.trim()) : 0
                };
            }).filter(category => category.name && category.name.toLowerCase() !== 'all' && category.name !== '全部');
            
            // 3. 提取当前显示的提示词
            const promptElements = document.querySelectorAll('.prompt-card, .prompt-item, .prompt');
            const prompts = Array.from(promptElements).map(card => {
                // 提取ID
                const id = card.getAttribute('data-id') || `prompt-${Math.random().toString(36).substring(2, 10)}`;
                
                // 提取标题
                const titleEl = card.querySelector('.prompt-title, h3, .title');
                const title = titleEl ? titleEl.innerText.trim() : '未命名提示词';
                
                // 提取内容（尝试多种可能的选择器）
                const contentEl = card.querySelector('.prompt-text, .prompt-content, .content, p:not(.category-tag)');
                const content = contentEl ? contentEl.innerText.trim() : '';
                
                // 提取标签
                const tagElements = card.querySelectorAll('.category-tag, .tag');
                const tags = Array.from(tagElements).map(tag => tag.innerText.trim());
                
                return {
                    id,
                    title,
                    content,
                    categories: tags.length > 0 ? tags : []
                };
            });
            
            // 4. 如果没找到提示词，尝试查找所有可能包含内容的元素
            if (prompts.length === 0) {
                // 查找可能包含内容的元素
                const contentElements = Array.from(document.querySelectorAll('div')).filter(el => {
                    // 筛选可能是内容卡片的元素
                    return (
                        el.children.length >= 2 && // 至少有两个子元素
                        el.innerText.length > 50 && // 有足够的文本内容
                        (el.className.includes('card') || el.className.includes('item') || el.className.includes('prompt')) // 类名暗示是卡片
                    );
                });
                
                const contentCards = contentElements.map(el => {
                    // 提取可能的标题和内容
                    const titleEl = el.querySelector('h2, h3, h4, .title, .heading');
                    const contentEl = el.querySelector('p, .content, .description');
                    
                    return {
                        id: el.id || `content-${Math.random().toString(36).substring(2, 10)}`,
                        title: titleEl ? titleEl.innerText.trim() : '未命名内容',
                        content: contentEl ? contentEl.innerText.trim() : el.innerText.trim(),
                        categories: []
                    };
                });
                
                return {
                    type: 'extracted',
                    categories,
                    prompts: contentCards
                };
            }
            
            return {
                type: 'extracted',
                categories,
                prompts
            };
        });
        
        console.log(`数据提取类型: ${extractedData.type}`);
        console.log(`提取到 ${extractedData.categories.length} 个分类`);
        console.log(`提取到 ${extractedData.prompts.length} 个提示词`);
        
        // 保存分类数据
        if (extractedData.categories.length > 0) {
            fs.writeFileSync(
                path.join('data', 'categories.json'),
                JSON.stringify({ categories: extractedData.categories }, null, 2)
            );
            console.log(`已保存 ${extractedData.categories.length} 个分类到 data/categories.json`);
        }
        
        // 保存提示词数据
        if (extractedData.prompts.length > 0) {
            fs.writeFileSync(
                path.join('data', 'prompts.json'),
                JSON.stringify({ prompts: extractedData.prompts }, null, 2)
            );
            console.log(`已保存 ${extractedData.prompts.length} 个提示词到 data/prompts.json`);
        }
        
        // 如果需要更多数据，尝试主动点击每个分类获取
        if (extractedData.prompts.length < 10 && extractedData.categories.length > 0) {
            console.log('提示词数量较少，尝试主动点击分类获取更多数据...');
            
            const allPrompts = [...extractedData.prompts];
            
            // 对每个分类进行处理
            for (const category of extractedData.categories) {
                console.log(`点击分类: ${category.name}`);
                
                try {
                    // 点击分类
                    await page.click(`#category-list .category-item[data-id="${category.id}"], .category-list .category-item[data-id="${category.id}"], .category-item[data-id="${category.id}"]`);
                    
                    // 等待页面更新
                    await page.waitFor(2000);
                    
                    // 提取该分类下的提示词
                    const categoryPrompts = await page.evaluate((categoryName) => {
                        const promptElements = document.querySelectorAll('.prompt-card, .prompt-item, .prompt');
                        return Array.from(promptElements).map(card => {
                            // 提取ID
                            const id = card.getAttribute('data-id') || `prompt-${Math.random().toString(36).substring(2, 10)}`;
                            
                            // 提取标题
                            const titleEl = card.querySelector('.prompt-title, h3, .title');
                            const title = titleEl ? titleEl.innerText.trim() : '未命名提示词';
                            
                            // 提取内容（尝试多种可能的选择器）
                            const contentEl = card.querySelector('.prompt-text, .prompt-content, .content, p:not(.category-tag)');
                            const content = contentEl ? contentEl.innerText.trim() : '';
                            
                            // 提取标签
                            const tagElements = card.querySelectorAll('.category-tag, .tag');
                            const tags = Array.from(tagElements).map(tag => tag.innerText.trim());
                            
                            // 如果没有标签，则使用当前分类
                            const categories = tags.length > 0 ? tags : [categoryName];
                            
                            return {
                                id,
                                title,
                                content,
                                categories
                            };
                        });
                    }, category.name);
                    
                    console.log(`从分类 ${category.name} 中提取到 ${categoryPrompts.length} 个提示词`);
                    allPrompts.push(...categoryPrompts);
                    
                } catch (err) {
                    console.error(`处理分类 ${category.name} 时出错:`, err.message);
                }
            }
            
            // 移除重复的提示词
            const uniquePrompts = removeDuplicates(allPrompts);
            console.log(`总共获取到 ${uniquePrompts.length} 个唯一提示词`);
            
            // 保存更新后的提示词数据
            fs.writeFileSync(
                path.join('data', 'prompts.json'),
                JSON.stringify({ prompts: uniquePrompts }, null, 2)
            );
            
            console.log('更新后的数据已保存到 data/prompts.json');
        }
        
        // 截图用于调试
        await page.screenshot({ path: 'screenshot.png', fullPage: true });
        console.log('已保存页面截图');
        
        // 尝试访问提示词详情页面获取完整内容
        if (extractedData.prompts.length > 0) {
            console.log('尝试访问单个提示词详情页获取完整内容...');
            
            // 访问主页，可能有不同的数据加载机制
            await page.goto('https://anaitsc.xiaofeipandian.cn/index.html', {
                waitUntil: 'networkidle2',
                timeout: 60000
            });
            
            await page.waitFor(5000);
            
            // 从主页提取数据
            const homeData = await page.evaluate(() => {
                // 尝试获取首页的全局数据
                if (window.promptsData || window.allPrompts || window.prompts) {
                    return {
                        type: 'homepage_global',
                        data: window.promptsData || window.allPrompts || window.prompts
                    };
                }
                
                // 尝试从DOM中提取
                const promptElements = document.querySelectorAll('.prompt-card, .prompt-item, .prompt');
                if (promptElements.length > 0) {
                    const promptsData = Array.from(promptElements).map(card => {
                        // 提取ID
                        const id = card.getAttribute('data-id') || `prompt-${Math.random().toString(36).substring(2, 10)}`;
                        
                        // 提取标题
                        const titleEl = card.querySelector('.prompt-title, h3, .title');
                        const title = titleEl ? titleEl.innerText.trim() : '未命名提示词';
                        
                        // 提取内容
                        const contentEl = card.querySelector('.prompt-text, .prompt-content, .content, p:not(.category-tag)');
                        const content = contentEl ? contentEl.innerText.trim() : '';
                        
                        // 提取标签
                        const tagElements = card.querySelectorAll('.category-tag, .tag');
                        const tags = Array.from(tagElements).map(tag => tag.innerText.trim());
                        
                        return {
                            id,
                            title,
                            content,
                            categories: tags
                        };
                    });
                    
                    return {
                        type: 'homepage_dom',
                        data: promptsData
                    };
                }
                
                return { type: 'homepage_none', data: [] };
            });
            
            if (homeData.data && homeData.data.length > 0) {
                console.log(`从主页获取到 ${homeData.data.length} 个提示词`);
                
                // 如果主页数据多于之前的数据，则更新
                if (homeData.data.length > extractedData.prompts.length) {
                    fs.writeFileSync(
                        path.join('data', 'prompts_homepage.json'),
                        JSON.stringify({ prompts: homeData.data }, null, 2)
                    );
                    console.log('主页数据已保存到 data/prompts_homepage.json');
                }
            }
            
            // 检查是否有详情页地址
            const promptDetails = await page.evaluate(() => {
                // 查找所有可能是提示词链接的元素
                const links = Array.from(document.querySelectorAll('a[href*="prompt"], a[href*="detail"]'));
                return links.map(link => ({
                    href: link.href,
                    text: link.innerText.trim()
                }));
            });
            
            if (promptDetails.length > 0) {
                console.log(`找到 ${promptDetails.length} 个可能的提示词详情链接`);
                
                // 保存链接信息
                fs.writeFileSync('prompt_links.json', JSON.stringify(promptDetails, null, 2));
                
                // 尝试访问第一个详情页
                try {
                    if (promptDetails[0].href) {
                        console.log(`尝试访问详情页: ${promptDetails[0].href}`);
                        await page.goto(promptDetails[0].href, { waitUntil: 'networkidle2', timeout: 30000 });
                        
                        await page.waitFor(3000);
                        
                        // 获取详情页HTML
                        const detailHtml = await page.content();
                        fs.writeFileSync('detail_page.html', detailHtml);
                        console.log('已保存详情页HTML');
                        
                        // 提取详情页数据
                        const detailData = await page.evaluate(() => {
                            // 提取标题
                            const titleEl = document.querySelector('h1, h2, .prompt-title, .title');
                            const title = titleEl ? titleEl.innerText.trim() : '未命名提示词';
                            
                            // 提取内容
                            const contentEl = document.querySelector('.prompt-content, .content, .description, .prompt-text');
                            const content = contentEl ? contentEl.innerText.trim() : '';
                            
                            // 提取分类
                            const categoryEls = document.querySelectorAll('.category-tag, .tag, .category');
                            const categories = Array.from(categoryEls).map(el => el.innerText.trim());
                            
                            return {
                                title,
                                content,
                                categories
                            };
                        });
                        
                        console.log('详情页数据提取完成');
                        fs.writeFileSync('detail_data.json', JSON.stringify(detailData, null, 2));
                    }
                } catch (err) {
                    console.error('访问详情页出错:', err.message);
                }
            }
        }
        
    } catch (error) {
        console.error('爬取过程中出错:', error);
    } finally {
        // 关闭浏览器
        await browser.close();
        console.log('浏览器已关闭');
    }
}

/**
 * 移除重复的提示词
 */
function removeDuplicates(prompts) {
    const seen = new Set();
    return prompts.filter(prompt => {
        // 使用标题和内容前100个字符作为唯一标识
        const key = `${prompt.title}|${prompt.content.substring(0, 100)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * 处理和保存提取到的数据
 */
function processAndSaveData(data) {
    // 根据数据结构处理
    if (Array.isArray(data)) {
        // 可能是提示词数组
        if (data.length > 0 && (data[0].title || data[0].content || data[0].prompt)) {
            const prompts = data.map(item => {
                return {
                    id: item.id || `prompt-${Math.random().toString(36).substring(2, 10)}`,
                    title: item.title || item.name || '未命名提示词',
                    content: item.content || item.text || item.prompt || '',
                    categories: item.categories || [item.category] || ['未分类']
                };
            });
            
            fs.writeFileSync(
                path.join('data', 'prompts.json'),
                JSON.stringify({ prompts }, null, 2)
            );
            console.log(`已保存 ${prompts.length} 个提示词`);
        }
        // 可能是分类数组
        else if (data.length > 0 && (data[0].name || data[0].categoryName)) {
            const categories = data.map(item => {
                return {
                    name: item.name || item.categoryName,
                    id: item.id || item.categoryId,
                    count: item.count || 0
                };
            });
            
            fs.writeFileSync(
                path.join('data', 'categories.json'),
                JSON.stringify({ categories }, null, 2)
            );
            console.log(`已保存 ${categories.length} 个分类`);
        }
    }
    // 可能是包含分类和提示词的对象
    else if (typeof data === 'object') {
        if (data.prompts) {
            fs.writeFileSync(
                path.join('data', 'prompts.json'),
                JSON.stringify({ prompts: data.prompts }, null, 2)
            );
            console.log(`已保存 ${data.prompts.length} 个提示词`);
        }
        if (data.categories) {
            fs.writeFileSync(
                path.join('data', 'categories.json'),
                JSON.stringify({ categories: data.categories }, null, 2)
            );
            console.log(`已保存 ${data.categories.length} 个分类`);
        }
    }
}

// 执行爬虫
scrapeWithHeadlessBrowser(); 