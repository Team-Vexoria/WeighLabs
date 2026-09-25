export type TestStatus = 'INC' | 'PASS' | 'FAIL'

export interface TestSummary {
    phase: string
    frames: number
    startedAt: string | null
    finishedAt: string | null
    durationMs: number
    stableNonCompliant: number
    maxAbsErrorE: number
    maxMpeE: number
    passed: boolean
}

export interface NawiScaleConfig {
    serialNumber: string
    model: string
    accuracyClass: number
    unit: number
    maxCapacity: number
    minCapacity: number
    verificationInterval: number
    actualInterval: number
    numberOfIntervals: number
}

export interface NawiLoadPoint {
    label: string
    referenceLoad: number
    loadInE: number
    pointIndex: number
}

export interface NawiFrame {
    sequence: number
    timestampMs: number
    phase: number
    loadPoint: NawiLoadPoint | null
    corner: number
    gross: number
    tare: number
    net: number
    stable: boolean
    zeroOffset: number
    temperatureC: number
    humidityRh: number
    supplyVoltageV: number
    indicatedErrorE: number
    maxPermissibleErrorE: number
    eCompliant: boolean
    config: NawiScaleConfig | null
    note: string
}

export interface NawiInstrumentInfo {
    config: NawiScaleConfig | null
    source: string
    oimlStandard: string
    streamFormat: string
}

export interface TestPayload {
    instrument?: Record<string, string>
    manufacturer?: Record<string, string>
    operator?: Record<string, string>
    laboratory?: Record<string, string>
    config?: NawiScaleConfig | null
    frames?: NawiFrame[]
    summary?: TestSummary | null
}

export interface TestRecord {
    id: string
    fileName: string
    status: TestStatus
    manufacturerId: string
    createdAt: string
    completedAt: string | null
    payload: TestPayload | null
}

export interface CreateTestInput {
    fileName: string
    manufacturerId: string
    createdAt: string
    payload: TestPayload
}

export interface CompleteTestInput {
    id: string | null
    fileName: string
    manufacturerId: string
    createdAt: string
    completedAt: string
    status: TestStatus
    payload: TestPayload
}

export interface ReportPdfInput {
    fileName: string
    status: TestStatus
    payload: TestPayload
}

export interface ReportPdfResult {
    path: string | null
    cancelled: boolean
}

export interface NawiStreamStatus {
    state: 'idle' | 'connecting' | 'running' | 'paused' | 'ended' | 'error'
    message?: string
}