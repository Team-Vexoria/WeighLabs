import logo from "../../../assets/wordmark-no-credit.png"
import logoDark from "../../../assets/wordmark-no-credit-dark.png"

export default function Sidebar() {
    return (
        <>
            <div className="min-h-screen p-ui border-r border-border/10 dark:border-border-dark/10 font-ui">

                {/* LOGO */}
                <div className="p-ui w-25">
                    {/* white mode */}
                    <img className="dark:hidden flex" src={logoDark} ></img>
                    {/* dark mode */}
                    <img className="hidden dark:flex" src={logo} ></img>
                </div>

                {/* USER INFORMATION */}
                <div className="min-w-60 border border-border/10 dark:border-border-dark/10 p-ui rounded-ui flex flex-col">
                    <h3>Logged in as</h3>
                    <div>
                        <h1>Dr. Pradeep</h1>
                    </div>
                </div>

                <div className="flex flex-col gap-1 my-5 p-ui text-left">
                    <div className="flex flex-col relative py-5 border-t border-border/10 dark:border-border-dark/10">
                        <h2 className="absolute -top-3 left-0 bg-main px-ui py-1 dark:bg-main-dark font-mono text-[12px]">Testing</h2>
                        <button className="text-left px-2 py-1 hover:bg-white/10">Test Reports</button>
                        <button className="text-left px-2 py-1 hover:bg-white/10">Create New Test</button>
                    </div>

                    <div className="flex flex-col relative py-5 border-t border-border/10 dark:border-border-dark/10">
                        <h2 className="absolute -top-3 left-0 bg-main px-ui py-1 dark:bg-main-dark font-mono text-[12px]">Account</h2>
                        <button className="text-left px-2 py-1 hover:bg-white/10">Settings</button>
                    </div>
                </div>

                {/* RECENT (HISTORY) */}
                <div className="p-ui border-t border-border-dark/10">
                    <h1>Recent</h1>
                    <div>
                        <h2>Empty History.</h2>
                    </div>
                </div>
                
            </div>
        </>
    )
}