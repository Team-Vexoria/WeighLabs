import 'dotenv/config';
import { createClient } from '@libsql/client';
import type {
  CompleteTestInput,
  CreateTestInput,
  TestRecord,
  TestStatus,
} from '../../src/shared';

const url = process.env.DB_FILE_NAME ?? 'file:local.db';

export const client = createClient({ url });

interface TestRow {
  id: string;
  fileName: string;
  status: string;
  manufacturerId: string;
  createdAt: string;
  completedAt: string | null;
  payload: string | null;
}

function rowToRecord(row: TestRow): TestRecord {
  return {
    id: row.id,
    fileName: row.fileName,
    status: row.status as TestStatus,
    manufacturerId: row.manufacturerId ?? '',
    createdAt: row.createdAt,
    completedAt: row.completedAt ?? null,
    payload: row.payload ? JSON.parse(row.payload) : null,
  };
}

export async function initDb() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS tests (
      id TEXT PRIMARY KEY,
      fileName TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'INC',
      manufacturerId TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL,
      completedAt TEXT,
      payload TEXT
    )
  `);
}

export async function listTests(): Promise<TestRecord[]> {
  const result = await client.execute('SELECT * FROM tests ORDER BY createdAt DESC');
  return result.rows.map((row) => rowToRecord(row as unknown as TestRow));
}

export async function getTest(id: string): Promise<TestRecord | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM tests WHERE id = ?',
    args: [id],
  });
  const row = result.rows[0] as unknown as TestRow | undefined;
  return row ? rowToRecord(row) : null;
}

export async function createTest(input: CreateTestInput): Promise<TestRecord> {
  const record: TestRecord = {
    id: crypto.randomUUID(),
    fileName: input.fileName,
    status: 'INC',
    manufacturerId: input.manufacturerId,
    createdAt: input.createdAt,
    completedAt: null,
    payload: input.payload,
  };
  await client.execute({
    sql: 'INSERT INTO tests (id, fileName, status, manufacturerId, createdAt, completedAt, payload) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [
      record.id,
      record.fileName,
      record.status,
      record.manufacturerId,
      record.createdAt,
      record.completedAt,
      JSON.stringify(record.payload),
    ],
  });
  return record;
}

export async function updateTest(
  id: string,
  patch: Partial<Pick<TestRecord, 'fileName' | 'status' | 'manufacturerId' | 'completedAt' | 'payload'>>,
): Promise<TestRecord | null> {
  const existing = await getTest(id);
  if (!existing) return null;

  const fileName = patch.fileName ?? existing.fileName;
  const status = patch.status ?? existing.status;
  const manufacturerId = patch.manufacturerId ?? existing.manufacturerId;
  const completedAt = patch.completedAt !== undefined ? patch.completedAt : existing.completedAt;
  const payload = patch.payload !== undefined ? patch.payload : existing.payload;

  const result = await client.execute({
    sql: 'UPDATE tests SET fileName = ?, status = ?, manufacturerId = ?, completedAt = ?, payload = ? WHERE id = ?',
    args: [
      fileName,
      status,
      manufacturerId,
      completedAt,
      payload ? JSON.stringify(payload) : null,
      id,
    ],
  });
  if (result.rowsAffected === 0) return null;
  return (await getTest(id))!;
}

export async function deleteTest(id: string): Promise<void> {
  await client.execute({ sql: 'DELETE FROM tests WHERE id = ?', args: [id] });
}

export async function completeTest(input: CompleteTestInput): Promise<TestRecord> {
  const createdAt = input.createdAt ?? new Date().toISOString();
  if (input.id) {
    const existing = await getTest(input.id);
    if (existing) {
      return (await updateTest(input.id, {
        fileName: input.fileName,
        status: input.status,
        manufacturerId: input.manufacturerId,
        createdAt,
        completedAt: input.completedAt,
        payload: input.payload,
      }))!;
    }
  }

  const record: TestRecord = {
    id: crypto.randomUUID(),
    fileName: input.fileName,
    status: input.status,
    manufacturerId: input.manufacturerId,
    createdAt,
    completedAt: input.completedAt,
    payload: input.payload,
  };
  await client.execute({
    sql: 'INSERT INTO tests (id, fileName, status, manufacturerId, createdAt, completedAt, payload) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [
      record.id,
      record.fileName,
      record.status,
      record.manufacturerId,
      record.createdAt,
      record.completedAt,
      JSON.stringify(record.payload),
    ],
  });
  return record;
}