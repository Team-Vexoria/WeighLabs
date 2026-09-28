import Sidebar from '../components/UI/Sidebar'
import AppSidebar from '../components/UI/App/Sidebar'
import Tabbar from '../components/UI/App/Tabbar'
import { useEffect, useState } from 'react'
import { setNavigator, setTabOpener } from '../lib/tabBus'

export interface Tab {
    id: string,
    Label: string,
    Component: React.ReactNode
    isDefault?: boolean
}

// tab page
import { newTabContent } from '../components/UI/App/TabContent/New'
import { dashboardContent } from '../components/UI/App/TabContent/Dashboard'
import { createTestTabContent } from '../components/UI/App/TabContent/CreateTest'
import { viewReportContent } from '../components/UI/App/TabContent/ViewReports'

function makeDefaultTab(): Tab {
    return { id: crypto.randomUUID(), Label: "New Tab", Component: newTabContent, isDefault: true }
}


export default function App() {

    const [tabState, setTabState] = useState(() => {
        const initialTab = makeDefaultTab()
        return { tabs: [initialTab], activeTabId: initialTab.id }
    })
    const { tabs, activeTabId } = tabState
    const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0]
    const dashboardActive = activeTab?.Label === 'Dashboard'

    const setActiveTabId = (id: string) => {
        setTabState(prev => prev.activeTabId === id ? prev : { ...prev, activeTabId: id })
    }

    const addTab = (component: React.ReactNode = newTabContent, label?: string) => {
        setTabState(prev => {
            // the lone default "New Tab" is a placeholder, not something the user opened
            const onlyTab = prev.tabs.length === 1 ? prev.tabs[0] : null
            const onlyTabIsDefault = onlyTab?.isDefault === true

            // asking for another placeholder just reuses the default one
            if (label === undefined && onlyTabIsDefault) {
                return { ...prev, activeTabId: onlyTab.id }
            }

            const resolvedLabel = label ?? `New Tab #${prev.tabs.filter(t => t.Label.startsWith('New Tab')).length + 1}`
            const existing = prev.tabs.find(t => t.Label === resolvedLabel)

            if (existing) {
                return { ...prev, activeTabId: existing.id }
            }

            const newTab: Tab = { id: crypto.randomUUID(), Label: resolvedLabel, Component: component }

            // opening a real tab while the default placeholder is the only tab — replace it
            if (onlyTabIsDefault) {
                return { tabs: [newTab], activeTabId: newTab.id }
            }

            return { tabs: [...prev.tabs, newTab], activeTabId: newTab.id }
        })
    }

    // drag-and-drop reorder. `insertIndex` is relative to the list with the dragged tab removed
    const moveTab = (draggedId: string, insertIndex: number) => {
        setTabState(prev => {
            const from = prev.tabs.findIndex(t => t.id === draggedId)
            if (from === -1) return prev

            const tabs = prev.tabs.filter(t => t.id !== draggedId)
            const index = Math.max(0, Math.min(insertIndex, tabs.length))
            tabs.splice(index, 0, prev.tabs[from])

            const unchanged = tabs.every((t, i) => t.id === prev.tabs[i].id)
            return unchanged ? prev : { ...prev, tabs }
        })
    }

    const removeTab = (id: string) => {
        setTabState(prev => {
            const filtered = prev.tabs.filter(t => t.id !== id)

            // nothing left — fall back to a fresh default tab instead of an empty array
            if (filtered.length === 0) {
                const fallback = makeDefaultTab()
                return { tabs: [fallback], activeTabId: fallback.id }
            }

            // if we just closed the active tab, fall back to another one
            return {
                tabs: filtered,
                activeTabId: prev.activeTabId === id ? filtered[filtered.length - 1].id : prev.activeTabId,
            }
        })
    }

    // chrome-style keyboard tab switching
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            // ctrl+tab / ctrl+shift+tab walk forwards and backwards through the strip
            if (e.ctrlKey && !e.altKey && !e.metaKey && e.key === 'Tab') {
                e.preventDefault()
                setTabState(prev => {
                    if (prev.tabs.length < 2) return prev
                    const current = prev.tabs.findIndex(t => t.id === prev.activeTabId)
                    const step = e.shiftKey ? -1 : 1
                    const next = (current + step + prev.tabs.length) % prev.tabs.length
                    return { ...prev, activeTabId: prev.tabs[next].id }
                })
                return
            }

            // ctrl+1..9 jumps straight to that tab
            if (e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey && /^Digit[1-9]$/.test(e.code)) {
                e.preventDefault()
                const target = Number(e.code.slice(5)) - 1
                setTabState(prev => {
                    const tab = prev.tabs[target]
                    return tab ? { ...prev, activeTabId: tab.id } : prev
                })
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [])

    useEffect(() => {
        setNavigator((target) => {
            if (target === 'dashboard') addTab(dashboardContent, 'Dashboard')
            else if (target === 'create-test') addTab(createTestTabContent, 'Create Test')
            else if (target === 'view-reports') addTab(viewReportContent, 'View Reports')
        })
        setTabOpener(addTab)
        return () => {
            setNavigator(null)
            setTabOpener(null)
        }
    }, [])

    return (
        <div className="page flex flex-col h-full">
            <div className="flex h-full flex-1">
                <Sidebar />
                <AppSidebar
                    addTab={addTab}
                />
                <div className="w-full flex flex-col">
                    <Tabbar
                        tabs={tabs}
                        activeTabId={activeTabId}
                        setActiveTabId={setActiveTabId}
                        addTab={addTab}
                        removeTab={removeTab}
                        onReorder={moveTab}
                    />
                    <div className={dashboardActive ? 'overflow-auto' : 'hidden'} aria-hidden={!dashboardActive}>
                        {dashboardContent}
                    </div>
                    {!dashboardActive && (
                        <div className="overflow-auto">
                            {activeTab?.Component}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}