// DOM元素
const body = document.body;
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const lightThemeBtn = document.querySelector('.light-theme-btn');
const darkThemeBtn = document.querySelector('.dark-theme-btn');
const searchInputs = document.querySelectorAll('.navbar-search input, .mobile-search input');
const searchButtons = document.querySelectorAll('.navbar-search button, .mobile-search button');

// 初始化
function init() {
  // 设置主题
  initTheme();
  
  // 设置事件监听器
  setupEventListeners();
}

// 初始化主题
function initTheme() {
  // 检查本地存储中的主题设置
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark') {
    setDarkTheme();
  } else {
    setLightTheme();
  }
}

// 设置事件监听器
function setupEventListeners() {
  // 移动菜单切换
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
  }
  
  // 主题切换
  if (lightThemeBtn) {
    lightThemeBtn.addEventListener('click', setLightTheme);
  }
  
  if (darkThemeBtn) {
    darkThemeBtn.addEventListener('click', setDarkTheme);
  }
  
  // 搜索功能
  searchButtons.forEach(button => {
    button.addEventListener('click', handleSearch);
  });
  
  searchInputs.forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    });
  });
  
  // 点击页面其他区域关闭移动菜单
  document.addEventListener('click', (e) => {
    if (mobileMenu && mobileMenu.classList.contains('active')) {
      if (!mobileMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        closeMobileMenu();
      }
    }
  });
}

// 切换移动菜单
function toggleMobileMenu() {
  if (mobileMenu) {
    if (mobileMenu.classList.contains('active')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }
}

// 打开移动菜单
function openMobileMenu() {
  if (mobileMenu) {
    mobileMenu.classList.add('active');
    document.body.style.overflow = 'hidden'; // 防止背景滚动
  }
}

// 关闭移动菜单
function closeMobileMenu() {
  if (mobileMenu) {
    mobileMenu.classList.remove('active');
    document.body.style.overflow = ''; // 恢复背景滚动
  }
}

// 设置浅色主题
function setLightTheme() {
  body.classList.remove('dark-theme');
  body.classList.add('light-theme');
  
  // 更新按钮状态
  updateThemeButtonsState('light');
  
  // 保存主题设置
  localStorage.setItem('theme', 'light');
}

// 设置深色主题
function setDarkTheme() {
  body.classList.remove('light-theme');
  body.classList.add('dark-theme');
  
  // 更新按钮状态
  updateThemeButtonsState('dark');
  
  // 保存主题设置
  localStorage.setItem('theme', 'dark');
}

// 更新主题按钮状态
function updateThemeButtonsState(theme) {
  const lightButtons = document.querySelectorAll('.light-theme-btn');
  const darkButtons = document.querySelectorAll('.dark-theme-btn');
  
  if (theme === 'light') {
    lightButtons.forEach(btn => btn.classList.add('active'));
    darkButtons.forEach(btn => btn.classList.remove('active'));
  } else {
    lightButtons.forEach(btn => btn.classList.remove('active'));
    darkButtons.forEach(btn => btn.classList.add('active'));
  }
}

// 处理搜索
function handleSearch() {
  // 获取搜索输入值
  const searchValue = (document.querySelector('.navbar-search input')?.value || 
                      document.querySelector('.mobile-search input')?.value || '').trim();
  
  if (searchValue) {
    // 跳转到搜索结果页面
    window.location.href = `/search.html?q=${encodeURIComponent(searchValue)}`;
  }
}

// 加载数据
async function loadData() {
  try {
    // 从服务器加载数据
    const response = await fetch('data/rules_bilingual.json');
    if (!response.ok) {
      throw new Error('无法加载数据');
    }
    
    const rules = await response.json();
    
    // 提取所有分类
    const categorySet = new Set();
    rules.forEach(rule => {
      if (rule.category) {
        categorySet.add(rule.category);
      }
    });
    
    // 确保每个规则都有一个唯一标识
    const processedRules = rules.map((rule, index) => {
      // 如果没有id，使用索引作为id
      if (!rule.id) {
        rule.id = `rule_${index}`;
      }
      return rule;
    });
    
    const categories = Array.from(categorySet);
    
    return { rules: processedRules, categories };
  } catch (error) {
    console.error('加载数据失败:', error);
    return { rules: [], categories: [] };
  }
}

// 当DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', init); 