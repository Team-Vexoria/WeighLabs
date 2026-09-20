// import icons
import '../App.css'

// components
import Logo from '../components/UI/Logo.tsx'
import Sidebar from '../components/UI/Sidebar.tsx'
import ProfileInstance from '../components/UI/Login/Profile.tsx'

export default function App() {
    return (
        <>
            <div className="page flex flex-col h-full">
                <div className="flex h-full flex-1">
                    <Sidebar />
                    <div className="w-full flex-1 p-ui">
                        <Logo />
                        {/* PROFILES */}
                        <div className="flex justify-self-center mt-50 gap-3 ">
                            <ProfileInstance />
                            <ProfileInstance />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}