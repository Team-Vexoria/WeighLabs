import profilePlaceholder from '../../../assets/placeholder/profile.jpg'

export default function App() {
    return (
        <>
            <a href="/app" className="flex flex-col text-center gap-2 w-fit hover:cursor-pointer duration-150 hover:scale-102">
                <div className="size-40 rounded-ui overflow-hidden">
                    <img className="w-fit" src={profilePlaceholder} />
                </div>
                <div>
                    <p className="font-ui text-[20px]">Profile Name</p>
                </div>
            </a>
        </>
    )
}