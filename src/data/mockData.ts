import { Notification, Package, DashboardStats, Feedback, Invite, Report } from '@/types'

// 模拟仪表盘数据
export const mockDashboardStats: DashboardStats = {
  totalLinks: 1520,
  remainingQuota: 480,
  todayUsedLinks: 23,
  unusedLinks: 45,
  participationRate: 0.85,
}

// 模拟套餐数据
export const mockPackages: Package[] = [
  {
    id: 'basic',
    name: '基础套餐',
    quota: 600,
    price: 99,
    description: '适合个人用户和心理小团队使用',
  },
  {
    id: 'standard',
    name: '标准套餐',
    quota: 1300,
    price: 199,
    description: '适合企业团队，覆盖常规测评需求',
    recommended: true,
  },
  {
    id: 'professional',
    name: '专业套餐',
    quota: 2300,
    price: 299,
    description: '适合进阶使用，支持更多批量测评',
  },
  {
    id: 'flagship',
    name: '旗舰套餐',
    quota: 5500,
    price: 599,
    description: '适合高频测评场景，满足大型机构',
  },
  {
    id: 'yearly',
    name: '年费套餐',
    quota: 0,
    price: 1688,
    description: '全年不限量使用，适合长期运营',
    unlimited: true,
  },
]

// 模拟通知数据
export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'completed',
    title: '新测评完成',
    message: '用户已完成 SCL-90 心理测评，总分：85分',
    read: false,
    createdAt: '2024-01-18T10:30:00',
    linkId: '1',
    reportId: 'r1',
    metadata: {
      questionnaireType: 'SCL-90',
      totalScore: 85,
      location: '北京市',
    },
  },
  {
    id: 'n2',
    type: 'quota-warning',
    title: '额度不足提醒',
    message: '您的剩余额度已不足100，请及时购买套餐',
    read: false,
    createdAt: '2024-01-18T09:00:00',
  },
  {
    id: 'n3',
    type: 'completed',
    title: '新测评完成',
    message: '用户已完成 MBTI 人格评估',
    read: true,
    createdAt: '2024-01-17T16:20:00',
    linkId: '3',
    reportId: 'r2',
  },
]

// 模拟反馈数据
export const mockFeedbacks: Feedback[] = [
  {
    id: 'f1',
    type: 'feature',
    title: '建议增加批量删除链接功能',
    content: '希望可以批量删除不需要的链接，提高管理效率',
    status: 'reviewing',
    createdAt: '2024-01-15T10:00:00',
    updatedAt: '2024-01-16T14:30:00',
  },
  {
    id: 'f2',
    type: 'bug',
    title: '导出功能在某些浏览器中失效',
    content: '在Chrome浏览器中导出CSV文件时出现错误',
    status: 'accepted',
    reward: 50,
    createdAt: '2024-01-14T15:20:00',
    updatedAt: '2024-01-17T09:00:00',
  },
]

// 模拟邀请数据
export const mockInvite: Invite = {
  id: 'inv1',
  inviteCode: 'INVITE2024',
  inviteUrl: 'https://platform.test/register?invite=INVITE2024',
  totalInvited: 12,
  totalReward: 1800,
  createdAt: '2024-01-01T00:00:00',
}

// 模拟报告数据
export const mockReports: Report[] = [
  {
    id: 'r1',
    linkId: '1',
    questionnaireType: 'SCL-90',
    totalScore: 85,
    scores: {
      '躯体化': 12,
      '强迫症状': 18,
      '人际关系敏感': 15,
      '抑郁': 20,
      '焦虑': 10,
      '敌对': 8,
      '恐怖': 6,
      '偏执': 8,
      '精神病性': 10,
    },
    completedAt: '2024-01-15T14:20:00',
    location: '北京市',
  },
]




