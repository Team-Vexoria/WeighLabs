
export const viewReportContent: React.ReactNode = (
        <>
        <div className="w-full min-h-full font-ui p-10">
            <h1 className="text-3xl">View Reports</h1>

            {/* TIMELINE */}
            <div className="flex flex-col mt-5 px-5">

                {/* TIMELINE NODE */}
                <div className=" border-white/30 p-ui min-h-10 relative flex flex-col">
                    <div className="flex gap-2 items-center">
                        <div className="size-5 rounded-full bg-black border border-white/30"></div>
                        <h1>21st September, 2026</h1>                        
                    </div>
                    <div className="p-ui flex flex-col gap-1">
                        <button className="border border-white/10 text-left px-ui py-1 max-w-100 rounded-xl">File Name</button>
                        <button className="border border-white/10 text-left px-ui py-1 max-w-100 rounded-xl">File Name</button>
                        <button className="border border-white/10 text-left px-ui py-1 max-w-100 rounded-xl">File Name</button>
                        <button className="border border-white/10 text-left px-ui py-1 max-w-100 rounded-xl">File Name</button>
                        <button className="border border-white/10 text-left px-ui py-1 max-w-100 rounded-xl">File Name</button>
                    </div>
                </div>
            </div>
        </div>
    </>
)
