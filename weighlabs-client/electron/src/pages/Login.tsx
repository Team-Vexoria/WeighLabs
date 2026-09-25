import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'

// components
import Logo from '../components/UI/Logo.tsx'
import Sidebar from '../components/UI/Sidebar.tsx'
import ProfileCard from '../components/UI/Login/Profile.tsx'

// login profiles
import { getProfiles, loginAs, removeProfile, type LoginProfile } from '../lib/profiles'
// operator activity history
import { addHistory } from '../lib/history'

const ROLE_OPTIONS = ['Operator', 'Technician', 'Metrologist', 'Admin']

export default function Login() {
    const navigate = useNavigate()
    const [profiles, setProfiles] = useState<LoginProfile[]>(() => getProfiles())
    const [name, setName] = useState('')
    const [licence, setLicence] = useState('')
    const [role, setRole] = useState(ROLE_OPTIONS[0])
    const [error, setError] = useState<string | null>(null)

    const handleQuickLogin = (profile: LoginProfile) => {
        loginAs(profile)
        addHistory({ type: 'login', message: `Signed in — ${profile.name}` })
        navigate('/app')
    }

    const handleCreate = (e: FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            setError('Please enter a profile name.')
            return
        }
        setError(null)
        const profile = loginAs({
            id: crypto.randomUUID(),
            name: name.trim(),
            licenceNumber: licence.trim(),
            role: role.trim() || ROLE_OPTIONS[0],
            createdAt: new Date().toISOString(),
        })
        addHistory({ type: 'login', message: `Signed in — ${profile.name}` })
        navigate('/app')
    }

    const handleRemove = (id: string) => {
        removeProfile(id)
        setProfiles(getProfiles())
    }

    const inputClass =
        'rounded-ui border dark:border-main/10 border-main-dark/10 bg-white dark:bg-main-dark text-main-dark dark:text-main p-1.5 px-2 text-sm outline-none focus:border-main-dark/30 dark:focus:border-main/30'

    return (
        <>
            <div className="page flex flex-col h-full">
                <div className="flex h-full flex-1">
                    <Sidebar />
                    <div className="w-full flex-1 p-ui overflow-auto">
                        <Logo />
                        <div className="flex flex-col items-center mt-8">
                            <div className="w-full max-w-2xl">
                                <h1 className="text-2xl">Sign in</h1>
                                <p className="opacity-60 text-sm mt-1">
                                    Pick a saved profile below, or create a new one. Profiles you log in with are
                                    remembered for one-click sign-in.
                                </p>

                                {error && (
                                    <div className="mt-4 p-ui rounded-ui border border-red-500/40 bg-red-500/10 text-red-500 dark:text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* QUICK LOGIN */}
                                <h2 className="font-mono text-[12px] mt-6 mb-2 opacity-70">QUICK LOGIN</h2>
                                {profiles.length === 0 ? (
                                    <div className="p-ui rounded-ui border border-dashed border-main-dark/20 dark:border-main/20 text-sm opacity-60">
                                        No saved profiles yet — create one below.
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-3">
                                        {profiles.map((p) => (
                                            <ProfileCard
                                                key={p.id}
                                                profile={p}
                                                onSelect={() => handleQuickLogin(p)}
                                                onRemove={() => handleRemove(p.id)}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* NEW PROFILE */}
                                <h2 className="font-mono text-[12px] mt-8 mb-2 opacity-70">NEW PROFILE</h2>
                                <form
                                    onSubmit={handleCreate}
                                    className="p-ui rounded-ui border border-main-dark/5 dark:border-main/5 bg-main-dark/5 dark:bg-main/5 flex flex-col gap-3 max-w-md"
                                >
                                    <div className="flex flex-col gap-y-1">
                                        <label htmlFor="login-name" className="text-sm opacity-70">
                                            Full Name
                                        </label>
                                        <input
                                            id="login-name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Dr. Pradeep Kumar"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-y-1">
                                        <label htmlFor="login-licence" className="text-sm opacity-70">
                                            Certification / License No.
                                        </label>
                                        <input
                                            id="login-licence"
                                            value={licence}
                                            onChange={(e) => setLicence(e.target.value)}
                                            placeholder="e.g. LAB011010231"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-y-1">
                                        <label htmlFor="login-role" className="text-sm opacity-70">
                                            Role
                                        </label>
                                        <select
                                            id="login-role"
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                            className={inputClass}
                                        >
                                            {ROLE_OPTIONS.map((opt) => (
                                                <option
                                                    key={opt}
                                                    value={opt}
                                                    className="bg-white dark:bg-main-dark text-main-dark dark:text-main"
                                                >
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button className="p-2 button border dark:border-main/5 border-main-dark/5">
                                        Log in
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}