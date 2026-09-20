import { Icon } from '@iconify/react'

export default function App() {
    return (
        <>
            <div className="flex flex-col items-center justify-center min-h-screen p-ui border-r border-border/10 dark:border-border-dark/10 sticky gap-3">
                <button className="text-3xl">
                    <Icon icon="akar-icons:settings-horizontal" />
                </button>
            </div>
        </>
    )
}
