// 提示词数据管理
class PromptDataManager {
    constructor() {
        this.prompts = [];
        this.categories = [];
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
            
            // 数据请求
            const fetchPromise = fetch('data/prompts.json');
            
            // 竞态Promise，哪个先完成就用哪个结果
            const response = await Promise.race([fetchPromise, timeoutPromise]);
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态码: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 处理两种可能的数据结构
            if (Array.isArray(data)) {
                // 如果数据是数组格式
                this.prompts = this.normalizePrompts(data);
            } else if (data.prompts && Array.isArray(data.prompts)) {
                // 如果数据有prompts属性
                this.prompts = this.normalizePrompts(data.prompts);
            } else {
                throw new Error('数据格式不正确');
            }
            
            // 提取所有分类
            this.categories = this.extractCategories(this.prompts);
            this.lastUpdated = new Date();
            
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