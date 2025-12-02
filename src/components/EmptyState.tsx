import { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        <Inbox className="h-8 w-8" />
      </div>
      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}







