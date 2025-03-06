# AI提示词收藏网站

这是一个功能完善的AI提示词收藏网站，提供丰富的AI提示词收集、分类、搜索和管理功能。灵感来源于 [AI提示词收藏](https://anaitsc.xiaofeipandian.cn/)。

## 功能特点

- 📝 **精选AI提示词展示**：提供多种专业领域的高质量AI提示词
- 🏷️ **分类浏览**：根据不同类别便捷查找提示词
- 🔍 **实时搜索**：快速查找关键词相关的提示词
- ⭐ **收藏管理**：一键收藏喜欢的提示词并随时查看
- 📋 **一键复制**：便捷复制提示词内容
- 🌓 **明暗主题**：支持浅色/深色模式切换
- 📊 **统计展示**：展示提示词总数、分类数量等统计信息
- 📱 **响应式设计**：完美适配PC、平板和手机等各种设备

## 技术栈

- **前端**：
  - HTML5
  - CSS3 (响应式设计)
  - JavaScript (ES6+，原生实现)
  - localStorage (本地数据存储)
  - Font Awesome (图标库)
  - SweetAlert2 (美化提示)

- **后端**：
  - Python简易HTTP服务器 (开发环境)
  - JSON (数据存储)

## 项目结构

```
/
├── index.html              # 主页面
├── css/                    # 样式文件
│   ├── style.css           # 主样式
│   └── responsive.css      # 响应式样式
├── js/                     # JavaScript文件
│   ├── data.js             # 数据处理模块
│   ├── favorites.js        # 收藏功能模块
│   ├── prompt-details.js   # 提示词详情模块
│   └── main.js             # 主逻辑模块
├── data/                   # 数据文件
│   ├── prompts.json        # 提示词数据
│   ├── categories.json     # 分类数据
│   └── rules_bilingual.json # 双语规则
├── assets/                 # 资源文件
│   └── icons/              # 图标资源
├── PROGRESS.md             # 开发进度
└── README.md               # 项目说明
```

## 功能模块

- **数据管理**：由 `data.js` 负责，提供数据加载、分类提取和搜索等功能
- **收藏系统**：由 `favorites.js` 负责，基于localStorage实现收藏的添加、移除和持久化
- **提示词详情**：由 `prompt-details.js` 负责，处理提示词详情展示、复制和收藏交互
- **页面交互**：由 `main.js` 负责，处理主页面的所有交互逻辑、导航和主题切换

## 本地开发

1. 启动本地服务器：
   ```
   python -m http.server 8000
   ```

2. 访问网站：
   ```
   http://localhost:8000
   ```

## 开发进度

请查看 [PROGRESS.md](./PROGRESS.md) 文件了解项目开发进度。 