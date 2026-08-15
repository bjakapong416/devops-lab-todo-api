#!/usr/bin/env bash
# สคริปต์ที่ถูกเรียกบน "เครื่องเซิร์ฟเวอร์" ตอน deploy
# แนวคิด: pull image ใหม่ -> ยกขึ้น -> smoke test -> ถ้าพังให้ย้อนกลับ tag เดิม
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/todo-api}"
NEW_TAG="${1:?ใช้: ./deploy.sh <image-tag>}"

cd "${APP_DIR}"

# จำ tag เดิมไว้เผื่อ rollback
PREV_TAG="$(grep -E '^TAG=' .env | cut -d= -f2- || echo '')"
echo "==> tag เดิม: ${PREV_TAG:-<ไม่มี>}  ->  tag ใหม่: ${NEW_TAG}"

# เขียน tag ใหม่ลง .env
if grep -qE '^TAG=' .env; then
  sed -i "s|^TAG=.*|TAG=${NEW_TAG}|" .env
else
  echo "TAG=${NEW_TAG}" >> .env
fi

docker compose -f docker-compose.prod.yml pull api
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# ตรวจสุขภาพ ถ้าไม่ผ่านให้ย้อนกลับทันที
if ! ./smoke-test.sh "http://localhost"; then
  echo "!!  smoke test ไม่ผ่าน กำลัง rollback ไปที่ ${PREV_TAG}"
  if [ -n "${PREV_TAG}" ]; then
    sed -i "s|^TAG=.*|TAG=${PREV_TAG}|" .env
    docker compose -f docker-compose.prod.yml up -d
  fi
  exit 1
fi

# ล้าง image เก่าที่ไม่ใช้แล้ว ไม่ให้ดิสก์เต็ม
docker image prune -f --filter "until=168h"
echo "==> deploy ${NEW_TAG} สำเร็จ ✅"
