/**
 * Integration Test — ต้องมี PostgreSQL จริง
 * รันด้วย:  STORE=postgres DATABASE_URL=... npm run test:integration
 * ใน GitHub Actions เราจะยกฐานข้อมูลขึ้นมาด้วย "service container"
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { store, storeKind } from '../../src/lib/store.js';

const app = createApp();

beforeAll(async () => {
  await store.init();
});

beforeEach(async () => {
  await store.reset();
});

afterAll(async () => {
  await store.close();
});

describe('การทำงานร่วมกับ PostgreSQL', () => {
  test('ต้องรันด้วย STORE=postgres', () => {
    expect(storeKind).toBe('postgres');
  });

  test('/readyz ตอบ 200 เมื่อต่อฐานข้อมูลได้', async () => {
    const res = await request(app).get('/readyz');
    expect(res.status).toBe(200);
  });

  test('ข้อมูลถูกบันทึกลงฐานข้อมูลจริง', async () => {
    await request(app).post('/api/todos').send({ title: 'บันทึกลง DB' });
    const rows = await store.list();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('บันทึกลง DB');
    expect(rows[0].created_at).toBeInstanceOf(Date);
  });

  test('id เพิ่มขึ้นตามลำดับจาก SERIAL', async () => {
    const a = await request(app).post('/api/todos').send({ title: 'หนึ่ง' });
    const b = await request(app).post('/api/todos').send({ title: 'สอง' });
    expect(b.body.data.id).toBe(a.body.data.id + 1);
  });
});
