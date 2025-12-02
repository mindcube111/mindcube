/**
 * 数据导出工具函数
 * 支持 Excel 和 PDF 导出
 */

import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Link, LinkStatus } from '@/types'

export type ExportFormat = 'excel' | 'csv' | 'pdf'

export interface ExportColumn<T extends Record<string, any>> {
  key: keyof T | string
  label: string
  width?: number
}

export interface ExportDataOptions<T extends Record<string, any>> {
  data: T[]
  filename: string
  format: ExportFormat
  columns?: Array<ExportColumn<T>>
  title?: string
  orientation?: 'portrait' | 'landscape'
}

function formatCellValue(value: unknown) {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toLocaleString('zh-CN')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function getCellValue<T extends Record<string, any>>(item: T, key: keyof T | string) {
  return (item as Record<string, any>)[key as string]
}

/**
 * 导出数据到 Excel
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: Array<{ key: keyof T | string; label: string; width?: number }>
) {
  if (!data || data.length === 0) {
    throw new Error('没有可导出的数据')
  }

  // 如果没有指定列，使用数据的第一项自动生成列
  if (!columns) {
    const firstItem = data[0]
    columns = Object.keys(firstItem).map((key) => ({
      key: key as keyof T,
      label: key,
    }))
  }

  // 创建工作表数据
  const worksheetData = [
    columns.map((col) => col.label),
    ...data.map((item) =>
      columns!.map((col) => {
        const value = getCellValue(item, col.key)
        return formatCellValue(value)
      })
    ),
  ]

  // 创建工作簿
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(worksheetData)

  // 设置列宽
  if (columns.some((col) => col.width)) {
    ws['!cols'] = columns.map((col) => ({ wch: col.width || 15 }))
  } else {
    // 自动计算列宽
    ws['!cols'] = columns.map(() => ({ wch: 15 }))
  }

  // 添加工作表
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

  // 导出文件
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/**
 * 导出数据到 PDF
 */
export function exportToPDF<T extends Record<string, any>>(
  data: T[],
  filename: string,
  title: string,
  columns?: Array<{ key: keyof T | string; label: string }>,
  options?: {
    orientation?: 'portrait' | 'landscape'
    unit?: 'mm' | 'pt' | 'px' | 'in'
    format?: 'a4' | 'letter'
  }
) {
  if (!data || data.length === 0) {
    throw new Error('没有可导出的数据')
  }

  const {
    orientation = 'portrait',
    unit = 'mm',
    format = 'a4',
  } = options || {}

  // 创建 PDF 文档
  const doc = new jsPDF({
    orientation,
    unit,
    format,
  })

  // 设置中文字体（如果需要中文，可能需要配置字体）
  doc.setFont('helvetica')

  // 添加标题
  doc.setFontSize(16)
  doc.text(title, 14, 15)

  // 添加日期
  doc.setFontSize(10)
  doc.text(`导出时间: ${new Date().toLocaleString('zh-CN')}`, 14, 22)

  // 如果没有指定列，使用数据的第一项自动生成列
  if (!columns) {
    const firstItem = data[0]
    columns = Object.keys(firstItem).map((key) => ({
      key: key as keyof T,
      label: key,
    }))
  }

  // 准备表格数据
  const tableData = data.map((item) =>
    columns!.map((col) => formatCellValue(getCellValue(item, col.key)))
  )

  const headers = columns.map((col) => col.label)

  // 添加表格
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 30,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [74, 108, 247], // primary-500
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { top: 30 },
  })

  // 保存文件
  doc.save(`${filename}.pdf`)
}

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: Array<{ key: keyof T | string; label: string }>
) {
  if (!data || data.length === 0) {
    throw new Error('没有可导出的数据')
  }

  if (!columns) {
    const firstItem = data[0]
    columns = Object.keys(firstItem).map((key) => ({
      key: key as keyof T,
      label: key,
    }))
  }

  const csvRows = [
    columns.map((col) => col.label),
    ...data.map((item) =>
      columns!.map((col) => {
        const raw = formatCellValue(getCellValue(item, col.key))
        const safe = raw.replace(/"/g, '""')
        return `"${safe}"`
      })
    ),
  ]

  const csvContent = csvRows.map((row) => row.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function exportData<T extends Record<string, any>>({
  data,
  filename,
  format,
  columns,
  title = filename,
  orientation = 'landscape',
}: ExportDataOptions<T>) {
  switch (format) {
    case 'excel':
      exportToExcel(data, filename, columns)
      break
    case 'csv':
      exportToCSV(data, filename, columns)
      break
    case 'pdf':
      exportToPDF(data, filename, title, columns, { orientation })
      break
    default:
      throw new Error(`不支持的导出格式：${format}`)
  }
}

/**
 * 导出链接列表到 Excel
 */
export function exportLinksToExcel(
  links: Link[],
  filename?: string
) {
  const statusMap: Record<LinkStatus, string> = {
    unused: '未使用',
    used: '已使用',
    expired: '已过期',
    disabled: '已禁用',
  }

  const data = links.map((link) => ({
    url: link.url,
    questionnaireType: link.questionnaireType,
    status: statusMap[link.status] || link.status,
    createdAt: new Date(link.createdAt).toLocaleString('zh-CN'),
    usedAt: link.usedAt ? new Date(link.usedAt).toLocaleString('zh-CN') : '未使用',
    reportId: link.reportId || '-',
  }))

  exportToExcel(data, filename || `链接列表_${new Date().toISOString().split('T')[0]}`)
}

/**
 * 导出 Dashboard 统计到 PDF
 */
export function exportDashboardToPDF(
  stats: {
    totalLinks: number
    remainingQuota: number
    todayUsedLinks: number
    unusedLinks: number
    participationRate: number
  },
  chartData?: Array<{ name: string; 链接数: number; 使用率: number }>,
  filename?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  let yPos = 15

  // 标题
  doc.setFontSize(18)
  doc.text('Dashboard 数据统计报告', 105, yPos, { align: 'center' })
  yPos += 10

  // 日期
  doc.setFontSize(10)
  doc.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, 14, yPos)
  yPos += 15

  // 统计数据表格
  const statsData = [
    ['总链接数', stats.totalLinks.toString()],
    ['剩余额度', stats.remainingQuota.toString()],
    ['今日使用', stats.todayUsedLinks.toString()],
    ['未使用链接', stats.unusedLinks.toString()],
    ['参与率', `${(stats.participationRate * 100).toFixed(2)}%`],
  ]

  autoTable(doc, {
    head: [['统计项', '数值']],
    body: statsData,
    startY: yPos,
    styles: {
      fontSize: 11,
      cellPadding: 5,
    },
    headStyles: {
      fillColor: [74, 108, 247],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 40 },
    },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // 如果有图表数据，添加表格
  if (chartData && chartData.length > 0) {
    doc.setFontSize(14)
    doc.text('链接使用趋势', 14, yPos)
    yPos += 8

    const chartTableData = chartData.map((item) => [
      item.name,
      item.链接数.toString(),
      `${(item.使用率 * 100).toFixed(2)}%`,
    ])

    autoTable(doc, {
      head: [['时间', '链接数', '使用率']],
      body: chartTableData,
      startY: yPos,
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [74, 108, 247],
        textColor: 255,
        fontStyle: 'bold',
      },
    })
  }

  // 保存文件
  doc.save(filename || `Dashboard统计_${new Date().toISOString().split('T')[0]}.pdf`)
}

