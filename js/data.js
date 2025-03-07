// 提示词数据管理
class PromptDataManager {
    constructor() {
        this.prompts = [];
        this.categories = [];
        this.bilingualPrompts = {};
        this.bilingualZhPrompts = {};
        this.isLoading = false;
        this.lastUpdated = null;
        this.loadError = null;
    }

    // 获取提示词的中文内容
    getChineseContent(promptId) {
        const prompt = this.prompts.find(p => p.id === promptId);
        if (!prompt) return null;
        return prompt.content_zh || prompt.zh_content || prompt.content || '';
    }

    // 获取提示词的英文内容
    getEnglishContent(promptId) {
        const prompt = this.prompts.find(p => p.id === promptId);
        if (!prompt) return null;
        return prompt.content_en || prompt.en_content || '';
    }

    // 获取完整的提示词数据
    getPromptById(promptId) {
        return this.prompts.find(p => p.id === promptId) || null;
    }

    // 加载提示词数据
    async loadPrompts() {
        if (this.isLoading) {
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
            const timestamp = new Date().getTime();
            const url = `data/prompts.json?t=${timestamp}`;
            console.log('正在请求最新数据:', url);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态码: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 处理数据
            if (data && Array.isArray(data.prompts)) {
                this.prompts = data.prompts.map(prompt => {
                    // 确保每个提示词都有正确的内容字段
                    return {
                        ...prompt,
                        content_zh: prompt.content_zh || prompt.zh_content || prompt.content || '',
                        content_en: prompt.content_en || prompt.en_content || '',
                        categories: Array.isArray(prompt.categories) ? prompt.categories : 
                                  (prompt.category ? [prompt.category] : [])
                    };
                });
                
                // 更新分类列表
                this.updateCategories();
                
                this.lastUpdated = new Date();
                console.log(`成功加载${this.prompts.length}个提示词`);
                return true;
            } else {
                throw new Error('数据格式错误');
            }
        } catch (error) {
            console.error('加载提示词数据失败:', error);
            this.loadError = error.message;
            return false;
        } finally {
            this.isLoading = false;
        }
    }

    // 更新分类列表
    updateCategories() {
        const categorySet = new Set();
        this.prompts.forEach(prompt => {
            if (Array.isArray(prompt.categories)) {
                prompt.categories.forEach(cat => cat && categorySet.add(cat));
            } else if (prompt.category) {
                categorySet.add(prompt.category);
            }
        });
        this.categories = Array.from(categorySet).sort();
    }

    // 按分类获取提示词
    getPromptsByCategory(category) {
        return this.prompts.filter(prompt => {
            if (Array.isArray(prompt.categories)) {
                return prompt.categories.includes(category);
            }
            return prompt.category === category;
        });
    }

    // 搜索提示词
    searchPrompts(query) {
        if (!query) return this.prompts;
        
        const searchTerm = query.toLowerCase();
        return this.prompts.filter(prompt => {
            const title = (prompt.title || prompt.name || '').toLowerCase();
            const content = (prompt.content_zh || prompt.content || '').toLowerCase();
            const contentEn = (prompt.content_en || '').toLowerCase();
            const category = (Array.isArray(prompt.categories) ? 
                            prompt.categories.join(' ') : 
                            prompt.category || '').toLowerCase();
            
            return title.includes(searchTerm) || 
                   content.includes(searchTerm) ||
                   contentEn.includes(searchTerm) ||
                   category.includes(searchTerm);
        });
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

// 创建全局实例
window.promptDataManager = new PromptDataManager(); 