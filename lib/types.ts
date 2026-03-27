export type UserRole = 'admin' | 'agency'

export type TaskStatus = 'Pending' | 'In Progress' | 'Done' | 'Verified' | 'Failed'
export type TaskCategory = 'SEO' | 'Google Ads' | 'Meta' | 'GEO' | 'Local'
export type VerificationResult = 'Pass' | 'Fail' | 'Needs Manual Review'
export type MetricTrend = 'up' | 'down' | 'flat'
export type MetricSection = 'SEO' | 'PAID' | 'CHANNEL HEALTH' | 'LOCAL GEO' | 'AI / GEO'

export interface Task {
  id: string
  title: string
  description: string
  category: TaskCategory
  due_date: string | null
  status: TaskStatus
  agency_response: string | null
  evidence_link: string | null
  ai_verification_result: VerificationResult | null
  ai_verification_reason: string | null
  admin_override: boolean
  admin_context: string | null
  approved: boolean
  created_at: string
}

export interface Metric {
  id: string
  metric_name: string
  section: MetricSection
  what_it_tells_you: string
  target: string
  last_month_value: string
  this_month_value: string
  trend: MetricTrend
  sort_order: number
  updated_at: string
}

export interface ContextMemory {
  id: string
  context_text: string
  related_task_id: string | null
  created_at: string
}

export interface GeneratedTask {
  title: string
  description: string
  category: TaskCategory
}

export interface WebsiteAnalysis {
  seoHealth: string
  topPages: string
  contentGaps: string
  quickWins: string
}
