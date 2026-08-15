import { createApp } from './app.js';
import { store, storeKind } from './lib/store.js';

const PORT = Number(process.env.PORT ?? 3000);

await store.init();

const server = createApp().listen(PORT, () => {
  console.log(`[todo-api] listening on :${PORT} (store=${storeKind})`);
});

// Graceful shutdown — สำคัญมากตอน deploy แบบ rolling update
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`[todo-api] received ${signal}, closing...`);
    server.close(async () => {
      await store.close();
      process.exit(0);
    });
  });
}
