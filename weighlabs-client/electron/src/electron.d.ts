import type {
    CompleteTestInput,
    CreateTestInput,
    NawiInstrumentInfo,
    NawiScaleConfig,
    NawiStreamStatus,
    ReportPdfInput,
    ReportPdfResult,
    TestRecord,
} from './shared'

export interface WindowControls {
    minimize: () => void
    toggleMaximize: () => void
    close: () => void
    isMaximized: () => Promise<boolean>
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void
}

export interface TestsApi {
    list: () => Promise<TestRecord[]>
    get: (id: string) => Promise<TestRecord | null>
    create: (input: CreateTestInput) => Promise<TestRecord>
    update: (id: string, patch: Partial<TestRecord>) => Promise<TestRecord | null>
    remove: (id: string) => Promise<void>
    complete: (input: CompleteTestInput) => Promise<TestRecord>
}

export interface NawiApi {
    start: (config?: NawiScaleConfig | null) => Promise<NawiInstrumentInfo>
    pause: () => Promise<void>
    resume: () => Promise<void>
    stop: () => Promise<void>
    onFrame: (callback: (frame: import('./shared').NawiFrame) => void) => () => void
    onStatus: (callback: (status: import('./shared').NawiStreamStatus) => void) => () => void
}

export interface ReportsApi {
    exportPdf: (input: ReportPdfInput) => Promise<ReportPdfResult>
    exportCsv: (input: ReportPdfInput) => Promise<ReportPdfResult>
    exportDocx: (input: ReportPdfInput) => Promise<ReportPdfResult>
}

export interface ThemeApi {
    set: (theme: 'system' | 'dark' | 'light') => Promise<void>
}

declare global {
    interface Window {
        windowControls?: WindowControls
        tests?: TestsApi
        nawi?: NawiApi
        reports?: ReportsApi
        theme?: ThemeApi
    }
}

export {}