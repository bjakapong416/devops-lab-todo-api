/**
 * ฟังก์ชัน "บริสุทธิ์" (pure function) สำหรับตรวจสอบข้อมูล
 * แยกออกมาเป็นไฟล์เดี่ยว ๆ เพื่อให้เขียน Unit Test ได้ง่าย
 * โดยไม่ต้องพึ่งฐานข้อมูลหรือ HTTP server
 */

export const MAX_TITLE_LENGTH = 120;

/**
 * ตรวจสอบข้อมูล Todo ที่รับเข้ามา
 * @param {unknown} payload ข้อมูลดิบจาก request body
 * @returns {{valid: boolean, errors: string[], value?: {title: string, done: boolean}}}
 */
export function validateTodo(payload) {
  const errors = [];

  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, errors: ['body ต้องเป็น JSON object'] };
  }

  const { title, done } = payload;

  if (typeof title !== 'string') {
    errors.push('title ต้องเป็น string');
  } else if (title.trim().length === 0) {
    errors.push('title ต้องไม่เป็นค่าว่าง');
  } else if (title.trim().length > MAX_TITLE_LENGTH) {
    errors.push(`title ต้องยาวไม่เกิน ${MAX_TITLE_LENGTH} ตัวอักษร`);
  }

  if (done !== undefined && typeof done !== 'boolean') {
    errors.push('done ต้องเป็น boolean');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    value: { title: title.trim(), done: done ?? false },
  };
}

/**
 * แปลง query string เป็นตัวเลขหน้า (page) ที่ปลอดภัย
 * @param {unknown} raw
 * @param {number} fallback
 */
export function parsePage(raw, fallback = 1) {
  const n = Number.parseInt(String(raw ?? ''), 10);
  if (Number.isNaN(n) || n < 1) return fallback;
  return n;
}
