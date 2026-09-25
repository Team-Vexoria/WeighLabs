import logo from "../../../assets/wordmark-no-credit.png"
import logoDark from "../../../assets/wordmark-no-credit-dark.png"
import placeholderProfileImage from '../../../assets/placeholder/profile.jpg'
import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { dashboardContent } from '../../UI/App/TabContent/Dashboard'
import { createTestTabContent } from '../../UI/App/TabContent/CreateTest'
import { viewReportContent } from '../../UI/App/TabContent/ViewReports'
import { settingsContent } from '../../UI/App/TabContent/Settings'

import { getCurrentProfile, logout } from '../../../lib/profiles'
import {
    addHistory,
    clearHistory,
    getHistory,
    HISTORY_ICONS,
    onHistoryChange,
    removeHistory,
    type HistoryEntry,
    type TestStatus,
} from '../../../lib/history'

interface SidebarProps {
    addTab: (component?: React.ReactNode, label?: string) => void
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'yesterday'
    if (days < 7) return `${days}d ago`
    return new Date(iso).toLocaleDateString('en-GB')
}

function StatusPill({ status }: { status: TestStatus }) {
    const styles: Record<TestStatus, string> = {
        PENDING: 'border-yellow-500/40 text-yellow-500',
        PASS: 'border-green-500/40 text-green-400',
        FAIL: 'border-red-500/40 text-red-400',
    }
    return (
        <span className={`shrink-0 text-[10px] font-mono px-1.5 rounded-full border ${styles[status]}`}>
            {status}
        </span>
    )
}

export default function Sidebar({ addTab }: SidebarProps) {
    const navigate = useNavigate()
    const [profile] = useState(() => getCurrentProfile())
    const [history, setHistory] = useState<HistoryEntry[]>(() => getHistory())
    const [unread, setUnread] = useState(0)

    useEffect(
        () =>
            onHistoryChange(() => {
                setHistory(getHistory())
                setUnread((n) => n + 1)
            }),
        [],
    )

    const initials =
        profile?.name
            .split(/\s+/)
            .map((word) => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2) || '??'

    const handleLogout = () => {
        addHistory({ type: 'logout', message: `Signed out${profile ? ` — ${profile.name}` : ''}` })
        logout()
        navigate('/')
    }

    const handleRemoveEntry = (id: string) => {
        removeHistory(id)
    }

    const handleClearHistory = () => {
        if (window.confirm('Delete the entire history?')) {
            clearHistory()
            setUnread(0)
        }
    }

    const lastTest = history.find((e) => e.type === 'test')

    return (
        <>
            <div className="h-full p-ui border-r border-border/10 dark:border-border-dark/10 font-ui max-w-75">

                {/* LOGO */}
                <div className="p-ui w-25">
                    {/* border mode * dark:hover:bg-border-dark/10 */}
                    <img className="dark:hidden flex" src={logoDark} ></img>
                    {/* dark mode */}
                    <img className="hidden dark:flex" src={logo} ></img>
                </div>

                {/* USER INFORMATION */}
                <div className="min-w-60 duration-ui border border-border/10 dark:border-border-dark/10 hover:bg-main/10 hover:cursor-pointer p-ui rounded-ui flex flex-col">
                    <h3 className="opacity-50 flex gap-1.5 items-center"><Icon icon="codicon:account" />Logged in as</h3>
                    <div className="flex my-2 items-center gap-2 border dark:border-border-dark/10 border-border/10 rounded-ui p-ui">
                        {profile ? (
                            <div className="size-10 rounded-full shrink-0 flex items-center justify-center font-mono text-sm bg-linear-to-br from-indigo-500 to-purple-600 text-white select-none">
                                {initials}
                            </div>
                        ) : (
                            <img className="w-10 rounded-full" src={placeholderProfileImage}></img>
                        )}
                        <div className="min-w-0">
                            <h1 className="truncate">{profile?.name ?? 'Not signed in'}</h1>
                            {profile ? (
                                <>
                                    <h2 className="text-[12px] opacity-50 font-mono">{profile.licenceNumber || 'No licence'}</h2>
                                    <h2 className="text-[12px] opacity-70">{profile.role}</h2>
                                </>
                            ) : (
                                <h2 className="text-[12px] opacity-50">Log in to get started</h2>
                            )}
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
                        <button onClick={() => { addTab(settingsContent, "Settings")}} className="duration-ui text-black dark:text-white rounded-ui flex items-center gap-1.5 text-left px-2 py-1 hover:bg-border/10 dark:hover:bg-border-dark/10">
                            <Icon icon="carbon:settings"/>
                            Settings
                        </button>
                        <button onClick={handleLogout} className="duration-ui text-black dark:text-white rounded-ui flex items-center gap-1.5 text-left px-2 py-1 hover:bg-border/10 dark:hover:bg-border-dark/10">
                            <Icon icon="mdi:logout"/>
                            Log out
                        </button>
                        
                    </div>
                </div>

                {/* RECENT (HISTORY) */}
                <div
                    className="p-ui border-t border-border/10 dark:border-border-dark/10 flex flex-col"
                    onMouseEnter={() => setUnread(0)}
                >
                    <div
                        className={`flex items-center justify-between ${
                            unread > 0 ? 'animate-pulse' : ''
                        }`}
                    >
                        <h1 className="flex items-center gap-1.5 text-indigo-500 dark:text-indigo-400">
                            Recent
                            {unread > 0 && (
                                <span className="size-5 rounded-full bg-indigo-500 text-white text-[10px] font-mono flex items-center justify-center">
                                    {unread > 99 ? '99+' : unread}
                                </span>
                            )}
                        </h1>
                        {history.length > 0 && (
                            <button
                                onClick={handleClearHistory}
                                title="Delete all history"
                                className="text-[11px] opacity-50 hover:opacity-100 flex items-center gap-1"
                            >
                                <Icon icon="akar-icons:trash-bin" />
                                Clear
                            </button>
                        )}
                    </div>

                    {lastTest && (
                        <div className="my-1 p-ui rounded-ui border border-main-dark/10 dark:border-main/10 bg-main-dark/5 dark:bg-main/5">
                            <span className="text-[11px] opacity-50">Last test</span>
                            <div className="flex items-center gap-1.5">
                                <span className="truncate text-[13px]">{lastTest.message}</span>
                                {lastTest.status && <StatusPill status={lastTest.status} />}
                            </div>
                            <span className="text-[11px] opacity-40">{timeAgo(lastTest.createdAt)}</span>
                        </div>
                    )}

                    <div className="flex flex-col gap-1 mt-1 max-h-64 overflow-y-auto">
                        {history.length === 0 ? (
                            <h2 className="flex items-center gap-1 opacity-50 text-[13px] py-1">
                                <Icon icon="akar-icons:trash-bin" />
                                Empty History
                            </h2>
                        ) : (
                            history.map((entry) => (
                                <div key={entry.id} className="flex items-start gap-1.5 py-1 group">
                                    <Icon icon={HISTORY_ICONS[entry.type]} className="mt-0.5 shrink-0 opacity-60" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="truncate text-[13px]">{entry.message}</span>
                                            {entry.type === 'test' && entry.status && (
                                                <StatusPill status={entry.status} />
                                            )}
                                        </div>
                                        <span className="text-[11px] opacity-40">{timeAgo(entry.createdAt)}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveEntry(entry.id)}
                                        title="Delete this entry"
                                        className="size-5 shrink-0 rounded-ui flex items-center justify-center text-[12px] opacity-0 group-hover:opacity-40 hover:!opacity-100 border border-main-dark/10 dark:border-main/10"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}