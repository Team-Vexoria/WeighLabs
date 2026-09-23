import Sidebar from '../components/UI/Sidebar'
import AppSidebar from '../components/UI/App/Sidebar'
import Tabbar from '../components/UI/App/Tabbar'
import { useState } from 'react'

export interface Tab {
    id: string,
    Label: string,
    Component: React.ReactNode
}

// tab page
import { newTabContent } from '../components/UI/App/TabContent/New'
// import { dashboardContent } from '../components/UI/App/TabContent/Dashboard'
// import { createTestTabContent } from '../components/UI/App/TabContent/CreateTest'

function makeDefaultTab(): Tab {
    return { id: crypto.randomUUID(), Label: "New Tab", Component: newTabContent }
}


export default function App() {

    const [tabs, setTabs] = useState<Tab[]>([makeDefaultTab()])
    const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id)
    const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0]

    const addTab = (component: React.ReactNode = newTabContent, label?: string) => {
        setTabs(prev => {
            const resolvedLabel = label ?? `New Tab #${prev.filter(t => t.Label.startsWith('New Tab')).length + 1}`
    
            const existing = prev.find(t => t.Label === resolvedLabel)
            if (existing) {
                setActiveTabId(existing.id)
                return prev
            }
    
            const newTab: Tab = { id: crypto.randomUUID(), Label: resolvedLabel, Component: component }
            setActiveTabId(newTab.id)
            return [...prev, newTab]
        })
    }

    const removeTab = (id: string) => {
        setTabs(prev => {
            const filtered = prev.filter(t => t.id !== id)

            // nothing left — fall back to a fresh default tab instead of an empty array
            if (filtered.length === 0) {
                const fallback = makeDefaultTab()
                setActiveTabId(fallback.id)
                return [fallback]
            }

            // if we just closed the active tab, fall back to another one
            if (id === activeTabId) {
                setActiveTabId(filtered[filtered.length - 1].id)
            }
            return filtered
        })
    }

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
                    <div className="overflow-auto">
                        {activeTab?.Component}
                    </div>
                </div>
            </div>
        </div>
    )
}