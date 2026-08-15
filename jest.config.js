export default {
  testEnvironment: 'node',
  transform: {},
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      transform: {},
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      transform: {},
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
    },
  ],
  // ไม่นับ server.js เพราะเป็นแค่จุดเริ่มโปรแกรม (bootstrap)
  // ซึ่งเราไปตรวจด้วย smoke test หลัง deploy แทน
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  coverageReporters: ['text', 'lcov', 'cobertura'],

  // "ประตูคุณภาพ" (quality gate): ถ้า coverage ต่ำกว่านี้ CI จะไม่ผ่าน
  // เคล็ดลับ: ตั้งค่าเริ่มต้นให้เท่ากับระดับปัจจุบัน แล้วค่อย ๆ ขยับขึ้น
  // (ratchet) อย่าตั้งสูงลิ่วตั้งแต่วันแรก เพราะทีมจะหาทางเลี่ยงแทนที่จะเขียนเทสต์
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 50,
      functions: 45,
      lines: 60,
    },
  },
};
