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
    stop: () => Promise<void>
    onFrame: (callback: (frame: import('./shared').NawiFrame) => void) => () => void
    onStatus: (callback: (status: NawiStreamStatus) => void) => () => void
}

export interface ReportsApi {
    exportPdf: (input: ReportPdfInput) => Promise<ReportPdfResult>
}

declare global {
    interface Window {
        windowControls?: WindowControls
        tests?: TestsApi
        nawi?: NawiApi
        reports?: ReportsApi
    }
}

export {}