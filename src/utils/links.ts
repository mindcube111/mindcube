/**
 * 链接管理工具函数
 * 用于管理生成的测试链接，确保一次性使用
 * 
 * @module utils/links
 */

import { Link, LinkStatus, QuestionnaireType } from '@/types'
import { generateId, generateTestLink } from './formatters'
import { STORAGE_KEYS } from '@/constants'
import { getCachedStorageItem, setCachedStorageItem } from './cache'

const LINKS_STORAGE_KEY = STORAGE_KEYS.LINKS

/**
 * 从 localStorage 加载所有链接
 * @returns 链接数组
 */
export function loadLinks(): Link[] {
  if (typeof window === 'undefined') return []
  const stored = getCachedStorageItem<Link[]>(LINKS_STORAGE_KEY, [])
  return Array.isArray(stored) ? stored : []
}

/**
 * 保存链接到 localStorage
 * @param links - 要保存的链接数组
 */
export function saveLinks(links: Link[]): void {
  if (typeof window === 'undefined') return
  try {
    setCachedStorageItem(LINKS_STORAGE_KEY, links)
    // 触发自定义事件，通知其他组件更新
    window.dispatchEvent(new Event('links-updated'))
  } catch (error) {
    console.error('Failed to save links:', error)
  }
}

/**
 * 添加新链接
 * @param questionnaireType - 问卷类型
 * @param quantity - 生成数量，默认为1
 * @param createdBy - 创建者用户ID，可选
 * @returns 新生成的链接数组
 */
export function addLinks(questionnaireType: QuestionnaireType, quantity: number = 1, createdBy?: string): Link[] {
  const existingLinks = loadLinks()
  const newLinks: Link[] = []

  for (let i = 0; i < quantity; i++) {
    const id = generateId()
    const link: Link = {
      id,
      url: generateTestLink(id),
      questionnaireType,
      status: 'unused', // 新生成的链接默认为未使用状态
      createdAt: new Date().toISOString(),
      createdBy, // 记录创建者
    }
    newLinks.push(link)
  }

  const allLinks = [...existingLinks, ...newLinks]
  saveLinks(allLinks)
  return newLinks
}

/**
 * 根据 ID 获取链接
 */
export function getLinkById(linkId: string): Link | null {
  const links = loadLinks()
  return links.find((link) => link.id === linkId) || null
}

/**
 * 根据 URL 获取链接
 */
export function getLinkByUrl(url: string): Link | null {
  const links = loadLinks()
  return links.find((link) => link.url === url) || null
}

/**
 * 更新链接状态
 */
export function updateLinkStatus(
  linkId: string,
  status: LinkStatus,
  reportId?: string
): boolean {
  const links = loadLinks()
  const linkIndex = links.findIndex((link) => link.id === linkId)

  if (linkIndex === -1) return false

  links[linkIndex] = {
    ...links[linkIndex],
    status,
    usedAt: status === 'used' ? new Date().toISOString() : links[linkIndex].usedAt,
    reportId: reportId || links[linkIndex].reportId,
  }

  saveLinks(links)
  return true
}

/**
 * 使用链接（一次性使用）
 * 如果链接已经被使用，返回 false
 */
export function useLink(linkId: string, reportId?: string): boolean {
  const links = loadLinks()
  const linkIndex = links.findIndex((link) => link.id === linkId)

  if (linkIndex === -1) return false

  const link = links[linkIndex]

  // 如果链接已经被使用，返回 false
  if (link.status === 'used') {
    return false
  }

  // 标记为已使用
  links[linkIndex] = {
    ...link,
    status: 'used',
    usedAt: new Date().toISOString(),
    reportId: reportId || link.reportId,
  }

  saveLinks(links)
  return true
}

/**
 * 删除链接
 */
export function deleteLink(linkId: string): boolean {
  const links = loadLinks()
  const filtered = links.filter((link) => link.id !== linkId)
  
  if (filtered.length === links.length) return false // 链接不存在

  saveLinks(filtered)
  return true
}

/**
 * 批量删除链接
 */
export function batchDeleteLinks(linkIds: string[]): number {
  const links = loadLinks()
  const filtered = links.filter((link) => !linkIds.includes(link.id))
  const deletedCount = links.length - filtered.length

  if (deletedCount > 0) {
    saveLinks(filtered)
  }

  return deletedCount
}

/**
 * 批量更新链接状态
 */
export function batchUpdateLinkStatus(linkIds: string[], status: LinkStatus): number {
  const links = loadLinks()
  let updatedCount = 0

  const updated = links.map((link) => {
    if (linkIds.includes(link.id)) {
      updatedCount++
      return {
        ...link,
        status,
        usedAt: status === 'used' && !link.usedAt ? new Date().toISOString() : link.usedAt,
      }
    }
    return link
  })

  if (updatedCount > 0) {
    saveLinks(updated)
  }

  return updatedCount
}

/**
 * 清除所有链接
 */
export function clearAllLinks(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LINKS_STORAGE_KEY)
  window.dispatchEvent(new Event('links-updated'))
}

/**
 * 获取链接统计信息
 */
export function getLinkStats() {
  const links = loadLinks()
  return {
    total: links.length,
    unused: links.filter((l) => l.status === 'unused').length,
    used: links.filter((l) => l.status === 'used').length,
    expired: links.filter((l) => l.status === 'expired').length,
    disabled: links.filter((l) => l.status === 'disabled').length,
  }
}



