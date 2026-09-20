import { Icon } from "@iconify/react"

export default function Tab({ tabName = "New Tab"}) {
    
    return (
        <>
            <div className="px-ui font-ui border border-border/10 dark:border-border-dark/10 flex items-center flex-1 min-w-0 max-w-40">
                <h1 className="flex-1 min-w-0 truncate">{tabName}</h1>
                <button className="text-[12px] p-1 hover:text-red-700 shrink-0">
                    <Icon icon="at-icons:cross"/>
                </button>
            </div>
        </>
    )
}