// DOM元素
const categoriesContainer = document.getElementById('categories-container');
let allRules = []; // 存储所有提示词
let allCategories = []; // 存储所有分类

// 初始化分类页面
async function initCategoriesPage() {
  // 显示加载状态
  showLoading();
  
  try {
    // 加载数据
    const { rules, categories } = await loadData();
    
    // 保存数据到全局变量
    allRules = rules;
    allCategories = categories;
    
    // 如果没有分类数据，显示空状态
    if (categories.length === 0) {
      showEmptyState();
    } else {
      // 否则，创建分类页面布局
      createCategoryLayout(categories, rules);
      
      // 默认选中第一个分类
      if (categories.length > 0) {
        selectCategory(categories[0]);
      }
    }
  } catch (error) {
    console.error('初始化分类页面失败:', error);
    showError('加载分类数据失败，请刷新页面重试');
  }
}

// 显示加载状态
function showLoading() {
  categoriesContainer.innerHTML = `
    <div class="content-placeholder">
      <i class="fas fa-spinner fa-spin placeholder-icon"></i>
      <p>正在加载分类数据...</p>
    </div>
  `;
}

// 显示空状态
function showEmptyState() {
  categoriesContainer.innerHTML = `
    <div class="content-placeholder">
      <i class="fas fa-folder-open placeholder-icon"></i>
      <p>暂无分类数据</p>
    </div>
  `;
}

// 显示错误状态
function showError(message) {
  categoriesContainer.innerHTML = `
    <div class="content-placeholder">
      <i class="fas fa-exclamation-circle placeholder-icon"></i>
      <p>${message}</p>
      <button class="btn btn-primary" onclick="initCategoriesPage()">重试</button>
    </div>
  `;
}

// 创建分类页面布局
function createCategoryLayout(categories, rules) {
  // 清空容器
  categoriesContainer.innerHTML = '';
  
  // 创建分类页面布局
  const layout = document.createElement('div');
  layout.className = 'category-layout';
  
  // 创建左侧分类列表
  const categoryListContainer = document.createElement('div');
  categoryListContainer.className = 'category-sidebar';
  categoryListContainer.innerHTML = `
    <h2>所有分类</h2>
    <div class="category-search">
      <input type="text" placeholder="搜索分类..." id="category-search-input">
      <button><i class="fas fa-search"></i></button>
    </div>
    <div class="category-list-container">
      <ul id="category-list" class="category-list-sidebar"></ul>
    </div>
  `;
  
  // 创建右侧提示词列表
  const promptsContainer = document.createElement('div');
  promptsContainer.className = 'category-content';
  promptsContainer.innerHTML = `
    <div id="category-header" class="category-content-header">
      <h2>选择一个分类</h2>
      <p>请从左侧选择一个分类查看相关提示词</p>
    </div>
    <div id="category-prompts" class="prompt-grid"></div>
  `;
  
  // 添加到布局中
  layout.appendChild(categoryListContainer);
  layout.appendChild(promptsContainer);
  
  // 添加到容器中
  categoriesContainer.appendChild(layout);
  
  // 渲染分类列表
  renderCategoryList(categories, rules);
  
  // 添加分类搜索功能
  const searchInput = document.getElementById('category-search-input');
  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    filterCategories(searchTerm);
  });
}

// 渲染分类列表
function renderCategoryList(categories, rules) {
  const categoryList = document.getElementById('category-list');
  
  // 清空列表
  categoryList.innerHTML = '';
  
  // 计算每个分类下的提示词数量
  const categoryCounts = {};
  rules.forEach(rule => {
    if (rule.category) {
      categoryCounts[rule.category] = (categoryCounts[rule.category] || 0) + 1;
    }
  });
  
  // 对分类进行排序（按名称）
  const sortedCategories = [...categories].sort();
  
  // 为每个分类创建列表项
  sortedCategories.forEach(category => {
    const count = categoryCounts[category] || 0;
    const listItem = document.createElement('li');
    listItem.className = 'category-item';
    listItem.setAttribute('data-category', category);
    listItem.innerHTML = `
      <span class="category-name">${category}</span>
      <span class="category-count">${count}</span>
    `;
    
    // 添加点击事件
    listItem.addEventListener('click', () => {
      selectCategory(category);
    });
    
    categoryList.appendChild(listItem);
  });
}

// 选择分类
function selectCategory(category) {
  // 更新分类列表选中状态
  const categoryItems = document.querySelectorAll('.category-item');
  categoryItems.forEach(item => {
    if (item.getAttribute('data-category') === category) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // 更新分类标题
  const categoryHeader = document.getElementById('category-header');
  const count = allRules.filter(rule => rule.category === category).length;
  categoryHeader.innerHTML = `
    <h2>${category}</h2>
    <p>共 ${count} 个提示词</p>
  `;
  
  // 渲染该分类下的提示词
  renderCategoryPrompts(category);
}

// 渲染分类下的提示词
function renderCategoryPrompts(category) {
  const promptsContainer = document.getElementById('category-prompts');
  
  // 清空容器
  promptsContainer.innerHTML = '';
  
  // 获取该分类下的提示词
  const categoryPrompts = allRules.filter(rule => rule.category === category);
  
  // 如果没有提示词，显示空状态
  if (categoryPrompts.length === 0) {
    promptsContainer.innerHTML = `
      <div class="content-placeholder">
        <i class="fas fa-file-alt placeholder-icon"></i>
        <p>该分类下暂无提示词</p>
      </div>
    `;
    return;
  }
  
  // 为每个提示词创建卡片
  categoryPrompts.forEach(prompt => {
    const card = createPromptCard(prompt);
    promptsContainer.appendChild(card);
  });
}

// 创建提示词卡片
function createPromptCard(prompt) {
  const card = document.createElement('div');
  card.className = 'prompt-card';
  
  // 获取标题（如果没有title属性，则使用category作为标题）
  const title = prompt.title || prompt.category;
  
  // 获取描述（优先使用中文内容）
  const description = getShortDescription(prompt.content_zh || prompt.content);
  
  card.innerHTML = `
    <div class="prompt-card-content">
      <div class="prompt-card-header">
        <h3 class="prompt-card-title">${title}</h3>
        <span class="prompt-card-category">${prompt.category}</span>
      </div>
      <p class="prompt-card-description">${description}</p>
    </div>
    <div class="prompt-card-footer">
      <div class="prompt-card-actions">
        <button class="action-btn toggle-favorite" data-id="${prompt.id || prompt.category}" title="收藏">
          <i class="far fa-heart"></i>
        </button>
        <button class="action-btn copy-prompt" data-content="${encodeURIComponent(prompt.content_zh || prompt.content)}" title="复制提示词">
          <i class="far fa-copy"></i>
        </button>
      </div>
    </div>
  `;
  
  // 添加事件监听器
  const favoriteBtn = card.querySelector('.toggle-favorite');
  favoriteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(prompt);
    updateFavoriteIcon(favoriteBtn, isFavorite(prompt.id || prompt.category));
  });
  
  // 检查是否已收藏，更新图标
  updateFavoriteIcon(favoriteBtn, isFavorite(prompt.id || prompt.category));
  
  const copyBtn = card.querySelector('.copy-prompt');
  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const content = decodeURIComponent(copyBtn.getAttribute('data-content'));
    copyPromptText(content);
  });
  
  // 点击卡片显示模态框
  card.addEventListener('click', () => {
    showPromptModal(prompt);
  });
  
  return card;
}

// 获取短描述
function getShortDescription(content) {
  if (!content) return '';
  // 提取前100个字符作为描述
  return content.substring(0, 100) + (content.length > 100 ? '...' : '');
}

// 过滤分类
function filterCategories(searchTerm) {
  const categoryItems = document.querySelectorAll('.category-item');
  let hasVisibleCategory = false;
  
  categoryItems.forEach(item => {
    const categoryName = item.querySelector('.category-name').textContent.toLowerCase();
    if (categoryName.includes(searchTerm)) {
      item.style.display = 'flex';
      hasVisibleCategory = true;
    } else {
      item.style.display = 'none';
    }
  });
  
  // 如果没有匹配的分类，显示提示
  const categoryList = document.getElementById('category-list');
  if (!hasVisibleCategory) {
    if (!document.getElementById('no-category-match')) {
      const noMatch = document.createElement('li');
      noMatch.id = 'no-category-match';
      noMatch.className = 'no-match';
      noMatch.textContent = '没有匹配的分类';
      categoryList.appendChild(noMatch);
    }
  } else {
    const noMatch = document.getElementById('no-category-match');
    if (noMatch) {
      noMatch.remove();
    }
  }
}

// 切换收藏状态
function toggleFavorite(prompt) {
  // 获取当前收藏
  let favorites = getFavorites();
  
  // 使用id或category作为唯一标识
  const promptId = prompt.id || prompt.category;
  
  // 检查是否已收藏
  const index = favorites.findIndex(fav => (fav.id || fav.category) === promptId);
  
  if (index === -1) {
    // 未收藏，添加到收藏
    favorites.push(prompt);
    showToast('已添加到收藏');
  } else {
    // 已收藏，从收藏中移除
    favorites.splice(index, 1);
    showToast('已从收藏中移除');
  }
  
  // 保存到本地存储
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// 获取收藏的提示词
function getFavorites() {
  const favoritesJson = localStorage.getItem('favorites');
  return favoritesJson ? JSON.parse(favoritesJson) : [];
}

// 检查提示词是否已收藏
function isFavorite(promptId) {
  const favorites = getFavorites();
  return favorites.some(fav => (fav.id || fav.category) === promptId);
}

// 更新收藏图标
function updateFavoriteIcon(button, isFavorite) {
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
}

// 复制提示词文本
function copyPromptText(text) {
  // 复制提示词内容到剪贴板
  navigator.clipboard.writeText(text)
    .then(() => {
      // 显示复制成功提示
      showToast('提示词已复制到剪贴板');
    })
    .catch(err => {
      console.error('复制失败:', err);
      showToast('复制失败，请手动复制');
    });
}

// 显示提示消息
function showToast(message) {
  // 创建提示元素
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  // 添加到页面
  document.body.appendChild(toast);
  
  // 显示提示
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // 2秒后隐藏提示
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 2000);
}

// 显示提示词模态框
function showPromptModal(prompt) {
  // 内容预处理，确保各种数据格式都能正确显示
  const contentZh = prompt.content_zh || prompt.zh_content || 
    (prompt.content && prompt.is_zh ? prompt.content : null);
  const contentEn = prompt.content_en || prompt.en_content || 
    (prompt.content && !prompt.is_zh ? prompt.content : null) || prompt.text || prompt.content;
  
  // 如果只有中文内容，自动生成英文版本
  let autoTranslatedEn = null;
  if (contentZh && !contentEn) {
    autoTranslatedEn = translateToEnglish(contentZh);
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
  
  // 优先使用分类名作为标题（如果没有title或name）
  const title = prompt.title || prompt.name || prompt.category || '未命名提示词';
  const category = prompt.category || 
    (Array.isArray(prompt.categories) && prompt.categories.length > 0 ? prompt.categories[0] : '未分类');
  
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
  
  // 如果没有任何内容，显示提示
  if (!contentZh && !contentEn && !autoTranslatedEn) {
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
  const promptId = prompt.id || prompt.category;
  const isFavorited = isFavorite(promptId);
  
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
  
  // 中文复制按钮
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
      copyPromptText(contentZh);
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
    copyEnBtn.style.cursor = 'pointer';
    copyEnBtn.style.fontSize = '14px';
    
    const textToCopy = contentEn || autoTranslatedEn;
    copyEnBtn.addEventListener('click', () => {
      copyPromptText(textToCopy);
    });
    
    copyBtnGroup.appendChild(copyEnBtn);
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
  
  // 收藏按钮点击事件
  favoriteBtn.addEventListener('click', () => {
    toggleFavorite(prompt);
    const newIsFavorited = isFavorite(promptId);
    favoriteBtn.innerHTML = newIsFavorited ? 
      '<i class="fas fa-heart"></i> 已收藏' : 
      '<i class="far fa-heart"></i> 收藏';
    
    // 更新卡片上的收藏图标
    const cardFavoriteBtn = document.querySelector(`.toggle-favorite[data-id="${promptId}"]`);
    if (cardFavoriteBtn) {
      updateFavoriteIcon(cardFavoriteBtn, newIsFavorited);
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
}

// 格式化内容，将换行符转换为HTML换行，保留空格
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

// 简单翻译中文内容为英文（模拟翻译）
function translateToEnglish(chineseText) {
  if (!chineseText) return '';
  
  // 实际项目中，这里可以接入真实的翻译API
  // 此处仅做模拟，添加说明文字
  
  // 模拟翻译结果，实际应用中应使用翻译API
  const translatedText = `[Auto-translated from Chinese]\n\n${chineseText}`;
  
  return translatedText;
}

// 当DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', initCategoriesPage); 