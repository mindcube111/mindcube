/**
 * 增强的搜索输入组件
 * 支持搜索高亮、搜索历史、自动完成
 */

import { useState, useRef, useEffect } from 'react'
import { Search, X, Clock, TrendingUp } from 'lucide-react'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  suggestions?: string[]
  showHistory?: boolean
  maxHistory?: number
  onSearch?: (value: string) => void
  className?: string
}

export default function SearchInput({
  value,
  onChange,
  placeholder = '搜索...',
  suggestions = [],
  showHistory = true,
  maxHistory = 5,
  onSearch,
  className = '',
}: SearchInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 从 localStorage 加载搜索历史
    if (showHistory) {
      try {
        const stored = localStorage.getItem('search_history')
        if (stored) {
          setSearchHistory(JSON.parse(stored).slice(0, maxHistory))
        }
      } catch {
        // 忽略错误
      }
    }
  }, [showHistory, maxHistory])

  const handleSearch = (searchValue: string) => {
    if (!searchValue.trim()) return

    // 保存到搜索历史
    if (showHistory) {
      const newHistory = [
        searchValue,
        ...searchHistory.filter(item => item !== searchValue),
      ].slice(0, maxHistory)
      setSearchHistory(newHistory)
      localStorage.setItem('search_history', JSON.stringify(newHistory))
    }

    onChange(searchValue)
    onSearch?.(searchValue)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(value)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  const filteredSuggestions = suggestions.filter(
    item => item.toLowerCase().includes(value.toLowerCase()) && item !== value
  )

  const filteredHistory = searchHistory.filter(
    (item) => item.toLowerCase().includes(value.toLowerCase()) && item !== value
  )

  const hasSuggestions =
    value.trim().length > 0 && (filteredSuggestions.length > 0 || filteredHistory.length > 0)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(hasSuggestions)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="input pl-10 pr-10"
        />
        {value && (
          <button
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 搜索建议和历史 */}
      {showSuggestions && hasSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg max-h-64 overflow-y-auto">
          {filteredHistory.length > 0 && (
            <div className="p-2 border-b border-gray-100">
              <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-gray-500">
                <Clock className="w-3 h-3" />
                搜索历史
              </div>
              {filteredHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(item)}
                  className="w-full text-left px-2 py-2 hover:bg-gray-50 rounded text-sm text-gray-700 flex items-center gap-2"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  {item}
                </button>
              ))}
            </div>
          )}

          {filteredSuggestions.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-gray-500">
                <TrendingUp className="w-3 h-3" />
                搜索建议
              </div>
              {filteredSuggestions.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(item)}
                  className="w-full text-left px-2 py-2 hover:bg-gray-50 rounded text-sm text-gray-700"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

