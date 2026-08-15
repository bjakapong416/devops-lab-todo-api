/**
 * ทดสอบระดับ API แต่ยังใช้ in-memory store จึงยังนับเป็น "unit / component test"
 * รันได้ทันทีโดยไม่ต้องมีฐานข้อมูล → เหมาะกับ CI ขั้นแรกที่ต้องเร็ว
 */
import { describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { store } from '../../src/lib/store.js';

const app = createApp();

beforeEach(async () => {
  await store.reset();
});

describe('GET /healthz', () => {
  test('ตอบ 200 พร้อมสถานะ ok', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('CRUD /api/todos', () => {
  test('เริ่มต้นต้องเป็น list ว่าง', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('สร้างรายการใหม่ได้', async () => {
    const res = await request(app).post('/api/todos').send({ title: 'เขียน CI pipeline' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ title: 'เขียน CI pipeline', done: false });
    expect(res.body.data.id).toBeDefined();
  });

  test('ปฏิเสธข้อมูลที่ไม่ถูกต้องด้วย 400', async () => {
    const res = await request(app).post('/api/todos').send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('อ่าน แก้ไข และลบรายการได้ครบวงจร', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'ทำแล็บ' });
    const id = created.body.data.id;

    const read = await request(app).get(`/api/todos/${id}`);
    expect(read.status).toBe(200);

    const updated = await request(app)
      .put(`/api/todos/${id}`)
      .send({ title: 'ทำแล็บเสร็จแล้ว', done: true });
    expect(updated.status).toBe(200);
    expect(updated.body.data.done).toBe(true);

    const removed = await request(app).delete(`/api/todos/${id}`);
    expect(removed.status).toBe(204);

    const readAgain = await request(app).get(`/api/todos/${id}`);
    expect(readAgain.status).toBe(404);
  });

  test('ตอบ 404 เมื่อไม่พบรายการ', async () => {
    const res = await request(app).get('/api/todos/9999');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/todos/stats', () => {
  test('นับจำนวนรายการทั้งหมด/เสร็จแล้ว/ค้างอยู่ได้ถูกต้อง', async () => {
    await request(app).post('/api/todos').send({ title: 'อันแรก' });
    const second = await request(app).post('/api/todos').send({ title: 'อันสอง' });
    await request(app)
      .put(`/api/todos/${second.body.data.id}`)
      .send({ title: 'อันสอง', done: true });

    const res = await request(app).get('/api/todos/stats');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ total: 2, done: 1, pending: 1 });
  });
});
