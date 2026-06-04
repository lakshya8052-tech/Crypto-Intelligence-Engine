'use client'

import { useState, useEffect } from 'react'
import { globalStateManager, type GlobalAppState } from '@/lib/global-state'

export function useGlobalState() {
  const [state, setState] = useState<GlobalAppState>(globalStateManager.getState())

  useEffect(() => {
    const unsubscribe = globalStateManager.subscribe((newState) => {
      setState(newState)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return {
    state,
    updateState: globalStateManager.updateState.bind(globalStateManager),
    updatePreferences: globalStateManager.updatePreferences.bind(globalStateManager),
    updateWatchlist: globalStateManager.updateWatchlist.bind(globalStateManager),
    updatePortfolio: globalStateManager.updatePortfolio.bind(globalStateManager),
    updateAISettings: globalStateManager.updateAISettings.bind(globalStateManager),
    updateWorkspace: globalStateManager.updateWorkspace.bind(globalStateManager),
    resetState: globalStateManager.resetState.bind(globalStateManager)
  }
}

// Specific hooks for convenience
export function usePreferences() {
  const { state, updatePreferences } = useGlobalState()
  return { preferences: state.preferences, updatePreferences }
}

export function useWatchlist() {
  const { state, updateWatchlist } = useGlobalState()
  return { watchlist: state.watchlist, updateWatchlist }
}

export function usePortfolio() {
  const { state, updatePortfolio } = useGlobalState()
  return { portfolio: state.portfolio, updatePortfolio }
}

export function useAISettings() {
  const { state, updateAISettings } = useGlobalState()
  return { aiSettings: state.aiSettings, updateAISettings }
}

export function useWorkspace() {
  const { state, updateWorkspace } = useGlobalState()
  return { workspace: state.workspace, updateWorkspace }
}
