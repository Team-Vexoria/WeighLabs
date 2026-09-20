import React from 'react'

export const createTestTabContent: React.ReactNode = (
    <>
        <div className="w-full px-10 py-5 font-ui flex flex-col">
            <h1 className="text-3xl mb-5">Create a Test Instance</h1>

            {/* INPUT INSTRUMENT INFORMATION */}
            <div className="w-full p-ui dark:bg-main/5 bg-main-dark/5 border border-main-dark/5 dark:border-main/5 my-1 rounded-ui">
                <h1 className="pb-2 text-[18px]">Instrument Information</h1>
                <div className="flex gap-1">
                    <div className="flex-1 flex flex-col rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5">
                        
                    </div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5"></div>
                </div>                
            </div>

            {/* INPUT MANUFACTURER INFORMATION */}
            <div className="w-full p-ui dark:bg-main/5 bg-main-dark/5 border border-main-dark/5 dark:border-main/5 my-1 rounded-ui">
                <h1 className="pb-2 text-[18px]">Manufacturer Information</h1>
                <div className="flex gap-1">
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5"></div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5"></div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5"></div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5"></div>
                </div>
            </div>

            {/* INPUT OPERATOR INFORMATION */}
            <div className="w-full p-ui dark:bg-main/5 bg-main-dark/5 border border-main-dark/5 dark:border-main/5 my-1 rounded-ui">
                <h1 className="pb-2 text-[18px]">Operator Information</h1>
                <div className="flex gap-1">
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5"></div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5"></div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5"></div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5"></div>
                </div>
            </div>

            {/* INPUT LABORATORY INFORMATION */}
            <div className="w-full p-ui dark:bg-main/5 bg-main-dark/5 border border-main-dark/5 dark:border-main/5 my-1 rounded-ui">
                <h1 className="pb-2 text-[18px]">Laboratory Information</h1>
                <div className="flex gap-1">
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5"></div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5"></div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5"></div>
                    <div className="flex-1 rounded-ui gap-y-1 p-ui dark:bg-main/5 bg-main-dark/5"></div>
                </div>
            </div>

            <div className="flex gap-1 ml-auto">
                <button className="p-2 button border dark:border-main/5 border-main-dark/5">Save for Later</button>
                <button className="p-2 button border dark:border-main/5 border-main-dark/5">Create Test</button>
            </div>
            
        </div>
    </>
)
