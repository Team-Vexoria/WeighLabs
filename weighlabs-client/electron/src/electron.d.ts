export interface WindowControls {
    minimize: () => void
    toggleMaximize: () => void
    close: () => void
    isMaximized: () => Promise<boolean>
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void
}

declare global {
    interface Window {
        windowControls?: WindowControls
    }
}

export {}