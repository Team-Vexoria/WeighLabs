import Sidebar from '../components/UI/Sidebar'
import AppSidebar from '../components/UI/App/Sidebar'
import Tabbar from '../components/UI/App/Tabbar'
import { useEffect, useState } from 'react'
import { setNavigator, setTabOpener } from '../lib/tabBus'

export interface Tab {
    id: string,
    Label: string,
    Component: React.ReactNode
}

// tab page
import { newTabContent } from '../components/UI/App/TabContent/New'
import { dashboardContent } from '../components/UI/App/TabContent/Dashboard'
import { createTestTabContent } from '../components/UI/App/TabContent/CreateTest'
import { viewReportContent } from '../components/UI/App/TabContent/ViewReports'

function makeDefaultTab(): Tab {
    return { id: crypto.randomUUID(), Label: "New Tab", Component: newTabContent }
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
            const resolvedLabel = label ?? `New Tab #${prev.tabs.filter(t => t.Label.startsWith('New Tab')).length + 1}`
            const existing = prev.tabs.find(t => t.Label === resolvedLabel)

            if (existing) {
                return { ...prev, activeTabId: existing.id }
            }

            const newTab: Tab = { id: crypto.randomUUID(), Label: resolvedLabel, Component: component }
            return { tabs: [...prev.tabs, newTab], activeTabId: newTab.id }
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