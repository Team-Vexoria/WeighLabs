import Sidebar from '../components/UI/Sidebar'
import AppSidebar from '../components/UI/App/Sidebar'
import Tabbar from '../components/UI/App/Tabbar'

export default function App() {
    return (
        <div className="page flex flex-col h-full">
            <div className="flex h-full flex-1">
                <Sidebar />
                <AppSidebar />
                <div className="w-full flex flex-col">
                    <Tabbar />
                </div>
            </div>
        </div>
    )
}