import { Icon } from '@iconify/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
            className={`group font-ui w-full flex items-center gap-2 px-3 py-2 border-r border-border/10 dark:border-border-dark/10 whitespace-nowrap select-none
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

interface Session {
    id: string
    width: number
    grabX: number
    grabY: number
    originX: number
    originY: number
    lastX: number
    lastY: number
    moved: boolean
}

const DRAG_THRESHOLD = 4

export default function Tabbar({ tabs, activeTabId, setActiveTabId, addTab, removeTab, onReorder }: TabbarProps) {
    const floatRef = useRef<HTMLDivElement | null>(null)
    const tabEls = useRef(new Map<string, HTMLElement>())

    const session = useRef<Session | null>(null)
    const dropIndex = useRef<number | null>(null)
    const suppressClick = useRef(false)
    const reorder = useRef(onReorder)
    const detach = useRef<(() => void) | null>(null)
    const currentTabs = useRef(tabs)

    // only what the render needs lives in state; live pointer data stays in refs
    const [dragged, setDragged] = useState<{ id: string; width: number } | null>(null)
    const [gapAt, setGapAt] = useState<number | null>(null)

    useEffect(() => {
        reorder.current = onReorder
    }, [onReorder])

    // a drag can outlive the render that started it, so measure against the latest tabs
    useEffect(() => {
        currentTabs.current = tabs
    }, [tabs])

    const registerTab = (id: string) => (el: HTMLDivElement | null) => {
        if (el) tabEls.current.set(id, el)
        else tabEls.current.delete(id)
    }

    // insert index within the list of tabs other than the dragged one
    const indexAtPointer = useCallback((clientX: number, draggedId: string) => {
        let index = 0
        for (const tab of currentTabs.current) {
            if (tab.id === draggedId) continue
            const el = tabEls.current.get(tab.id)
            if (!el) continue
            const rect = el.getBoundingClientRect()
            if (clientX > rect.left + rect.width / 2) index++
        }
        return index
    }, [])

    const endDrag = useCallback((commit: boolean) => {
        const s = session.current
        if (commit && s && dropIndex.current !== null) {
            reorder.current(s.id, dropIndex.current)
        }
        detach.current?.()
        session.current = null
        dropIndex.current = null
        setDragged(null)
        setGapAt(null)
    }, [])

    const handlePointerMove = useCallback((e: PointerEvent) => {
        const s = session.current
        if (!s) return

        s.lastX = e.clientX
        s.lastY = e.clientY

        if (!s.moved) {
            const dx = e.clientX - s.originX
            const dy = e.clientY - s.originY
            if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
            s.moved = true
            setDragged({ id: s.id, width: s.width })
        }

        e.preventDefault() // don't select text while dragging

        // move the ghost imperatively so it tracks the pointer without re-rendering
        if (floatRef.current) {
            floatRef.current.style.transform =
                `translate3d(${e.clientX - s.grabX}px, ${e.clientY - s.grabY}px, 0)`
        }

        const index = indexAtPointer(e.clientX, s.id)
        if (dropIndex.current !== index) {
            dropIndex.current = index
            setGapAt(index)
        }
    }, [indexAtPointer])

    const handlePointerUp = useCallback(() => {
        const s = session.current
        if (!s) return
        // click fires after pointerup, so leave the flag set for the click to consume
        suppressClick.current = s.moved
        endDrag(s.moved)
    }, [endDrag])

    const handlePointerDown = (e: React.PointerEvent, id: string) => {
        if (e.button !== 0 || tabs.length < 2) return

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        session.current = {
            id,
            width: rect.width,
            grabX: e.clientX - rect.left,
            grabY: e.clientY - rect.top,
            originX: e.clientX,
            originY: e.clientY,
            lastX: e.clientX,
            lastY: e.clientY,
            moved: false,
        }
        suppressClick.current = false

        e.currentTarget.setPointerCapture?.(e.pointerId)

        // listen on window so the drag survives leaving the strip or the window
        window.addEventListener('pointermove', handlePointerMove)
        window.addEventListener('pointerup', handlePointerUp)
        window.addEventListener('pointercancel', handlePointerUp)
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return
            suppressClick.current = false
            endDrag(false)
        }
        window.addEventListener('keydown', onKey)

        detach.current = () => {
            window.removeEventListener('pointermove', handlePointerMove)
            window.removeEventListener('pointerup', handlePointerUp)
            window.removeEventListener('pointercancel', handlePointerUp)
            window.removeEventListener('keydown', onKey)
        }
    }

    // put the ghost under the cursor the moment it mounts
    useLayoutEffect(() => {
        const s = session.current
        if (!dragged || !s || !floatRef.current) return
        floatRef.current.style.transform = `translate3d(${s.lastX - s.grabX}px, ${s.lastY - s.grabY}px, 0)`
    }, [dragged])

    const draggedTab = dragged ? tabs.find(t => t.id === dragged.id) : undefined

    const selectTab = (id: string) => {
        if (suppressClick.current) {
            suppressClick.current = false // the drag ended here, don't also select it
            return
        }
        setActiveTabId(id)
    }

    // while dragging, the strip drops the dragged tab and opens a gap where it will land
    const strip = tabs.filter(t => t.id !== dragged?.id).flatMap((tab, i) => {
        const nodes = [
            <div
                key={tab.id}
                onPointerDown={(e) => handlePointerDown(e, tab.id)}
                onClick={() => selectTab(tab.id)}
                ref={registerTab(tab.id)}
                className="shrink-0 cursor-grab active:cursor-grabbing touch-none"
            >
                <TabButton
                    tab={tab}
                    isActive={tab.id === activeTabId}
                    onSelect={() => selectTab(tab.id)}
                    onClose={() => removeTab(tab.id)}
                />
            </div>,
        ]

        if (gapAt === i + 1) {
            nodes.push(<div key={`gap-${tab.id}`} className="shrink-0" style={{ width: dragged?.width }} />)
        }

        return nodes
    })

    if (gapAt === 0) {
        strip.unshift(<div key="gap-head" className="shrink-0" style={{ width: dragged?.width }} />)
    }

    return (
        <div className="min-w-0 max-w-screen shrink-0 border-b border-border/10 dark:border-border-dark/10 select-none">
            <div role="tablist" className="min-w-0 max-w-screen overflow-x-auto flex">
                {strip}

                {/* Create Tab */}
                <button onClick={() => addTab()} className="p-2 hover:bg-border-dark/10 shrink-0">
                    <Icon icon="akar-icons:plus" />
                </button>
            </div>

            {dragged && draggedTab && (
                <div
                    ref={floatRef}
                    className="fixed top-0 left-0 z-50 pointer-events-none shadow-lg rounded-ui overflow-hidden bg-main dark:bg-main-dark"
                    style={{ width: dragged.width }}
                >
                    <TabButton tab={draggedTab} isActive onSelect={() => { }} onClose={() => { }} />
                </div>
            )}
        </div>
    )
}
