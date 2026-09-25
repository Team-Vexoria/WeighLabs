import type { LoginProfile } from '../../../lib/profiles'

export default function ProfileCard({
    profile,
    onSelect,
    onRemove,
}: {
    profile: LoginProfile
    onSelect: () => void
    onRemove?: () => void
}) {
    const initials =
        profile.name
            .split(/\s+/)
            .map((word) => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2) || '??'

    return (
        <div className="relative flex flex-col items-center gap-2 p-3 rounded-ui border border-main-dark/10 dark:border-main/10 bg-main-dark/5 dark:bg-main/5 dark:hover:bg-main/10 hover:bg-main/10 duration-ui w-44">
            <button
                onClick={onSelect}
                className="flex flex-col items-center gap-2 w-full hover:cursor-pointer"
                title={`Log in as ${profile.name}`}
            >
                <div className="size-28 rounded-full flex items-center justify-center text-3xl font-mono bg-linear-to-br from-indigo-500 to-purple-600 text-white select-none">
                    {initials}
                </div>
                <div className="text-center">
                    <p className="font-ui text-[16px] leading-tight">{profile.name}</p>
                    {profile.licenceNumber && (
                        <p className="text-[12px] opacity-50 font-mono">{profile.licenceNumber}</p>
                    )}
                    <span className="text-[12px] opacity-80">{profile.role}</span>
                </div>
            </button>
            {onRemove && (
                <button
                    onClick={onRemove}
                    title="Remove profile"
                    className="absolute top-2 right-2 size-6 rounded-ui flex items-center justify-center text-main-dark dark:text-white opacity-40 hover:opacity-100 bg-main-dark/5 dark:bg-main/5 border border-main-dark/10 dark:border-main/10"
                >
                    ×
                </button>
            )}
        </div>
    )
}