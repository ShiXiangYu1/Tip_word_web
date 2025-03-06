// 提示词数据管理
class PromptDataManager {
    constructor() {
        this.prompts = [];
        this.categories = [];
        this.bilingualPrompts = {}; // 添加双语数据存储
        this.bilingualZhPrompts = {}; // 新增：中文内容的映射
        this.isLoading = false;
        this.lastUpdated = null;
        this.loadError = null;
    }

    // 加载提示词数据
    async loadPrompts() {
        if (this.isLoading) {
            // 如果已经在加载中，返回一个Promise等待当前加载完成
            return new Promise((resolve) => {
                const checkLoading = setInterval(() => {
                    if (!this.isLoading) {
                        clearInterval(checkLoading);
                        resolve(true);
                    }
                }, 100);
            });
        }
        
        this.isLoading = true;
        this.loadError = null;
        
        try {
            // 设置超时
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('加载超时')), 10000);
            });
            
            // 添加时间戳参数防止缓存
            const timestamp = new Date().getTime();
            const url = `data/prompts.json?t=${timestamp}`;
            console.log('正在请求最新数据:', url);
            
            // 数据请求
            const fetchPromise = fetch(url);
            
            // 竞态Promise，哪个先完成就用哪个结果
            const response = await Promise.race([fetchPromise, timeoutPromise]);
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态码: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('prompts.json数据加载成功, 数据类型:', typeof data);
            
            // 处理两种可能的数据结构
            if (Array.isArray(data)) {
                // 如果数据是数组格式
                this.prompts = this.normalizePrompts(data);
                console.log(`规范化后的prompts数据数量: ${this.prompts.length}`);
            } else if (data.prompts && Array.isArray(data.prompts)) {
                // 如果数据有prompts属性
                this.prompts = this.normalizePrompts(data.prompts);
                console.log(`规范化后的prompts数据数量: ${this.prompts.length}`);
            } else {
                throw new Error('数据格式不正确');
            }
            
            // 提取所有分类
            this.categories = this.extractCategories(this.prompts);
            this.lastUpdated = new Date();
            
            // 加载双语数据 - 确保在prompts加载后再加载
            console.log('prompts数据加载完成，开始加载双语数据...');
            const bilingualResult = await this.loadBilingualData();
            console.log('双语数据加载结果:', bilingualResult ? '成功' : '失败');
            
            this.isLoading = false;
            return true;
        } catch (error) {
            console.error('加载提示词数据失败:', error);
            this.loadError = error.message || '未知错误';
            
            // 使用默认数据作为回退
            this.prompts = [
                {
                    id: "1",
                    title: "写作助手",
                    content: "我需要你充当一名专业写作助手，为我的写作项目提供帮助。我会提供主题和目标受众，请为我编写清晰、引人入胜且适合目标受众的内容。请确保内容符合专业标准，没有语法错误，并能够有效地传达信息。",
                    categories: ["写作", "创意"]
                },
                {
                    id: "2",
                    title: "编程导师",
                    content: "我希望你充当编程导师，帮助我学习和解决代码问题。我会提供我正在学习的编程语言和我遇到的问题，请你用清晰的解释和示例代码帮助我理解概念和解决问题。如果可能，请提供多种解决方案和最佳实践建议。",
                    categories: ["编程", "教育"]
                },
                {
                    id: "3",
                    title: "数据分析专家",
                    content: "请作为数据分析专家，帮助我分析和解释数据。我会提供数据集的描述或问题，请为我提供分析方法、可能的见解和建议。请使用清晰的语言解释复杂的统计概念，并提出可行的建议。",
                    categories: ["数据分析", "商业"]
                }
            ];
            this.categories = this.extractCategories(this.prompts);
            
            this.isLoading = false;
            return true; // 返回true因为我们有回退数据
        }
    }
    
    // 加载双语数据
    async loadBilingualData() {
        try {
            console.log('正在加载双语数据...');
            
            // 添加时间戳参数防止缓存
            const timestamp = new Date().getTime();
            const url = `data/rules_bilingual.json?t=${timestamp}`;
            console.log('正在请求最新双语数据:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态码: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('双语数据加载成功，数据类型:', typeof data, '是否为数组:', Array.isArray(data), '数据长度:', Array.isArray(data) ? data.length : 0);
            
            // 检查一下内容示例
            if (Array.isArray(data) && data.length > 0) {
                const first = data[0];
                console.log('第一项的字段:', Object.keys(first));
                console.log('content_en字段存在:', !!first.content_en);
                console.log('content_en_zh字段存在:', !!first.content_en_zh);
                console.log('content字段存在:', !!first.content);
                console.log('content_zh字段存在:', !!first.content_zh);
                
                // 优先使用的字段
                const preferredEnField = first.content_en ? 'content_en' : 'content';
                const preferredZhField = first.content_en_zh ? 'content_en_zh' : 'content_zh';
                console.log(`将优先使用 ${preferredEnField} 作为英文字段，${preferredZhField} 作为中文字段`);
            }
            
            // 清空现有数据
            this.bilingualPrompts = {};
            this.bilingualZhPrompts = {}; // 新增：中文内容的映射
            
            // 处理rules_bilingual.json中的数据
            if (Array.isArray(data)) {
                // 主要存储：基于索引的ID映射
                data.forEach((item, index) => {
                    const id = String(index + 1);
                    
                    // 存储英文内容 - 优先使用content_en字段
                    let englishContent = null;
                    if (item?.content_en) {
                        englishContent = item.content_en;
                        console.log(`使用content_en字段作为ID ${id} 的英文内容`);
                    } else if (item?.content) {
                        // 验证是否为英文
                        const sample = item.content.substring(0, 50);
                        const englishChars = sample.replace(/[^a-zA-Z]/g, '').length;
                        const ratio = englishChars / sample.length;
                        
                        if (ratio > 0.6) {
                            englishContent = item.content;
                            console.log(`使用content字段作为ID ${id} 的英文内容`);
                        }
                    }
                    
                    if (englishContent) {
                        this.bilingualPrompts[id] = englishContent;
                        console.log(`加载ID为${id}的英文内容成功，内容前20个字符:`, englishContent.substring(0, 20));
                    }
                    
                    // 存储中文内容 - 优先使用content_en_zh字段
                    let chineseContent = null;
                    if (item?.content_en_zh) {
                        chineseContent = item.content_en_zh;
                        console.log(`使用content_en_zh字段作为ID ${id} 的中文内容`);
                    } else if (item?.content_zh) {
                        chineseContent = item.content_zh;
                        console.log(`使用content_zh字段作为ID ${id} 的中文内容`);
                    }
                    
                    if (chineseContent) {
                        this.bilingualZhPrompts[id] = chineseContent;
                        console.log(`加载ID为${id}的中文内容成功，内容前20个字符:`, chineseContent.substring(0, 20));
                    }
                    
                    // 创建额外映射：通过中文内容前20个字符作为键
                    if (englishContent && chineseContent) {
                        const zhContentKey = 'zhcontent_' + chineseContent.substring(0, 20).replace(/\s+/g, '');
                        this.bilingualPrompts[zhContentKey] = englishContent;
                        console.log(`通过中文内容创建额外英文映射:`, zhContentKey);
                    }
                });
                
                // 如果有prompts数据，尝试直接匹配
                if (this.prompts && this.prompts.length > 0) {
                    console.log('尝试直接匹配现有的prompts数据...');
                    this.prompts.forEach(prompt => {
                        if (prompt && prompt.content) {
                            // 提示：在双语数据中匹配中文内容
                            const matchingItem = data.find(item => {
                                // 优先匹配content_en_zh，其次是content_zh
                                const zhContent = item?.content_en_zh || item?.content_zh;
                                return zhContent && zhContent.substring(0, 30) === prompt.content.substring(0, 30);
                            });
                            
                            if (matchingItem) {
                                const promptId = String(prompt.id);
                                // 存储英文内容
                                const englishContent = matchingItem.content_en || matchingItem.content;
                                if (englishContent) {
                                    this.bilingualPrompts[promptId] = englishContent;
                                    console.log(`通过内容匹配成功设置ID ${promptId} 的英文内容`);
                                }
                                
                                // 存储中文内容
                                const chineseContent = matchingItem.content_en_zh || matchingItem.content_zh;
                                if (chineseContent) {
                                    this.bilingualZhPrompts[promptId] = chineseContent;
                                    console.log(`通过内容匹配成功设置ID ${promptId} 的中文内容`);
                                }
                            }
                        }
                    });
                }
            } else {
                console.error('双语数据格式不正确，期望数组格式但得到:', typeof data);
            }
            
            console.log(`成功加载${Object.keys(this.bilingualPrompts).length}条英文内容，${Object.keys(this.bilingualZhPrompts).length}条中文内容`);
            
            return true;
        } catch (error) {
            console.error('加载双语数据失败:', error);
            return false;
        }
    }
    
    // 获取英文提示词内容
    getEnglishContent(promptId) {
        if (!promptId) {
            console.log('获取英文内容失败: 未提供promptId');
            return '';
        }
        
        try {
            console.log(`尝试获取ID为${promptId}的英文内容`);
            
            // 尝试直接通过ID获取
            let englishContent = this.bilingualPrompts[promptId];
            
            // 如果找不到，尝试通过prompt的中文内容查找
            if (!englishContent) {
                console.log(`未找到ID为${promptId}的英文内容，尝试其他匹配方法`);
                
                // 尝试找到对应的prompt
                const prompt = this.getPromptById(promptId);
                if (prompt && prompt.content) {
                    // 通过中文内容前20个字符作为键
                    const zhContentKey = 'zhcontent_' + prompt.content.substring(0, 20).replace(/\s+/g, '');
                    englishContent = this.bilingualPrompts[zhContentKey];
                    
                    if (englishContent) {
                        console.log(`通过中文内容前20个字符匹配成功:`, zhContentKey);
                    } else {
                        console.log(`通过中文内容前20个字符匹配失败:`, zhContentKey);
                    }
                }
            }
            
            if (englishContent) {
                console.log(`成功获取ID为${promptId}的英文内容，内容前20个字符:`, englishContent.substring(0, 20));
                return englishContent;
            } else {
                // 如果找不到对应的英文内容，返回空字符串
                console.log(`未找到ID为${promptId}的英文内容，已尝试所有匹配方法`);
                return '';
            }
        } catch (error) {
            console.error('获取英文内容失败:', error);
            return '';
        }
    }
    
    // 获取中文提示词内容（新增方法）
    getChineseContent(promptId) {
        if (!promptId) {
            console.log('获取中文内容失败: 未提供promptId');
            return '';
        }
        
        try {
            console.log(`尝试获取ID为${promptId}的中文内容`);
            
            // 尝试直接通过ID获取
            const chineseContent = this.bilingualZhPrompts[promptId];
            
            if (chineseContent) {
                console.log(`成功获取ID为${promptId}的中文内容，内容前20个字符:`, chineseContent.substring(0, 20));
                return chineseContent;
            } else {
                console.log(`未找到ID为${promptId}的中文内容`);
                return '';
            }
        } catch (error) {
            console.error('获取中文内容失败:', error);
            return '';
        }
    }

    // 标准化提示词数据
    normalizePrompts(data) {
        return data.map((item, index) => ({
            id: String(item.id || index + 1),
            title: item.title || item.name || '未命名提示词',
            content: item.content || item.text || item.prompt || '',
            categories: Array.isArray(item.categories) ? item.categories : [item.category || '未分类']
        }));
    }

    // 提取所有分类
    extractCategories(prompts) {
        try {
            const categorySet = new Set();
            
            prompts.forEach(prompt => {
                if (Array.isArray(prompt.categories)) {
                    prompt.categories.forEach(category => {
                        if (category && typeof category === 'string') {
                            categorySet.add(category);
                        }
                    });
                } else if (prompt.category) {
                    categorySet.add(prompt.category);
                }
            });
            
            // 按字母顺序排序分类
            return Array.from(categorySet).sort();
        } catch (error) {
            console.error('提取分类失败:', error);
            return [];
        }
    }

    // 按分类获取提示词
    getPromptsByCategory(category) {
        if (!category) return [...this.prompts];
        
        try {
            return this.prompts.filter(prompt => {
                if (Array.isArray(prompt.categories)) {
                    return prompt.categories.includes(category);
                } else {
                    return prompt.category === category;
                }
            });
        } catch (error) {
            console.error('按分类获取提示词失败:', error);
            return [];
        }
    }

    // 搜索提示词
    searchPrompts(query) {
        if (!query) return [...this.prompts];
        
        try {
            const searchTerm = query.toLowerCase().trim();
            
            return this.prompts.filter(prompt => {
                try {
                    const title = (prompt.title || '').toLowerCase();
                    const content = (prompt.content || prompt.text || '').toLowerCase();
                    const categories = Array.isArray(prompt.categories) 
                        ? prompt.categories.join(' ').toLowerCase() 
                        : (prompt.category || '').toLowerCase();
                    
                    return title.includes(searchTerm) || 
                           content.includes(searchTerm) || 
                           categories.includes(searchTerm);
                } catch {
                    // 如果单个项目处理失败，跳过该项
                    return false;
                }
            });
        } catch (error) {
            console.error('搜索提示词失败:', error);
            return [];
        }
    }

    // 获取热门分类（按提示词数量排序）
    getPopularCategories(limit = 6) {
        try {
            const categoryCounts = new Map();
            
            // 计算每个分类下的提示词数量
            this.categories.forEach(category => {
                const count = this.getPromptsByCategory(category).length;
                categoryCounts.set(category, count);
            });
            
            // 按数量降序排序
            return Array.from(categoryCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(entry => ({
                    name: entry[0],
                    count: entry[1]
                }));
        } catch (error) {
            console.error('获取热门分类失败:', error);
            return [];
        }
    }

    // 获取最新提示词
    getLatestPrompts(limit = 6) {
        try {
            return [...this.prompts]
                .sort((a, b) => {
                    const idA = parseInt(a.id) || 0;
                    const idB = parseInt(b.id) || 0;
                    return idB - idA;
                })
                .slice(0, limit);
        } catch (error) {
            console.error('获取最新提示词失败:', error);
            return [];
        }
    }

    // 根据ID获取提示词
    getPromptById(id) {
        if (!id) return null;
        
        try {
            return this.prompts.find(prompt => String(prompt.id) === String(id)) || null;
        } catch (error) {
            console.error('根据ID获取提示词失败:', error);
            return null;
        }
    }

    // 获取随机提示词
    getRandomPrompt() {
        if (this.prompts.length === 0) return null;
        
        try {
            const randomIndex = Math.floor(Math.random() * this.prompts.length);
            return this.prompts[randomIndex];
        } catch (error) {
            console.error('获取随机提示词失败:', error);
            return null;
        }
    }
    
    // 获取加载状态
    getLoadingStatus() {
        return {
            isLoading: this.isLoading,
            error: this.loadError,
            lastUpdated: this.lastUpdated,
            promptCount: this.prompts.length,
            categoryCount: this.categories.length
        };
    }
}

// 导出数据管理器实例
const promptDataManager = new PromptDataManager(); 

// 将实例挂载到window对象，使其在全局范围内可用
window.promptDataManager = promptDataManager; 