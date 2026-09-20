import { Icon } from "@iconify/react"

function getIconForTab(tabName: string) {
    switch (tabName) {
        case "New Tab":
            return "fluent-md12:page-add"
        default:
            return "fluent-md12:page" // some fallback
    }
}

export default function Tab({ tabName = "New Tab" }) {
    const iconName = getIconForTab(tabName)
    
    return (
        <>
            <div className="px-ui font-ui dark:hover:bg-main/10 hover:bg-main-dark/10 hover:cursor-pointer duration-200 border border-border/10 dark:border-border-dark/10 flex items-center flex-1 min-w-0 max-w-40">
                <h1 className="flex-1 flex items-center gap-1.5 min-w-0 truncate"><Icon icon={iconName}/>{tabName}</h1>
                <button className="text-[12px] p-1 hover:text-red-700 shrink-0">
                    <Icon icon="at-icons:cross"/>
                </button>
            </div>
        </>
    )
}
