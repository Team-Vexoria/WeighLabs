import { Icon } from '@iconify/react'
import TabButton from './TabBar/Tabs'

export default function Tabs(setActiveTabFunction: any) {

    return (
        <>
            <div className="min-w-0 max-w-screen overflow-x-auto border-b border-border/10 dark:border-border-dark/10 flex">
                <TabButton tabName="New Tab" />

                {/* Create Tab */}
                <button onClick={() => {newTab()}} className="p-2 hover:bg-border-dark/10">
                    <Icon icon="akar-icons:plus"/>
                </button>
            </div>
        </>
    )
}
