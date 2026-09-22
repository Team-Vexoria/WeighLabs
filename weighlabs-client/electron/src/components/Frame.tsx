import { Icon } from '@iconify/react'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

const dragRegion: CSSProperties = { WebkitAppRegion: 'drag' } as CSSProperties
const noDrag: CSSProperties = { WebkitAppRegion: 'no-drag' } as CSSProperties

interface FrameProps {
    children: ReactNode
}

export default function Frame({ children }: FrameProps) {
    const [isMaximized, setIsMaximized] = useState(false)

    useEffect(() => {
        let mounted = true
        const applyState = (value: boolean) => {
            if (mounted) setIsMaximized(value)
        }

        window.windowControls?.isMaximized()?.then(applyState)
        const unsubscribe = window.windowControls?.onMaximizeChange(applyState)

        return () => {
            mounted = false
            unsubscribe?.()
        }
    }, [])

    const controls = window.windowControls

    return (
        <div className="w-full flex flex-col h-screen ">
            {/* TITLEBAR */}
            <div
                style={dragRegion}
                onDoubleClick={(e) => {
                    if (e.target === e.currentTarget) controls?.toggleMaximize()
                }}
                className="h-10 shrink-0 select-none flex items-center border-b border-border/10 dark:border-border-dark/10 bg-main dark:bg-main-dark"
            >
                <div className="w-25 p-ui font-ui text-black dark:text-white">
                    <h1>WeighLabs</h1>
                </div>

                <div className="ml-auto m-0 h-full flex items-center text-black dark:text-white">
                    <button style={noDrag} onClick={() => controls?.minimize()} className="h-full p-ui text-xl">
                        <Icon icon="codicon:chrome-minimize"/>
                    </button>
                    <button style={noDrag} onClick={() => controls?.toggleMaximize()} className="h-full p-ui text-xl">
                        {isMaximized
                            ? <Icon icon="codicon:chrome-restore"/>
                            : <Icon icon="codicon:chrome-maximize"/>}
                    </button>

                    {/* CLOSE WINDOW */}
                    <button style={noDrag} onClick={() => controls?.close()} className="h-full p-ui text-xl text-red-600 hover:text-white hover:bg-red-500">
                        <Icon icon="ant-design:close-outlined"/>
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <main className="flex-1  min-h-0 min-w-0">
                {children}
            </main>
        </div>
    )
}