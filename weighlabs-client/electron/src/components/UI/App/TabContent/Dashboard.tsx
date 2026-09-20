import React from 'react'

export const dashboardContent: React.ReactNode = (
    // BENTO LAYOUT
    // TEST NAME
    // TEST READINGS - GRAPH
    // TEST DURATION
    // OPERATOR
    // NAWI MODEL INFORMATION
    // TEMPERATURE
    <>
        <div className="w-full font-ui text-black dark:text-white px-5 py-2 flex flex-col gap-2 dashboard">
            <div className="flex items-center">
                <h1 className="flex gap-1 items-center">Test #012313</h1>
                
                
                {/* BUTTONS */}
                <div className="ml-auto flex gap-1">
                    <button className="p-ui min-w-20 button border border-white/5 bg-neutral-400 dark:bg-neutral-900">Print</button>
                    <button className="p-ui min-w-20 button border border-white/5 bg-indigo-400 dark:bg-indigo-950">Continue Test</button>
                    <button className="p-ui min-w-20 button border border-white/5 bg-red-400 dark:bg-red-950">End Test</button>
                </div>
            </div>
            <div className="flex gap-dashboard">
                {/* GRAPH */}
                <div className="flex-5 h-100 dashboard-material">
                </div>

                {/* Test Time */}
                <div className="flex-1 p-ui h-100 bg-black/5 dashboard-material">

                    {/* DURATION */}
                    <div className=" rounded p-ui dark:border-white/10 border-black/10">
                        <h1 className="">Test Duration</h1>
                        <h3 className="text-4xl text-center border dark:border-white/10 border-black/10 p-ui rounded-ui">00:00:00</h3>
                    </div>          

                    {/* TEMPERATURE */}
                    <div className=" rounded p-ui dark:border-white/10 border-black/10">
                        <h1 className="">Instrument Temperature</h1>
                        <h3 className="text-4xl text-center border dark:border-white/10 border-black/10 p-ui rounded-t-ui">273.01231K</h3>
                        <div className="flex">
                            <button className="flex-1 my-1 text-black dark:text-white rounded-bl border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5/5">Kelvin</button>
                            <button className="flex-1 my-1 text-black dark:text-white border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5/5">Celsius</button>
                            <button className="flex-1 my-1 text-black dark:text-white rounded-br-ui border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5/5">Farenheit</button>
                        </div>
                    </div>

                    {/* CURRENT WEIGHT READING */}
                    <div className=" rounded p-ui dark:border-white/10 border-black/10">
                        <h1 className="">Current Weight Reading</h1>
                        <h3 className="text-4xl text-center border dark:border-white/10 border-black/10 p-ui rounded-t-ui">100 KG</h3>
                        <div className="flex">
                            <button className="flex-1 my-1 text-black dark:text-white rounded-bl border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5/5">KG</button>
                            <button className="flex-1 my-1 text-black dark:text-white border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5/5">G</button>
                            <button className="flex-1 my-1 text-black dark:text-white border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5/5">MG</button>
                            <button className="flex-1 my-1 text-black dark:text-white rounded-br-ui border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5/5">lbs</button>
                        </div>
                    </div>
                    
                </div>
            </div>

            <div className="flex gap-dashboard">
                <div className="p-ui dashboard-material flex-1 flex flex-col gap-1 h-100 bg-black/5">
                    {/* WEIGHT */}
                    <h1 className="text-[20px] px-ui flex-1">Weight</h1>
                    {/* WEIGHT GRAPH */}
                    <div className="w-full h-full rounded-ui bg-black/5"></div>
                </div>
                <div className="p-ui dashboard-material flex-1 flex flex-col gap-1 h-100 bg-black/5">
                    <h1 className="text-[20px] px-ui flex-1">Instrument Temperature</h1>
                    {/* TEMP GRAPH */}
                    <div className="w-full h-full rounded-ui bg-black/5"></div>
                </div>
                <div className="p-ui dashboard-material flex-1 flex flex-col gap-1 h-100 bg-black/5">
                    <h1 className="text-[20px] px-ui flex-1">Eccentricity</h1>
                    {/*  GRAPH */}
                    <div className="w-full h-full rounded-ui bg-black/5"></div>
                </div>
                <div className="p-ui dashboard-material flex-1 flex flex-col gap-1 h-100 bg-black/5">
                    <h1 className="text-[20px] px-ui flex-1">Voltage Variations</h1>
                    {/*  GRAPH */}
                    <div className="w-full h-full rounded-ui bg-black/5"></div>
                </div>
            </div>

        </div>
    </>
)
