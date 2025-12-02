# MIND CUBE 心理测评管理平台

专业、便捷、可信赖的心理健康测评管理系统

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 📁 项目结构

```
src/
├── components/          # 通用组件
├── contexts/           # React Context（认证等）
├── pages/              # 页面组件
├── services/           # API服务层
├── types/              # TypeScript类型定义
├── utils/              # 工具函数
└── data/               # 数据文件
```

## 🔑 默认账号

- **管理员**: `admin` / `admin123`
- **普通用户**: `user` / `user123`

## ✨ 主要功能

- 📊 **仪表盘** - 数据统计和可视化
- 🔗 **链接管理** - 生成和管理测试链接（一次性使用）
- 📝 **题目导入** - 管理员导入和管理问卷题库
- 👥 **用户管理** - 用户审核和管理
- 📦 **套餐购买** - 额度购买系统
- 🔔 **通知中心** - 系统通知管理

## 📚 题目导入

### 方式1: 管理员后台导入（推荐）

1. 登录管理员账号
2. 进入"题目导入"页面
3. 选择问卷类型或创建新类型
4. 上传题目文件（JSON或TypeScript格式）
5. 预览并确认导入

### 方式2: 直接导入文件

将题目文件放在 `src/data/questions/[问卷类型]/questions.ts` 或 `questions.json`

## 🔧 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router

## 📖 更多文档

- [API文档](src/services/api/README.md) - API接口说明
- [题目导入指南](src/data/questions/README.md) - 题目导入详细说明

## ⚙️ 环境变量

创建 `.env` 文件配置：

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## 📝 注意事项

- 所有测试链接为一次性使用，使用后自动失效
- 新注册用户需要管理员审核后才能登录
- 题目导入后需要手动上架才能在"生成链接"页面使用
