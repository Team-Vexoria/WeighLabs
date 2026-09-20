import { Icon } from '@iconify/react'
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
        <div className="w-full font-ui px-5 py-2 flex flex-col gap-2 dashboard">
            <h1 className="flex gap-1 items-center">Test #012313</h1>
            <div className="flex gap-dashboard">
                {/* GRAPH */}
                <div className="flex-5 h-100 dashboard-material">
                </div>

                {/* Test Time */}
                <div className="flex-1 p-ui h-100 bg-black dashboard-material">

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
                            <button className="flex-1 my-1 rounded-bl border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5">Kelvin</button>
                            <button className="flex-1 my-1 border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5">Celsius</button>
                            <button className="flex-1 my-1 rounded-br-ui border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5">Farenheit</button>
                        </div>
                    </div>

                    {/* CURRENT WEIGHT READING */}
                    <div className=" rounded p-ui dark:border-white/10 border-black/10">
                        <h1 className="">Current Weight Reading</h1>
                        <h3 className="text-4xl text-center border dark:border-white/10 border-black/10 p-ui rounded-t-ui">100 KG</h3>
                        <div className="flex">
                            <button className="flex-1 my-1 rounded-bl border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5">KG</button>
                            <button className="flex-1 my-1 border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5">G</button>
                            <button className="flex-1 my-1 border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5">MG</button>
                            <button className="flex-1 my-1 rounded-br-ui border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5">lbs</button>
                        </div>
                    </div>
                    
                </div>
            </div>

            <div className="flex gap-dashboard">
                <div className="p-ui dashboard-material flex-1 flex flex-col gap-1 h-100 bg-black">
                    {/* WEIGHT */}
                    <h1 className="text-[20px] px-ui flex-1">Weight</h1>
                    {/* WEIGHT GRAPH */}
                    <div className="w-full h-full rounded-ui bg-black"></div>
                </div>
                <div className="p-ui dashboard-material flex-1 flex flex-col gap-1 h-100 bg-black">
                    <h1 className="text-[20px] px-ui flex-1">Instrument Temperature</h1>
                    {/* TEMP GRAPH */}
                    <div className="w-full h-full rounded-ui bg-black"></div>
                </div>
                <div className="p-ui dashboard-material flex-1 flex flex-col gap-1 h-100 bg-black">
                    <h1 className="text-[20px] px-ui flex-1">Eccentricity</h1>
                    {/*  GRAPH */}
                    <div className="w-full h-full rounded-ui bg-black"></div>
                </div>
                <div className="p-ui dashboard-material flex-1 flex flex-col gap-1 h-100 bg-black">
                    <h1 className="text-[20px] px-ui flex-1">Voltage Variations</h1>
                    {/*  GRAPH */}
                    <div className="w-full h-full rounded-ui bg-black"></div>
                </div>
            </div>

            
            {/* BUTTONS */}
            <div className="flex gap-1">
                <button className="p-ui button border border-white/5">PRINT</button>
                <button className="p-ui button border border-white/5">CONTINUE TEST</button>
                <button className="p-ui button border border-white/5">END TEST</button>
            </div>
        </div>
    </>
)
