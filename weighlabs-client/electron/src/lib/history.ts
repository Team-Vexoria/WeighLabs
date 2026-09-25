export type HistoryType = 'login' | 'logout' | 'test' | 'report' | 'settings' | 'navigation'
export type TestStatus = 'PENDING' | 'PASS' | 'FAIL'

export interface HistoryEntry {
    id: string
    type: HistoryType
    message: string
    testId?: string
    status?: TestStatus
    createdAt: string
}

/* icons rendered by the sidebar, keyed by entry layout, not stored */
export const HISTORY_ICONS: Record<HistoryType, string> = {
    login: 'carbon:user-avatar',
    logout: 'mdi:logout',
    test: 'mdi:beaker-plus',
    report: 'carbon:report',
    settings: 'carbon:settings',
    navigation: 'carbon:tab',
}

const HISTORY_KEY = 'weighlabs.history'
const MAX_ENTRIES = 50

const changeListeners = new Set<() => void>()

export function onHistoryChange(callback: () => void): () => void {
    changeListeners.add(callback)
    return () => changeListeners.delete(callback)
}

function notifyChanged() {
    changeListeners.forEach((cb) => cb())
}

function readHistory(): HistoryEntry[] {
    try {
        const raw = localStorage.getItem(HISTORY_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : []
    } catch {
        return []
    }
}

function writeHistory(entries: HistoryEntry[]) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
}

export function getHistory(): HistoryEntry[] {
    return readHistory()
}

export function addHistory(entry: Omit<HistoryEntry, 'id' | 'createdAt'>): HistoryEntry {
    const next: HistoryEntry = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    const entries = [next, ...readHistory()].slice(0, MAX_ENTRIES)
    writeHistory(entries)
    notifyChanged()
    return next
}

export function removeHistory(id: string) {
    writeHistory(readHistory().filter((e) => e.id !== id))
    notifyChanged()
}

export function clearHistory() {
    writeHistory([])
    notifyChanged()
}