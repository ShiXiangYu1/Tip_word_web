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
        
        // 初始化收藏内容
        favoritesManager.updateFavoritesUI();
        
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
    console.log('创建提示词卡片:', prompt.id, prompt.title || prompt.name || prompt.category);
    
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.setAttribute('data-id', prompt.id);
    
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = prompt.title || prompt.name || prompt.category || '未命名提示词';
    card.appendChild(title);
    
    // 内容预览
    const previewContent = prompt.content_zh || prompt.zh_content || prompt.content_en || prompt.en_content || prompt.content || prompt.text || '';
    const preview = document.createElement('div');
    preview.className = 'card-preview';
    preview.textContent = previewContent.length > 100 ? previewContent.substring(0, 100) + '...' : previewContent;
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
                    e.stopPropagation(); // 阻止事件冒泡到卡片
                    window.location.href = `categories.html?category=${encodeURIComponent(category)}`;
                });
                
                tagsContainer.appendChild(tag);
            }
        });
        
        card.appendChild(tagsContainer);
    }
    
    // 操作按钮
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    
    // 复制按钮
    const copyBtn = document.createElement('button');
    copyBtn.className = 'action-btn copy-btn';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
    copyBtn.setAttribute('title', '复制提示词');
    copyBtn.setAttribute('data-id', prompt.id);
    
    // 复制按钮点击事件
    copyBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡到卡片
        
        // 获取要复制的内容
        let contentToCopy = '';
        if (prompt.content_zh || prompt.zh_content) {
            contentToCopy = prompt.content_zh || prompt.zh_content;
        } else if (prompt.content_en || prompt.en_content) {
            contentToCopy = prompt.content_en || prompt.en_content;
        } else {
            contentToCopy = prompt.content || prompt.text || '';
        }
        
        // 复制到剪贴板
        if (contentToCopy) {
            try {
                navigator.clipboard.writeText(contentToCopy).then(() => {
                    showToast('已复制到剪贴板');
                }).catch(err => {
                    console.error('复制失败:', err);
                    showToast('复制失败');
                });
            } catch (error) {
                console.error('复制出错:', error);
                // 降级复制方法
                const textarea = document.createElement('textarea');
                textarea.value = contentToCopy;
                document.body.appendChild(textarea);
                textarea.select();
                
                try {
                    const successful = document.execCommand('copy');
                    if (successful) {
                        showToast('已复制到剪贴板');
                    } else {
                        showToast('复制失败');
                    }
                } catch (err) {
                    console.error('降级复制失败:', err);
                    showToast('复制失败');
                }
                
                document.body.removeChild(textarea);
            }
        } else {
            showToast('没有可复制的内容');
        }
    });
    
    actions.appendChild(copyBtn);
    
    // 收藏按钮
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = 'action-btn toggle-favorite';
    favoriteBtn.setAttribute('data-id', prompt.id);
    
    // 设置初始收藏状态
    if (typeof window.isFavorite === 'function' && window.isFavorite(prompt.id)) {
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
        favoriteBtn.setAttribute('title', '取消收藏');
    } else {
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
        favoriteBtn.setAttribute('title', '添加到收藏');
    }
    
    // 收藏按钮点击事件
    favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡到卡片
        if (typeof window.toggleFavorite === 'function') {
            window.toggleFavorite(prompt);
            
            // 更新收藏图标
            if (typeof window.isFavorite === 'function') {
                const isFav = window.isFavorite(prompt.id);
                window.updateFavoriteIcon(favoriteBtn, isFav);
            }
        }
    });
    
    actions.appendChild(favoriteBtn);
    card.appendChild(actions);
    
    // 为整个卡片添加点击事件，显示详情模态框
    card.addEventListener('click', (event) => {
        console.log('卡片被点击 ===========> ', event.currentTarget.getAttribute('data-id'));
        console.log('点击的DOM元素:', event.target);
        console.log('点击坐标:', event.clientX, event.clientY);
        
        try {
            console.log('卡片被点击:', prompt.id);
            
            // 获取完整提示词数据
            let fullPrompt = prompt;
            if (window.promptDataManager && typeof window.promptDataManager.getPromptById === 'function') {
                const detailedPrompt = window.promptDataManager.getPromptById(prompt.id);
                if (detailedPrompt) {
                    fullPrompt = detailedPrompt;
                }
            }
            
            // 内容预处理，确保各种数据格式都能正确显示
            const contentZh = fullPrompt.content_zh || fullPrompt.zh_content || 
                (fullPrompt.content && fullPrompt.is_zh ? fullPrompt.content : null);
            const contentEn = fullPrompt.content_en || fullPrompt.en_content || 
                (fullPrompt.content && !fullPrompt.is_zh ? fullPrompt.content : null) || fullPrompt.text;
            
            // 如果只有中文内容，自动生成英文版本
            let autoTranslatedEn = null;
            if (contentZh && !contentEn) {
                // 简单翻译中文内容为英文（模拟翻译）
                autoTranslatedEn = `[Auto-translated from Chinese]\n\n${contentZh}`;
                console.log('已自动生成英文版本:', autoTranslatedEn.substring(0, 50) + '...');
            }
            
            console.log('解析内容:', {
                hasZhContent: !!contentZh,
                hasEnContent: !!contentEn,
                hasAutoTranslatedEn: !!autoTranslatedEn,
                contentLength: {
                    zh: contentZh ? contentZh.length : 0,
                    en: contentEn ? contentEn.length : 0,
                    autoEn: autoTranslatedEn ? autoTranslatedEn.length : 0
                }
            });
            
            // 格式化内容函数（内联）
            function formatContent(content) {
                if (!content) return '';
                // 将换行符转换为<br>
                let formatted = content.replace(/\n/g, '<br>');
                // 保留连续空格
                formatted = formatted.replace(/ {2,}/g, function(match) {
                    return '&nbsp;'.repeat(match.length);
                });
                return formatted;
            }
            
            // 构建显示内容
            let htmlContent = '';
            
            // 优先使用分类名作为标题（如果没有title或name）
            const title = fullPrompt.title || fullPrompt.name || fullPrompt.category || '未命名提示词';
            
            // 添加分类信息
            const category = fullPrompt.category || 
                (Array.isArray(fullPrompt.categories) && fullPrompt.categories.length > 0 ? fullPrompt.categories[0] : '未分类');
            
            // 构建模态框DOM结构（与prompt-details.js中测试模态框一致）
            const modal = document.createElement('div');
            modal.id = 'temp-prompt-modal';
            modal.className = 'modal';
            modal.style.display = 'block';
            modal.style.position = 'fixed';
            modal.style.zIndex = '1000';
            modal.style.left = '0';
            modal.style.top = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.overflow = 'auto';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            modal.style.backdropFilter = 'blur(3px)';
            
            // 创建模态框内容
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            modalContent.style.position = 'relative';
            modalContent.style.backgroundColor = '#fff';
            modalContent.style.margin = '50px auto';
            modalContent.style.padding = '0';
            modalContent.style.width = '550px';
            modalContent.style.maxWidth = '90%';
            modalContent.style.borderRadius = '8px';
            modalContent.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
            modalContent.style.animation = 'modalFadeIn 0.3s';
            modalContent.style.border = '1px solid #eee';
            
            // 创建标题区域
            const modalHeader = document.createElement('div');
            modalHeader.className = 'modal-header';
            modalHeader.style.display = 'flex';
            modalHeader.style.flexDirection = 'column';
            modalHeader.style.alignItems = 'start';
            modalHeader.style.padding = '15px 20px';
            modalHeader.style.borderBottom = '1px solid #eee';
            
            // 标题和关闭按钮
            const headerTop = document.createElement('div');
            headerTop.style.display = 'flex';
            headerTop.style.justifyContent = 'space-between';
            headerTop.style.width = '100%';
            headerTop.style.marginBottom = '5px';
            
            const modalTitle = document.createElement('h2');
            modalTitle.textContent = title;
            modalTitle.style.margin = '0';
            modalTitle.style.fontSize = '20px';
            modalTitle.style.fontWeight = '600';
            
            const closeBtn = document.createElement('span');
            closeBtn.innerHTML = '&times;';
            closeBtn.className = 'modal-close';
            closeBtn.style.color = '#aaa';
            closeBtn.style.fontSize = '28px';
            closeBtn.style.fontWeight = 'bold';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.lineHeight = '1';
            
            headerTop.appendChild(modalTitle);
            headerTop.appendChild(closeBtn);
            
            // 分类信息
            const modalCategory = document.createElement('div');
            modalCategory.textContent = `分类：${category}`;
            modalCategory.style.color = '#666';
            modalCategory.style.fontSize = '14px';
            
            modalHeader.appendChild(headerTop);
            modalHeader.appendChild(modalCategory);
            
            // 正文区域
            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            modalBody.style.padding = '20px';
            
            // 内容容器，允许滚动
            const contentContainer = document.createElement('div');
            contentContainer.style.maxHeight = '350px';
            contentContainer.style.overflowY = 'auto';
            contentContainer.style.paddingRight = '5px';
            
            // 中文内容
            if (contentZh) {
                const zhSection = document.createElement('div');
                zhSection.className = 'content-section';
                zhSection.style.marginBottom = '20px';
                zhSection.style.padding = '15px';
                zhSection.style.backgroundColor = '#f9f9f9';
                zhSection.style.borderRadius = '8px';
                zhSection.style.border = '1px solid #eee';
                
                const zhHeader = document.createElement('h4');
                zhHeader.textContent = '中文版本';
                zhHeader.style.marginTop = '0';
                zhHeader.style.marginBottom = '10px';
                zhHeader.style.color = '#3498db';
                zhHeader.style.fontSize = '16px';
                zhHeader.style.fontWeight = '500';
                
                const zhContent = document.createElement('div');
                zhContent.className = 'content-text';
                zhContent.innerHTML = formatContent(contentZh);
                zhContent.style.whiteSpace = 'pre-wrap';
                zhContent.style.lineHeight = '1.6';
                zhContent.style.color = '#333';
                
                zhSection.appendChild(zhHeader);
                zhSection.appendChild(zhContent);
                contentContainer.appendChild(zhSection);
            }
            
            // 英文内容
            if (contentEn || autoTranslatedEn) {
                const enSection = document.createElement('div');
                enSection.className = 'content-section';
                enSection.style.marginBottom = '20px';
                enSection.style.padding = '15px';
                enSection.style.backgroundColor = '#f9f9f9';
                enSection.style.borderRadius = '8px';
                enSection.style.border = '1px solid #eee';
                
                const enHeader = document.createElement('h4');
                enHeader.textContent = 'English';
                enHeader.style.marginTop = '0';
                enHeader.style.marginBottom = '10px';
                enHeader.style.color = '#3498db';
                enHeader.style.fontSize = '16px';
                enHeader.style.fontWeight = '500';
                
                // 如果是自动翻译内容，添加提示
                if (!contentEn && autoTranslatedEn) {
                    const autoTranslateNote = document.createElement('div');
                    autoTranslateNote.className = 'auto-translate-note';
                    autoTranslateNote.textContent = '(自动翻译)';
                    autoTranslateNote.style.fontStyle = 'italic';
                    autoTranslateNote.style.color = '#666';
                    autoTranslateNote.style.fontSize = '12px';
                    autoTranslateNote.style.marginBottom = '5px';
                    enSection.appendChild(enHeader);
                    enSection.appendChild(autoTranslateNote);
                } else {
                    enSection.appendChild(enHeader);
                }
                
                const enContent = document.createElement('div');
                enContent.className = 'content-text';
                
                // 使用自动翻译或原始英文内容
                const displayEnContent = contentEn || autoTranslatedEn;
                enContent.innerHTML = formatContent(displayEnContent);
                
                enContent.style.whiteSpace = 'pre-wrap';
                enContent.style.lineHeight = '1.6';
                enContent.style.color = '#333';
                
                enSection.appendChild(enContent);
                contentContainer.appendChild(enSection);
                console.log('已添加英文内容区域:', displayEnContent ? displayEnContent.substring(0, 50) + '...' : '无内容');
            }
            
            // 如果没有内容，显示通用内容（可能是纯文本）
            if (!contentZh && !contentEn && !autoTranslatedEn && (fullPrompt.content || fullPrompt.text)) {
                const generalSection = document.createElement('div');
                generalSection.className = 'content-section';
                generalSection.style.marginBottom = '20px';
                generalSection.style.padding = '15px';
                generalSection.style.backgroundColor = '#f9f9f9';
                generalSection.style.borderRadius = '8px';
                generalSection.style.border = '1px solid #eee';
                
                const generalContent = document.createElement('div');
                generalContent.className = 'content-text';
                generalContent.innerHTML = formatContent(fullPrompt.content || fullPrompt.text);
                generalContent.style.whiteSpace = 'pre-wrap';
                generalContent.style.lineHeight = '1.6';
                generalContent.style.color = '#333';
                
                generalSection.appendChild(generalContent);
                contentContainer.appendChild(generalSection);
            }
            
            // 如果没有任何内容，显示提示
            if (!contentZh && !contentEn && !autoTranslatedEn && !fullPrompt.content && !fullPrompt.text) {
                const emptyContent = document.createElement('div');
                emptyContent.className = 'empty-content';
                emptyContent.textContent = '此提示词暂无内容';
                emptyContent.style.color = '#999';
                emptyContent.style.fontStyle = 'italic';
                emptyContent.style.textAlign = 'center';
                emptyContent.style.padding = '20px';
                contentContainer.appendChild(emptyContent);
            }
            
            modalBody.appendChild(contentContainer);
            
            // 底部操作区域
            const modalFooter = document.createElement('div');
            modalFooter.className = 'modal-footer';
            modalFooter.style.padding = '15px 20px';
            modalFooter.style.borderTop = '1px solid #eee';
            modalFooter.style.display = 'flex';
            modalFooter.style.justifyContent = 'space-between';
            modalFooter.style.alignItems = 'center';
            
            // 收藏按钮
            const isFavorited = typeof window.isFavorite === 'function' && window.isFavorite(fullPrompt.id);
            
            const favoriteBtn = document.createElement('button');
            favoriteBtn.className = 'btn favorite-btn';
            favoriteBtn.innerHTML = isFavorited ? 
                '<i class="fas fa-heart"></i> 已收藏' : 
                '<i class="far fa-heart"></i> 收藏';
            favoriteBtn.style.backgroundColor = '#3498db';
            favoriteBtn.style.color = 'white';
            favoriteBtn.style.border = 'none';
            favoriteBtn.style.padding = '8px 15px';
            favoriteBtn.style.borderRadius = '4px';
            favoriteBtn.style.cursor = 'pointer';
            favoriteBtn.style.fontSize = '14px';
            
            // 复制按钮区域
            const copyBtnGroup = document.createElement('div');
            copyBtnGroup.className = 'copy-btn-group';
            copyBtnGroup.style.display = 'flex';
            copyBtnGroup.style.gap = '10px';
            
            // 生成相应的复制按钮
            if (contentZh) {
                const copyZhBtn = document.createElement('button');
                copyZhBtn.className = 'btn copy-btn';
                copyZhBtn.innerHTML = '<i class="fas fa-copy"></i> 复制中文';
                copyZhBtn.style.backgroundColor = '#3498db';
                copyZhBtn.style.color = 'white';
                copyZhBtn.style.border = 'none';
                copyZhBtn.style.padding = '8px 15px';
                copyZhBtn.style.borderRadius = '4px';
                copyZhBtn.style.cursor = 'pointer';
                copyZhBtn.style.fontSize = '14px';
                
                copyZhBtn.addEventListener('click', () => {
                    // 复制到剪贴板
                    if (contentZh) {
                        try {
                            navigator.clipboard.writeText(contentZh).then(() => {
                                showToast('已复制到剪贴板');
                            }).catch(err => {
                                console.error('复制失败:', err);
                                fallbackCopy(contentZh);
                            });
                        } catch (error) {
                            console.error('复制出错:', error);
                            fallbackCopy(contentZh);
                        }
                    }
                });
                
                copyBtnGroup.appendChild(copyZhBtn);
            }
            
            // 英文复制按钮
            if (contentEn || autoTranslatedEn) {
                const copyEnBtn = document.createElement('button');
                copyEnBtn.className = 'btn copy-btn';
                copyEnBtn.innerHTML = '<i class="fas fa-copy"></i> 复制英文';
                copyEnBtn.style.backgroundColor = '#3498db';
                copyEnBtn.style.color = 'white';
                copyEnBtn.style.border = 'none';
                copyEnBtn.style.padding = '8px 15px';
                copyEnBtn.style.borderRadius = '4px';
                copyEnBtn.style.margin = '0 5px';
                copyEnBtn.style.cursor = 'pointer';
                copyEnBtn.style.fontSize = '14px';
                
                const textToCopy = contentEn || autoTranslatedEn;
                copyEnBtn.addEventListener('click', () => {
                    // 复制到剪贴板
                    try {
                        navigator.clipboard.writeText(textToCopy).then(() => {
                            showToast('已复制到剪贴板');
                        }).catch(err => {
                            console.error('复制失败:', err);
                            fallbackCopy(textToCopy);
                        });
                    } catch (error) {
                        console.error('复制出错:', error);
                        fallbackCopy(textToCopy);
                    }
                });
                
                copyBtnGroup.appendChild(copyEnBtn);
            }
            
            if (!contentZh && !contentEn && (fullPrompt.content || fullPrompt.text)) {
                const generalBtn = document.createElement('button');
                generalBtn.className = 'btn copy-btn';
                generalBtn.innerHTML = '<i class="fas fa-copy"></i> 复制内容';
                generalBtn.style.backgroundColor = '#3498db';
                generalBtn.style.color = 'white';
                generalBtn.style.border = 'none';
                generalBtn.style.padding = '8px 15px';
                generalBtn.style.borderRadius = '4px';
                generalBtn.style.cursor = 'pointer';
                generalBtn.style.fontSize = '14px';
                
                generalBtn.addEventListener('click', () => {
                    const text = fullPrompt.content || fullPrompt.text;
                    if (text) {
                        try {
                            navigator.clipboard.writeText(text).then(() => {
                                showToast('已复制到剪贴板');
                            }).catch(err => {
                                console.error('复制失败:', err);
                                fallbackCopy(text);
                            });
                        } catch (error) {
                            console.error('复制出错:', error);
                            fallbackCopy(text);
                        }
                    }
                });
                
                copyBtnGroup.appendChild(generalBtn);
            }
            
            modalFooter.appendChild(favoriteBtn);
            modalFooter.appendChild(copyBtnGroup);
            
            // 组装模态框
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modalContent.appendChild(modalFooter);
            modal.appendChild(modalContent);
            
            // 添加到body
            document.body.appendChild(modal);
            
            // 显示Toast消息
            function showToast(message) {
                let toast = document.getElementById('toast');
                if (!toast) {
                    toast = document.createElement('div');
                    toast.id = 'toast';
                    document.body.appendChild(toast);
                }
                toast.textContent = message;
                toast.className = 'show';
                setTimeout(() => {
                    toast.className = toast.className.replace('show', '');
                }, 3000);
            }
            
            // 降级复制方法
            function fallbackCopy(text) {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                
                try {
                    const successful = document.execCommand('copy');
                    if (successful) {
                        showToast('已复制到剪贴板');
                    } else {
                        showToast('复制失败，请手动复制');
                    }
                } catch (err) {
                    console.error('降级复制失败:', err);
                    showToast('复制失败，请手动复制');
                }
                
                document.body.removeChild(textarea);
            }
            
            // 收藏按钮点击事件
            favoriteBtn.addEventListener('click', () => {
                if (typeof window.toggleFavorite === 'function') {
                    window.toggleFavorite(fullPrompt);
                    
                    const isNowFavorite = typeof window.isFavorite === 'function' && window.isFavorite(fullPrompt.id);
                    favoriteBtn.innerHTML = isNowFavorite ? 
                        '<i class="fas fa-heart"></i> 已收藏' : 
                        '<i class="far fa-heart"></i> 收藏';
                    
                    // 更新卡片上的收藏图标
                    const cardFavoriteBtn = document.querySelector(`.toggle-favorite[data-id="${fullPrompt.id}"]`);
                    if (cardFavoriteBtn && typeof window.updateFavoriteIcon === 'function') {
                        window.updateFavoriteIcon(cardFavoriteBtn, isNowFavorite);
                    }
                }
            });
            
            // 关闭按钮点击事件
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            // 点击模态框外部关闭
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    document.body.removeChild(modal);
                }
            });
            
            // 防止滚动穿透
            document.body.style.overflow = 'hidden';
            
            // 清除模态框时恢复滚动
            function removeModalAndRestoreScroll() {
                document.body.style.overflow = '';
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }
            
            // ESC键关闭模态框
            function handleEscKey(event) {
                if (event.key === 'Escape') {
                    removeModalAndRestoreScroll();
                    document.removeEventListener('keydown', handleEscKey);
                }
            }
            
            document.addEventListener('keydown', handleEscKey);
            
        } catch (error) {
            console.error('显示提示词详情时出错:', error);
            alert('显示提示词详情时出错: ' + error.message);
        }
    });
    
    // 在返回卡片前添加一些明显的标记，确保卡片正确创建
    card.style.position = 'relative';
    card.style.cursor = 'pointer';
    
    // 添加一个小提示，表明卡片可点击
    const clickTip = document.createElement('div');
    clickTip.style.position = 'absolute';
    clickTip.style.bottom = '5px';
    clickTip.style.right = '5px';
    clickTip.style.fontSize = '12px';
    clickTip.style.color = 'var(--primary-color)';
    clickTip.style.pointerEvents = 'none';
    clickTip.innerHTML = '<i class="fas fa-search"></i>';
    clickTip.title = '点击查看详情';
    card.appendChild(clickTip);
    
    console.log('卡片创建完成，已绑定点击事件');
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
    
    // 使用现代API复制文本
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => showMessage('提示词已复制到剪贴板'))
            .catch(err => {
                console.error('复制失败:', err);
                fallbackCopy(text);
            });
    } else {
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
function toggleFavorite(promptId) {
    const prompt = promptDataManager.getPromptById(promptId);
    if (!prompt) return;

    try {
        // 使用全局函数切换收藏状态
        const result = window.toggleFavorite(prompt);
        
        if (result) {
            const isCurrentlyFavorited = window.isFavorite(promptId);
            
            // 显示操作结果提示
            if (isCurrentlyFavorited) {
                showMessage('已添加到收藏');
            } else {
                showMessage('已从收藏中移除');
            }
            
            // 更新UI
            document.querySelectorAll(`.prompt-card[data-id="${promptId}"] .favorite-btn`).forEach(btn => {
                if (isCurrentlyFavorited) {
                    btn.classList.add('active');
                    btn.innerHTML = '<i class="fas fa-star"></i> 已收藏';
                    btn.title = '取消收藏';
                } else {
                    btn.classList.remove('active');
                    btn.innerHTML = '<i class="far fa-star"></i> 收藏';
                    btn.title = '添加到收藏';
                }
            });
            
            // 如果在收藏页面，需要重新渲染
            if (currentPage === 'favorites') {
                window.favoritesManager.updateFavoritesUI();
            }
            
            // 更新统计信息
            updateStats();
        } else {
            showError('收藏操作失败');
        }
    } catch (error) {
        console.error('收藏操作失败:', error);
        showError('操作失败，请重试');
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