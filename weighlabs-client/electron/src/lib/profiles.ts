export interface LoginProfile {
    id: string
    name: string
    licenceNumber: string
    role: string
    operatorSignature?: string
    createdAt: string
    lastLoginAt?: string
}

const PROFILES_KEY = 'weighlabs.loginProfiles'
const CURRENT_KEY = 'weighlabs.currentProfile'

function readProfiles(): LoginProfile[] {
    try {
        const raw = localStorage.getItem(PROFILES_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? (parsed as LoginProfile[]) : []
    } catch {
        return []
    }
}

function writeProfiles(profiles: LoginProfile[]) {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}

export function getProfiles(): LoginProfile[] {
    return readProfiles()
}

export function getCurrentProfile(): LoginProfile | null {
    try {
        const id = localStorage.getItem(CURRENT_KEY)
        if (!id) return null
        return readProfiles().find((p) => p.id === id) ?? null
    } catch {
        return null
    }
}

export function loginAs(profile: LoginProfile): LoginProfile {
    const profiles = readProfiles()
    const existing = profiles.find((p) => p.id === profile.id)
    const now = new Date().toISOString()
    const updated: LoginProfile = existing
        ? { ...existing, ...profile, lastLoginAt: now }
        : { ...profile, lastLoginAt: now }
    const next = existing ? profiles.map((p) => (p.id === existing.id ? updated : p)) : [...profiles, updated]
    writeProfiles(next)
    localStorage.setItem(CURRENT_KEY, updated.id)
    return updated
}

export function logout() {
    localStorage.removeItem(CURRENT_KEY)
}

export function removeProfile(id: string) {
    writeProfiles(readProfiles().filter((p) => p.id !== id))
    if (localStorage.getItem(CURRENT_KEY) === id) {
        localStorage.removeItem(CURRENT_KEY)
    }
}