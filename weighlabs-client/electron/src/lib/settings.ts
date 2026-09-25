export type ThemeMode = 'system' | 'dark' | 'light'
export type FontSize = 'sm' | 'md' | 'lg'

export interface AppSettings {
    theme: ThemeMode
    fontSize: FontSize
}

const SETTINGS_KEY = 'weighlabs.settings'

export const FONT_SIZE_LABELS: Record<FontSize, string> = {
    sm: 'Small',
    md: 'Medium',
    lg: 'Large',
}

export const FONT_SIZE_PX: Record<FontSize, string> = {
    sm: '14px',
    md: '16px',
    lg: '18px',
}

export function getSettings(): AppSettings {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY)
        if (!raw) return { theme: 'system', fontSize: 'md' }
        const parsed = JSON.parse(raw) as Partial<AppSettings>
        return {
            theme: parsed.theme === 'dark' || parsed.theme === 'light' || parsed.theme === 'system' ? parsed.theme : 'system',
            fontSize:
                parsed.fontSize === 'sm' || parsed.fontSize === 'md' || parsed.fontSize === 'lg'
                    ? parsed.fontSize
                    : 'md',
        }
    } catch {
        return { theme: 'system', fontSize: 'md' }
    }
}

export function saveSettings(patch: Partial<AppSettings>): AppSettings {
    const next = { ...getSettings(), ...patch }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
    applySettings(next)
    return next
}

export function applySettings(settings: AppSettings) {
    window.theme?.set(settings.theme)
    document.documentElement.style.colorScheme = settings.theme === 'dark' ? 'dark' : settings.theme === 'light' ? 'light' : ''
    document.documentElement.style.fontSize = FONT_SIZE_PX[settings.fontSize]
}