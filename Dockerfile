# syntax=docker/dockerfile:1
###############################################################################
# Multi-stage build
#   - stage "deps"    : ติดตั้ง dependency ทั้งหมด (รวม devDependencies) ไว้เทสต์
#   - stage "test"    : รัน lint + unit test ภายใน image (fail fast)
#   - stage "prod-deps": ติดตั้งเฉพาะ dependency ที่ใช้ตอนรันจริง
#   - stage "runtime" : image สุดท้าย เล็กที่สุด ไม่มี source ที่ไม่จำเป็น
#
# ประโยชน์: image สุดท้ายเล็กลงมาก + ไม่มีเครื่องมือ dev ติดไปด้วย (ลด attack surface)
###############################################################################

########################  1) deps  ############################################
FROM node:25-alpine AS deps
WORKDIR /app
# คัดลอกเฉพาะไฟล์ manifest ก่อน เพื่อให้ Docker cache ชั้นนี้ไว้ได้
# ถ้า package.json ไม่เปลี่ยน ขั้น npm ci จะถูกใช้ cache ทันที
COPY package.json package-lock.json ./
RUN npm ci

########################  2) test  ############################################
FROM deps AS test
WORKDIR /app
COPY . .
RUN npm run lint && npm test

########################  3) prod-deps  #######################################
FROM node:25-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

########################  4) runtime  #########################################
FROM node:25-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app

# ติดตั้ง wget ไว้ทำ HEALTHCHECK (alpine มี wget ใน busybox อยู่แล้ว)
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# รันด้วยผู้ใช้ที่ไม่ใช่ root — เป็น best practice ด้านความปลอดภัย
# image node:alpine มีผู้ใช้ชื่อ node (uid 1000) มาให้อยู่แล้ว
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1

# ใช้ exec form เพื่อให้ process รับสัญญาณ SIGTERM ได้ตรง ๆ (graceful shutdown)
CMD ["node", "src/server.js"]
