import { Icon } from '@iconify/react'
import { type Tab } from '../../../pages/App' 

interface TabbarProps {
    tabs: Tab[]
    activeTabId: string
    setActiveTabId: (id: string) => void
    addTab: (component?: React.ReactNode, label?: string) => void
    removeTab: (id: string) => void
}

interface TabButtonProps {
    tab: Tab
    isActive: boolean
    onSelect: () => void
    onClose: () => void
}

function TabButton({ tab, isActive, onSelect, onClose }: TabButtonProps) {
    return (
        <button
            onClick={onSelect}
            className={`group font-ui flex items-center gap-2 px-3 py-2 border-r border-border/10 dark:border-border-dark/10 whitespace-nowrap
                ${isActive
                    ? 'bg-border/5 dark:bg-border-dark/5 '
                    : 'hover:bg-border/10 dark:hover:bg-border-dark/10 text-foreground/60 dark:text-foreground-dark/60'
                }`}
        >
            <span className="truncate max-w-40">{tab.Label}</span>
            <span
                onClick={(e) => {
                    e.stopPropagation() // prevent onSelect firing too
                    onClose()
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-border-dark/20 rounded p-0.5"
            >
                <Icon icon="akar-icons:cross" width="12" height="12" />
            </span>
        </button>
    )
}

export default function Tabbar({ tabs, activeTabId, setActiveTabId, addTab, removeTab }: TabbarProps) {
    return (
        <div className="min-w-0 max-w-screen overflow-x-auto border-b border-border/10 dark:border-border-dark/10 flex">
            {tabs.map((tab) => (
                <TabButton
                    key={tab.id}
                    tab={tab}
                    isActive={tab.id === activeTabId}
                    onSelect={() => setActiveTabId(tab.id)}
                    onClose={() => removeTab(tab.id)}
                />
            ))}

            {/* Create Tab */}
            <button onClick={() => { addTab()}} className="p-2 hover:bg-border-dark/10">
                <Icon icon="akar-icons:plus" />
            </button>
        </div>
    )
}