# devops-lab-todo-api

โปรเจกต์ตัวอย่างสำหรับวิชา **CI/CD** — Todo REST API ขนาดเล็กที่ออกแบบมาให้เห็นครบทุกขั้นของ pipeline

## โครงสร้างไฟล์

```
devops-lab-todo-api/
├── src/
│   ├── app.js              สร้าง Express app (แยกจาก server เพื่อให้เทสต์ได้)
│   ├── server.js           จุดเริ่มโปรแกรม + graceful shutdown
│   ├── lib/
│   │   ├── validate.js     pure function → ตัวอย่าง Unit Test ที่ดี
│   │   └── store.js        สลับ memory / postgres ด้วย env STORE
│   └── routes/todos.js     REST endpoints
├── tests/
│   ├── unit/               รันได้ทันที ไม่ต้องมี DB   (เร็ว)
│   └── integration/        ต้องมี PostgreSQL จริง     (ช้ากว่า แต่สมจริง)
├── .github/
│   ├── workflows/
│   │   ├── 01-hello.yml    Lab 1 — โครงสร้าง workflow
│   │   ├── 02-ci.yml       Lab 2 — lint + test matrix + service container
│   │   ├── 03-docker.yml   Lab 3 — build/scan/push image ขึ้น GHCR
│   │   └── 04-cd.yml       Lab 4 — deploy staging/production + approval
│   ├── dependabot.yml
│   └── pull_request_template.md
├── deploy/
│   ├── docker-compose.prod.yml   ใช้บนเซิร์ฟเวอร์ (pull image, ไม่ build)
│   └── deploy.sh                 deploy + smoke test + auto rollback
├── scripts/smoke-test.sh
├── Dockerfile              multi-stage: deps → test → prod-deps → runtime
└── docker-compose.yml      สำหรับพัฒนาบนเครื่องตัวเอง
```

## เริ่มต้นใช้งาน

```bash
# 1) ติดตั้ง dependency
npm ci

# 2) รัน unit test (ไม่ต้องมีฐานข้อมูล)
npm test

# 3) รันเซิร์ฟเวอร์แบบ in-memory
npm run dev
curl http://localhost:3000/healthz

# 4) รันทั้งระบบด้วย Docker Compose (มี PostgreSQL ให้ด้วย)
docker compose up --build
./scripts/smoke-test.sh http://localhost:3000

# 5) รัน integration test (ต้องมี DB อยู่แล้ว)
STORE=postgres DATABASE_URL=postgres://postgres:postgres@localhost:5432/todos \
  npm run test:integration
```

## API

| Method | Path             | คำอธิบาย                       |
| ------ | ---------------- | ------------------------------ |
| GET    | `/healthz`       | liveness — โปรเซสยังอยู่ไหม    |
| GET    | `/readyz`        | readiness — ต่อ DB ได้ไหม      |
| GET    | `/api/todos`     | รายการทั้งหมด                  |
| GET    | `/api/todos/:id` | รายการเดียว                    |
| POST   | `/api/todos`     | สร้าง — body `{ "title": "" }` |
| PUT    | `/api/todos/:id` | แก้ไข                          |
| DELETE | `/api/todos/:id` | ลบ                             |

## ตัวแปรแวดล้อม

| ตัวแปร         | ค่าเริ่มต้น | คำอธิบาย                       |
| -------------- | ----------- | ------------------------------ |
| `PORT`         | `3000`      | พอร์ตที่ให้บริการ              |
| `STORE`        | `memory`    | `memory` หรือ `postgres`       |
| `DATABASE_URL` | —           | connection string ของ Postgres |
| `APP_VERSION`  | `dev`       | เวอร์ชันที่โชว์ที่ `/healthz`  |

> เวอร์ชันของ GitHub Actions ในไฟล์ workflow อ้างอิง ณ เดือนสิงหาคม 2026
> ก่อนใช้งานจริงควรตรวจสอบเวอร์ชันล่าสุดที่ GitHub Marketplace เสมอ
