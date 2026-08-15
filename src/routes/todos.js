import { Router } from 'express';
import { store } from '../lib/store.js';
import { validateTodo } from '../lib/validate.js';

export const todosRouter = Router();

todosRouter.get('/', async (_req, res, next) => {
  try {
    res.json({ data: await store.list() });
  } catch (err) {
    next(err);
  }
});

todosRouter.get('/stats', async (_req, res, next) => {
  try {
    const items = await store.list();
    const done = items.filter((item) => item.done).length;
    res.json({ data: { total: items.length, done, pending: items.length - done } });
  } catch (err) {
    next(err);
  }
});

todosRouter.get('/:id', async (req, res, next) => {
  try {
    const item = await store.get(req.params.id);
    if (!item) return res.status(404).json({ error: 'ไม่พบรายการนี้' });
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
});

todosRouter.post('/', async (req, res, next) => {
  try {
    const result = validateTodo(req.body);
    if (!result.valid) return res.status(400).json({ errors: result.errors });
    const created = await store.create(result.value);
    res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
});

todosRouter.put('/:id', async (req, res, next) => {
  try {
    const result = validateTodo(req.body);
    if (!result.valid) return res.status(400).json({ errors: result.errors });
    const updated = await store.update(req.params.id, result.value);
    if (!updated) return res.status(404).json({ error: 'ไม่พบรายการนี้' });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

todosRouter.delete('/:id', async (req, res, next) => {
  try {
    const ok = await store.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: 'ไม่พบรายการนี้' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
