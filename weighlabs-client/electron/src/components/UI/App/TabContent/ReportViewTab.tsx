import { useState } from 'react'
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
import type { TestRecord } from '../../../../shared'
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

const statusBg: Record<string, string> = {
    PASS: 'border-green-500/40 bg-green-500/10',
    FAIL: 'border-red-500/40 bg-red-500/10',
    INC: 'border-yellow-500/40 bg-yellow-500/10',
}

type ExportKind = 'pdf' | 'csv' | 'docx'

const EXPORT_LABEL: Record<ExportKind, string> = {
    pdf: 'PDF',
    csv: 'CSV',
    docx: 'DOCX',
}

export function ReportViewTab({ record }: { record: TestRecord }) {
    const [exporting, setExporting] = useState<ExportKind | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [deleted, setDeleted] = useState(false)

    const payload = record.payload ?? {}
    const frames = payload.frames ?? []
    const summary = payload.summary ?? null
    const config = payload.config ?? null
    const instrument = payload.instrument ?? {}
    const manufacturer = payload.manufacturer ?? {}
    const operator = payload.operator ?? {}
    const laboratory = payload.laboratory ?? {}

    const firstMs = frames.length > 0 ? frames[0].timestampMs : 0
    const timeData = frames.map((f) => ({
        t: (f.timestampMs - firstMs) / 1000,
        weight: f.gross,
        temp: f.temperatureC,
        err: f.indicatedErrorE,
    }))
    const maxMpe = frames.reduce((m, f) => Math.max(m, f.maxPermissibleErrorE), 0)

    const doExport = async (kind: ExportKind) => {
        setExporting(kind)
        setMessage(null)
        try {
            const input = {
                fileName: record.fileName,
                status: record.status,
                payload: record.payload ?? {},
            }
            const result =
                kind === 'pdf'
                    ? await window.reports?.exportPdf(input)
                    : kind === 'csv'
                      ? await window.reports?.exportCsv(input)
                      : await window.reports?.exportDocx(input)

            if (result && !result.cancelled) {
                setMessage(result.path ? `${EXPORT_LABEL[kind]} saved to ${result.path}` : `Exported ${EXPORT_LABEL[kind]}.`)
                addHistory({
                    type: 'report',
                    message: `Report exported (${EXPORT_LABEL[kind]}) — ${record.fileName}`,
                    status: record.status === 'INC' ? 'PENDING' : record.status,
                })
            } else {
                setMessage('Export cancelled.')
            }
        } catch (err) {
            setMessage(err instanceof Error ? err.message : String(err))
        } finally {
            setExporting(null)
        }
    }

    const doDelete = async () => {
        if (!window.confirm(`Delete report "${record.fileName}"?`)) return
        await window.tests?.remove(record.id)
        addHistory({ type: 'report', message: `Report deleted — ${record.fileName}` })
        setDeleted(true)
    }

    if (deleted) {
        return (
            <div className="w-full px-5 py-2 font-ui flex flex-col">
                <h1 className="text-3xl mb-5">Report</h1>
                <div className="p-ui rounded-ui border border-red-500/40 bg-red-500/10 text-red-400">
                    This report was deleted and is no longer available.
                </div>
            </div>
        )
    }

    const kvList = (rows: Record<string, string>) =>
        Object.entries(rows).filter(([, v]) => v !== '' && v !== undefined)

    const metaPairs = [
        ['Status', record.status],
        ['Created', record.createdAt ? new Date(record.createdAt).toLocaleString() : '—'],
        ['Completed', record.completedAt ? new Date(record.completedAt).toLocaleString() : '—'],
        ['Manufacturer', manufacturer['Manufacturer Name'] ?? record.manufacturerId ?? '—'],
        ...(config ? ([['Model', config.model], ['Serial No.', config.serialNumber], ['Accuracy Class', String(config.accuracyClass)]] as const) : []),
    ]

    const stableSample = frames
        .filter((f) => f.stable)
        .filter((_, i, arr) => i % Math.max(1, Math.floor(arr.length / 40)) === 0)

    return (
        <div className="w-full px-5 py-2 font-ui flex flex-col">
            <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                    <h1 className="text-3xl">{record.fileName}</h1>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm opacity-70">
                        {metaPairs.map(([k, v]) => (
                            <span key={k}>
                                {k}: <b className="font-mono">{String(v)}</b>
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex gap-1 items-center">
                    <span className={`px-2 py-0.5 rounded-full border text-[12px] font-mono ${statusBg[record.status]}`}>
                        {record.status}
                    </span>
                </div>
            </div>

            {message && (
                <div className="mt-3 p-ui rounded-ui border border-main-dark/10 dark:border-main/10 bg-main-dark/5 dark:bg-main/5 text-sm">
                    {message}
                </div>
            )}

            {/* ACTIONS */}
            <div className="flex gap-1 mt-3">
                <button
                    onClick={() => void doExport('pdf')}
                    disabled={exporting !== null}
                    className="p-2 button border dark:border-main/5 border-main-dark/5"
                >
                    {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
                </button>
                <button
                    onClick={() => void doExport('csv')}
                    disabled={exporting !== null}
                    className="p-2 button border dark:border-main/5 border-main-dark/5"
                >
                    {exporting === 'csv' ? 'Exporting…' : 'Export CSV'}
                </button>
                <button
                    onClick={() => void doExport('docx')}
                    disabled={exporting !== null}
                    className="p-2 button border dark:border-main/5 border-main-dark/5"
                >
                    {exporting === 'docx' ? 'Exporting…' : 'Export DOCX'}
                </button>
                <button
                    onClick={() => void doDelete()}
                    className="p-2 button border border-red-500/40 bg-red-500/10 text-red-500 dark:text-red-400"
                >
                    Delete
                </button>
            </div>

            {/* SUMMARY */}
            {summary && frames.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {[
                        ['Phase', summary.phase],
                        ['Frames captured', String(summary.frames)],
                        ['Duration', `${(summary.durationMs / 1000).toFixed(1)} s`],
                        ['Stable non-compliant', String(summary.stableNonCompliant)],
                        ['Max absolute error', `${summary.maxAbsErrorE.toFixed(3)} e`],
                        ['Max permissible error', `${summary.maxMpeE.toFixed(3)} e`],
                    ].map(([k, v]) => (
                        <div key={k} className="p-ui rounded-ui dashboard-material">
                            <h3 className="text-[12px] opacity-50">{k}</h3>
                            <p className="font-mono">{v}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mt-3 p-ui rounded-ui border border-dashed border-main-dark/20 dark:border-main/20 text-sm opacity-70">
                    {record.status === 'INC'
                        ? 'This test has not been run yet — open the Dashboard, run the test, then End Test to attach data.'
                        : 'No captured sample data for this report.'}
                </div>
            )}

            {/* CONFIG + PARTIES */}
            <div className="mt-3 flex gap-2">
                <div className="flex-1 p-ui rounded-ui dashboard-material">
                    <h3 className="text-[12px] opacity-50 pb-1">Scale Configuration</h3>
                    {config ? (
                        <div className="text-sm">
                            {[
                                ['Serial', config.serialNumber],
                                ['Model', config.model],
                                ['Max', String(config.maxCapacity)],
                                ['Min', String(config.minCapacity)],
                                ['e', String(config.verificationInterval)],
                                ['d', String(config.actualInterval)],
                                ['n', String(config.numberOfIntervals)],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-2 border-b border-main-dark/5 dark:border-main/5 py-0.5">
                                    <span className="opacity-60">{k}</span>
                                    <span className="font-mono">{v}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm opacity-60">No scale configuration recorded.</p>
                    )}
                </div>
                <div className="flex-1 p-ui rounded-ui dashboard-material">
                    <h3 className="text-[12px] opacity-50 pb-1">Instrument Information</h3>
                    <DetailRows pairs={kvList(instrument)} />
                </div>
                <div className="flex-1 p-ui rounded-ui dashboard-material">
                    <h3 className="text-[12px] opacity-50 pb-1">Manufacturer</h3>
                    <DetailRows pairs={kvList(manufacturer)} />
                </div>
            </div>

            <div className="mt-2 flex gap-2">
                <div className="flex-1 p-ui rounded-ui dashboard-material">
                    <h3 className="text-[12px] opacity-50 pb-1">Operator</h3>
                    <DetailRows pairs={kvList(operator)} />
                </div>
                <div className="flex-1 p-ui rounded-ui dashboard-material">
                    <h3 className="text-[12px] opacity-50 pb-1">Laboratory</h3>
                    <DetailRows pairs={kvList(laboratory)} />
                </div>
            </div>

            {/* CHARTS */}
            <div className="mt-3 flex gap-2">
                <div className="flex-1 h-64 p-ui rounded-ui dashboard-material">
                    <h3 className="text-[12px] opacity-50">Weight vs Time</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={timeData} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                            <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                            <Line type="monotone" dataKey="weight" name="weight (gross)" stroke="#22c55e" dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex-1 h-64 p-ui rounded-ui dashboard-material">
                    <h3 className="text-[12px] opacity-50">Temperature vs Time</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={timeData} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                            <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                            <Line type="monotone" dataKey="temp" name="temp °C" stroke="#f97316" dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex-1 h-64 p-ui rounded-ui dashboard-material">
                    <h3 className="text-[12px] opacity-50">Indication Error (e)</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={timeData} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                            <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                            <ReferenceLine y={0} stroke="currentColor" strokeDasharray="4 3" opacity={0.4} />
                            {maxMpe > 0 && <ReferenceLine y={maxMpe} stroke="#ef4444" strokeDasharray="6 4" />}
                            <Line type="monotone" dataKey="err" name="error (e)" stroke="#3b82f6" dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* PHASE TIMELINE */}
            <h3 className="text-[14px] mt-5 mb-1 opacity-80">Phase Timeline</h3>
            <div className="overflow-auto rounded-ui dashboard-material">
                {stableSample.length === 0 ? (
                    <p className="p-ui text-sm opacity-60">No stable samples captured.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[12px] opacity-50 border-b border-main-dark/10 dark:border-main/10">
                                <th className="p-ui">Phase</th>
                                <th className="p-ui">Point</th>
                                <th className="p-ui">Reference (kg)</th>
                                <th className="p-ui">Net (kg)</th>
                                <th className="p-ui">Temp (°C)</th>
                                <th className="p-ui">Voltage (V)</th>
                                <th className="p-ui">Error (e)</th>
                                <th className="p-ui">MPE (e)</th>
                                <th className="p-ui">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stableSample.map((f, i) => (
                                <tr key={i} className="border-b border-main-dark/5 dark:border-main/5">
                                    <td className="p-ui">{PHASE_NAMES[f.phase] ?? String(f.phase)}</td>
                                    <td className="p-ui">{f.loadPoint?.label ?? '—'}</td>
                                    <td className="p-ui font-mono">{(f.loadPoint?.referenceLoad ?? 0).toFixed(3)}</td>
                                    <td className="p-ui font-mono">{f.net.toFixed(3)}</td>
                                    <td className="p-ui font-mono">{f.temperatureC.toFixed(1)}</td>
                                    <td className="p-ui font-mono">{f.supplyVoltageV.toFixed(1)}</td>
                                    <td className="p-ui font-mono">{f.indicatedErrorE.toFixed(3)}</td>
                                    <td className="p-ui font-mono">{f.maxPermissibleErrorE.toFixed(3)}</td>
                                    <td className={`p-ui font-mono ${f.eCompliant ? 'text-green-400' : 'text-red-400'}`}>
                                        {f.eCompliant ? 'OK' : '▲'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

function DetailRows({ pairs }: { pairs: Array<[string, string]> }) {
    if (pairs.length === 0) {
        return <p className="text-sm opacity-60">No information recorded</p>
    }
    return (
        <div className="text-sm">
            {pairs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 border-b border-main-dark/5 dark:border-main/5 py-0.5">
                    <span className="opacity-60">{k}</span>
                    <span className="font-mono">{v}</span>
                </div>
            ))}
        </div>
    )
}