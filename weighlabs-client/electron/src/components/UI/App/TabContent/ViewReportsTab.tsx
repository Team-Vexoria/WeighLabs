import { useEffect, useMemo, useState } from "react";
import type { TestRecord, TestStatus } from "../../../../shared";
import { addHistory } from "../../../../lib/history";

type SortField = "createdAt" | "completedAt";
type SortDir = "asc" | "desc";
type StatusFilter = "ALL" | TestStatus;

const statusColor: Record<TestStatus, string> = {
    PASS: "text-green-400",
    FAIL: "text-red-400",
    INC: "text-yellow-400",
};

// Shared dark-mode-safe select styling
const selectClass =
    "px-ui py-1 pr-8 border dark:border-main/10 border-main-dark/10 bg-main/10 outline-0 rounded " +
    "text-main-dark dark:text-main appearance-none dark:[color-scheme:dark] [color-scheme:light]";

export function ViewReports() {
    const [reports, setReports] = useState<TestRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [manufacturerFilter, setManufacturerFilter] = useState<string>("ALL");
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const loadReports = async (showSpinner: boolean) => {
        if (showSpinner) setLoading(true);
        try {
            const list = await window.tests!.list();
            setLoadError(null);
            setReports(list);
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!window.tests) return;
        window.tests
            .list()
            .then((list) => {
                setLoadError(null);
                setReports(list);
            })
            .catch((err: unknown) => {
                setLoadError(err instanceof Error ? err.message : String(err));
            })
            .finally(() => setLoading(false));
    }, []);

    const selected = reports.find((r) => r.id === selectedId) ?? null;

    const manufacturers = useMemo(
        () => Array.from(new Set(reports.map(r => r.manufacturerId))).sort(),
        [reports]
    );

    const filteredSorted = useMemo(() => {
        let list = reports.filter(r =>
            r.fileName.toLowerCase().includes(search.toLowerCase())
        );

        if (statusFilter !== "ALL") {
            list = list.filter(r => r.status === statusFilter);
        }
        if (manufacturerFilter !== "ALL") {
            list = list.filter(r => r.manufacturerId === manufacturerFilter);
        }

        list = [...list].sort((a, b) => {
            const aVal = new Date(a[sortField] ?? a.createdAt).getTime();
            const bVal = new Date(b[sortField] ?? b.createdAt).getTime();
            return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        });

        return list;
    }, [reports, search, statusFilter, manufacturerFilter, sortField, sortDir]);

    // Group by createdAt date for the timeline display
    const grouped = useMemo(() => {
        const map = new Map<string, TestRecord[]>();
        for (const r of filteredSorted) {
            const key = new Date(r.createdAt).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric",
            });
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(r);
        }
        return Array.from(map.entries());
    }, [filteredSorted]);

    if (!window.tests) {
        return (
            <div className="w-full min-h-full font-ui p-10">
                <h1 className="text-3xl">View Reports</h1>
                <p className="opacity-60 mt-5">
                    Reports require the Electron backend. Launch the app with `npm run dev:back`.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-full font-ui p-10">
            <h1 className="text-3xl">View Reports</h1>

            {/* CONTROLS */}
            <div className="my-2 flex flex-wrap gap-2 items-center rounded">
                <input
                    placeholder="Search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="px-ui py-1 border dark:border-main/10 border-main-dark/10 bg-main/10 outline-0"
                />

                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                        className={selectClass}
                    >
                        <option value="ALL">All statuses</option>
                        <option value="PASS">Pass</option>
                        <option value="FAIL">Fail</option>
                        <option value="INC">Incomplete</option>
                    </select>
                    <SelectChevron />
                </div>

                <div className="relative">
                    <select
                        value={manufacturerFilter}
                        onChange={e => setManufacturerFilter(e.target.value)}
                        className={selectClass}
                    >
                        <option value="ALL">All manufacturers</option>
                        {manufacturers.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                    <SelectChevron />
                </div>

                <div className="relative">
                    <select
                        value={sortField}
                        onChange={e => setSortField(e.target.value as SortField)}
                        className={selectClass}
                    >
                        <option value="createdAt">Sort by creation date</option>
                        <option value="completedAt">Sort by completion date</option>
                    </select>
                    <SelectChevron />
                </div>

                <button
                    onClick={() => setSortDir(d => (d === "asc" ? "desc" : "asc"))}
                    className="px-ui py-1 border dark:border-main/10 border-main-dark/10 bg-main/10 rounded dark:hover:bg-main/10 hover:bg-main-dark/10"
                >
                    {sortDir === "asc" ? "↑ Oldest first" : "↓ Newest first"}
                </button>

                <button
                    onClick={() => void loadReports(true)}
                    className="px-ui py-1 border dark:border-main/10 border-main-dark/10 bg-main/10 rounded dark:hover:bg-main/10 hover:bg-main-dark/10"
                >
                    {loading ? "Loading…" : "↻ Refresh"}
                </button>
            </div>

            {loadError && <p className="text-red-400 mt-3">{loadError}</p>}

            {/* TIMELINE */}
            <div className="flex flex-col mt-5 px-5">
                {grouped.map(([date, entries]) => (
                    <div key={date} className="border-white/30 p-ui min-h-10 relative flex flex-col">
                        <div className="flex gap-2 items-center">
                            <div className="size-5 rounded-full bg-black border border-white/30"></div>
                            <h1>{date}</h1>
                        </div>
                        <div className="p-ui flex flex-col gap-1">
                            {entries.map(entry => (
                                <button
                                    key={entry.id}
                                    onClick={() => setSelectedId(entry.id === selectedId ? null : entry.id)}
                                    className={`border border-main-dark/10 dark:border-main/10 text-left px-ui py-1 max-w-100 rounded dark:hover:bg-main/10 hover:bg-main-dark/10 flex items-center ${
                                        selectedId === entry.id ? "dark:bg-main/10 bg-main-dark/10" : ""
                                    }`}
                                >
                                    {entry.fileName}
                                    <span className="ml-2 text-xs opacity-60">({entry.manufacturerId})</span>
                                    <span className={`ml-auto font-mono ${statusColor[entry.status]}`}>
                                        {entry.status}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {!loading && grouped.length === 0 && (
                    <p className="opacity-60 mt-5">
                        No reports yet. Create a test from the sidebar to get started.
                    </p>
                )}

                {loading && grouped.length === 0 && (
                    <p className="opacity-60 mt-5">Loading reports…</p>
                )}
            </div>

            {selected && <ReportDetail record={selected} onDelete={() => void loadReports(true)} />}
        </div>
    );
}

function ReportDetail({ record, onDelete }: { record: TestRecord; onDelete: () => void }) {
    const [exporting, setExporting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const frames = record.payload?.frames ?? [];
    const summary = record.payload?.summary ?? null;

    const doExport = async () => {
        setExporting(true);
        setMessage(null);
        try {
            const result = await window.reports?.exportPdf({
                fileName: record.fileName,
                status: record.status,
                payload: record.payload ?? {},
            });
            if (result && !result.cancelled) {
                addHistory({
                    type: "report",
                    message: `Report exported — ${record.fileName}`,
                    status: record.status === "INC" ? "PENDING" : record.status,
                });
            }
            setMessage(
                result?.cancelled
                    ? "PDF export cancelled."
                    : result?.path
                      ? `PDF saved to ${result.path}`
                      : "PDF export failed.",
            );
        } catch (err) {
            setMessage(err instanceof Error ? err.message : String(err));
        } finally {
            setExporting(false);
        }
    };

    const doDelete = async () => {
        if (!window.confirm(`Delete report "${record.fileName}"?`)) return;
        await window.tests?.remove(record.id);
        onDelete();
    };

    return (
        <div className="mt-5 p-ui rounded-ui border border-main-dark/10 dark:border-main/10">
            <h2 className="text-xl mb-2">{record.fileName}</h2>
            <div className="flex flex-wrap gap-1 mb-3">
                <button
                    onClick={doExport}
                    disabled={exporting}
                    className="px-ui py-1 border dark:border-main/10 border-main-dark/10 rounded bg-main/10 dark:hover:bg-main/10 hover:bg-main-dark/10"
                >
                    {exporting ? "Exporting…" : "Export PDF"}
                </button>
                <button
                    onClick={doDelete}
                    className="px-ui py-1 border border-red-500/40 rounded bg-red-500/10 text-red-400"
                >
                    Delete
                </button>
            </div>

            {message && <p className="opacity-80 mb-2 text-sm">{message}</p>}

            {summary && frames.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <Detail label="Frames captured" value={String(summary.frames)} />
                    <Detail label="Duration" value={`${(summary.durationMs / 1000).toFixed(1)} s`} />
                    <Detail label="Stable non-compliant frames" value={String(summary.stableNonCompliant)} />
                    <Detail label="Max absolute error" value={`${summary.maxAbsErrorE.toFixed(3)} e`} />
                    <Detail label="Max permissible error" value={`${summary.maxMpeE.toFixed(3)} e`} />
                    <Detail label="Completed" value={record.completedAt ? new Date(record.completedAt).toLocaleString() : "—"} />
                </div>
            ) : (
                <p className="opacity-60 text-sm">
                    {record.status === "INC"
                        ? "This test has not been run yet — open the Dashboard, run the test, then End Test to attach data."
                        : "No captured sample data for this report."}
                </p>
            )}
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-ui rounded-ui dark:bg-main/5 bg-main-dark/5">
            <h3 className="text-[12px] opacity-50">{label}</h3>
            <p className="font-mono">{value}</p>
        </div>
    );
}

function SelectChevron() {
    return (
        <svg
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3 opacity-60"
            viewBox="0 0 12 8"
            fill="none"
        >
            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}