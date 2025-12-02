import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface CollapsiblePanelProps {
  title: ReactNode
  children: ReactNode
  defaultExpanded?: boolean
  actions?: ReactNode
}

export default function CollapsiblePanel({
  title,
  children,
  defaultExpanded = true,
  actions,
}: CollapsiblePanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <section className="border border-gray-200 rounded-2xl bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 sm:px-6 py-4 text-left"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
          <div className="text-base font-semibold text-gray-900 dark:text-white">{title}</div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </button>

      {expanded && <div className="px-4 sm:px-6 pb-5">{children}</div>}
    </section>
  )
}








