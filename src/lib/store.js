/**
 * ชั้นเก็บข้อมูล (Data store)
 * รองรับ 2 โหมด เพื่อให้เห็นความต่างระหว่าง Unit Test กับ Integration Test
 *   - memory   : เก็บใน RAM  -> ใช้ตอน Unit Test / รันเครื่องตัวเองเร็ว ๆ
 *   - postgres : ต่อฐานข้อมูลจริง -> ใช้ตอน Integration Test (service container ใน CI)
 *
 * เลือกโหมดด้วย environment variable: STORE=memory | postgres
 */
import pg from 'pg';

const STORE = process.env.STORE ?? 'memory';

/* ------------------------------------------------------------------ */
/* In-memory store                                                     */
/* ------------------------------------------------------------------ */
class MemoryStore {
  constructor() {
    this.items = new Map();
    this.seq = 0;
  }

  async init() {
    return this;
  }

  async list() {
    return [...this.items.values()].sort((a, b) => a.id - b.id);
  }

  async get(id) {
    return this.items.get(Number(id)) ?? null;
  }

  async create({ title, done }) {
    const item = { id: ++this.seq, title, done, created_at: new Date().toISOString() };
    this.items.set(item.id, item);
    return item;
  }

  async update(id, { title, done }) {
    const current = await this.get(id);
    if (!current) return null;
    const next = { ...current, title, done };
    this.items.set(next.id, next);
    return next;
  }

  async remove(id) {
    return this.items.delete(Number(id));
  }

  async reset() {
    this.items.clear();
    this.seq = 0;
  }

  async ping() {
    return true;
  }

  async close() {
    /* ไม่มีอะไรต้องปิด */
  }
}

/* ------------------------------------------------------------------ */
/* PostgreSQL store                                                    */
/* ------------------------------------------------------------------ */
class PostgresStore {
  constructor() {
    this.pool = new pg.Pool({
      connectionString:
        process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/todos',
      max: 5,
    });
  }

  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id         SERIAL PRIMARY KEY,
        title      TEXT        NOT NULL,
        done       BOOLEAN     NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    return this;
  }

  async list() {
    const { rows } = await this.pool.query('SELECT * FROM todos ORDER BY id');
    return rows;
  }

  async get(id) {
    const { rows } = await this.pool.query('SELECT * FROM todos WHERE id = $1', [id]);
    return rows[0] ?? null;
  }

  async create({ title, done }) {
    const { rows } = await this.pool.query(
      'INSERT INTO todos (title, done) VALUES ($1, $2) RETURNING *',
      [title, done],
    );
    return rows[0];
  }

  async update(id, { title, done }) {
    const { rows } = await this.pool.query(
      'UPDATE todos SET title = $1, done = $2 WHERE id = $3 RETURNING *',
      [title, done, id],
    );
    return rows[0] ?? null;
  }

  async remove(id) {
    const { rowCount } = await this.pool.query('DELETE FROM todos WHERE id = $1', [id]);
    return rowCount > 0;
  }

  async reset() {
    await this.pool.query('TRUNCATE todos RESTART IDENTITY');
  }

  async ping() {
    await this.pool.query('SELECT 1');
    return true;
  }

  async close() {
    await this.pool.end();
  }
}

export const store = STORE === 'postgres' ? new PostgresStore() : new MemoryStore();
export const storeKind = STORE;
