import { TaskStatus, TaskCategory, VerificationResult } from '@/lib/types'

interface StatusBadgeProps {
  status?: TaskStatus
  category?: TaskCategory
  verification?: VerificationResult
}

export default function StatusBadge({ status, category, verification }: StatusBadgeProps) {
  if (status) {
    const classMap: Record<TaskStatus, string> = {
      'Pending': 'badge badge-pending',
      'In Progress': 'badge badge-inprogress',
      'Done': 'badge badge-done',
      'Verified': 'badge badge-verified',
      'Failed': 'badge badge-failed',
    }
    return <span className={classMap[status]}>{status}</span>
  }

  if (category) {
    const classMap: Record<TaskCategory, string> = {
      'SEO': 'badge badge-seo',
      'Google Ads': 'badge badge-ads',
      'Meta': 'badge badge-meta',
      'GEO': 'badge badge-geo',
      'Local': 'badge badge-local',
    }
    return <span className={classMap[category]}>{category}</span>
  }

  if (verification) {
    const classMap: Record<VerificationResult, string> = {
      'Pass': 'badge badge-pass',
      'Fail': 'badge badge-fail',
      'Needs Manual Review': 'badge badge-manual',
    }
    return <span className={classMap[verification]}>{verification}</span>
  }

  return null
}
