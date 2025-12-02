/**
 * 报告管理工具
 * 从链接中提取报告信息，管理报告数据
 */

import { Report } from '@/types'
import { loadLinks } from './links'

const REPORT_STORAGE_KEY = 'reports'

export function loadReports(): Report[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(REPORT_STORAGE_KEY)
    const persisted: Report[] = stored ? JSON.parse(stored) : []
    const links = loadLinks()

    const reports = links
      .filter(link => link.reportId)
      .map(link => persisted.find(report => report.id === link.reportId))
      .filter((report): report is Report => Boolean(report))

    return reports
  } catch (error) {
    console.warn('报告列表读取失败', error)
    return []
  }
}

export function saveReport(report: Report): void {
  if (typeof window === 'undefined') return

  try {
    const existing = loadReports()
    const updated = existing.filter(r => r.id !== report.id)
    updated.push(report)
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('保存报告失败', error)
  }
}

export function getReportById(reportId: string): Report | null {
  return loadReports().find(report => report.id === reportId) ?? null
}

export function deleteReport(reportId: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const reports = loadReports()
    const filtered = reports.filter(report => report.id !== reportId)
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(filtered))
    return filtered.length < reports.length
  } catch (error) {
    console.error('删除报告失败', error)
    return false
  }
}







