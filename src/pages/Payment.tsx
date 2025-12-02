import PageTransition from '@/components/PageTransition'

export default function Payment() {
  return (
    <PageTransition>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            支付页面建设中
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            当前支付功能暂未开放，请联系管理员或稍后再试。
          </p>
        </div>
      </div>
    </PageTransition>
  )
}


