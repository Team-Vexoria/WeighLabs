import { useEffect, useState } from 'react'
import packageSource from '../../../../../package.json?raw'

const SOURCE_REPOSITORY_URL = 'https://github.com/Team-Vexoria/WeighLabs'
const APP_VERSION = (JSON.parse(packageSource) as { version: string }).version
const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
})

export function NewTab() {
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 1000)
        return () => window.clearInterval(timer)
    }, [])

    return (
        <>
            <div className="p-20 font-ui">
                <time dateTime={now.toISOString()}>{timeFormatter.format()}</time>
                <h1 className="text-3xl">New Tab</h1>
                <p className="max-w-75">Create a test report, view an existing report or a dashboard, all at the same time.</p>
                <div className="mt-8 flex items-center gap-4 text-sm">
                    <a href={SOURCE_REPOSITORY_URL} target="_blank" rel="noreferrer" className="link">
                        Source
                    </a>
                    <span className="opacity-60">v{APP_VERSION}</span>
                </div>
            </div>
        </>
    )
}
