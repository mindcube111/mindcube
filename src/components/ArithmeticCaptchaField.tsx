import { RefreshCw } from 'lucide-react'

interface ArithmeticCaptchaFieldProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  expression: string
  onRefresh: () => void
  disabled?: boolean
  helperText?: string
}

export default function ArithmeticCaptchaField({
  label = '验证码',
  placeholder = '计算结果',
  value,
  onChange,
  expression,
  onRefresh,
  disabled = false,
  helperText = '请输入右侧算式的计算结果',
}: ArithmeticCaptchaFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-3">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input flex-1"
          placeholder={placeholder}
          required
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-base font-semibold text-gray-700 shadow-sm hover:bg-white transition-colors"
          aria-label="刷新验证码"
          disabled={disabled}
        >
          <span className="whitespace-nowrap">{expression} =</span>
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      {helperText && (
        <p className="mt-1 text-xs text-gray-400">{helperText}</p>
      )}
    </div>
  )
}



