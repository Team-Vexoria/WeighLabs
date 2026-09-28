import { Icon } from '@iconify/react'
import { useRef, useState } from 'react'
import { type Tab } from '../../../pages/App'

interface TabbarProps {
    tabs: Tab[]
    activeTabId: string
    setActiveTabId: (id: string) => void
    addTab: (component?: React.ReactNode, label?: string) => void
    removeTab: (id: string) => void
    onReorder: (draggedId: string, insertIndex: number) => void
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
            className={`group font-ui flex items-center gap-2 px-3 py-2 border-r border-border/10 dark:border-border-dark/10 whitespace-nowrap select-none
                ${isActive
                    ? 'bg-border/5 dark:bg-border-dark/5 '
                    : 'text-foreground/60 dark:text-foreground-dark/60'
                }`}
        >
            <span className="truncate max-w-40">{tab.Label}</span>
            <span
                onPointerDown={(e) => e.stopPropagation()} // never start a drag from the close button
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

interface DragState {
    id: string
    width: number
    grabX: number
    grabY: number
    x: number
    y: number
}

const DRAG_THRESHOLD = 4

export default function Tabbar({ tabs, activeTabId, setActiveTabId, addTab, removeTab, onReorder }: TabbarProps) {
    const stripRef = useRef<HTMLDivElement | null>(null)
    const floatRef = useRef<HTMLDivElement | null>(null)
    const tabEls = useRef(new Map<string, HTMLElement>())

    const drag = useRef<DragState | null>(null)
    const origin = useRef<{ x: number; y: number } | null>(null)
    const dropIndex = useRef<number | null>(null)
    const moved = useRef(false)

    const [ghost, setGhost] = useState(false)
    const [gapAt, setGapAt] = useState<number | null>(null)

    const registerTab = (id: string) => (el: HTMLButtonElement | null) => {
        if (el) tabEls.current.set(id, el)
        else tabEls.current.delete(id)
    }

    // insert index among the tabs other than the dragged one, by pointer x position
    const indexAtPointer = (clientX: number, draggedId: string) => {
        let index = 0
        for (const [id, el] of tabEls.current) {
            if (id === draggedId) continue
            const rect = el.getBoundingClientRect()
            if (clientX > rect.left + rect.width / 2) index++
        }
        return index
    }

    const setDrop = (index: number) => {
        if (dropIndex.current === index) return
        dropIndex.current = index
        setGapAt(index)
    }

    const endDrag = (commit: boolean) => {
        const state = drag.current
        if (commit && state && dropIndex.current !== null) {
            onReorder(state.id, dropIndex.current)
        }
        drag.current = null
        origin.current = null
        dropIndex.current = null
        moved.current = false
        setGhost(false)
        setGapAt(null)
    }

    const handlePointerDown = (e: React.PointerEvent, id: string) => {
        if (e.button !== 0 || tabs.length < 2) return

        const el = e.currentTarget as HTMLElement
        const rect = el.getBoundingClientRect()
        origin.current = { x: e.clientX, y: e.clientY }
        drag.current = {
            id,
            width: rect.width,
            grabX: e.clientX - rect.left,
            grabY: e.clientY - rect.top,
            x: e.clientX,
            y: e.clientY,
        }

        e.currentTarget.setPointerCapture?.(e.pointerId)
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        const state = drag.current
        if (!state || !origin.current) return

        const dx = e.clientX - origin.current.x
        const dy = e.clientY - origin.current.y

        if (!moved.current) {
            if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
            moved.current = true
            setGhost(true)
            document.body.style.userSelect = 'none'
        }

        state.x = e.clientX
        state.y = e.clientY

        // move the floating ghost imperatively so it tracks the pointer at 60fps
        if (floatRef.current) {
            floatRef.current.style.transform =
                `translate3d(${e.clientX - state.grabX}px, ${e.clientY - state.grabY}px, 0)`
        }

        setDrop(indexAtPointer(e.clientX, state.id))
    }

    const handlePointerUp = () => {
        if (!drag.current) return
        document.body.style.userSelect = ''
        const wasDragging = moved.current
        endDrag(wasDragging)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== 'Escape' || !drag.current) return
        e.preventDefault()
        document.body.style.userSelect = ''
        endDrag(false)
    }

    const dragged = ghost ? drag.current?.id : null
    const draggedTab = dragged ? tabs.find(t => t.id === dragged) : undefined

    // the strip keeps a gap where the tab will land, and skips rendering the dragged tab itself
    const rendered = tabs.flatMap((tab, i) => {
            if (tab.id === dragged) {
                return gapAt === i
                    ? [<div key={`gap-${tab.id}`} className="shrink-0" style={{ width: drag.current?.width }} />]
                    : []
            }
        return [
            <div
                key={tab.id}
                onPointerDown={(e) => handlePointerDown(e, tab.id)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onKeyDown={handleKeyDown}
                onClick={() => {
                    if (moved.current) return // a drag ended here, don't also select
                    setActiveTabId(tab.id)
                }}
                ref={registerTab(tab.id)}
                className="shrink-0 cursor-grab active:cursor-grabbing touch-none"
            >
                <TabButton
                    tab={tab}
                    isActive={tab.id === activeTabId}
                    onSelect={() => {
                        if (moved.current) return
                        setActiveTabId(tab.id)
                    }}
                    onClose={() => removeTab(tab.id)}
                />
            </div>,
        ]
    })

    return (
        <div className="min-w-0 max-w-screen shrink-0 flex items-stretch relative">
            <div
                ref={stripRef}
                role="tablist"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="min-w-0 max-w-screen shrink-0 overflow-x-auto border-b border-border/10 dark:border-border-dark/10 flex"
            >
                {rendered}

                {/* Create Tab */}
                <button onClick={() => addTab()} className="p-2 hover:bg-border-dark/10 shrink-0">
                    <Icon icon="akar-icons:plus" />
                </button>
            </div>

            {draggedTab && (
                <div
                    ref={floatRef}
                    className="fixed top-0 left-0 z-50 pointer-events-none shadow-lg rounded-ui overflow-hidden"
                    style={{ width: drag.current?.width }}
                >
                    <TabButton tab={draggedTab} isActive={false} onSelect={() => { }} onClose={() => { }} />
                </div>
            )}
        </div>
    )
}
