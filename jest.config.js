// jest.config.js
module.exports = {
  testEnvironment: 'jsdom', // Используем jsdom для тестирования React-компонентов
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Файл с настройками после инициализации Jest
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // Алиасы для импортов
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }], // Транспиляция TypeScript и JSX
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'], // Игнорируем node_modules и .next
  collectCoverage: true, // Включаем сбор покрытия кода
  coverageDirectory: 'coverage', // Директория для отчётов о покрытии
  coverageReporters: ['text', 'lcov'], // Форматы отчётов
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}', // Собираем покрытие для всех TypeScript файлов
    '!src/**/*.d.ts', // Игнорируем файлы с типами
    '!src/**/__tests__/**', // Игнорируем тестовые файлы
    '!src/**/index.ts', // Игнорируем index.ts
  ],
};
