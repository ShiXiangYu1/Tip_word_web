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
  
  // 这里简单模拟翻译，实际项目中应调用真实的翻译API
  // 添加一个明显的标记，表示这是自动翻译的内容
  return `[This is an automatic translation]\n\n`
    + `The original content was in Chinese. For accurate information, please refer to the Chinese version above.\n\n`
    + `${chineseText.replace(/[\u4e00-\u9fa5]/g, 'X')}`;
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
async function showPromptModal(prompt) {
  if (!prompt) return;
  
  console.log('显示提示词模态框，提示词ID:', prompt.id, '标题:', prompt.title);

  // 获取静态模态框
  const modal = document.getElementById('prompt-modal');
  if (!modal) {
    console.error('找不到模态框元素 #prompt-modal');
    return;
  }
  
  // 存储提示词ID用于收藏功能
  modal.dataset.promptId = prompt.id;
  
  // 显示模态框
  modal.className = 'modal show';
  
  // 获取提示词内容 - 统一字段名称
  const title = prompt.title || prompt.name || '未命名提示词';
  const category = prompt.category || (Array.isArray(prompt.categories) && prompt.categories[0]) || '未分类';
  
  // 显示加载中提示
  const loadingDiv = document.createElement('div');
  loadingDiv.style.position = 'fixed';
  loadingDiv.style.top = '50%';
  loadingDiv.style.left = '50%';
  loadingDiv.style.transform = 'translate(-50%, -50%)';
  loadingDiv.style.background = 'rgba(0, 0, 0, 0.7)';
  loadingDiv.style.color = 'white';
  loadingDiv.style.padding = '20px';
  loadingDiv.style.borderRadius = '10px';
  loadingDiv.style.zIndex = '10000';
  loadingDiv.innerHTML = '正在加载内容...';
  document.body.appendChild(loadingDiv);
  
  // 准备内容变量 - 统一数据处理逻辑
  let contentZh = '';  // 中文内容
  let contentEn = '';  // 英文内容
  let useAutoTranslation = false;  // 是否使用自动翻译
  
  try {
    // 统一处理中文内容来源 
    contentZh = prompt.content_zh || prompt.zh_content || prompt.content || '';
    console.log('【中文内容】长度:', contentZh.length, '前50个字符:', contentZh.substring(0, 50));
    
    // 统一处理英文内容来源
    contentEn = prompt.content_en || prompt.en_content || prompt.english_content || '';
    console.log('【英文内容】来自原始数据，长度:', contentEn.length);
    
    // 如果没有英文内容，尝试从其他源获取
    if (!contentEn && window.promptDataManager && typeof window.promptDataManager.getEnglishContent === 'function') {
      console.log('尝试从promptDataManager获取英文内容...');
      contentEn = window.promptDataManager.getEnglishContent(prompt.id);
      console.log('从promptDataManager获取结果:', contentEn ? '成功' : '失败');
    }
    
    // 如果仍然没有英文内容，尝试直接获取
    if (!contentEn) {
      console.log('尝试直接获取英文内容...');
      contentEn = await getEnglishContentDirect(prompt.id, contentZh);
      console.log('直接获取结果:', contentEn ? '成功' : '失败');
    }
    
    // 如果所有方法都失败，使用模拟翻译
    if (!contentEn) {
      console.log('所有获取英文内容的方法都失败，使用模拟翻译');
      contentEn = translateToEnglish(contentZh);
      useAutoTranslation = true;
    }
    
    console.log('【英文内容】最终长度:', contentEn.length, '前50个字符:', contentEn.substring(0, 50));
    
    // 验证英文内容是否真的是英文
    const isReallyEnglish = /^[A-Za-z\s\d\p{P}]+/u.test(contentEn.substring(0, 50));
    if (!isReallyEnglish && contentEn.length > 0 && !useAutoTranslation) {
      console.log('警告：获取的英文内容实际上不是英文！使用模拟翻译替代');
      contentEn = translateToEnglish(contentZh);
      useAutoTranslation = true;
    }
  } catch (error) {
    console.error('获取内容过程中发生错误:', error);
    // 确保有内容显示
    if (!contentZh) contentZh = prompt.content || '';
    if (!contentEn) contentEn = translateToEnglish(contentZh);
    useAutoTranslation = true;
  } finally {
    // 移除加载提示
    document.body.removeChild(loadingDiv);
  }
  
  // 更新模态框内容
  const modalTitle = document.getElementById('modal-title');
  const modalCategory = document.getElementById('modal-category');
  
  if (modalTitle) modalTitle.textContent = title;
  if (modalCategory) modalCategory.textContent = category;
  
  // 重建内容区域
  const modalBody = document.querySelector('.modal-body');
  if (!modalBody) {
    console.error('找不到模态框内容区域元素 .modal-body');
    return;
  }
  
  // 清空现有内容
  modalBody.innerHTML = '';
  
  // 创建中文内容区
  const sectionZh = document.createElement('div');
  sectionZh.className = 'content-section';
  sectionZh.id = 'section-zh';
  
  const zhTitle = document.createElement('div');
  zhTitle.className = 'section-title';
  zhTitle.textContent = '中文';
  
  const zhContent = document.createElement('div');
  zhContent.className = 'content-text zh-content';
  zhContent.id = 'content-zh';
  zhContent.innerHTML = formatContent(contentZh);
  
  sectionZh.appendChild(zhTitle);
  sectionZh.appendChild(zhContent);
  modalBody.appendChild(sectionZh);
  
  // 创建英文内容区
  if (contentEn) {
    const sectionEn = document.createElement('div');
    sectionEn.className = 'content-section';
    sectionEn.id = 'section-en';
    
    const enTitle = document.createElement('div');
    enTitle.className = 'section-title';
    enTitle.textContent = '中文';
    
    // 如果是自动翻译，添加提示
    if (useAutoTranslation) {
      const autoTranslateIndicator = document.createElement('small');
      autoTranslateIndicator.style.color = '#f44336';
      autoTranslateIndicator.style.marginLeft = '10px';
      autoTranslateIndicator.textContent = '[自动翻译]';
      enTitle.appendChild(autoTranslateIndicator);
    }
    
    const enContent = document.createElement('div');
    enContent.className = 'content-text en-content';
    enContent.id = 'content-en';
    enContent.innerHTML = formatContent(contentEn);
    
    sectionEn.appendChild(enTitle);
    sectionEn.appendChild(enContent);
    modalBody.appendChild(sectionEn);
  }
  
  // 处理复制按钮
  const copyZhBtn = document.getElementById('copy-zh-btn');
  const copyEnBtn = document.getElementById('copy-en-btn');
  
  if (copyZhBtn) {
    copyZhBtn.style.display = contentZh ? 'inline-block' : 'none';
  }
  
  if (copyEnBtn) {
    copyEnBtn.style.display = contentEn ? 'inline-block' : 'none';
  }
  
  // 更新收藏状态
  const favoriteBtn = document.getElementById('modal-favorite-btn');
  if (favoriteBtn) {
    const isFavorited = typeof window.isFavorite === 'function' && window.isFavorite(prompt.id);
    favoriteBtn.innerHTML = `
      <i class="${isFavorited ? 'fas' : 'far'} fa-heart"></i>
      ${isFavorited ? '已收藏' : '收藏'}
    `;
  }
  
  // 防止背景滚动
  document.body.style.overflow = 'hidden';
  
  // 绑定事件处理函数 - 确保使用正确的选择器
  const closeBtn = modal.querySelector('.modal-close');
  if (closeBtn) {
    const closeModal = () => {
      modal.className = 'modal';
      document.body.style.overflow = '';
    };
    
    // 移除旧事件再绑定新事件，防止重复
    closeBtn.removeEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
  } else {
    console.error('找不到关闭按钮元素 .modal-close');
  }
  
  // 绑定复制按钮事件
  if (copyZhBtn) {
    const copyZhHandler = () => {
      copyToClipboard(contentZh.replace(/<br>/g, '\n'));
      showToast('已复制中文内容');
    };
    copyZhBtn.removeEventListener('click', copyZhHandler);
    copyZhBtn.addEventListener('click', copyZhHandler);
  }
  
  if (copyEnBtn) {
    const copyEnHandler = () => {
      copyToClipboard(contentEn.replace(/<br>/g, '\n'));
      showToast('已复制英文内容');
    };
    copyEnBtn.removeEventListener('click', copyEnHandler);
    copyEnBtn.addEventListener('click', copyEnHandler);
  }
  
  // 绑定收藏按钮事件
  if (favoriteBtn) {
    const toggleFavoriteHandler = () => {
      if (typeof window.toggleFavorite === 'function') {
        window.toggleFavorite(prompt);
        const isFavorited = typeof window.isFavorite === 'function' && window.isFavorite(prompt.id);
        favoriteBtn.innerHTML = `
          <i class="${isFavorited ? 'fas' : 'far'} fa-heart"></i>
          ${isFavorited ? '已收藏' : '收藏'}
        `;
      }
    };
    favoriteBtn.removeEventListener('click', toggleFavoriteHandler);
    favoriteBtn.addEventListener('click', toggleFavoriteHandler);
  }
  
  // 点击外部关闭
  const outsideClickHandler = (e) => {
    if (e.target === modal) {
      modal.className = 'modal';
      document.body.style.overflow = '';
    }
  };
  modal.removeEventListener('click', outsideClickHandler);
  modal.addEventListener('click', outsideClickHandler);
  
  // ESC键关闭
  const escKeyHandler = (e) => {
    if (e.key === 'Escape') {
      modal.className = 'modal';
      document.body.style.overflow = '';
      document.removeEventListener('keydown', escKeyHandler);
    }
  };
  document.removeEventListener('keydown', escKeyHandler);
  document.addEventListener('keydown', escKeyHandler);
  
  console.log('模态框显示完成');
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

// 直接从rules_bilingual.json获取英文内容
async function getEnglishContentDirect(promptId, chineseContent) {
  try {
    console.log('尝试直接从rules_bilingual.json获取英文内容，promptId:', promptId);
    
    // 添加时间戳防止缓存
    const timestamp = new Date().getTime();
    const url = `data/rules_bilingual.json?t=${timestamp}`;
    console.log('请求URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP错误! 状态码: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('rules_bilingual.json加载成功，数据长度:', Array.isArray(data) ? data.length : '非数组');
    
    if (!Array.isArray(data)) {
      throw new Error('data不是数组');
    }
    
    // 打印第一个项目的字段，帮助调试
    if (data.length > 0) {
      console.log('第一个项目的字段:', Object.keys(data[0]));
    }
    
    // 判断内容是否为英文的辅助函数
    function isEnglishContent(text) {
      if (!text || text.length < 10) return false;
      
      // 检查前50个字符是否主要是英文字母
      const sample = text.substring(0, 50);
      // 计算英文字符的比例
      const englishChars = sample.replace(/[^a-zA-Z]/g, '').length;
      const ratio = englishChars / sample.length;
      
      // 如果英文字符占比超过60%，则认为是英文内容
      const isEnglish = ratio > 0.6;
      console.log(`判断内容是否为英文: 英文字符比例=${ratio.toFixed(2)}, 判断结果: ${isEnglish ? '是英文' : '不是英文'}`);
      return isEnglish;
    }
    
    // 尝试多种匹配方式
    let foundEnglishContent = null;
    
    // 优先检查是否存在content_en字段
    if (data.length > 0 && data[0].content_en) {
      console.log('检测到数据使用content_en字段存储英文内容，优先使用该字段');
    }
    
    // 方式1：按ID索引匹配，优先使用content_en字段
    const indexId = parseInt(promptId);
    if (!isNaN(indexId) && indexId > 0 && indexId <= data.length) {
      const item = data[indexId - 1];
      if (item) {
        // 优先从content_en字段获取
        if (item.content_en && isEnglishContent(item.content_en)) {
          console.log('从content_en字段获取成功');
          foundEnglishContent = item.content_en;
        }
        // 其次尝试content字段
        else if (item.content && isEnglishContent(item.content)) {
          console.log('从content字段获取成功');
          foundEnglishContent = item.content;
        } 
        // 最后尝试任何包含en的字段
        else {
          for (const key of Object.keys(item)) {
            if (key.includes('en') && !key.includes('zh') && isEnglishContent(item[key])) {
              console.log(`从${key}字段获取英文内容成功`);
              foundEnglishContent = item[key];
              break;
            }
          }
        }
      }
    }
    
    // 如果已找到验证通过的英文内容，直接返回
    if (foundEnglishContent) return foundEnglishContent;
    
    // 方式2：尝试在所有项中查找匹配的中文内容
    if (chineseContent) {
      console.log('尝试匹配中文内容...');
      
      const matchingItem = data.find(item => {
        if (!item) return false;
        
        // 检查不同可能的中文字段
        return (
          (item.content_en_zh && item.content_en_zh.substring(0, 30) === chineseContent.substring(0, 30)) ||
          (item.content_zh && item.content_zh.substring(0, 30) === chineseContent.substring(0, 30))
        );
      });
      
      if (matchingItem) {
        console.log('找到匹配的中文内容');
        
        // 优先从content_en字段获取
        if (matchingItem.content_en && isEnglishContent(matchingItem.content_en)) {
          console.log('从matchingItem.content_en获取成功');
          foundEnglishContent = matchingItem.content_en;
        }
        // 其次尝试content字段
        else if (matchingItem.content && isEnglishContent(matchingItem.content)) {
          console.log('从matchingItem.content获取成功');
          foundEnglishContent = matchingItem.content;
        }
      }
    }
    
    // 如果已找到验证通过的英文内容，直接返回
    if (foundEnglishContent) return foundEnglishContent;
    
    // 如果所有方法都失败，扫描所有项目查找可能的英文内容字段
    console.log('尝试扫描所有项，查找英文内容字段...');
    
    // 尝试找出可能的英文内容字段
    const potentialEnFields = new Set();
    data.forEach(item => {
      if (!item) return;
      Object.keys(item).forEach(key => {
        if ((key.includes('en') || key === 'content') && !key.includes('zh')) {
          potentialEnFields.add(key);
        }
      });
    });
    
    console.log('可能的英文内容字段:', Array.from(potentialEnFields));
    
    // 检查每个可能的字段
    for (const field of potentialEnFields) {
      for (const item of data) {
        if (item && item[field] && isEnglishContent(item[field])) {
          console.log(`从${field}字段找到英文内容`);
          return item[field];
        }
      }
    }
    
    // 如果所有方法都失败，返回空字符串
    console.log('所有匹配方法都失败，或找到的内容都不是真正的英文');
    return '';
  } catch (error) {
    console.error('直接获取英文内容失败:', error);
    return '';
  }
} 
