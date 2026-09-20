import Sidebar from '../components/UI/Sidebar'
import AppSidebar from '../components/UI/App/Sidebar'
import Tabbar from '../components/UI/App/Tabbar'
import { useState } from 'react'

export interface Tab {
    Label: string,
    Component: React.ReactNode
}

// tab page
import { newTabContent } from '../components/UI/App/TabContent/New'
import { dashboardContent } from '../components/UI/App/TabContent/Dashboard'
import { createTestTabContent } from '../components/UI/App/TabContent/CreateTest'

export default function App() {

    const [tabs, setTabsArray] = useState<Tab[]>([
        {Label: "New Tab", Component: dashboardContent}
    ])
    const [activeTab, setActiveTab] = useState<Tab>(tabs[0])
    const [activeTabContent, setActiveTabContent] = useState<React.ReactNode>(tabs[0].Component)
    
    return (
        <div className="page flex flex-col h-full">
            <div className="flex h-full flex-1">
                <Sidebar />
                <AppSidebar />
                <div className="w-full flex flex-col">
                    <Tabbar setActiveTabFunction={setActiveTabContent}/>
                    {activeTabContent}
                </div>
            </div>
        </div>
    )
}