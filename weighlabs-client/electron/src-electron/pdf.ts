import { BrowserWindow, app, dialog } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx'
import type { NawiFrame, ReportPdfInput } from '../src/shared'

interface SeriesPoint {
  x: number
  y: number
  label?: string
}

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmt(value: number | undefined | null, digits = 3): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '-'
  return value.toFixed(digits)
}

function lineChart(data: SeriesPoint[], opts: { yLabel: string; ySuffix?: string }) {
  const W = 760
  const H = 220
  const PAD_L = 50
  const PAD_R = 10
  const PAD_T = 12
  const PAD_B = 24

  if (data.length === 0) {
    return `<div class="chart empty">No data for this phase</div>`
  }

  const ys = data.map((d) => d.y)
  let yMin = Math.min(...ys)
  let yMax = Math.max(...ys)
  if (yMin === yMax) {
    yMin -= 0.5
    yMax += 0.5
  }
  const pad = (yMax - yMin) * 0.08
  yMin -= pad
  yMax += pad

  const xMin = Math.min(...data.map((d) => d.x))
  const xMax = Math.max(...data.map((d) => d.x))
  const spanX = xMax - xMin || 1

  const px = (x: number) => PAD_L + ((x - xMin) / spanX) * (W - PAD_L - PAD_R)
  const py = (y: number) => PAD_T + (1 - (y - yMin) / (yMax - yMin)) * (H - PAD_T - PAD_B)

  const points = data.map((d) => `${px(d.x).toFixed(1)},${py(d.y).toFixed(1)}`).join(' ')

  const gridLines = 4
  let grid = ''
  for (let i = 0; i <= gridLines; i += 1) {
    const y = yMin + ((yMax - yMin) * i) / gridLines
    const gpy = py(y)
    grid += `<line x1="${PAD_L}" y1="${gpy}" x2="${W - PAD_R}" y2="${gpy}" stroke="#e5e7eb" stroke-width="1"/>`
    grid += `<text x="${PAD_L - 6}" y="${gpy + 4}" text-anchor="end" font-size="11" fill="#6b7280">${fmt(y, 2)}</text>`
  }

  return `
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
      <rect x="${PAD_L}" y="${PAD_T}" width="${W - PAD_L - PAD_R}" height="${H - PAD_T - PAD_B}" fill="#fafafa"/>
      ${grid}
      <polyline points="${points}" fill="none" stroke="#2563eb" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <text x="${PAD_L}" y="${H - 6}" font-size="11" fill="#6b7280">${esc(opts.yLabel)}</text>
    </svg>
  `
}

function mpeChart(frames: NawiFrame[]) {
  const data: SeriesPoint[] = frames.map((f) => ({
    x: f.loadPoint?.pointIndex ?? f.sequence,
    y: f.indicatedErrorE,
    label: f.loadPoint?.label,
  }))
  const W = 760
  const H = 220
  const PAD = 16
  if (data.length === 0) return `<div class="chart empty">No accuracy data</div>`

  const ys = data.map((d) => d.y)
  const mpes = frames.map((f) => f.maxPermissibleErrorE)
  let yMin = Math.min(0, ...ys)
  let yMax = Math.max(0, ...ys, ...mpes)
  const pad = (yMax - yMin) * 0.1 || 1
  yMin -= pad
  yMax += pad
  const xMin = Math.min(...data.map((d) => d.x))
  const xMax = Math.max(...data.map((d) => d.x))
  const spanX = xMax - xMin || 1

  const px = (x: number) => PAD + ((x - xMin) / spanX) * (W - 2 * PAD)
  const py = (y: number) => PAD + (1 - (y - yMin) / (yMax - yMin)) * (H - 2 * PAD)
  const points = data.map((d) => `${px(d.x).toFixed(1)},${py(d.y).toFixed(1)}`).join(' ')

  const mpeY = py(Math.max(...mpes) || 0.5)
  return `
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
      <line x1="${PAD}" y1="${py(0)}" x2="${W - PAD}" y2="${py(0)}" stroke="#9ca3af" stroke-width="1" stroke-dasharray="4 3"/>
      <text x="${W - PAD - 2}" y="${py(0) - 4}" text-anchor="end" font-size="11" fill="#6b7280">0 e</text>
      <line x1="${PAD}" y1="${mpeY}" x2="${W - PAD}" y2="${mpeY}" stroke="#ef4444" stroke-width="1" stroke-dasharray="6 4"/>
      <text x="${W - PAD - 2}" y="${mpeY - 4}" text-anchor="end" font-size="11" fill="#ef4444">max mpe</text>
      <polyline points="${points}" fill="none" stroke="#2563eb" stroke-width="2" stroke-linejoin="round"/>
    </svg>
  `
}

function buildHtml(input: ReportPdfInput): string {
  const payload = input.payload ?? {}
  const frames: NawiFrame[] = payload.frames ?? []
  const summary = payload.summary ?? null
  const config = payload.config ?? null
  const instrument = payload.instrument ?? {}
  const manufacturer = payload.manufacturer ?? {}
  const operator = payload.operator ?? {}
  const laboratory = payload.laboratory ?? {}

  const firstMs = frames.length > 0 ? frames[0].timestampMs : null
  const weightSeries: SeriesPoint[] = frames.map((f) => ({
    x: firstMs !== null ? (f.timestampMs - firstMs) / 1000 : f.sequence,
    y: f.gross,
  }))
  const tempSeries: SeriesPoint[] = frames.map((f) => ({
    x: firstMs !== null ? (f.timestampMs - firstMs) / 1000 : f.sequence,
    y: f.temperatureC,
  }))

  const summaryRows =
    !summary || frames.length === 0
      ? '<em>Test not completed yet — no summary available.</em>'
      : `
        <table class="kv">
          <tr><th>Status</th><td>${esc(summary.passed ? 'PASS' : 'FAIL')}</td></tr>
          <tr><th>Frames captured</th><td>${summary.frames}</td></tr>
          <tr><th>Duration</th><td>${(summary.durationMs / 1000).toFixed(1)} s</td></tr>
          <tr><th>Stable non-compliant frames</th><td>${summary.stableNonCompliant}</td></tr>
          <tr><th>Max absolute error</th><td>${fmt(summary.maxAbsErrorE, 3)} e</td></tr>
          <tr><th>Max permissible error</th><td>${fmt(summary.maxMpeE, 3)} e</td></tr>
        </table>
      `

  const kv = (rows: Record<string, string>) => {
    const entries = Object.entries(rows).filter(([, v]) => v !== '' && v !== undefined)
    if (entries.length === 0) return '<span class="muted">No information recorded</span>'
    return `<table class="kv">${entries
      .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
      .join('')}</table>`
  }

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page { margin: 18mm; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #111; font-size: 12px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 18px 0 6px; border-bottom: 2px solid #111; padding-bottom: 3px; }
  .status { display: inline-block; padding: 2px 10px; border-radius: 4px; font-weight: 600; }
  .status.PASS { background: #dcfce7; color: #166534; }
  .status.FAIL { background: #fee2e2; color: #991b1b; }
  .status.INC { background: #fef9c3; color: #854d0e; }
  .muted { color: #6b7280; }
  .meta { color: #4b5563; margin-bottom: 8px; }
  .section { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; }
  .card h3 { margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #374151; }
  table.kv { border-collapse: collapse; width: 100%; }
  table.kv th, table.kv td { text-align: left; padding: 3px 6px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
  table.kv th { color: #6b7280; font-weight: 500; width: 45%; }
  .chart { margin-top: 8px; }
  .chart.empty { color: #6b7280; border: 1px dashed #d1d5db; border-radius: 6px; padding: 12px; text-align: center; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
</style>
</head>
<body>
  <h1>${esc(input.fileName)}</h1>
  <div class="meta">
    <span class="status ${esc(input.status)}">${esc(input.status)}</span>
    <span> &nbsp; Manufacturer: <b>${esc(input.payload?.manufacturer?.manufacturerName ?? '')}</b></span>
    ${config ? `<span> &nbsp; Instrument: <b>${esc(config.model)}</b> (SN ${esc(config.serialNumber)})</span>` : ''}
  </div>
  <div class="meta">Generated ${new Date().toLocaleString()} &middot; WeighLabs NAWI Verification Report</div>

  <h2>Summary</h2>
  ${summaryRows}

  <h2>Configuration</h2>
  <div class="section">
    <div class="card">${kv(instrument)}</div>
    <div class="card"><h3>Scale Configuration</h3>${config ? kv({
      'Serial number': config.serialNumber,
      'Model': config.model,
      'Max capacity': `${config.maxCapacity}`,
      'Min capacity': `${config.minCapacity}`,
      'Verification interval (e)': `${config.verificationInterval}`,
      'Actual interval (d)': `${config.actualInterval}`,
      'Number of intervals (n)': `${config.numberOfIntervals}`,
    }) : ''}</div>
    <div class="card"><h3>Manufacturer</h3>${kv(manufacturer)}</div>
    <div class="card"><h3>Operator / Laboratory</h3>${kv(operator)}${kv(laboratory)}</div>
  </div>

  <h2>Weight vs Time</h2>
  ${lineChart(weightSeries, { yLabel: 'Weight (gross)' })}

  <h2>Instrument Temperature vs Time</h2>
  ${lineChart(tempSeries, { yLabel: 'Temperature (°C)' })}

  <h2>Indication Error (e) — OIML R 76 accuracy assessment</h2>
  ${mpeChart(frames.filter((f) => f.phase === 6 || f.phase === 7 || f.phase === 5))}

  <h2>Phase Timeline</h2>
  ${
    frames.length === 0
      ? '<div class="chart empty">No samples captured</div>'
      : `
      <table class="kv">
        <tr><th>Phase</th><th>Point</th><th>Reference (kg)</th><th>Stable</th><th>Net (kg)</th><th>Temp (°C)</th><th>Voltage (V)</th></tr>
        ${frames
          .filter((f) => f.stable)
          .filter((_, i, arr) => i % Math.max(1, Math.floor(arr.length / 40)) === 0)
          .map(
            (f) => `<tr>
              <td>${esc(f.phase)}</td>
              <td>${esc(f.loadPoint?.label ?? '')}</td>
              <td>${fmt(f.loadPoint?.referenceLoad)}</td>
              <td>${f.stable ? 'yes' : 'no'}</td>
              <td>${fmt(f.net)}</td>
              <td>${fmt(f.temperatureC, 1)}</td>
              <td>${fmt(f.supplyVoltageV, 1)}</td>
            </tr>`,
          )
          .join('')}
      </table>
      `
  }
</body>
</html>`
}

export function renderReportHtml(input: ReportPdfInput): string {
  return buildHtml(input)
}

async function printHtmlToPdf(win: BrowserWindow, html: string): Promise<Buffer> {
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
  return win.webContents.printToPDF({
    pageSize: 'A4',
    printBackground: true,
  })
}

export async function writeReportPdf(input: ReportPdfInput, filePath: string): Promise<void> {
  const win = new BrowserWindow({
    show: false,
    width: 1024,
    height: 900,
    webPreferences: { sandbox: true },
  })
  try {
    const html = buildHtml(input)
    const pdf = await printHtmlToPdf(win, html)
    await fs.promises.writeFile(filePath, pdf)
  } finally {
    if (!win.isDestroyed()) {
      win.destroy()
    }
  }
}

export async function exportReportPdf(input: ReportPdfInput): Promise<{ path: string | null; cancelled: boolean }> {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Export Test Report as PDF',
    defaultPath: app.getPath('documents'),
    filters: [{ name: 'PDF document', extensions: ['pdf'] }],
  })
  if (canceled || !filePath) {
    return { path: null, cancelled: true }
  }

  await writeReportPdf(input, filePath)
  return { path: filePath, cancelled: false }
}

/* ---------------------------------------------------------------- */
/* CSV export                                                       */
/* ---------------------------------------------------------------- */

function csvCell(value: unknown): string {
  const str = String(value ?? '')
  return /[",\n\r]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str
}

export async function writeReportCsv(input: ReportPdfInput, filePath: string): Promise<void> {
  const payload = input.payload ?? {}
  const frames: NawiFrame[] = payload.frames ?? []
  const summary = payload.summary ?? null
  const config = payload.config ?? null

  const lines: string[] = []
  lines.push(csvCell('WeighLabs NAWI Verification Report'))
  lines.push(csvCell('Report'), csvCell(input.fileName))
  lines.push(csvCell('Status'), csvCell(input.status))
  if (config) {
    lines.push(csvCell('Serial Number'), csvCell(config.serialNumber))
    lines.push(csvCell('Model'), csvCell(config.model))
  }
  if (summary) {
    lines.push(csvCell('Summary'), csvCell(summary.passed ? 'PASS' : 'FAIL'))
    lines.push(csvCell('Frames'), csvCell(summary.frames))
    lines.push(csvCell('Duration (s)'), csvCell((summary.durationMs / 1000).toFixed(1)))
    lines.push(csvCell('Stable non-compliant'), csvCell(summary.stableNonCompliant))
    lines.push(csvCell('Max abs error (e)'), csvCell(summary.maxAbsErrorE.toFixed(3)))
    lines.push(csvCell('Max MPE (e)'), csvCell(summary.maxMpeE.toFixed(3)))
  }
  lines.push('')
  lines.push(
    [
      'Sequence', 'Timestamp (ms)', 'Phase', 'Point', 'Corner', 'Gross', 'Tare', 'Net', 'Stable',
      'Temperature (C)', 'Humidity (%)', 'Voltage (V)', 'Error (e)', 'MPE (e)', 'Compliant',
    ].map(csvCell).join(','),
  )
  for (const f of frames) {
    lines.push(
      [
        f.sequence, f.timestampMs, f.phase, f.loadPoint?.label ?? '', f.corner,
        f.gross, f.tare, f.net, f.stable ? 'yes' : 'no', f.temperatureC, f.humidityRh,
        f.supplyVoltageV, f.indicatedErrorE, f.maxPermissibleErrorE, f.eCompliant ? 'yes' : 'no',
      ].map(csvCell).join(','),
    )
  }

  await fs.promises.writeFile(filePath, lines.join('\r\n') + '\r\n', 'utf8')
}

export async function exportReportCsv(input: ReportPdfInput): Promise<{ path: string | null; cancelled: boolean }> {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Export Test Report as CSV',
    defaultPath: path.join(app.getPath('documents'), `${input.fileName}.csv`),
    filters: [{ name: 'CSV spreadsheet', extensions: ['csv'] }],
  })
  if (canceled || !filePath) {
    return { path: null, cancelled: true }
  }

  await writeReportCsv(input, filePath)
  return { path: filePath, cancelled: false }
}

/* ---------------------------------------------------------------- */
/* DOCX export                                                      */
/* ---------------------------------------------------------------- */

function kvRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 40, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
      }),
      new TableCell({
        width: { size: 60, type: WidthType.PERCENTAGE },
        children: [new Paragraph(String(value ?? ''))],
      }),
    ],
  })
}

function kvTable(rows: Record<string, string>): Table {
  const entries = Object.entries(rows).filter(([, v]) => v !== '' && v !== undefined)
  const tableRows =
    entries.length === 0
      ? [new TableRow({ children: [new TableCell({ children: [new Paragraph('No information recorded')] })] })]
      : entries.map(([k, v]) => kvRow(k, v))
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows })
}

export async function writeReportDocx(input: ReportPdfInput, filePath: string): Promise<void> {
  const payload = input.payload ?? {}
  const frames: NawiFrame[] = payload.frames ?? []
  const summary = payload.summary ?? null
  const config = payload.config ?? null
  const instrument = payload.instrument ?? {}
  const manufacturer = payload.manufacturer ?? {}
  const operator = payload.operator ?? {}
  const laboratory = payload.laboratory ?? {}

  const children: (Paragraph | Table)[] = []

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(input.fileName)] }))
  children.push(new Paragraph({ children: [new TextRun(`Status: ${input.status}`)] }))
  children.push(
    new Paragraph({ children: [new TextRun(`Generated ${new Date().toLocaleString()} · WeighLabs NAWI Verification Report`)] }),
  )

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Summary')] }))
  if (summary && frames.length > 0) {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          kvRow('Status', summary.passed ? 'PASS' : 'FAIL'),
          kvRow('Frames captured', String(summary.frames)),
          kvRow('Duration (s)', (summary.durationMs / 1000).toFixed(1)),
          kvRow('Stable non-compliant frames', String(summary.stableNonCompliant)),
          kvRow('Max absolute error (e)', summary.maxAbsErrorE.toFixed(3)),
          kvRow('Max permissible error (e)', summary.maxMpeE.toFixed(3)),
        ],
      }),
    )
  } else {
    children.push(new Paragraph('Test not completed yet — no summary available.'))
  }

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Scale Configuration')] }))
  if (config) {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          kvRow('Serial number', config.serialNumber),
          kvRow('Model', config.model),
          kvRow('Max capacity', String(config.maxCapacity)),
          kvRow('Min capacity', String(config.minCapacity)),
          kvRow('Verification interval (e)', String(config.verificationInterval)),
          kvRow('Actual interval (d)', String(config.actualInterval)),
          kvRow('Number of intervals (n)', String(config.numberOfIntervals)),
        ],
      }),
    )
  } else {
    children.push(new Paragraph('No scale configuration recorded.'))
  }

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Instrument Information')] }))
  children.push(kvTable(instrument))
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Manufacturer')] }))
  children.push(kvTable(manufacturer))
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Operator')] }))
  children.push(kvTable(operator))
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Laboratory')] }))
  children.push(kvTable(laboratory))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Phase Timeline')] }))
  const stableSample = frames
    .filter((f) => f.stable)
    .filter((_, i, arr) => i % Math.max(1, Math.floor(arr.length / 40)) === 0)
  const headerRow = new TableRow({
    tableHeader: true,
    children: ['Phase', 'Point', 'Reference (kg)', 'Net (kg)', 'Temp (C)', 'Voltage (V)', 'Error (e)', 'MPE (e)', 'Compliant']
      .map((h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })),
  })
  const frameRows = stableSample.map(
    (f) =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(String(f.phase))] }),
          new TableCell({ children: [new Paragraph(f.loadPoint?.label ?? '')] }),
          new TableCell({ children: [new Paragraph((f.loadPoint?.referenceLoad ?? 0).toFixed(3))] }),
          new TableCell({ children: [new Paragraph(f.net.toFixed(3))] }),
          new TableCell({ children: [new Paragraph(f.temperatureC.toFixed(1))] }),
          new TableCell({ children: [new Paragraph(f.supplyVoltageV.toFixed(1))] }),
          new TableCell({ children: [new Paragraph(f.indicatedErrorE.toFixed(3))] }),
          new TableCell({ children: [new Paragraph(f.maxPermissibleErrorE.toFixed(3))] }),
          new TableCell({ children: [new Paragraph(f.eCompliant ? 'yes' : 'no')] }),
        ],
      }),
  )
  children.push(
    stableSample.length === 0
      ? new Paragraph('No stable samples captured.')
      : new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...frameRows] }),
  )

  const doc = new Document({ sections: [{ children }] })
  const buffer = await Packer.toBuffer(doc)
  await fs.promises.writeFile(filePath, buffer)
}

export async function exportReportDocx(input: ReportPdfInput): Promise<{ path: string | null; cancelled: boolean }> {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Export Test Report as DOCX',
    defaultPath: path.join(app.getPath('documents'), `${input.fileName}.docx`),
    filters: [{ name: 'Word document', extensions: ['docx'] }],
  })
  if (canceled || !filePath) {
    return { path: null, cancelled: true }
  }

  await writeReportDocx(input, filePath)
  return { path: filePath, cancelled: false }
}