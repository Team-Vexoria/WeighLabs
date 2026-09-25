import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { BrowserWindow } from 'electron'
import { loadSync } from '@grpc/proto-loader'
import { loadPackageDefinition, credentials } from '@grpc/grpc-js'
import type { NawiScaleConfig, NawiStreamStatus } from '../src/shared'

const PROTO_PATH = path.resolve(import.meta.dirname, '../../rust-stream/proto/nawi.proto')
const DEFAULT_ADDR = '127.0.0.1:50051'
const TICK_MS = 100
const START_MAX_ATTEMPTS = 40
const START_ATTEMPT_DELAY_MS = 300

let child: ChildProcess | null = null
let startedAt = 0

export function startRustStream() {
  if (child) return

  const bin =
    process.env.RUST_STREAM_BIN ??
    path.resolve(import.meta.dirname, '../../rust-stream/target/debug/rust-stream.exe')

  try {
    child = spawn(bin, [], { stdio: 'inherit', windowsHide: true })
    console.log(`[nawi] spawned rust-stream: ${bin}`)
    child.on('exit', (code, signal) => {
      console.log(`[nawi] rust-stream exited code=${code} signal=${signal}`)
      if (child) child = null
    })
    child.on('error', (err) => {
      console.error(`[nawi] failed to spawn rust-stream: ${err.message}`)
      child = null
    })
  } catch (err) {
    console.error('[nawi] error spawning rust-stream:', err)
    child = null
  }
}

export function stopRustStream() {
  if (child) {
    child.kill()
    child = null
  }
}

const packageDefinition = loadSync(PROTO_PATH, {
  keepCase: false,
  longs: Number,
  enums: Number,
  defaults: true,
  oneofs: true,
})

const proto = loadPackageDefinition(packageDefinition) as unknown as {
  weighlabs?: { nawi?: Record<string, unknown> }
}

function serviceClient(address: string) {
  const ctor = proto.weighlabs?.nawi?.NawiTestService as new (address: string, creds: unknown) => {
    getInstrumentInfo: (req: unknown, cb: (err: unknown, res: unknown) => void) => unknown
    streamTest: (req: unknown) => {
      on: (event: string, cb: (arg?: unknown) => void) => unknown
      cancel: () => void
    }
  }
  return new ctor(address, credentials.createInsecure())
}

interface ActiveStream {
  cancel: () => void
  cancelled: boolean
}

let activeStream: ActiveStream | null = null

function sendFrame(payload: unknown) {
  broadcast('nawi:frame', payload)
}

function sendStatus(payload: NawiStreamStatus) {
  broadcast('nawi:status', payload)
}

function broadcast(channel: string, payload: unknown) {
  const wins = BrowserWindow.getAllWindows()
  if (wins.length === 0) return
  for (const win of wins) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, payload)
    }
  }
}

function buildRequestConfig(config?: NawiScaleConfig | null) {
  if (!config) return null
  return {
    serial_number: config.serialNumber,
    model: config.model,
    accuracy_class: config.accuracyClass,
    unit: config.unit,
    max_capacity: config.maxCapacity,
    min_capacity: config.minCapacity,
    verification_interval: config.verificationInterval,
    actual_interval: config.actualInterval,
    number_of_intervals: config.numberOfIntervals,
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForServer(client: ReturnType<typeof serviceClient>): Promise<unknown> {
  for (let attempt = 0; attempt < START_MAX_ATTEMPTS; attempt += 1) {
    try {
      const info = await new Promise((resolve, reject) => {
        client.getInstrumentInfo({}, (err, res) => {
          if (err) reject(err as Error)
          else resolve(res)
        })
      })
      return info
    } catch {
      await delay(START_ATTEMPT_DELAY_MS)
    }
  }
  throw new Error('NAWI gRPC server not reachable')
}

export async function startNawiStream(config?: NawiScaleConfig | null) {
  stopNawiStream(false)

  const client = serviceClient(DEFAULT_ADDR)
  sendStatus({ state: 'connecting' })

  startedAt = 0
  const info = await waitForServer(client)
  startedAt = Date.now()
  sendStatus({ state: 'running' })

  const stream = client.streamTest({
    config: buildRequestConfig(config),
    tick_ms: TICK_MS,
    loop_session: false,
  })

  activeStream = {
    cancel: () => stream.cancel(),
    cancelled: false,
  }

  stream.on('data', (frame: unknown) => {
    if (!activeStream?.cancelled) {
      sendFrame(frame)
    }
  })
  stream.on('end', () => {
    activeStream = null
    sendStatus({ state: 'ended' })
  })
  stream.on('error', (err: Error) => {
    activeStream = null
    sendStatus({ state: 'error', message: err.message })
  })

  return info
}

export function stopNawiStream(notify = true) {
  startedAt = 0
  if (activeStream) {
    activeStream.cancelled = true
    activeStream.cancel()
    activeStream = null
  }
  if (notify) {
    sendStatus({ state: 'ended' })
  }
}

export function getStreamStartedAt() {
  return startedAt
}