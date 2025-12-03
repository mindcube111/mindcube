/**
 * 首页组件
 * 网站入口页面，展示平台介绍和入口
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Shield, 
  BarChart3, 
  Users, 
  ArrowRight, 
  UserPlus,
  Sparkles,
  CheckCircle2,
  Clock,
  FileText,
  ShoppingCart,
  Star,
  Award,
  HelpCircle,
  MessageCircle,
  MapPin,
  Play,
  Quote,
  Activity,
  Layers
} from 'lucide-react'
import { getPublishedQuestionnaires, type QuestionnaireConfig } from '@/utils/questionnaireConfig'

export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState<QuestionnaireConfig[]>([])

  const loadQuestionnaires = () => {
    const published = getPublishedQuestionnaires()
    setAvailableQuestionnaires(published)
  }

  useEffect(() => {
    loadQuestionnaires()
    
    // 监听上架状态更新事件
    const handleUpdate = () => {
      loadQuestionnaires()
    }
    
    window.addEventListener('questionnaire-publish-state-updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    
    return () => {
      window.removeEventListener('questionnaire-publish-state-updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  const handleStartTest = (questionnaireType: string) => {
    // 直接跳转到支付页面（无需登录）
    navigate(`/payment?type=${questionnaireType}`)
  }

  const features = [
    {
      icon: Brain,
      title: '专业测评',
      description: '多种权威心理测评量表，科学评估心理健康状况',
    },
    {
      icon: Shield,
      title: '数据安全',
      description: '严格的数据保护措施，确保用户隐私安全',
    },
    {
      icon: BarChart3,
      title: '数据分析',
      description: '详细的测评报告和数据分析，帮助了解自身状况',
    },
    {
      icon: Users,
      title: '便捷管理',
      description: '简单易用的管理平台，轻松管理测评和用户',
    },
  ]

  const advantages = [
    '专业权威的心理测评量表',
    '详细的测评报告和解读',
    '安全可靠的数据保护',
    '简单易用的操作界面',
    '实时数据统计分析',
    '灵活的链接生成和管理',
  ]

  const stats = [
    { label: '累计用户', value: '10,000+', icon: Users },
    { label: '完成测试', value: '50,000+', icon: FileText },
    { label: '满意度', value: '98%', icon: Star },
    { label: '专业认证', value: 'ISO认证', icon: Award },
  ]

  const steps = [
    {
      number: '01',
      title: '选择测评',
      description: '浏览精选的心理测评题目，选择适合您的测评类型',
      icon: FileText,
    },
    {
      number: '02',
      title: '完成支付',
      description: '安全便捷的支付流程，支持多种支付方式',
      icon: ShoppingCart,
    },
    {
      number: '03',
      title: '开始测试',
      description: '在线完成测评，实时查看进度和结果',
      icon: Play,
    },
    {
      number: '04',
      title: '查看报告',
      description: '获得专业的测评报告和详细的数据分析',
      icon: BarChart3,
    },
  ]

  const testimonials = [
    {
      name: '张先生',
      role: '企业HR',
      content: 'MIND CUBE帮助我们高效管理员工心理健康测评，数据统计功能非常强大。',
      rating: 5,
    },
    {
      name: '李女士',
      role: '心理咨询师',
      content: '专业的测评量表，详细的报告解读，为我的工作提供了很大帮助。',
      rating: 5,
    },
    {
      name: '王同学',
      role: '大学生',
      content: '操作简单，报告详细，让我更好地了解自己的心理健康状况。',
      rating: 5,
    },
  ]

  const faqs = [
    {
      question: '测试需要多长时间？',
      answer: '不同测评的时长不同，通常在10-30分钟之间。您可以在测评卡片上查看预计用时。',
    },
    {
      question: '测试结果是否保密？',
      answer: '是的，我们严格保护用户隐私，所有数据都经过加密处理，不会泄露给第三方。',
    },
    {
      question: '可以重复测试吗？',
      answer: '每个测试链接只能使用一次。如需再次测试，可以重新购买。',
    },
    {
      question: '如何查看测试报告？',
      answer: '完成测试后，系统会自动生成报告，您可以在测试完成页面或通过邮件查看。',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 导航栏 */}
      <nav className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-700/80 shadow-md shadow-gray-200/30 dark:shadow-gray-900/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex-shrink-0 shadow-lg bg-primary-500/10">
                <img
                  src="/logo-cube.jpg"
                  alt="MIND CUBE Logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">MIND CUBE</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">心理测评管理平台</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {!isAuthenticated && (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    登录
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
                  >
                    <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">注册</span>
                  </button>
                </>
              )}
              {isAuthenticated && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
                >
                  <span className="hidden sm:inline">进入系统</span>
                  <span className="sm:hidden">进入</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* 英雄区域 */}
        <section className="text-center py-8 sm:py-12 relative overflow-hidden">
          {/* 装饰性背景元素 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-20 left-10 w-32 h-32 bg-primary-200/20 dark:bg-primary-800/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute top-40 right-20 w-40 h-40 bg-secondary-200/20 dark:bg-secondary-800/20 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl mb-4 sm:mb-6 shadow-lg shadow-primary-500/30 bg-primary-500/10"
              whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.3 }}
            >
              <img
                src="/logo-cube.jpg"
                alt="MIND CUBE Logo"
                className="w-full h-full rounded-2xl object-cover"
              />
            </motion.div>
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 bg-clip-text text-transparent mb-4 sm:mb-5 px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              MIND CUBE
            </motion.h1>
            <motion.p
              className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-700 dark:text-gray-200 mb-3 sm:mb-4 px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              心理测评管理平台
            </motion.p>
            <motion.p
              className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6 sm:mb-8 px-4 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              专业、便捷、可信赖的心理健康测评管理系统
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              为个人和组织提供科学、准确的心理健康评估服务
            </motion.p>
          </motion.div>
        </section>

        {/* 统计数据 */}
        <section className="py-6 sm:py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-7 shadow-lg border border-gray-200 dark:border-gray-700 text-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                >
                  <motion.div
                    className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-xl flex items-center justify-center mx-auto mb-4"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" />
                  </motion.div>
                  <motion.div
                    className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 bg-clip-text text-transparent mb-2"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* 使用流程 */}
        <section className="py-8 sm:py-12">
          <motion.div
            className="text-center mb-8 sm:mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 sm:mb-4">
              简单四步，开始测试
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 px-4">
              无需注册，支付后即可开始，流程简单快捷
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={index}
                  className="relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <motion.div
                    className="absolute -top-4 -left-4 w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    {step.number}
                  </motion.div>
                  <motion.div
                    className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-xl flex items-center justify-center mb-5 mt-6"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                  {index < steps.length - 1 && (
                    <motion.div
                      className="hidden lg:block absolute -right-3 top-1/2 transform -translate-y-1/2"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                    >
                      <ArrowRight className="w-7 h-7 text-primary-400" />
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* 题目架 */}
        <section className="py-8 sm:py-12">
          <motion.div
            className="text-center mb-8 sm:mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 sm:mb-4">
              精选测评题目
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 px-4">
              选择适合您的心理测评，开始您的心理健康之旅
            </p>
          </motion.div>
          {availableQuestionnaires.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {availableQuestionnaires.map((questionnaire, index) => (
                <motion.div
                  key={questionnaire.value}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 group relative overflow-hidden"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-50/30 dark:from-primary-900/0 dark:to-primary-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {/* 价格标签 */}
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white break-words">
                          {questionnaire.label}
                        </h3>
                        {questionnaire.isCustom && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded flex-shrink-0">
                            自定义
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {questionnaire.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="inline-flex flex-col items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 bg-primary-500 text-white rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold">¥{questionnaire.price}</div>
                        <div className="text-[10px] sm:text-xs opacity-90 whitespace-nowrap">每次测试</div>
                      </div>
                    </div>
                  </div>

                  {/* 特性标签 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {questionnaire.features.slice(0, 3).map((feature, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* 详细信息 */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>{questionnaire.questions}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{questionnaire.duration}</span>
                    </div>
                  </div>

                  {/* 开始测试按钮 */}
                  <motion.button
                    onClick={() => handleStartTest(questionnaire.value)}
                    className="w-full px-4 py-2 sm:py-3 bg-primary-500 text-white rounded-lg flex items-center justify-center gap-2 font-bold shadow-md relative z-10 text-sm sm:text-base"
                    whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>开始测试</span>
                  </motion.button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">暂无可用的测评题目</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                管理员可以在后台管理问卷类型
              </p>
            </div>
          )}
        </section>

        {/* 功能特性 */}
        <section className="py-8 sm:py-12">
          <motion.h2
            className="text-3xl sm:text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-8 sm:mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            平台特性
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-7 shadow-lg border border-gray-200 dark:border-gray-700 relative overflow-hidden group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-50/50 dark:from-primary-900/0 dark:to-primary-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <motion.div
                    className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-xl flex items-center justify-center mb-5 relative z-10"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" />
                  </motion.div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 relative z-10">
                    {feature.title}
                  </h3>
                  <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed relative z-10">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* 平台优势 */}
        <section className="py-8 sm:py-12 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl px-4 sm:px-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <Activity className="w-96 h-96 absolute -top-20 -right-20 text-primary-500" />
            <Layers className="w-96 h-96 absolute -bottom-20 -left-20 text-secondary-500" />
          </div>
          <div className="max-w-4xl mx-auto relative z-10">
            <motion.h2
              className="text-3xl sm:text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-8 sm:mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              为什么选择 MIND CUBE？
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {advantages.map((advantage, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-4 p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ x: 5, scale: 1.02 }}
                >
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-primary-500 flex-shrink-0" />
                  </motion.div>
                  <span className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300">{advantage}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 用户评价 */}
        <section className="py-8 sm:py-12">
          <motion.div
            className="text-center mb-8 sm:mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 sm:mb-4">
              用户评价
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 px-4">
              真实用户的使用体验和反馈
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-7 shadow-lg border border-gray-200 dark:border-gray-700 relative overflow-hidden group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100/20 dark:bg-primary-900/20 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-primary-300 mb-3" />
                <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 relative z-10">
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-full flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </motion.div>
                  <div>
                    <div className="font-bold text-lg text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 常见问题 */}
        <section className="py-8 sm:py-12 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl px-4 sm:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="text-center mb-8 sm:mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 sm:mb-4">
                常见问题
              </h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
                解答您可能关心的问题
              </p>
            </motion.div>
            <div className="space-y-4 sm:space-y-5">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 sm:p-7 border border-gray-200 dark:border-gray-600 group cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ x: 5, scale: 1.01, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
                >
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.5 }}
                    >
                      <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7 text-primary-500 flex-shrink-0 mt-0.5" />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3">
                        {faq.question}
                      </h3>
                      <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA 区域 */}
        <section className="py-8 sm:py-12 text-center">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-6 sm:p-10 shadow-lg border border-gray-200 dark:border-gray-700 relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0 opacity-10">
              <motion.div
                className="absolute top-0 left-0 w-64 h-64 bg-primary-200 dark:bg-primary-800 rounded-full -translate-x-1/2 -translate-y-1/2"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute bottom-0 right-0 w-96 h-96 bg-primary-200 dark:bg-primary-800 rounded-full translate-x-1/2 translate-y-1/2"
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />
            </div>
            <div className="relative z-10">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 sm:mb-5 text-primary-500" />
              </motion.div>
              <motion.h2
                className="text-3xl sm:text-4xl font-extrabold mb-3 sm:mb-4 text-gray-900 dark:text-white"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                准备开始您的心理测评之旅？
              </motion.h2>
              <motion.p
                className="text-lg sm:text-xl mb-6 sm:mb-8 text-gray-600 dark:text-gray-400"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                立即注册，体验专业的心理健康测评服务
              </motion.p>
              {!isAuthenticated && (
                <motion.button
                  onClick={() => navigate('/register')}
                  className="px-8 sm:px-10 py-4 sm:py-5 bg-primary-500 text-white rounded-xl flex items-center justify-center gap-2 text-lg sm:text-xl font-bold shadow-xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
                  立即注册
                </motion.button>
              )}
            </div>
          </motion.div>
        </section>

        {/* 联系方式区域 */}
        <section className="py-8 sm:py-12">
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 shadow-lg border border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.h3
              className="text-gray-900 dark:text-white font-extrabold text-2xl sm:text-3xl mb-6 sm:mb-7 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              联系我们
            </motion.h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <motion.div
                className="flex items-center gap-4 group cursor-pointer bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/30 rounded-xl p-5 sm:p-6 relative overflow-hidden"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ scale: 1.02, y: -3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-200/0 to-primary-200/20 dark:from-primary-800/0 dark:to-primary-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <motion.div
                  className="w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 shadow-lg"
                  whileHover={{ scale: 1.15, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <MessageCircle className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
                </motion.div>
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-400 mb-1.5">微信客服</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white truncate">Mindcube111</div>
                </div>
              </motion.div>
              <motion.div
                className="flex items-center gap-4 group cursor-pointer bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/30 rounded-xl p-5 sm:p-6 relative overflow-hidden"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{ scale: 1.02, y: -3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-200/0 to-primary-200/20 dark:from-primary-800/0 dark:to-primary-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <motion.div
                  className="w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 shadow-lg"
                  whileHover={{ scale: 1.15, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <MapPin className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
                </motion.div>
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-400 mb-1.5">公司地址</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">北京市朝阳区</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-gray-400 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* 其他信息 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
            {/* 关于我们 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/logo-cube.jpg"
                  alt="MIND CUBE Logo"
                  className="w-8 h-8 rounded-lg"
                />
                <h3 className="text-white font-bold">MIND CUBE</h3>
              </div>
              <p className="text-sm mb-4">
                专业、便捷、可信赖的心理健康测评管理系统
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4" />
                <span>ISO 27001 认证</span>
              </div>
            </div>

            {/* 快速链接 */}
            <div>
              <h4 className="text-white font-semibold mb-4">快速链接</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => navigate('/')}
                    className="hover:text-white transition-colors"
                  >
                    首页
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/login')}
                    className="hover:text-white transition-colors"
                  >
                    登录
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/register')}
                    className="hover:text-white transition-colors"
                  >
                    注册
                  </button>
                </li>
              </ul>
            </div>

            {/* 服务支持 */}
            <div>
              <h4 className="text-white font-semibold mb-4">服务支持</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button className="hover:text-white transition-colors">
                    帮助中心
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">
                    隐私政策
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">
                    用户协议
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 text-center text-sm">
            <p>© 2025 MIND CUBE 心理测评管理平台. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

