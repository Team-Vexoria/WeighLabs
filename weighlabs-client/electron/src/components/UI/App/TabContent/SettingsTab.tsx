import { useState } from 'react'
import { Icon } from '@iconify/react'
import {
    FONT_SIZE_LABELS,
    getSettings,
    saveSettings,
    type AppSettings,
    type FontSize,
    type ThemeMode,
} from '../../../../lib/settings'
import { addHistory } from '../../../../lib/history'

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'system', label: 'System', icon: 'clarity:computer-solid' },
    { value: 'dark', label: 'Dark', icon: 'carbon:moon' },
    { value: 'light', label: 'Light', icon: 'carbon:sun' },
]

const FONT_OPTIONS: FontSize[] = ['sm', 'md', 'lg']

const optionClass = (selected: boolean) =>
    `flex flex-col items-center gap-1 px-4 py-3 rounded-ui border duration-ui ${
        selected
            ? 'border-indigo-500/60 bg-indigo-500/10 text-main-dark dark:text-white'
            : 'border-main-dark/10 dark:border-main/10 bg-main-dark/5 dark:bg-main/5 text-main-dark/70 dark:text-white/70 hover:bg-main-dark/10 dark:hover:bg-main/10'
    }`

const sectionCard =
    'p-ui rounded-ui border border-main-dark/5 dark:border-main/5 bg-main-dark/5 dark:bg-main/5 mb-2'

export function SettingsTab() {
    const [settings, setSettings] = useState<AppSettings>(() => getSettings())

    const update = (patch: Partial<AppSettings>) => {
        const next = saveSettings(patch)
        setSettings(next)
        const parts: string[] = []
        if (patch.theme) parts.push(`theme → ${patch.theme}`)
        if (patch.fontSize) parts.push(`font size → ${FONT_SIZE_LABELS[patch.fontSize]}`)
        addHistory({ type: 'settings', message: `Settings changed: ${parts.join(', ')}` })
    }

    return (
        <div className="w-full px-5 py-2 font-ui flex flex-col">
            <h1 className="text-3xl mb-5">Settings</h1>

            {/* APPEARANCE */}
            <h2 className="font-mono text-[12px] opacity-70 mb-1">APPEARANCE</h2>
            <div className={sectionCard}>
                <h3 className="pb-2 text-[16px]">Theme</h3>
                <div className="flex gap-2">
                    {THEME_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => update({ theme: opt.value })}
                            className={optionClass(settings.theme === opt.value)}
                        >
                            <Icon icon={opt.icon} className="text-2xl" />
                            <span className="text-sm">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className={sectionCard}>
                <h3 className="pb-2 text-[16px]">Font Size</h3>
                <p className="text-sm opacity-60 pb-2">Scales the interface text and spacing without breaking the layout.</p>
                <div className="flex gap-2">
                    {FONT_OPTIONS.map((size) => (
                        <button
                            key={size}
                            onClick={() => update({ fontSize: size })}
                            className={optionClass(settings.fontSize === size)}
                        >
                            <span className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-base' : 'text-2xl'}>Aa</span>
                            <span className="text-sm">{FONT_SIZE_LABELS[size]}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className={sectionCard}>
                <h3 className="pb-2 text-[16px]">Interface Preview</h3>
                <div className="flex flex-col gap-2 text-sm">
                    <p>
                        The <strong>heading</strong> and <em>body</em> text resize with your chosen font size, keeping the
                        dashboard, forms and reports aligned.
                    </p>
                    <div className="text-xs opacity-60">
                        Current: theme = {settings.theme} · font-size = {FONT_SIZE_LABELS[settings.fontSize]}
                    </div>
                </div>
            </div>

            {/* ABOUT */}
            <h2 className="font-mono text-[12px] opacity-70 mb-1 mt-4">ABOUT</h2>
            <div className={sectionCard}>
                <p className="text-sm opacity-70">
                    WeighLabs — OIML R76 non-automatic weighing instrument verifier. Settings are saved locally on this
                    device and are shared across all operator profiles.
                </p>
            </div>
        </div>
    )
}