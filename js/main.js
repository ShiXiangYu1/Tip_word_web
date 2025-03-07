// DOM 元素
const searchInput = document.getElementById('prompt-search');
const heroSearchInput = document.getElementById('hero-search');
const searchBtn = document.getElementById('search-btn');
const heroSearchBtn = document.getElementById('hero-search-btn');
const categorySearchInput = document.getElementById('category-search-input');
const categoryList = document.getElementById('category-list');
const promptsGrids = document.querySelectorAll('.prompts-grid');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const themeToggleBtns = document.querySelectorAll('.theme-btn');
const popularCategoriesGrid = document.querySelector('.category-grid');
const totalPromptsElement = document.getElementById('total-prompts');
const totalCategoriesElement = document.getElementById('total-categories');
const totalFavoritesElement = document.getElementById('total-favorites');
const navItems = document.querySelectorAll('.nav-item');
const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
const pageContents = document.querySelectorAll('.page-content');

// 注意：promptDataManager 和 favoritesManager 已在各自的JS文件中定义，此处不再重复声明

// 当前状态
let currentCategory = null;
let currentTheme = 'light';
let currentPage = 'home';
let isLoadingData = false;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initializePage);

// 初始化页面
async function initializePage() {
    try {
        isLoadingData = true;
        showLoadingIndicator();
        
        // 加载提示词数据
        await promptDataManager.loadPrompts();
        
        // 确保收藏管理器已初始化
        if (!window.favoritesManager) {
            console.warn('收藏管理器未初始化，正在尝试初始化...');
            if (typeof FavoritesManager === 'function') {
                window.favoritesManager = new FavoritesManager();
                console.log('收藏管理器已手动初始化');
            } else {
                console.error('无法初始化收藏管理器，相关类不存在');
            }
        }
        
        // 渲染分类
        renderCategories();
        
        // 渲染热门分类
        renderPopularCategories();
        
        // 渲染最新提示词
        renderLatestPrompts();
        
        // 更新统计信息
        updateStats();
        
        // 渲染初始提示词
        renderPrompts();
        
        // 设置事件监听
        setupEventListeners();
        
        // 初始化主题
        initializeTheme();
        
        // 检查收藏管理器
        if (window.favoritesManager && typeof window.favoritesManager.updateFavoritesUI === 'function') {
            // 初始化收藏内容
            try {
                window.favoritesManager.updateFavoritesUI();
            } catch (error) {
                console.error('初始化收藏内容失败:', error);
            }
        } else {
            console.error('收藏管理器不可用，无法初始化收藏内容');
        }
        
        isLoadingData = false;
        hideLoadingIndicator();
    } catch (error) {
        console.error('初始化失败:', error);
        showError('数据加载失败，请刷新页面重试');
        isLoadingData = false;
        hideLoadingIndicator();
    }
}

// 显示加载指示器
function showLoadingIndicator() {
    promptsGrids.forEach(grid => {
        if (grid) {
            grid.innerHTML = '<div class="loading">加载中</div>';
        }
    });
}

// 隐藏加载指示器
function hideLoadingIndicator() {
    promptsGrids.forEach(grid => {
        if (grid && grid.querySelector('.loading')) {
            grid.querySelector('.loading').remove();
        }
    });
}

// 渲染分类列表
function renderCategories() {
    if (!categoryList) return;
    
    const categories = promptDataManager.categories;
    
    categoryList.innerHTML = `
        <li class="category-item ${!currentCategory ? 'active' : ''}" data-category="all">
            <span class="category-name">全部</span>
            <span class="category-count">${promptDataManager.prompts.length}</span>
        </li>
        ${categories.map(category => `
            <li class="category-item ${category === currentCategory ? 'active' : ''}" 
                data-category="${category}">
                <span class="category-name">${category}</span>
                <span class="category-count">${promptDataManager.getPromptsByCategory(category).length}</span>
            </li>
        `).join('')}
    `;
    
    // 添加点击事件
    categoryList.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            const category = item.dataset.category;
            
            // 移除所有活动状态
            categoryList.querySelectorAll('.category-item').forEach(el => 
                el.classList.remove('active'));
            
            // 设置当前项为活动状态
            item.classList.add('active');
            
            // 更新当前分类
            currentCategory = category === 'all' ? null : category;
            
            // 重新渲染提示词
            renderPrompts();
        });
    });
}

// 渲染热门分类
function renderPopularCategories() {
    if (!popularCategoriesGrid) return;
    
    const categories = promptDataManager.categories
        .map(category => ({
            name: category,
            count: promptDataManager.getPromptsByCategory(category).length
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
    
    // 图标集合，用于随机分配给分类
    const icons = [
        'fa-comments', 'fa-pencil', 'fa-code', 
        'fa-book', 'fa-image', 'fa-chart-simple',
        'fa-lightbulb', 'fa-brain', 'fa-rocket',
        'fa-palette', 'fa-robot', 'fa-wand-magic-sparkles'
    ];

    popularCategoriesGrid.innerHTML = categories.map((category, index) => {
        // 为每个分类选择一个图标
        const icon = icons[index % icons.length];
        
        return `
            <div class="category-card" data-category="${category.name}">
                <i class="fas ${icon}"></i>
                <h3>${category.name}</h3>
                <p>${category.count} 个提示词</p>
            </div>
        `;
    }).join('');

    // 添加点击事件
    popularCategoriesGrid.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            
            // 导航到分类页面
            navigateToPage('categories');
            
            // 延迟执行，等待页面切换完成
            setTimeout(() => {
                // 找到对应的分类项并触发点击
                const categoryItem = categoryList.querySelector(`[data-category="${category}"]`);
                if (categoryItem) {
                    categoryItem.click();
                }
            }, 100);
        });
    });
}

// 渲染最新提示词
function renderLatestPrompts() {
    const latestPromptsGrid = document.querySelector('.latest-prompts .prompts-grid');
    if (!latestPromptsGrid) return;
    
    const latestPrompts = [...promptDataManager.prompts]
        .sort((a, b) => b.id - a.id)
        .slice(0, 6);
    
    latestPromptsGrid.innerHTML = '';
    
    if (latestPrompts.length === 0) {
        latestPromptsGrid.innerHTML = '<div class="empty-state">暂无提示词</div>';
        return;
    }
    
    latestPrompts.forEach(prompt => {
        const card = createPromptCard(prompt);
        latestPromptsGrid.appendChild(card);
    });
}

// 创建提示词卡片
function createPromptCard(prompt) {
    // 记录正在创建哪个提示词的卡片
    console.log('创建提示词卡片:', prompt.id, prompt.prompt_name);
    
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.setAttribute('data-id', prompt.id);
    
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = prompt.title || prompt.name || prompt.category || '未命名提示词';
    card.appendChild(title);
    
    // 内容预览 - 优先显示中文内容
    const previewContent = prompt.content_zh || prompt.zh_content || prompt.content || '';
    const preview = document.createElement('div');
    preview.className = 'card-preview';
    preview.textContent = previewContent.length > 100 ? previewContent.substring(0, 100) + '...' : previewContent;
    
    // 如果有英文内容，添加标记
    if (prompt.content_en || prompt.en_content) {
        const bilingualBadge = document.createElement('span');
        bilingualBadge.className = 'bilingual-badge';
        bilingualBadge.innerHTML = '<i class="fas fa-language"></i>';
        bilingualBadge.title = '包含中英文内容';
        preview.appendChild(bilingualBadge);
    }
    
    card.appendChild(preview);
    
    // 分类标签
    if (prompt.category || (prompt.categories && prompt.categories.length > 0)) {
        const categories = Array.isArray(prompt.categories) ? prompt.categories : [prompt.category];
        
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'card-tags';
        
        categories.forEach(category => {
            if (category) {
                const tag = document.createElement('span');
                tag.className = 'category-tag';
                tag.textContent = category;
                tag.setAttribute('data-category', category);
                
                tag.addEventListener('click', (e) => {
                    e.stopPropagation();
                    navigateToPage('categories');
                    // 延迟一下以确保分类页面已加载
                    setTimeout(() => {
                        const categoryList = document.getElementById('category-list');
                        const categoryItems = categoryList.querySelectorAll('li');
                        categoryItems.forEach(item => {
                            if (item.textContent === category) {
                                item.click();
                            }
                        });
                    }, 100);
                });
                
                tagsContainer.appendChild(tag);
            }
        });
        
        card.appendChild(tagsContainer);
    }
    
    // 操作按钮
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    
    // 复制按钮组
    const copyBtnGroup = document.createElement('div');
    copyBtnGroup.className = 'copy-btn-group';
    
    // 中文复制按钮
    const copyZhBtn = document.createElement('button');
    copyZhBtn.className = 'action-btn copy-btn';
    copyZhBtn.innerHTML = '<i class="fas fa-copy"></i>';
    copyZhBtn.setAttribute('title', '复制中文内容');
    copyZhBtn.setAttribute('data-id', prompt.id);
    copyZhBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const content = prompt.content_zh || prompt.zh_content || prompt.content || '';
        if (content) {
            copyToClipboard(content);
            showToast('已复制中文内容');
        }
    });
    copyBtnGroup.appendChild(copyZhBtn);
    
    // 如果有英文内容，添加英文复制按钮
    if (prompt.content_en || prompt.en_content) {
        const copyEnBtn = document.createElement('button');
        copyEnBtn.className = 'action-btn copy-btn';
        copyEnBtn.innerHTML = '<i class="fas fa-copy"></i> EN';
        copyEnBtn.setAttribute('title', '复制英文内容');
        copyEnBtn.setAttribute('data-id', prompt.id);
        copyEnBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const content = prompt.content_en || prompt.en_content || '';
            if (content) {
                copyToClipboard(content);
                showToast('已复制英文内容');
            }
        });
        copyBtnGroup.appendChild(copyEnBtn);
    }
    
    actions.appendChild(copyBtnGroup);
    
    // 收藏按钮
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = 'action-btn favorite-btn';
    
    // 增加错误处理和兼容性检查
    let isFavorited = false;
    try {
        // 优先使用全局函数
        if (typeof window.isFavorite === 'function') {
            isFavorited = window.isFavorite(prompt.id);
        } 
        // 备选方案1：使用favoritesManager.isFavorite
        else if (window.favoritesManager && typeof window.favoritesManager.isFavorite === 'function') {
            isFavorited = window.favoritesManager.isFavorite(prompt.id);
        } 
        // 备选方案2：使用favoritesManager.isInFavorites
        else if (window.favoritesManager && typeof window.favoritesManager.isInFavorites === 'function') {
            isFavorited = window.favoritesManager.isInFavorites(prompt.id);
        }
        console.log(`提示词 ${prompt.id} 收藏状态:`, isFavorited);
    } catch (error) {
        console.error('检查收藏状态失败:', error);
    }
    
    favoriteBtn.innerHTML = `<i class="${isFavorited ? 'fas' : 'far'} fa-heart"></i>`;
    favoriteBtn.setAttribute('title', isFavorited ? '取消收藏' : '添加到收藏');
    favoriteBtn.setAttribute('data-id', prompt.id);
    
    favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        try {
            // 优先使用全局函数
            if (typeof window.toggleFavorite === 'function') {
                window.toggleFavorite(prompt);
                
                // 使用相同的判断逻辑更新图标
                let isNowFavorited = false;
                if (typeof window.isFavorite === 'function') {
                    isNowFavorited = window.isFavorite(prompt.id);
                } else if (window.favoritesManager && typeof window.favoritesManager.isFavorite === 'function') {
                    isNowFavorited = window.favoritesManager.isFavorite(prompt.id);
                } else if (window.favoritesManager && typeof window.favoritesManager.isInFavorites === 'function') {
                    isNowFavorited = window.favoritesManager.isInFavorites(prompt.id);
                }
                
                // 使用原生DOM API更新图标
                const icon = favoriteBtn.querySelector('i');
                if (isNowFavorited) {
                    icon.className = 'fas fa-heart';
                    favoriteBtn.setAttribute('title', '取消收藏');
                } else {
                    icon.className = 'far fa-heart';
                    favoriteBtn.setAttribute('title', '添加到收藏');
                }
                
                console.log(`提示词 ${prompt.id} 收藏状态已切换为:`, isNowFavorited);
                
                // 显示操作反馈
                if (typeof showMessage === 'function') {
                    showMessage(isNowFavorited ? '已添加到收藏' : '已从收藏中移除');
                }
            } else {
                console.error('toggleFavorite函数不存在');
                if (typeof showError === 'function') {
                    showError('收藏功能暂时不可用');
                }
            }
        } catch (error) {
            console.error('切换收藏状态失败:', error);
            if (typeof showError === 'function') {
                showError('收藏操作失败');
            }
        }
    });
    
    actions.appendChild(favoriteBtn);
    card.appendChild(actions);
    
    // 点击卡片显示详情
    card.addEventListener('click', () => {
        if (typeof window.showPromptModal === 'function') {
            window.showPromptModal(prompt);
        } else {
            console.error('showPromptModal函数未定义');
        }
    });
    
    return card;
}

// 更新统计信息
function updateStats() {
    if (totalPromptsElement) {
        totalPromptsElement.textContent = promptDataManager.prompts.length;
    }
    
    if (totalCategoriesElement) {
        totalCategoriesElement.textContent = promptDataManager.categories.length;
    }
    
    if (totalFavoritesElement) {
        totalFavoritesElement.textContent = favoritesManager.getAllFavorites().length;
    }
}

// 渲染提示词卡片
function renderPrompts(prompts = null) {
    // 获取当前页面的promptsGrid
    const grid = document.querySelector(`#${currentPage} .prompts-grid`);
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (isLoadingData) {
        grid.innerHTML = '<div class="loading">加载中</div>';
        return;
    }
    
    // 如果没有提供prompts参数，使用当前分类的提示词
    const promptsToRender = prompts || (currentCategory 
        ? promptDataManager.getPromptsByCategory(currentCategory) 
        : promptDataManager.prompts);
    
    if (promptsToRender.length === 0) {
        grid.innerHTML = '<div class="empty-state">没有找到相关提示词</div>';
        return;
    }
    
    // 使用文档片段提高性能
    const fragment = document.createDocumentFragment();
    promptsToRender.forEach(prompt => {
        const card = createPromptCard(prompt);
        fragment.appendChild(card);
    });
    
    grid.appendChild(fragment);
}

// 设置事件监听器
function setupEventListeners() {
    // 导航项点击事件
    navItems.forEach(item => {
        const link = item.querySelector('a');
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                navigateToPage(targetId);
            });
        }
    });
    
    // 移动端导航项点击事件
    mobileNavItems.forEach(item => {
        const link = item.querySelector('a');
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                navigateToPage(targetId);
                // 关闭移动菜单
                mobileMenu.classList.remove('active');
            });
        }
    });
    
    // 搜索功能
    [searchBtn, heroSearchBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                const input = btn.id === 'hero-search-btn' ? heroSearchInput : searchInput;
                const query = input?.value.trim();
                
                if (query) {
                    navigateToPage('categories');
                    
                    // 重置分类筛选
                    currentCategory = null;
                    categoryList.querySelectorAll('.category-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    categoryList.querySelector('[data-category="all"]')?.classList.add('active');
                    
                    // 搜索并渲染结果
                    const results = promptDataManager.searchPrompts(query);
                    renderPrompts(results);
                    
                    // 如果是首页搜索，将搜索词同步到分类页搜索框
                    if (btn.id === 'hero-search-btn' && searchInput) {
                        searchInput.value = query;
                    }
                }
            });
        }
    });

    // 搜索框回车事件
    [searchInput, heroSearchInput].forEach(input => {
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const btn = input.id === 'hero-search' ? heroSearchBtn : searchBtn;
                    btn?.click();
                }
            });
        }
    });

    // 分类搜索
    if (categorySearchInput) {
        categorySearchInput.addEventListener('input', handleCategorySearch);
    }

    // 移动端菜单
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });
        
        // 点击页面其他区域关闭菜单
        document.addEventListener('click', (e) => {
            if (mobileMenu.classList.contains('active') && 
                !e.target.closest('.mobile-menu') && 
                !e.target.closest('.mobile-menu-toggle')) {
                mobileMenu.classList.remove('active');
            }
        });
    }

    // 主题切换
    themeToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.classList.contains('light-theme-btn') ? 'light' : 'dark';
            setTheme(theme);
        });
    });
    
    // 窗口滚动时的效果
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });
}

// 处理分类搜索
function handleCategorySearch() {
    const query = categorySearchInput.value.toLowerCase().trim();
    const categoryItems = categoryList.querySelectorAll('.category-item');
    
    categoryItems.forEach(item => {
        const categoryName = item.querySelector('.category-name').textContent.toLowerCase();
        item.style.display = categoryName.includes(query) ? 'flex' : 'none';
    });
}

// 复制提示词
function copyPrompt(promptId) {
    const prompt = promptDataManager.getPromptById(promptId);
    if (!prompt) return;
    
    const text = prompt.content || prompt.text;
    copyToClipboard(text);
}

// 复制内容到剪贴板
function copyToClipboard(text) {
    if (!text) {
        showMessage('没有可复制的内容');
        return;
    }
    
    // 使用现代API复制文本
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                console.log('使用Clipboard API复制成功');
                showMessage('内容已复制到剪贴板');
            })
            .catch(err => {
                console.error('Clipboard API复制失败:', err);
                fallbackCopy(text);
            });
    } else {
        console.log('浏览器不支持Clipboard API，使用备用方法');
        fallbackCopy(text);
    }
}

// 备用复制方法
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showMessage('提示词已复制到剪贴板');
        } else {
            showError('复制失败，请手动复制');
        }
    } catch (err) {
        console.error('复制失败:', err);
        showError('复制失败，请手动复制');
    }
    
    document.body.removeChild(textarea);
}

// 切换收藏状态
function toggleFavorite(prompt) {
    try {
        // 确保有一个ID
        if (!prompt || (!prompt.id && prompt.id !== 0)) {
            console.error('无效的提示词数据，缺少ID');
            return false;
        }
        
        let result = false;
        
        // 尝试使用不同的途径切换收藏状态
        if (window.favoritesManager && typeof window.favoritesManager.toggleFavorite === 'function') {
            result = window.favoritesManager.toggleFavorite(prompt);
        } else if (typeof window.toggleFavorite === 'function' && window.toggleFavorite !== toggleFavorite) {
            result = window.toggleFavorite(prompt);
        } else {
            // 如果没有找到toggleFavorite函数，尝试自己实现简单版本
            if (!window.favoritesManager) {
                console.error('收藏管理器未初始化');
                return false;
            }
            
            // 检查是否已收藏
            const isInFavorites = typeof window.favoritesManager.isInFavorites === 'function' 
                ? window.favoritesManager.isInFavorites(prompt.id)
                : (typeof window.favoritesManager.isFavorite === 'function' 
                    ? window.favoritesManager.isFavorite(prompt.id) 
                    : false);
            
            if (isInFavorites) {
                // 移除收藏
                if (typeof window.favoritesManager.removeFromFavorites === 'function') {
                    result = window.favoritesManager.removeFromFavorites(prompt.id);
                }
            } else {
                // 添加收藏
                if (typeof window.favoritesManager.addToFavorites === 'function') {
                    result = window.favoritesManager.addToFavorites(prompt);
                }
            }
        }
        
        // 更新UI
        if (typeof window.favoritesManager.updateFavoritesUI === 'function') {
            window.favoritesManager.updateFavoritesUI();
        }
        
        return result;
    } catch (error) {
        console.error('切换收藏状态时出错:', error);
        return false;
    }
}

// 导航到指定页面
function navigateToPage(pageId) {
    // 更新导航项状态
    navItems.forEach(item => {
        const link = item.querySelector('a');
        const linkPageId = link?.getAttribute('href')?.substring(1);
        
        if (linkPageId === pageId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // 更新移动端导航项状态
    mobileNavItems.forEach(item => {
        const link = item.querySelector('a');
        const linkPageId = link?.getAttribute('href')?.substring(1);
        
        if (linkPageId === pageId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // 更新页面内容显示
    pageContents.forEach(content => {
        if (content.id === pageId) {
            content.classList.add('active');
            content.style.animation = 'fadeIn 0.5s ease-in-out forwards';
        } else {
            content.classList.remove('active');
        }
    });
    
    // 更新当前页面
    currentPage = pageId;
    
    // 特殊页面处理
    if (pageId === 'favorites') {
        favoritesManager.updateFavoritesUI();
    }
    
    // 平滑滚动到顶部
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 初始化主题
function initializeTheme() {
    // 从localStorage获取主题设置，默认为浅色
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

// 设置主题
function setTheme(theme) {
    const body = document.body;
    const lightBtn = document.querySelector('.light-theme-btn');
    const darkBtn = document.querySelector('.dark-theme-btn');
    
    if (theme === 'dark') {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        darkBtn?.classList.add('active');
        lightBtn?.classList.remove('active');
    } else {
        body.classList.add('light-theme');
        body.classList.remove('dark-theme');
        lightBtn?.classList.add('active');
        darkBtn?.classList.remove('active');
    }
    
    // 保存主题设置
    localStorage.setItem('theme', theme);
    currentTheme = theme;
}

// 显示消息提示
function showMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.textContent = message;
    document.body.appendChild(messageElement);
    
    // 3秒后移除消息
    setTimeout(() => {
        messageElement.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, 300);
    }, 3000);
}

// 显示错误消息
function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'message error';
    errorElement.textContent = message;
    document.body.appendChild(errorElement);
    
    // 3秒后移除消息
    setTimeout(() => {
        errorElement.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(errorElement);
        }, 300);
    }, 3000);
} 