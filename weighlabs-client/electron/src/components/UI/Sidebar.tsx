import { Icon } from '@iconify/react'

export default function App() {
    return (
        <>
            <div className="hidden flex-col items-center min-h-screen border-r border-border/10 dark:border-border-dark/10 sticky gap-3 text-3xl">

                <div className="text-center p-ui gap-2.5 flex flex-col items-center">
                    {/* LOGOUT */}
                    <button className="button">
                        <Icon icon="basil:logout-outline"/>
                    </button>
    
                    {/* OPTIONS */}
                    <button className="button text-2xl">
                        <Icon icon="akar-icons:settings-horizontal" />
                    </button>
                </div>

                <div className="mt-auto py-ui">
                    <button className="button text-2xl">
                        <Icon icon="bi:info-lg" />
                    </button>
                </div>
                
            </div>
        </>
    )
}
