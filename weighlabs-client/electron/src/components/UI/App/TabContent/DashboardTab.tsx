import { useCallback, useEffect, useRef, useState } from 'react'
import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import type {
    NawiFrame,
    NawiInstrumentInfo,
    NawiStreamStatus,
    TestPayload,
    TestRecord,
    TestSummary,
} from '../../../../shared'
import { consumePendingRun, navigateTo, onRunRequest } from '../../../../lib/tabBus'
import { addHistory } from '../../../../lib/history'

const PHASE_NAMES: Record<number, string> = {
    1: 'Warm-up',
    2: 'Zero setting',
    3: 'Min load',
    4: 'Max load',
    5: 'Eccentricity',
    6: 'Accuracy (ascending)',
    7: 'Accuracy (descending)',
    8: 'Repeatability',
    9: 'Tare accuracy',
    10: 'Voltage variation',
    11: 'Completed',
}

const CORNER_NAMES: Record<number, string> = {
    1: 'Center',
    2: 'Front',
    3: 'Rear',
    4: 'Left',
    5: 'Right',
}

type StreamState = NawiStreamStatus['state']

type TempUnit = 'K' | 'C' | 'F'
type WeightUnit = 'KG' | 'G' | 'MG' | 'LBS'

const tempConvert = (c: number, unit: TempUnit) =>
    unit === 'K' ? c + 273.15 : unit === 'F' ? (c * 9) / 5 + 32 : c

const tempSuffix = (unit: TempUnit) => (unit === 'K' ? 'K' : unit === 'C' ? '°C' : '°F')

const weightConvert = (kg: number, unit: WeightUnit) => {
    switch (unit) {
        case 'G':
            return kg * 1000
        case 'MG':
            return kg * 1e6
        case 'LBS':
            return kg * 2.20462
        default:
            return kg
    }
}

const weightSuffix = (unit: WeightUnit) => (unit === 'KG' ? 'KG' : unit === 'G' ? 'G' : unit === 'MG' ? 'MG' : 'lbs')

function computeSummary(frames: NawiFrame[], startedAtMs: number, durationMs: number): TestSummary | null {
    if (frames.length === 0) return null
    let stableNonCompliant = 0
    let maxAbs = 0
    let maxMpe = 0
    for (const f of frames) {
        if (f.stable && !f.eCompliant) stableNonCompliant += 1
        maxAbs = Math.max(maxAbs, Math.abs(f.indicatedErrorE))
        maxMpe = Math.max(maxMpe, f.maxPermissibleErrorE)
    }
    return {
        phase: PHASE_NAMES[frames[frames.length - 1].phase] ?? String(frames[frames.length - 1].phase),
        frames: frames.length,
        startedAt: new Date(startedAtMs).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs,
        stableNonCompliant,
        maxAbsErrorE: maxAbs,
        maxMpeE: maxMpe,
        passed: stableNonCompliant === 0 && frames.length > 0,
    }
}

function getActiveDuration(elapsedBeforePauseMs: number, activeSegmentStartedAtMs: number) {
    return elapsedBeforePauseMs + (activeSegmentStartedAtMs > 0 ? Date.now() - activeSegmentStartedAtMs : 0)
}

const MAX_KEPT_FRAMES = 20000

export function DashboardTab() {
    const [frames, setFrames] = useState<NawiFrame[]>([])
    const [streamState, setStreamState] = useState<StreamState>('idle')
    const [streamError, setStreamError] = useState<string | null>(null)
    const [info, setInfo] = useState<NawiInstrumentInfo | null>(null)
    const [seconds, setSeconds] = useState(0)
    const [tempUnit, setTempUnit] = useState<TempUnit>('K')
    const [weightUnit, setWeightUnit] = useState<WeightUnit>('KG')
    const [notice, setNotice] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const [incomplete, setIncomplete] = useState<TestRecord[]>([])

    const framesRef = useRef<NawiFrame[]>([])
    const activeRunGenerationRef = useRef(0)
    const lifecycleRef = useRef({ token: 0, runGeneration: 0 })
    const startedAtRef = useRef(0)
    const elapsedBeforePauseRef = useRef(0)
    const activeSegmentStartedAtRef = useRef(0)
    const activeTestRef = useRef<TestRecord | null>(null)
    const runTestIdRef = useRef<string | null>(null)
    const runStartedRef = useRef(false)
    const finalizedRef = useRef(false)

    const beginRun = useCallback(async (runToken: number, testId: string) => {
        const generation = ++lifecycleRef.current.runGeneration
        const isCurrentRun = () =>
            lifecycleRef.current.token === runToken && lifecycleRef.current.runGeneration === generation
        try {
            const rec = window.tests ? await window.tests.get(testId) : null
            if (!isCurrentRun()) return
            activeRunGenerationRef.current = generation
            activeTestRef.current = rec
            finalizedRef.current = false
            if (rec?.id) {
                addHistory({
                    type: 'test',
                    message: `Test run started — ${rec.fileName}`,
                    testId: rec.id,
                    status: 'PENDING',
                })
            }
            framesRef.current = []
            setFrames([])
            setInfo(null)
            elapsedBeforePauseRef.current = 0
            activeSegmentStartedAtRef.current = 0

            const res = rec ? await window.nawi!.start(rec.payload?.config ?? null) : null
            if (!isCurrentRun()) return
            if (!res) throw new Error('No instrument information received from NAWI stream')
            startedAtRef.current = Date.now()
            activeSegmentStartedAtRef.current = startedAtRef.current
            setInfo(res)
            setSeconds(0)
            setStreamError(null)
            setNotice(null)
        } catch (err) {
            if (!isCurrentRun()) return
            setStreamState('error')
            setStreamError(err instanceof Error ? err.message : String(err))
        }
    }, [])

    const loadIncomplete = useCallback(async (loadToken: number) => {
        if (lifecycleRef.current.token !== loadToken) return
        const all = window.tests ? await window.tests.list() : []
        if (lifecycleRef.current.token !== loadToken) return
        setIncomplete(all.filter((t) => t.status === 'INC'))
    }, [])

    const finalizeRun = useCallback(async (runToken: number, runGeneration: number) => {
        const isCurrentFinalization = () =>
            lifecycleRef.current.token === runToken &&
            lifecycleRef.current.runGeneration === runGeneration &&
            activeRunGenerationRef.current === runGeneration
        if (finalizedRef.current || !isCurrentFinalization()) return
        finalizedRef.current = true
        try {
            const captured = framesRef.current
            const durationMs = getActiveDuration(
                elapsedBeforePauseRef.current,
                activeSegmentStartedAtRef.current,
            )
            const summary = computeSummary(captured, startedAtRef.current, durationMs)
            const payload: TestPayload = {
                ...(activeTestRef.current?.payload ?? {}),
                frames: captured,
                summary,
            }
            const serial = payload.config?.serialNumber ?? 'NAWI'
            const fileName = `Test ${serial} - ${new Date().toLocaleDateString('en-GB')}`
            const manufacturerId = payload.manufacturer?.['Manufacturer Name'] ?? serial
            const createdAt = activeTestRef.current?.createdAt ?? new Date().toISOString()
            const status = summary?.passed ? 'PASS' : 'FAIL'
            const record = await window.tests?.complete({
                id: activeTestRef.current?.id ?? null,
                fileName,
                manufacturerId,
                createdAt,
                completedAt: new Date().toISOString(),
                status,
                payload,
            })
            if (!isCurrentFinalization()) return
            if (record?.id) {
                addHistory({
                    type: 'test',
                    message: `Test ${status === 'PASS' ? 'passed' : 'failed'} — ${record.fileName}`,
                    testId: record.id,
                    status,
                })
            }
            setNotice(
                `Test ${status === 'PASS' ? 'passed' : 'failed'}${
                    summary ? ` (${summary.frames} frames, ${summary.stableNonCompliant} non-compliant stable)` : ' (no frames captured)'
                } — "${record?.fileName}" saved to View Reports.`,
            )
            void loadIncomplete(runToken)
        } catch (err) {
            if (!isCurrentFinalization()) return
            finalizedRef.current = false
            setStreamError(err instanceof Error ? err.message : String(err))
        }
    }, [loadIncomplete])

    useEffect(() => {
        const ownerLifecycle = lifecycleRef.current
        const token = ++ownerLifecycle.token
        ++ownerLifecycle.runGeneration

        const unSubFrame = window.nawi?.onFrame((frame) => {
            if (lifecycleRef.current.token !== token) return
            setFrames((prev) => {
                const next =
                    prev.length >= MAX_KEPT_FRAMES
                        ? [...prev.slice(prev.length - MAX_KEPT_FRAMES + 1), frame]
                        : [...prev, frame]
                framesRef.current = next
                return next
            })
        })
        const unSubStatus = window.nawi?.onStatus((status) => {
            if (lifecycleRef.current.token !== token) return
            setStreamState(status.state)
            if (status.message) setStreamError(status.message)
            if (
                (status.state === 'paused' || status.state === 'ended' || status.state === 'error') &&
                activeSegmentStartedAtRef.current > 0
            ) {
                elapsedBeforePauseRef.current += Date.now() - activeSegmentStartedAtRef.current
                activeSegmentStartedAtRef.current = 0
            }
            if (status.state === 'paused') {
                setSeconds(Math.floor(elapsedBeforePauseRef.current / 1000))
            } else if (
                status.state === 'running' &&
                runTestIdRef.current &&
                activeSegmentStartedAtRef.current === 0
            ) {
                activeSegmentStartedAtRef.current = Date.now()
            }
            if (status.state === 'ended' && runTestIdRef.current && !finalizedRef.current) {
                void finalizeRun(token, activeRunGenerationRef.current)
            }
        })
        const unSubRun = onRunRequest((req) => {
            if (lifecycleRef.current.token !== token) return
            runTestIdRef.current = req.testId
            runStartedRef.current = true
            void beginRun(token, req.testId)
        })

        const pending = consumePendingRun()
        if (pending) {
            runTestIdRef.current = pending.testId
            runStartedRef.current = true
            void beginRun(token, pending.testId)
        } else if (runStartedRef.current && runTestIdRef.current) {
            // re-armed after a strict-mode remount while a run was pending
            void beginRun(token, runTestIdRef.current)
        }
        void loadIncomplete(token)

        return () => {
            const cleanupToken = ++ownerLifecycle.token
            unSubFrame?.()
            unSubStatus?.()
            unSubRun?.()
            window.setTimeout(() => {
                if (ownerLifecycle.token === cleanupToken) {
                    void window.nawi?.stop()
                }
            }, 0)
        }
    }, [beginRun, finalizeRun, loadIncomplete])

    useEffect(() => {
        if (streamState !== 'running') return
        const t = setInterval(() => {
            setSeconds(
                Math.floor(
                    getActiveDuration(
                        elapsedBeforePauseRef.current,
                        activeSegmentStartedAtRef.current,
                    ) / 1000,
                ),
            )
        }, 1000)
        return () => clearInterval(t)
    }, [streamState])

    const latest = frames[frames.length - 1]
    const firstMs = frames.length > 0 ? frames[0].timestampMs : 0
    const testActive = streamState === 'connecting' || streamState === 'running' || streamState === 'paused'
    const idle = streamState === 'idle'

    const timeSeries = frames.map((f, i) => ({
        i,
        t: (f.timestampMs - firstMs) / 1000,
        gross: f.gross,
        temp: f.temperatureC,
        err: f.indicatedErrorE,
    }))

    const eccentricity = frames
        .filter((f) => f.phase === 5)
        .map((f, i) => ({
            idx: f.loadPoint?.pointIndex ?? i,
            name: CORNER_NAMES[f.corner] ?? String(f.corner),
            err: f.indicatedErrorE,
        }))

    const voltage = frames
        .filter((f) => f.phase === 10)
        .map((f, i) => ({
            idx: f.loadPoint?.pointIndex ?? i,
            name: f.loadPoint?.label ?? String(i),
            v: f.supplyVoltageV,
        }))

    const rerunTest = () => {
        if (!runTestIdRef.current) return
        runStartedRef.current = true
        void beginRun(lifecycleRef.current.token, runTestIdRef.current)
    }

    const runIncomplete = (testId: string) => {
        runTestIdRef.current = testId
        runStartedRef.current = true
        void beginRun(lifecycleRef.current.token, testId)
    }

    const setPaused = async (paused: boolean) => {
        if (busy) return
        setBusy(true)
        setStreamError(null)
        try {
            if (!window.nawi) throw new Error('NAWI stream is unavailable')
            if (paused) await window.nawi.pause()
            else await window.nawi.resume()
        } catch (err) {
            setStreamError(err instanceof Error ? err.message : String(err))
        } finally {
            setBusy(false)
        }
    }

    const endTest = () => {
        if (!runTestIdRef.current || busy || streamState === 'connecting') return
        if (!window.confirm('End this test and save it as a report?')) return
        void (async () => {
            setBusy(true)
            const runGeneration = ++lifecycleRef.current.runGeneration
            activeRunGenerationRef.current = runGeneration
            if (activeSegmentStartedAtRef.current > 0) {
                elapsedBeforePauseRef.current += Date.now() - activeSegmentStartedAtRef.current
                activeSegmentStartedAtRef.current = 0
            }
            try {
                await window.nawi?.stop()
                await finalizeRun(lifecycleRef.current.token, runGeneration)
            } finally {
                setBusy(false)
            }
        })()
    }

    const printNow = async () => {
        if (busy) return
        setBusy(true)
        try {
            const f = framesRef.current
            const durationMs = getActiveDuration(
                elapsedBeforePauseRef.current,
                activeSegmentStartedAtRef.current,
            )
            const summary = computeSummary(f, startedAtRef.current, durationMs)
            const payload: TestPayload = {
                ...(activeTestRef.current?.payload ?? {}),
                frames: f,
                summary,
            }
            const serial = info?.config?.serialNumber ?? payload.config?.serialNumber ?? 'NAWI'
            await window.reports?.exportPdf({
                fileName: `Test ${serial} - ${new Date().toLocaleDateString('en-GB')}`,
                status: summary?.passed ? 'PASS' : 'FAIL',
                payload,
            })
            addHistory({
                type: 'report',
                message: `Report exported — Test ${serial}`,
                status: summary?.passed ? 'PASS' : 'FAIL',
            })
        } finally {
            setBusy(false)
        }
    }

    const phaseName = latest ? PHASE_NAMES[latest.phase] ?? `Phase ${latest.phase}` : 'Waiting…'
    const title = info?.config?.serialNumber ? `Test #${info.config.serialNumber}` : 'Live NAWI Test'

    return (
        <div className="w-full font-ui text-black dark:text-white px-5 py-2 flex flex-col gap-2 dashboard">
            <div className="flex items-center">
                <div className="flex flex-col">
                    <h1 className="flex gap-1 items-center">{title}</h1>
                    <span className="text-[12px] opacity-50 font-mono">
                        {info ? `${info.source} · ${info.oimlStandard} · ${info.config?.model ?? ''}` : 'No test running — create a test to begin'}
                    </span>
                </div>

                {/* STREAM STATE */}
                <span
                    className={`ml-3 text-[12px] font-mono px-2 py-0.5 rounded-full border ${
                        streamState === 'running'
                            ? 'border-green-500/40 text-green-400'
                            : streamState === 'paused'
                              ? 'border-amber-500/40 text-amber-400'
                              : streamState === 'error'
                                ? 'border-red-500/40 text-red-400'
                                : 'border-yellow-500/40 text-yellow-500'
                    }`}
                >
                    {streamState === 'running' ? '● LIVE' : streamState === 'paused' ? 'PAUSED' : streamState === 'connecting' ? '◌ connecting' : streamState === 'error' ? '✕ error' : idle ? '○ idle' : '■ stopped'}
                </span>

                {/* BUTTONS */}
                <div className="ml-auto flex gap-1">
                    {idle ? (
                        <button
                            onClick={() => navigateTo('create-test')}
                            className="p-ui min-w-20 button border border-white/5 bg-indigo-400 dark:bg-indigo-950"
                        >
                            Create Test
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={printNow}
                                disabled={busy}
                                className="p-ui min-w-20 button border border-white/5 bg-neutral-400 dark:bg-neutral-900"
                            >
                                Print
                            </button>
                            {streamState === 'connecting' ? (
                                <button
                                    disabled
                                    className="p-ui min-w-20 button border border-white/5 bg-indigo-400/40 dark:bg-indigo-950/40 opacity-50"
                                >
                                    Starting
                                </button>
                            ) : streamState === 'running' ? (
                                <button
                                    onClick={() => void setPaused(true)}
                                    disabled={busy}
                                    className="p-ui min-w-20 button border border-white/5 bg-amber-400 dark:bg-amber-950"
                                >
                                    Pause Test
                                </button>
                            ) : streamState === 'paused' ? (
                                <button
                                    onClick={() => void setPaused(false)}
                                    disabled={busy}
                                    className="p-ui min-w-20 button border border-white/5 bg-indigo-400 dark:bg-indigo-950"
                                >
                                    Resume Test
                                </button>
                            ) : (
                                <button
                                    onClick={rerunTest}
                                    disabled={busy}
                                    className="p-ui min-w-20 button border border-white/5 bg-indigo-400 dark:bg-indigo-950"
                                >
                                    Rerun Test
                                </button>
                            )}
                            <button
                                onClick={endTest}
                                disabled={busy || streamState === 'connecting'}
                                className="p-ui min-w-20 button border border-white/5 bg-red-400 dark:bg-red-950"
                            >
                                End Test
                            </button>
                        </>
                    )}
                </div>
            </div>

            {notice && (
                <div className="p-ui rounded-ui border border-green-500/40 bg-green-500/10 text-green-500 dark:text-green-400 text-sm">
                    {notice}
                </div>
            )}
            {streamError && (
                <div className="p-ui rounded-ui border border-red-500/40 bg-red-500/10 text-red-400 text-sm">
                    {streamError}
                </div>
            )}

            <div className="flex gap-dashboard">
                {idle ? (
                    <>
                        <div className="flex-1 h-100 dashboard-material flex items-center justify-center">
                            <div className="text-center flex flex-col gap-3">
                                <h2 className="text-2xl">No test is running</h2>
                                <p className="opacity-60 max-w-80 mx-auto">
                                    Create a test instance to start streaming live NAWI data from rust-stream into the dashboard.
                                </p>
                                <div>
                                    <button
                                        onClick={() => navigateTo('create-test')}
                                        className="p-ui min-w-32 button border border-white/5 bg-indigo-400 dark:bg-indigo-950"
                                    >
                                        Create Test
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 h-100 dashboard-material p-ui flex flex-col">
                            <h2 className="text-2xl mb-1">
                                Incomplete Tests
                                {incomplete.length > 0 && <span className="text-indigo-400"> ({incomplete.length})</span>}
                            </h2>
                            <div className="flex-1 min-h-0 overflow-y-auto">
                                <IncompleteList records={incomplete} onRun={runIncomplete} />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* GRAPH — indication error vs time */}
                        <div className="flex-5 h-100 dashboard-material p-ui">
                            <h1 className="text-[16px] mb-1">{phaseName} — Indication Error (e)</h1>
                            <ResponsiveContainer width="100%" height="80%">
                                <LineChart data={timeSeries} margin={{ top: 4, right: 12, left: -14, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                                    <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                    <ReferenceLine y={0} stroke="currentColor" strokeDasharray="4 3" opacity={0.4} />
                                    <Line type="monotone" dataKey="err" name="error (e)" stroke="#3b82f6" dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Test Time */}
                        <div className="flex-1 p-ui h-100 bg-black/5 dashboard-material">
                            {/* DURATION */}
                            <div className=" rounded p-ui dark:border-white/10 border-black/10">
                                <h1 className="">Test Duration</h1>
                                <h3 className="text-4xl text-center border dark:border-white/10 border-black/10 p-ui rounded-ui">
                                    {String(Math.floor(seconds / 3600)).padStart(2, '0')}:
                                    {String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:
                                    {String(seconds % 60).padStart(2, '0')}
                                </h3>
                            </div>

                            {/* TEMPERATURE */}
                            <div className=" rounded p-ui dark:border-white/10 border-black/10">
                                <h1 className="">Instrument Temperature</h1>
                                <h3 className="text-4xl text-center border dark:border-white/10 border-black/10 p-ui rounded-t-ui">
                                    {latest ? tempConvert(latest.temperatureC, tempUnit).toFixed(3) : '—'}
                                    {tempSuffix(tempUnit)}
                                </h3>
                                <div className="flex">
                                    <button className="flex-1 my-1 text-black dark:text-white rounded-bl border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5/5" onClick={() => setTempUnit('K')}>Kelvin</button>
                                    <button className="flex-1 my-1 text-black dark:text-white border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5/5" onClick={() => setTempUnit('C')}>Celsius</button>
                                    <button className="flex-1 my-1 text-black dark:text-white rounded-br-ui border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5/5" onClick={() => setTempUnit('F')}>Farenheit</button>
                                </div>
                            </div>

                            {/* CURRENT WEIGHT READING */}
                            <div className=" rounded p-ui dark:border-white/10 border-black/10">
                                <h1 className="">Current Weight Reading</h1>
                                <h3 className="text-4xl text-center border dark:border-white/10 border-black/10 p-ui rounded-t-ui">
                                    {latest ? weightConvert(latest.gross, weightUnit).toFixed(3) : '—'} {weightSuffix(weightUnit)}
                                </h3>
                                <div className="flex">
                                    <button className="flex-1 my-1 text-black dark:text-white rounded-bl border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5/5" onClick={() => setWeightUnit('KG')}>KG</button>
                                    <button className="flex-1 my-1 text-black dark:text-white border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5/5" onClick={() => setWeightUnit('G')}>G</button>
                                    <button className="flex-1 my-1 text-black dark:text-white border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5/5" onClick={() => setWeightUnit('MG')}>MG</button>
                                    <button className="flex-1 my-1 text-black dark:text-white rounded-br-ui border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5/5" onClick={() => setWeightUnit('LBS')}>lbs</button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {!idle && (
                <div className="flex gap-dashboard">
                    <div className="p-ui dashboard-material flex-1 flex flex-col gap-1 h-100 bg-black/5">
                        {/* WEIGHT */}
                        <h1 className="text-[20px] px-ui flex-1">Weight</h1>
                        <div className="w-full h-full rounded-ui bg-black/5">
                            <MiniChart data={timeSeries} x="t" y="gross" name="weight" color="#22c55e" />
                        </div>
                    </div>
                    <div className="p-ui dashboard-material flex-1 flex flex-col gap-1 h-100 bg-black/5">
                        <h1 className="text-[20px] px-ui flex-1">Instrument Temperature</h1>
                        <div className="w-full h-full rounded-ui bg-black/5">
                            <MiniChart data={timeSeries} x="t" y="temp" name="temp °C" color="#f97316" />
                        </div>
                    </div>
                    <div className="p-ui dashboard-material flex-1 flex flex-col gap-1 h-100 bg-black/5">
                        <h1 className="text-[20px] px-ui flex-1">Eccentricity</h1>
                        <div className="w-full h-full rounded-ui bg-black/5">
                            <MiniChart data={eccentricity} x="idx" y="err" name="error e" color="#a855f7" unit={eccentricity.length > 0 ? eccentricity[0].name : undefined} />
                        </div>
                    </div>
                    <div className="p-ui dashboard-material flex-1 flex flex-col gap-1 h-100 bg-black/5">
                        <h1 className="text-[20px] px-ui flex-1">Voltage Variations</h1>
                        <div className="w-full h-full rounded-ui bg-black/5">
                            <MiniChart data={voltage} x="idx" y="v" name="voltage V" color="#ef4444" unit={voltage.length > 0 ? voltage[0].name : undefined} />
                        </div>
                    </div>
                </div>
            )}

            {!idle && !testActive && incomplete.length > 0 && (
                <div className="p-ui dashboard-material flex flex-col gap-1">
                    <h2 className="text-[16px]">
                        Incomplete Tests
                        <span className="text-indigo-400"> ({incomplete.length})</span>
                    </h2>
                    <div className="max-h-40 min-h-0 overflow-y-auto">
                        <IncompleteList records={incomplete} onRun={runIncomplete} />
                    </div>
                </div>
            )}
        </div>
    )
}

function IncompleteList({ records, onRun }: { records: TestRecord[]; onRun: (testId: string) => void }) {
    if (records.length === 0) {
        return (
            <p className="opacity-50 text-sm">
                No incomplete tests. Tests saved for later from Create Test will appear here to pick up and run.
            </p>
        )
    }
    return (
        <ul className="flex flex-col gap-1">
            {records.map((t) => (
                <li
                    key={t.id}
                    className="flex items-center gap-2 p-ui rounded-ui border border-white/5 bg-white/5 dark:bg-white/5"
                >
                    <span className="flex-1 min-w-0">
                        <span className="block truncate text-sm">{t.fileName}</span>
                        <span className="block text-[12px] opacity-50 font-mono">
                            {new Date(t.createdAt).toLocaleString()} · {t.payload?.config?.serialNumber ?? 'no serial'}
                        </span>
                    </span>
                    <button
                        onClick={() => onRun(t.id)}
                        className="p-ui min-w-16 button border border-white/5 bg-indigo-400 dark:bg-indigo-950 text-sm"
                    >
                        Run
                    </button>
                </li>
            ))}
        </ul>
    )
}

function MiniChart({
    data,
    x,
    y,
    name,
    color,
    unit,
}: {
    data: Array<Record<string, number | string>>
    x: string
    y: string
    name: string
    color: string
    unit?: string
}) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 6, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                <XAxis dataKey={x} hide />
                <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    labelFormatter={(value) =>
                        unit !== undefined ? `${name} @ ${String(unit)}` : `${x} ${String(value)}`
                    }
                />
                <Line type="monotone" dataKey={y} name={name} stroke={color} dot={false} isAnimationActive={false} strokeWidth={1.5} />
            </LineChart>
        </ResponsiveContainer>
    )
}