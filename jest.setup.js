// jest.setup.js
import '@testing-library/jest-dom'; // Добавляем матчеры для тестирования DOM
import { server } from './src/mocks/server'; // Импортируем моковый сервер

// Запускаем моковый сервер перед всеми тестами
beforeAll(() => server.listen());

// Сбрасываем моки после каждого теста
afterEach(() => server.resetHandlers());

// Останавливаем моковый сервер после всех тестов
afterAll(() => server.close());
