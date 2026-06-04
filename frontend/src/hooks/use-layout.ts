'use client'

import { useState, useEffect, useCallback } from 'react'

const SIDEBAR_WIDTH_EXPANDED = 320 // w-80 = 320px
const SIDEBAR_WIDTH_COLLAPSED = 48  // w-12 = 48px
const MOBILE_BREAKPOINT = 1024 // Align with Tailwind lg:

export function useLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_WIDTH_EXPANDED)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const checkMobile = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const mobile = window.innerWidth < MOBILE_BREAKPOINT
        setIsMobile(mobile)
        
        if (mobile) {
          setSidebarCollapsed(true)
          setSidebarWidth(SIDEBAR_WIDTH_COLLAPSED)
        } else {
          // On desktop, we don't force expanded, but we allow it
          // For now, keep it simple and sync with mobile state
          setSidebarCollapsed(false)
          setSidebarWidth(SIDEBAR_WIDTH_EXPANDED)
        }
      }, 100)
    }

    const initialCheck = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(mobile)
      if (mobile) {
        setSidebarCollapsed(true)
        setSidebarWidth(SIDEBAR_WIDTH_COLLAPSED)
      } else {
        setSidebarCollapsed(false)
        setSidebarWidth(SIDEBAR_WIDTH_EXPANDED)
      }
    }

    initialCheck()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      clearTimeout(timeoutId)
    }
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const nextCollapsed = !prev
      setSidebarWidth(nextCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED)
      return nextCollapsed
    })
  }, [])

  return {
    sidebarWidth,
    sidebarCollapsed,
    isMobile,
    toggleSidebar,
    marginLeft: `${sidebarWidth}px`
  }
}
