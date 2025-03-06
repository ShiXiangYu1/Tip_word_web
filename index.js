// DOM元素
const featuredPromptsContainer = document.getElementById('featured-prompts');

// 初始化首页
async function initHomePage() {
  try {
    // 加载数据
    const { rules, categories } = await loadData();
    
    // 显示精选提示词
    renderFeaturedPrompts(rules);
  } catch (error) {
    console.error('初始化首页失败:', error);
    showError('加载数据失败，请刷新页面重试');
  }
}

// 渲染精选提示词
function renderFeaturedPrompts(rules) {
  // 清空容器
  featuredPromptsContainer.innerHTML = '';
  
  // 如果没有提示词数据，显示空状态
  if (!rules || rules.length === 0) {
    featuredPromptsContainer.innerHTML = `
      <div class="content-placeholder">
        <i class="fas fa-file-alt placeholder-icon"></i>
        <p>暂无提示词数据</p>
      </div>
    `;
    return;
  }
  
  // 获取精选提示词（这里简单地取前6个）
  const featuredRules = rules.slice(0, 6);
  
  // 创建提示词卡片网格
  const grid = document.createElement('div');
  grid.className = 'prompt-grid';
  
  // 为每个提示词创建卡片
  featuredRules.forEach(rule => {
    const card = createPromptCard(rule);
    grid.appendChild(card);
  });
  
  // 将网格添加到容器中
  featuredPromptsContainer.appendChild(grid);
}

// 创建提示词卡片
function createPromptCard(prompt) {
  const card = document.createElement('div');
  card.className = 'prompt-card';
  card.innerHTML = `
    <div class="prompt-card-content">
      <div class="prompt-card-header">
        <h3 class="prompt-card-title">${prompt.title || prompt.category}</h3>
        <span class="prompt-card-category">${prompt.category}</span>
      </div>
      <p class="prompt-card-description">${getShortDescription(prompt.content_zh || prompt.content)}</p>
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
  // 提取前100个字符作为描述
  return content.substring(0, 100) + (content.length > 100 ? '...' : '');
}

// 切换收藏状态
function toggleFavorite(prompt) {
  // 获取当前收藏
  let favorites = getFavorites();
  
  // 检查是否已收藏
  const index = favorites.findIndex(fav => fav.id === prompt.id);
  
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
function isFavorite(id) {
  const favorites = getFavorites();
  return favorites.some(fav => fav.id === id);
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

// 显示提示词模态框
function showPromptModal(prompt) {
  const modal = document.getElementById('prompt-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalCategory = document.getElementById('modal-category');
  const modalContent = document.getElementById('modal-content');
  const modalFavoriteBtn = document.getElementById('modal-favorite-btn');
  
  // 设置模态框内容
  modalTitle.textContent = prompt.title || prompt.category;
  modalCategory.textContent = prompt.category;
  
  // 格式化内容函数
  function formatContent(text) {
    return text ? text.replace(/\n/g, '<br>') : '';
  }
  
  // 清空原有内容
  modalContent.innerHTML = '';
  
  // 创建中文内容区域
  const zhSection = document.createElement('div');
  zhSection.className = 'content-section';
  
  const zhHeader = document.createElement('h4');
  zhHeader.textContent = '中文';
  zhSection.appendChild(zhHeader);
  
  const zhContent = document.createElement('div');
  zhContent.className = 'content-text';
  zhContent.innerHTML = formatContent(prompt.content_zh || prompt.content);
  zhSection.appendChild(zhContent);
  
  modalContent.appendChild(zhSection);
  
  // 创建英文内容区域
  const enSection = document.createElement('div');
  enSection.className = 'content-section';
  
  const enHeader = document.createElement('h4');
  enHeader.textContent = 'English';
  enSection.appendChild(enHeader);
  
  const enContent = document.createElement('div');
  enContent.className = 'content-text';
  enContent.innerHTML = formatContent(prompt.content_en || prompt.content);
  enSection.appendChild(enContent);
  
  modalContent.appendChild(enSection);
  
  // 创建复制按钮组
  const copyBtnGroup = document.createElement('div');
  copyBtnGroup.className = 'copy-btn-group';
  
  const copyZhBtn = document.createElement('button');
  copyZhBtn.id = 'modal-copy-zh-btn';
  copyZhBtn.className = 'btn';
  copyZhBtn.innerHTML = '<i class="fas fa-copy"></i> 复制中文';
  copyZhBtn.onclick = function() {
    copyPromptText(prompt.content_zh || prompt.content);
  };
  copyBtnGroup.appendChild(copyZhBtn);
  
  const copyEnBtn = document.createElement('button');
  copyEnBtn.id = 'modal-copy-en-btn';
  copyEnBtn.className = 'btn';
  copyEnBtn.innerHTML = '<i class="fas fa-copy"></i> 复制英文';
  copyEnBtn.onclick = function() {
    copyPromptText(prompt.content_en || prompt.content);
  };
  copyBtnGroup.appendChild(copyEnBtn);
  
  // 添加按钮组到模态框底部
  const modalFooter = document.querySelector('.modal-footer');
  // 移除旧的复制按钮（如果存在）
  const oldCopyBtn = document.getElementById('modal-copy-btn');
  if (oldCopyBtn) {
    oldCopyBtn.remove();
  }
  
  // 移除已存在的复制按钮组
  const existingBtnGroup = document.querySelector('.copy-btn-group');
  if (existingBtnGroup) {
    existingBtnGroup.remove();
  }
  
  modalFooter.appendChild(copyBtnGroup);
  
  // 更新收藏按钮状态
  const promptId = prompt.id || prompt.category;
  if (isFavorite(promptId)) {
    modalFavoriteBtn.classList.add('active');
    modalFavoriteBtn.innerHTML = '<i class="fas fa-heart"></i> 已收藏';
  } else {
    modalFavoriteBtn.classList.remove('active');
    modalFavoriteBtn.innerHTML = '<i class="far fa-heart"></i> 收藏';
  }
  
  // 添加收藏按钮事件
  modalFavoriteBtn.onclick = function() {
    toggleFavorite(prompt);
    if (isFavorite(promptId)) {
      modalFavoriteBtn.classList.add('active');
      modalFavoriteBtn.innerHTML = '<i class="fas fa-heart"></i> 已收藏';
    } else {
      modalFavoriteBtn.classList.remove('active');
      modalFavoriteBtn.innerHTML = '<i class="far fa-heart"></i> 收藏';
    }
    
    // 同时更新卡片上的收藏图标
    const favoriteBtn = document.querySelector(`.toggle-favorite[data-id="${promptId}"]`);
    if (favoriteBtn) {
      updateFavoriteIcon(favoriteBtn, isFavorite(promptId));
    }
  };
  
  // 显示模态框
  modal.style.display = 'block';
  
  // 关闭模态框
  const closeBtn = document.querySelector('.modal-close');
  closeBtn.onclick = function() {
    modal.style.display = 'none';
  };
  
  // 点击模态框外部关闭
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  };
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

// 显示错误信息
function showError(message) {
  featuredPromptsContainer.innerHTML = `
    <div class="content-placeholder">
      <i class="fas fa-exclamation-circle placeholder-icon"></i>
      <p>${message}</p>
    </div>
  `;
}

// 当DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', initHomePage); 