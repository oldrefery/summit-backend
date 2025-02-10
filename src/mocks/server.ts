// src/mocks/server.ts
import { setupServer } from 'msw/node'; // Импортируем setupServer из msw/node
import { handlers } from './handlers'; // Импортируем моковые обработчики

// Создаем моковый сервер с использованием обработчиков
export const server = setupServer(...handlers);
