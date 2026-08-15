import express from 'express';
import { todosRouter } from './routes/todos.js';
import { store, storeKind } from './lib/store.js';

export const APP_VERSION = process.env.APP_VERSION ?? 'dev';

export function createApp() {
  const app = express();
  app.use(express.json());

  // Endpoint สำหรับ health check — ใช้ทั้งใน Docker HEALTHCHECK และตอน smoke test หลัง deploy
  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', version: APP_VERSION, store: storeKind });
  });

  // readiness: เช็คว่าต่อ dependency (ฐานข้อมูล) ได้จริงหรือยัง
  app.get('/readyz', async (_req, res) => {
    try {
      await store.ping();
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not-ready' });
    }
  });

  app.use('/api/todos', todosRouter);

  app.use((_req, res) => res.status(404).json({ error: 'not found' }));

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'internal server error' });
  });

  return app;
}
