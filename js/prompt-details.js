/**
 * 提示词详情模块
 * 处理提示词详情模态框的显示和交互
 */

// 格式化内容，将换行转换为HTML换行，保留空格
function formatContent(content) {
  if (!content) return '';
  return content.replace(/\n/g, '<br>').replace(/ {2,}/g, match => '&nbsp;'.repeat(match.length));
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

// 复制提示词文本到剪贴板
function copyPromptText(text) {
  if (!text) {
    showToast('没有可复制的内容');
    return;
  }
  
  navigator.clipboard.writeText(text)
    .then(() => showToast('已复制到剪贴板'))
    .catch(() => {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        showToast('已复制到剪贴板');
      } catch (err) {
        showToast('复制失败，请手动复制');
      }
      
      document.body.removeChild(textarea);
    });
}

// 显示提示词模态框
function showPromptModal(prompt) {
  if (!prompt) return;

  const modal = document.createElement('div');
  modal.className = 'modal show';
  
  // 获取提示词内容
  const title = prompt.title || prompt.name || '未命名提示词';
  const category = prompt.category || (Array.isArray(prompt.categories) && prompt.categories[0]) || '未分类';
  const contentZh = prompt.content_zh || prompt.content || '';
  const contentEn = prompt.content_en || '';
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${title}</h2>
        <div class="modal-close">&times;</div>
      </div>
      <div class="modal-category">
        分类：${category}
      </div>
      <div class="modal-body">
        ${contentEn ? `
          <div class="content-section">
            <div class="section-title">English</div>
            <div class="content-text">${formatContent(contentEn)}</div>
          </div>
        ` : ''}
        ${contentZh ? `
          <div class="content-section">
            <div class="section-title">中文</div>
            <div class="content-text">${formatContent(contentZh)}</div>
          </div>
        ` : ''}
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary favorite-btn">
          <i class="${window.isFavorite?.(prompt.id) ? 'fas' : 'far'} fa-heart"></i>
          收藏
        </button>
        <div class="copy-btn-group">
          ${contentEn ? `
            <button class="btn btn-primary copy-en-btn">
              <i class="fas fa-copy"></i>
              复制英文
            </button>
          ` : ''}
          ${contentZh ? `
            <button class="btn btn-primary copy-zh-btn">
              <i class="fas fa-copy"></i>
              复制中文
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  // 事件处理
  const closeBtn = modal.querySelector('.modal-close');
  const favoriteBtn = modal.querySelector('.favorite-btn');
  const copyZhBtn = modal.querySelector('.copy-zh-btn');
  const copyEnBtn = modal.querySelector('.copy-en-btn');

  closeBtn?.addEventListener('click', () => {
    document.body.removeChild(modal);
    document.body.style.overflow = '';
  });

  favoriteBtn?.addEventListener('click', () => {
    if (window.toggleFavorite) {
      window.toggleFavorite(prompt);
      const isFavorite = window.isFavorite?.(prompt.id);
      favoriteBtn.innerHTML = `
        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
        ${isFavorite ? '已收藏' : '收藏'}
      `;
    }
  });

  copyZhBtn?.addEventListener('click', () => copyPromptText(contentZh));
  copyEnBtn?.addEventListener('click', () => copyPromptText(contentEn));

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', function closeOnEsc(e) {
    if (e.key === 'Escape') {
      document.body.removeChild(modal);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', closeOnEsc);
    }
  });
}

// 显示提示消息
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

// 初始化提示词详情模块
function initPromptDetails() {
  // 将函数挂载到window对象上，以便其他模块调用
  window.showPromptModal = showPromptModal;
  window.copyPromptText = copyPromptText;
  window.showToast = showToast;
  
  // 创建Toast元素
  if (!document.getElementById('toast')) {
    const toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
}

// 在脚本加载完成后初始化
initPromptDetails(); 
