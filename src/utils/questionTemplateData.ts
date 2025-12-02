import type { ImportedQuestion } from './questionImport'

export const csvHeader = ['题目', '题型', '选项', '答案', '标签', '难度', '解析']

export const templateQuestions: ImportedQuestion[] = [
  {
    id: 'demo-1',
    title: '我能够在团队中清晰表达自己的观点。',
    type: 'single',
    options: ['非常不同意', '不同意', '中立', '同意', '非常同意'],
    answer: '非常同意',
    tags: ['沟通', '团队'],
    difficulty: 2,
    analysis: '用于评估沟通能力与团队协作倾向。',
    createdAt: Date.now(),
  },
  {
    id: 'demo-2',
    title: '面对陌生环境时，我通常会保持积极探索的态度。',
    type: 'single',
    options: ['从不', '偶尔', '有时', '经常', '总是'],
    answer: '经常',
    tags: ['性格', '适应力'],
    difficulty: 3,
    analysis: '衡量个体的适应能力与开放性。',
    createdAt: Date.now(),
  },
  {
    id: 'demo-3',
    title: '请用简短的文字描述最近一次让你印象深刻的沟通经历。',
    type: 'text',
    options: [],
    answer: '',
    tags: ['开放题', '沟通'],
    difficulty: 1,
    analysis: '开放式题目，可辅助定性分析。',
    createdAt: Date.now(),
  },
]








