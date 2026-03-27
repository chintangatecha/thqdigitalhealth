import { MetricTrend } from '@/lib/types'

interface TrendArrowProps {
  trend: MetricTrend
}

export default function TrendArrow({ trend }: TrendArrowProps) {
  if (trend === 'up') {
    return <span className="trend-up" style={{ fontSize: '16px', fontWeight: 'bold' }}>↑</span>
  }
  if (trend === 'down') {
    return <span className="trend-down" style={{ fontSize: '16px', fontWeight: 'bold' }}>↓</span>
  }
  return <span className="trend-flat" style={{ fontSize: '16px' }}>→</span>
}
