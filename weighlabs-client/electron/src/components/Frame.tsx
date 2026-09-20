import { Icon } from '@iconify/react'

export default function Frame() {
    return (
        <>
            <div className="w-full flex items-center border-b border-border/10 dark:border-border-dark/10 bg-main dark:bg-main-dark">
                <div className="w-25 text-black dark:text-white font-ui p-ui">
                    <h1>WeighLabs</h1>
                </div>

                <div className="ml-auto m-0 dark:text-white text-black flex items-center">
                    <button className="text-xl p-ui h-full">
                        <Icon icon="codicon:chrome-minimize"/>
                    </button>
                    <button className="text-xl p-ui h-full">
                        <Icon icon="mdi:border-all-variant"/>
                    </button>

                    {/* CLOSE WINDOW */}
                    <button className="text-xl text-red-600 hover:text-white hover:bg-red-500 p-ui h-full">
                        <Icon icon="ant-design:close-outlined"/>
                    </button>
                </div>
                
            </div>
        </>
    )
}