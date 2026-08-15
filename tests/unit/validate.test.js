import { describe, test, expect } from '@jest/globals';
import { validateTodo, parsePage, MAX_TITLE_LENGTH } from '../../src/lib/validate.js';

describe('validateTodo', () => {
  test('ผ่านเมื่อข้อมูลถูกต้อง และตัดช่องว่างหัวท้ายให้', () => {
    const r = validateTodo({ title: '  อ่านหนังสือ  ' });
    expect(r.valid).toBe(true);
    expect(r.value).toEqual({ title: 'อ่านหนังสือ', done: false });
  });

  test('รับค่า done ที่ส่งมาได้', () => {
    const r = validateTodo({ title: 'ส่งงาน', done: true });
    expect(r.valid).toBe(true);
    expect(r.value.done).toBe(true);
  });

  test('ไม่ผ่านเมื่อไม่มี title', () => {
    const r = validateTodo({});
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('title ต้องเป็น string');
  });

  test('ไม่ผ่านเมื่อ title เป็นช่องว่างล้วน', () => {
    const r = validateTodo({ title: '     ' });
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('title ต้องไม่เป็นค่าว่าง');
  });

  test('ไม่ผ่านเมื่อ title ยาวเกินกำหนด', () => {
    const r = validateTodo({ title: 'ก'.repeat(MAX_TITLE_LENGTH + 1) });
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/ยาวไม่เกิน/);
  });

  test('ไม่ผ่านเมื่อ done ไม่ใช่ boolean', () => {
    const r = validateTodo({ title: 'ok', done: 'yes' });
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('done ต้องเป็น boolean');
  });

  test.each([null, 'string', 42, ['a']])('ไม่ผ่านเมื่อ body ไม่ใช่ object: %p', (input) => {
    expect(validateTodo(input).valid).toBe(false);
  });
});

describe('parsePage', () => {
  test('คืนค่าตัวเลขที่ถูกต้อง', () => {
    expect(parsePage('3')).toBe(3);
  });

  test.each([undefined, null, '', 'abc', '0', '-5'])(
    'คืนค่า fallback เมื่อ input = %p',
    (input) => {
      expect(parsePage(input)).toBe(1);
    },
  );
});
