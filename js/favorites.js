// 收藏功能管理
class FavoritesManager {
    constructor() {
        this.favorites = [];
        this.loadFavorites();
        
        // 确保方法绑定到实例
        this.isFavorite = this.isFavorite.bind(this);
        this.isInFavorites = this.isInFavorites.bind(this);
        this.toggleFavorite = this.toggleFavorite.bind(this);
        this.addToFavorites = this.addToFavorites.bind(this);
        this.removeFromFavorites = this.removeFromFavorites.bind(this);
    }

    // 从localStorage加载收藏数据
    loadFavorites() {
        try {
            const savedFavorites = localStorage.getItem('favorites');
            if (savedFavorites) {
                this.favorites = JSON.parse(savedFavorites);
            } else {
                this.favorites = [];
            }
            return this.favorites;
        } catch (error) {
            console.error('加载收藏数据失败:', error);
            this.favorites = [];
            return [];
        }
    }

    // 保存收藏到localStorage
    saveFavorites() {
        try {
            localStorage.setItem('favorites', JSON.stringify(this.favorites));
            return true;
        } catch (error) {
            console.error('保存收藏数据失败:', error);
            return false;
        }
    }

    // 添加到收藏
    addToFavorites(prompt) {
        if (!prompt || !prompt.id) {
            console.error('无效的提示词数据');
            return false;
        }
        
        if (this.isInFavorites(prompt.id)) {
            return false; // 已经在收藏中
        }
        
        try {
            // 标准化提示词数据格式
            const favoritePrompt = {
                id: String(prompt.id),
                title: prompt.title || prompt.name || '未命名提示词',
                content: prompt.content || prompt.text || '',
                categories: Array.isArray(prompt.categories) ? prompt.categories : 
                           [prompt.category || '未分类']
            };
            
            this.favorites.push(favoritePrompt);
            this.saveFavorites();
            this.updateFavoritesUI();
            return true;
        } catch (error) {
            console.error('添加收藏失败:', error);
            return false;
        }
    }

    // 切换收藏状态
    toggleFavorite(prompt) {
        if (!prompt || !prompt.id) {
            console.error('无效的提示词数据');
            return false;
        }
        
        try {
            if (this.isInFavorites(prompt.id)) {
                // 如果已收藏则取消
                return this.removeFromFavorites(prompt.id);
            } else {
                // 如果未收藏则添加
                return this.addToFavorites(prompt);
            }
        } catch (error) {
            console.error('切换收藏状态失败:', error);
            return false;
        }
    }

    // 从收藏中移除
    removeFromFavorites(promptId) {
        if (!promptId) return false;
        
        try {
            const promptIdStr = String(promptId);
            const index = this.favorites.findIndex(item => String(item.id) === promptIdStr);
            if (index === -1) return false;
            
            this.favorites.splice(index, 1);
            this.saveFavorites();
            this.updateFavoritesUI();
            return true;
        } catch (error) {
            console.error('移除收藏失败:', error);
            return false;
        }
    }

    // 检查是否在收藏中
    isInFavorites(promptId) {
        if (!promptId) return false;
        try {
            return this.favorites.some(item => String(item.id) === String(promptId));
        } catch (error) {
            console.error('检查收藏状态失败:', error);
            return false;
        }
    }

    // 添加别名方法
    isFavorite(promptId) {
        return this.isInFavorites(promptId);
    }

    // 获取所有收藏
    getAllFavorites() {
        return [...this.favorites]; // 返回副本防止外部修改
    }

    // 清空所有收藏
    clearAllFavorites() {
        try {
            this.favorites = [];
            this.saveFavorites();
            this.updateFavoritesUI();
            return true;
        } catch (error) {
            console.error('清空收藏失败:', error);
            return false;
        }
    }

    // 更新收藏页面UI
    updateFavoritesUI() {
        try {
            const favoritesContainer = document.querySelector('#favorites .prompts-grid');
            if (!favoritesContainer) return;
    
            if (this.favorites.length === 0) {
                favoritesContainer.innerHTML = `
                    <div class="empty-favorites">
                        <i class="fas fa-star"></i>
                        <p>您还没有收藏任何提示词</p>
                        <a href="#categories" onclick="navigateToPage('categories'); return false;" class="btn">浏览提示词</a>
                    </div>
                `;
                return;
            }
    
            // 清空容器
            favoritesContainer.innerHTML = '';
            
            // 为每个收藏创建卡片
            this.favorites.forEach(prompt => {
                const card = this.createFavoriteCard(prompt);
                favoritesContainer.appendChild(card);
            });
        } catch (error) {
            console.error('更新收藏UI失败:', error);
            // 显示友好的错误提示
            if (typeof showError === 'function') {
                showError('更新收藏失败，请刷新页面重试');
            }
        }
    }
    
    // 创建收藏卡片
    createFavoriteCard(prompt) {
        try {
            const card = document.createElement('div');
            card.className = 'prompt-card';
            card.dataset.id = prompt.id;
            
            // 创建分类标签HTML
            let categoriesHTML = '';
            
            if (Array.isArray(prompt.categories) && prompt.categories.length > 0) {
                categoriesHTML = prompt.categories.map(category => 
                    `<span class="category-tag" data-category="${category}">${category}</span>`
                ).join('');
            } else if (prompt.category) {
                categoriesHTML = `<span class="category-tag" data-category="${prompt.category}">${prompt.category}</span>`;
            } else {
                categoriesHTML = `<span class="category-tag" data-category="未分类">未分类</span>`;
            }
            
            card.innerHTML = `
                <h3 class="prompt-title">${prompt.title || '未命名提示词'}</h3>
                <div class="prompt-categories">${categoriesHTML}</div>
                <p class="prompt-text">${prompt.content || prompt.text || ''}</p>
                <div class="card-actions">
                    <button class="copy-btn" title="复制提示词">
                        <i class="fas fa-copy"></i> 复制
                    </button>
                    <button class="favorite-btn remove-btn active" title="取消收藏">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            `;
            
            // 添加事件监听器
            const copyBtn = card.querySelector('.copy-btn');
            if (copyBtn) {
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 防止事件冒泡
                    this.copyFavoritePrompt(prompt.id);
                });
            }
            
            const favoriteBtn = card.querySelector('.favorite-btn');
            if (favoriteBtn) {
                favoriteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 防止事件冒泡
                    this.removeFromFavorites(prompt.id);
                });
            }
            
            // 分类标签点击事件
            card.querySelectorAll('.category-tag').forEach(tag => {
                tag.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const category = tag.dataset.category;
                    
                    // 使用全局函数进行导航
                    if (typeof navigateToPage === 'function') {
                        // 导航到分类页面
                        navigateToPage('categories');
                        
                        // 延迟执行，等待页面切换完成
                        setTimeout(() => {
                            const categoryItem = document.querySelector(`#category-list [data-category="${category}"]`);
                            if (categoryItem) {
                                categoryItem.click();
                            }
                        }, 100);
                    }
                });
            });
            
            return card;
        } catch (error) {
            console.error('创建收藏卡片失败:', error);
            // 返回一个基本卡片，防止整个UI崩溃
            const fallbackCard = document.createElement('div');
            fallbackCard.className = 'prompt-card';
            fallbackCard.innerHTML = '<p class="error">加载收藏卡片失败</p>';
            return fallbackCard;
        }
    }
    
    // 复制收藏的提示词
    copyFavoritePrompt(promptId) {
        try {
            const prompt = this.favorites.find(item => String(item.id) === String(promptId));
            if (!prompt) return;
            
            const text = prompt.content || prompt.text || '';
            
            // 使用现代API复制文本
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text)
                    .then(() => {
                        if (typeof showMessage === 'function') {
                            showMessage('提示词已复制到剪贴板');
                        } else {
                            alert('提示词已复制到剪贴板');
                        }
                    })
                    .catch(err => {
                        console.error('复制失败:', err);
                        this.fallbackCopy(text);
                    });
            } else {
                this.fallbackCopy(text);
            }
        } catch (error) {
            console.error('复制提示词失败:', error);
        }
    }
    
    // 备用复制方法
    fallbackCopy(text) {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            const successful = document.execCommand('copy');
            if (successful) {
                if (typeof showMessage === 'function') {
                    showMessage('提示词已复制到剪贴板');
                } else {
                    alert('提示词已复制到剪贴板');
                }
            } else {
                if (typeof showError === 'function') {
                    showError('复制失败，请手动复制');
                } else {
                    alert('复制失败，请手动复制');
                }
            }
        } catch (err) {
            console.error('备用复制失败:', err);
            if (typeof showError === 'function') {
                showError('复制失败，请手动复制');
            } else {
                alert('复制失败，请手动复制');
            }
        } finally {
            if (document.body.contains(textarea)) {
                document.body.removeChild(textarea);
            }
        }
    }
}

// 确保FavoritesManager类在全局作用域可用
if (typeof window !== 'undefined') {
    // 检查是否已经初始化
    if (!window.favoritesManager) {
        console.log('初始化收藏管理器...');
        try {
            // 创建并保存实例
            const manager = new FavoritesManager();
            
            // 定义全局对象
            window.favoritesManager = manager;
            
            // 检查实例是否有效
            if (window.favoritesManager && typeof window.favoritesManager.isFavorite === 'function') {
                console.log('收藏管理器初始化成功');
            } else {
                console.error('收藏管理器初始化后属性检查失败');
            }
            
            // 添加全局辅助函数
            window.isFavorite = function(promptId) {
                return window.favoritesManager.isFavorite(promptId);
            };
            
            window.toggleFavorite = function(prompt) {
                return window.favoritesManager.toggleFavorite(prompt);
            };
            
            window.updateFavoriteIcon = function(button, isFavorite) {
                const icon = button.querySelector('i');
                if (isFavorite) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    button.title = '取消收藏';
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    button.title = '收藏';
                }
            };
        } catch (error) {
            console.error('初始化收藏管理器失败:', error);
        }
    } else {
        console.log('收藏管理器已存在，跳过初始化');
    }
} 