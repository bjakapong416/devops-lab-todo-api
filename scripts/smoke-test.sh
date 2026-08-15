#!/usr/bin/env bash
# Smoke test — ตรวจ "ลมหายใจ" ของระบบหลัง deploy
# ถ้าสคริปต์นี้ไม่ผ่าน แปลว่า deploy ไม่สำเร็จ ต้อง rollback
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
RETRIES="${RETRIES:-20}"
SLEEP="${SLEEP:-3}"

echo "==> smoke test ที่ ${BASE_URL}"

# 1) รอให้บริการพร้อม (readiness gate)
for i in $(seq 1 "${RETRIES}"); do
  if curl -fsS "${BASE_URL}/healthz" >/dev/null 2>&1; then
    echo "    [${i}/${RETRIES}] /healthz พร้อมแล้ว"
    break
  fi
  if [ "${i}" -eq "${RETRIES}" ]; then
    echo "!!  บริการไม่ตอบสนองภายใน $((RETRIES * SLEEP)) วินาที"
    exit 1
  fi
  echo "    [${i}/${RETRIES}] ยังไม่พร้อม รออีก ${SLEEP}s ..."
  sleep "${SLEEP}"
done

# 2) ตรวจ readiness (ต่อฐานข้อมูลได้จริงไหม)
curl -fsS "${BASE_URL}/readyz" >/dev/null
echo "    /readyz ผ่าน"

# 3) ตรวจเส้นทางหลักของธุรกิจ (critical path)
created=$(curl -fsS -X POST "${BASE_URL}/api/todos" \
  -H 'Content-Type: application/json' \
  -d '{"title":"smoke-test"}')
id=$(echo "${created}" | sed -n 's/.*"id":\([0-9]*\).*/\1/p')
[ -n "${id}" ] || { echo "!!  สร้าง todo ไม่สำเร็จ"; exit 1; }
echo "    สร้าง todo id=${id} สำเร็จ"

curl -fsS "${BASE_URL}/api/todos/${id}" >/dev/null
curl -fsS -X DELETE "${BASE_URL}/api/todos/${id}" -o /dev/null
echo "    อ่าน/ลบ todo สำเร็จ"

echo "==> smoke test ผ่านทั้งหมด ✅"
