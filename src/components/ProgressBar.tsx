interface ProgressBarProps {
  progress: number
  variant?: 'default' | 'success' | 'danger'
  showLabel?: boolean
}

const variantClass: Record<NonNullable<ProgressBarProps['variant']>, string> = {
  default: 'bg-primary-500',
  success: 'bg-emerald-500',
  danger: 'bg-red-500',
}

export default function ProgressBar({ progress, variant = 'default', showLabel = true }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(progress)))

  return (
    <div className="space-y-1">
      <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className={`${variantClass[variant]} h-full transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-right text-xs text-gray-500">
          {clamped}
          %
        </div>
      )}
    </div>
  )
}








