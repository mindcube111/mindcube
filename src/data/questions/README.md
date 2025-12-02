# 题目数据文件夹

## 📁 用途

这个文件夹用于存放题目数据文件（可选）。**推荐使用管理员后台的"题目导入"功能**来管理题目。

## 📝 如何添加题目

### 方式1: 管理员后台导入（推荐）✨

1. 登录管理员账号
2. 进入"题目导入"页面 (`/admin/questions/import`)
3. 选择或创建问卷类型
4. 上传题目文件（JSON或TypeScript格式）
5. 预览并确认导入

### 方式2: 直接放入文件夹

如果您希望手动管理题目文件，可以将文件放入对应文件夹：

```
src/data/questions/
├── SCL-90/
│   └── questions.ts 或 questions.json
├── MBTI/
│   └── questions.ts 或 questions.json
└── Holland/
    └── questions.ts 或 questions.json
```

## 📋 文件格式

### JSON格式 (questions.json)

```json
{
  "type": "SCL-90",
  "title": "SCL-90 心理健康症状自评量表",
  "description": "描述信息",
  "dimensions": ["维度1", "维度2"],
  "questions": [
    {
      "id": "scl90_1",
      "number": 1,
      "text": "题目内容",
      "category": "维度1",
      "options": [
        { "value": 0, "label": "选项1" }
      ],
      "required": true
    }
  ]
}
```

### TypeScript格式 (questions.ts)

```typescript
import { QuestionnaireData } from '@/types'

export const questions: QuestionnaireData = {
  type: 'SCL-90',
  title: '标题',
  description: '描述',
  dimensions: ['维度1'],
  questions: [
    {
      id: 'scl90_1',
      number: 1,
      text: '题目内容',
      options: [{ value: 0, label: '选项1' }],
      required: true
    }
  ]
}
```

## 🔧 导入工具

使用 `src/data/questions/importHelper.ts` 中的 `convertQuestions()` 函数来转换和导入题目数据。
