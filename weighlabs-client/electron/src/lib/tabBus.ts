import type { ReactNode } from 'react'

export type TabTarget = 'dashboard' | 'create-test' | 'view-reports'

export interface RunRequest {
    testId: string
}

type NavHandler = (target: TabTarget) => void
type RunHandler = (req: RunRequest) => void
type TabOpener = (content: ReactNode, label: string) => void

let navHandler: NavHandler | null = null
let tabOpener: TabOpener | null = null
let pendingRun: RunRequest | null = null
const runHandlers = new Set<RunHandler>()

export function setNavigator(handler: NavHandler | null) {
    navHandler = handler
}

export function setTabOpener(handler: TabOpener | null) {
    tabOpener = handler
}

export function openTab(content: ReactNode, label: string) {
    tabOpener?.(content, label)
}

export function navigateTo(target: TabTarget) {
    navHandler?.(target)
}

export function requestRun(req: RunRequest) {
    pendingRun = req
    runHandlers.forEach((handler) => handler(req))
}

export function consumePendingRun(): RunRequest | null {
    const req = pendingRun
    pendingRun = null
    return req
}

export function onRunRequest(handler: RunHandler): () => void {
    runHandlers.add(handler)
    return () => {
        runHandlers.delete(handler)
    }
}