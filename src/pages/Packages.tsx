import { useEffect, useState } from 'react'
import { Check, ShoppingCart, Crown } from 'lucide-react'
import { Package } from '@/types'
import { mockPackages } from '@/data/mockData'
import { formatNumber } from '@/utils/formatters'
import { useConfirmDialog } from '@/components/ConfirmDialog'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getCurrentUser } from '@/services/api/auth'
import { getMyOrders, type Order } from '@/services/api/orders'

export default function Packages() {
  const [selectedId, setSelectedId] = useState<string>(
    mockPackages.find((pkg) => pkg.recommended)?.id ?? mockPackages[0].id,
  )
  const { showAlert, DialogComponent } = useConfirmDialog()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [remainingQuota, setRemainingQuota] = useState<number>(user?.remainingQuota ?? 0)
  const [orders, setOrders] = useState<
    Array<{
      id: string | number
      name: string
      quota: number
      price: number
      time: string
      status: string
      unlimited?: boolean
    }>
  >([])

  useEffect(() => {
    const fetchData = async () => {
      // 剩余额度优先从后端获取，失败则回退到前端 user
      try {
        const res = await getCurrentUser()
        if (res.success && res.data && typeof res.data.remainingQuota === 'number') {
          setRemainingQuota(res.data.remainingQuota)
        } else if (user?.remainingQuota != null) {
          setRemainingQuota(user.remainingQuota)
        }
      } catch {
        if (user?.remainingQuota != null) {
          setRemainingQuota(user.remainingQuota)
        }
      }

      // 购买记录从订单接口获取，失败则使用示例数据
      try {
        const res = await getMyOrders()
        if (res.success && res.data?.orders) {
          const list = res.data.orders.map((order: Order) => {
            const pkg = mockPackages.find((p) => p.id === order.packageId)
            return {
              id: order.id,
              name: order.packageName || pkg?.name || order.packageId || '未知套餐',
              quota: pkg?.quota ?? 0,
              price: order.amount,
              time: new Date(order.createdAt).toLocaleString(),
              status: order.status === 'paid' ? '已完成' : order.status === 'pending' ? '待支付' : '已失败',
              unlimited: pkg?.unlimited,
            }
          })
          setOrders(list)
          return
        }
      } catch {
        // ignore and use fallback
      }

      setOrders([
        { id: 1, name: '标准套餐', quota: 1300, price: 199, time: '2024-03-05', status: '已完成' },
        { id: 2, name: '旗舰套餐', quota: 5500, price: 599, time: '2024-02-22', status: '已完成' },
        { id: 3, name: '年费套餐', quota: 0, price: 1688, time: '2024-01-18', status: '已完成', unlimited: true },
      ])
    }

    void fetchData()
  }, [user])

  const handlePurchase = async (pkg: Package) => {
    const quotaLabel = pkg.unlimited ? '不限量' : `${formatNumber(pkg.quota)} 条`

    const confirmed = await showAlert(
      '确认购买套餐',
      `准备购买套餐：${pkg.name}（${quotaLabel}，¥${pkg.price}）\n\n将跳转至支付页面，仅支持支付宝支付。`,
      'info'
    )

    if (!confirmed) return

    navigate('/payment', {
      state: {
        from: 'packages',
        packageId: pkg.id,
        name: pkg.name,
        money: pkg.price.toFixed(2),
        param: `套餐购买:${pkg.name}`,
      },
    })
  }

  return (
    <div className="space-y-6">
      {DialogComponent}
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900">购买套餐</h1>
        <p className="text-gray-600 mt-2">最新套餐覆盖 5 种场景，从个人到大型机构都可使用</p>
      </div>

      {/* 当前额度 */}
      <div className="card bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80">当前剩余链接</p>
            <p className="text-4xl font-bold mt-2">{formatNumber(remainingQuota)}</p>
            <p className="text-white/70 mt-2">链接适用于所有问卷类型</p>
          </div>
          <div className="text-right">
            <p className="text-white/80">累计已用</p>
            <p className="text-3xl font-bold mt-2">1,520</p>
            <p className="text-white/70 mt-2">最近 30 天使用量</p>
          </div>
        </div>
      </div>

      {/* 套餐列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {mockPackages.map((pkg) => {
          const quotaLabel = pkg.unlimited ? '全年不限量' : `${formatNumber(pkg.quota)} 条`
          const pricePer = pkg.unlimited ? '不限次数 · 按年结算' : `约 ¥${(pkg.price / pkg.quota).toFixed(2)}/条`
          const isSelected = selectedId === pkg.id

          return (
            <div
              key={pkg.id}
              className={`card relative transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-secondary-500 shadow-2xl scale-[1.02]'
                  : 'hover:shadow-xl'
              }`}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedId(pkg.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedId(pkg.id)
                }
              }}
            >
              {pkg.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">
                    推荐
                  </span>
                </div>
              )}
              {pkg.unlimited && (
                <div className="absolute top-4 right-4 text-accent-500">
                  <Crown className="w-6 h-6" />
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">{pkg.name}</h3>
                <div className="mt-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">¥{pkg.price}</span>
                    {pkg.originalPrice && (
                      <span className="ml-2 text-lg text-gray-500 line-through">
                        ¥{pkg.originalPrice}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-2">{quotaLabel}</p>
                  <p className="text-sm text-gray-500 mt-1">{pricePer}</p>
                </div>

                <div className="mt-6 text-left">
                  <p className="text-sm text-gray-700 mb-3">{pkg.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span>适用于所有问卷类型</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span>链接永久有效，不设过期</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span>数据永久保存，可随时导出</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span>专业化报告自动生成</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePurchase(pkg)
                  }}
                  className={`w-full mt-6 py-3 rounded-lg font-medium transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 inline mr-2" />
                  立即购买
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* 购买说明 */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">购买说明</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• 购买的额度适用于所有问卷类型</li>
          <li>• 1个额度 = 生成1个测试链接</li>
          <li>• 额度永久有效，不会过期</li>
          <li>• 购买后立即到账，可立即使用</li>
        </ul>
      </div>

      {/* 购买记录 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">购买记录</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted text-text">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">套餐名称</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">购买额度</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">支付金额</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">购买时间</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">状态</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    暂无购买记录
                  </td>
                </tr>
              ) : (
                orders.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{record.name}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {record.unlimited ? '不限量' : `${formatNumber(record.quota)} 条`}
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">¥{record.price}</td>
                    <td className="py-3 px-4 text-gray-600">{record.time}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

