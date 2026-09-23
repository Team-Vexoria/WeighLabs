import logo from "../../../assets/wordmark-no-credit.png"
import placeholderProfileImage from '../../../assets/placeholder/profile.jpg'
import { Icon } from '@iconify/react'

import { dashboardContent } from '../../UI/App/TabContent/Dashboard'
import { createTestTabContent } from '../../UI/App/TabContent/CreateTest'
import { viewReportContent } from '../../UI/App/TabContent/ViewReports'

interface SidebarProps {
    addTab: (component?: React.ReactNode, label?: string) => void
}

export default function Sidebar({ addTab }: SidebarProps) {
    return (
        <>
            <div className="h-full p-ui border-r border-border/10 dark:border-border-dark/10 font-ui">

                {/* LOGO */}
                <div className="p-ui w-25">
                    {/* border mode * dark:hover:bg-border-dark/10/}
                    <img className="dark:hidden flex" src={logoDark} ></img>
                    {/* dark mode */}
                    <img className="hidden dark:flex" src={logo} ></img>
                </div>

                {/* USER INFORMATION */}
                <div className="min-w-60 duration-ui border border-border/10 dark:border-border-dark/10 hover:bg-main/10 hover:cursor-pointer p-ui rounded-ui flex flex-col">
                    <h3 className="opacity-50 flex gap-1.5 items-center"><Icon icon="codicon:account" />Logged in as</h3>
                    <div className="flex my-2 items-center gap-2 border dark:border-border-dark/10 border-border/10 rounded-ui p-ui">
                        <img className="w-10 rounded-full" src={placeholderProfileImage}></img>
                        <div>
                            <h1 className="">Dr. Pradeep</h1>
                            <h2 className="text-[12px] opacity-50">LAB011010231</h2>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-1 my-5 p-ui text-left">
                    <div className="flex flex-col relative py-5 border-t border-border/10 dark:border-border-dark/10">
                        <h2 className="absolute -top-3 left-0 bg-main px-ui py-1 dark:bg-main-dark font-mono text-[12px]">Testing</h2>
                        <button onClick={() => { addTab(dashboardContent, "Dashboard")}} className="duration-ui rounded-ui text-main-dark dark:text-border flex items-center dark:hover:bg-border-dark/10tems-center gap-1.5 text-left px-2 py-1 hover:bg-border/10 dark:hover:bg-border-dark/10"><Icon icon="boxicons:dashboard-alt-filled"/>Dashboard</button>
                        <button onClick={() => { addTab(viewReportContent, "View Reports")}} className="duration-ui rounded-ui text-main-dark dark:text-border flex items-center dark:hover:bg-border-dark/10tems-center gap-1.5 text-left px-2 py-1 hover:bg-border/10 dark:hover:bg-border-dark/10"><Icon icon="carbon:report"/>View Reports</button>
                        <button onClick={() => { addTab(createTestTabContent, "Create Test")}} className="duration-ui rounded-ui text-main-dark dark:text-border flex items-center dark:hover:bg-border-dark/10tems-center gap-1.5 text-left px-2 py-1 hover:bg-border/10 dark:hover:bg-border-dark/10"><Icon icon="mdi:beaker-plus"/>Create New Test</button>
                    </div>

                    <div className="flex flex-col relative py-5 border-t border-border/10 dark:border-border-dark/10">
                        <h2 className="absolute -top-3 left-0 bg-main px-ui py-1 dark:bg-main-dark font-mono text-[12px]">Account</h2>
                        <button className="duration-ui text-black rounded-ui flex items-center gap-1.5 text-left px-2 py-1 hover:bg-border/10 dark:hover:bg-border-dark/10">
                            <Icon icon="carbon:settings"/>
                            Settings
                        </button>
                        <a href="/" className="duration-ui text-black dark:text-white rounded-ui flex items-center gap-1.5 text-left px-2 py-1 hover:bg-border/10 dark:hover:bg-border-dark/10">
                            <Icon icon="mdi:logout"/>
                            Log out
                        </a>
                        
                    </div>
                </div>

                {/* RECENT (HISTORY) */}
                <div className="p-ui border-t border-border/10 dark:border-border-dark/10">
                    <h1>Recent</h1>
                    <div>
                        <h2 className="flex items-center gap-1 opacity-50"> 
                            <Icon icon="akar-icons:trash-bin"/>
                            Empty History
                        </h2>
                    </div>
                </div>
            </div>
        </>
    )
}