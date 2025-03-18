import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { URL } from 'url';

/**
 * Response mode types for mocking various Expo API responses
 */
export type ExpoResponseMode = 'success' | 'deviceNotRegistered' | 'invalidCredentials' | 'messageTooLarge' | 'mixed';

/**
 * Structure for Expo Push Messages received in the request
 */
interface ExpoPushMessage {
    to: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    sound?: string;
    priority?: string;
}

/**
 * Structure for response data in different cases
 */
type ExpoResponseTicket =
    | { status: 'ok'; id: string }
    | { status: 'error'; message: string; details: { error: string } };

/**
 * Mock server for Expo Push API used in integration tests
 * Simulates various responses from the Expo Push service
 */
export class ExpoApiMock {
    private server: Server;
    private port: number = 0;
    private responseMode: ExpoResponseMode = 'success';

    constructor() {
        this.server = createServer((req, res) => {
            console.log(`[ExpoApiMock] Received request: ${req.method} ${req.url}`);

            // Parse URL to get the actual path without query parameters
            const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
            const path = parsedUrl.pathname;

            // Adding additional logging for debugging
            console.log(`[ExpoApiMock] Parsed path: ${path}`);
            console.log(`[ExpoApiMock] Headers:`, req.headers);

            // Check if this is a push notification request
            // The Expo API endpoint is "/--/api/v2/push/send" 
            // But we should also handle the root path "/" for backward compatibility
            if (req.method === 'POST' && (path === '/--/api/v2/push/send' || path === '/')) {
                // Read request body
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });

                req.on('end', () => {
                    console.log(`[ExpoApiMock] Received body: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`);

                    // Parse the messages from the request body
                    let messages;
                    try {
                        messages = JSON.parse(body);

                        // Ensure messages is always an array
                        if (!Array.isArray(messages)) {
                            messages = [messages];
                        }
                    } catch (e) {
                        console.error('[ExpoApiMock] Error parsing JSON:', e);
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: 'Invalid JSON' }));
                        return;
                    }

                    // Generate appropriate response based on mode
                    const response = this.generateResponse(messages as ExpoPushMessage[]);
                    console.log(`[ExpoApiMock] Sending response: ${JSON.stringify(response)}`);

                    // Send the response
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(response));
                });
            } else {
                console.log(`[ExpoApiMock] Unhandled request: ${req.method} ${path}`);
                res.writeHead(404);
                res.end(JSON.stringify({
                    error: 'Not found',
                    details: `Method: ${req.method}, Path: ${path}`
                }));
            }
        });
    }

    /**
     * Start the mock server on a random port
     * @returns The URL of the mock server
     */
    async start(): Promise<string> {
        return new Promise((resolve) => {
            this.server.listen(0, () => {
                const address = this.server.address() as AddressInfo;
                this.port = address.port;
                const url = `http://localhost:${this.port}`;
                console.log(`[ExpoApiMock] Server started at ${url}`);
                resolve(url);
            });
        });
    }

    /**
     * Stop the mock server
     */
    async stop(): Promise<void> {
        return new Promise((resolve) => {
            if (this.server.listening) {
                this.server.close(() => {
                    console.log('[ExpoApiMock] Server stopped');
                    resolve();
                });
            } else {
                console.log('[ExpoApiMock] Server was not running');
                resolve();
            }
        });
    }

    /**
     * Set the response mode for the mock server
     * @param mode The response mode to use
     */
    setResponseMode(mode: ExpoResponseMode): void {
        console.log(`[ExpoApiMock] Setting response mode to: ${mode}`);
        this.responseMode = mode;
    }

    /**
     * Get the URL of the running mock server
     * @returns The URL of the mock server
     */
    getUrl(): string {
        if (this.port === 0) {
            throw new Error('Server not started');
        }
        return `http://localhost:${this.port}`;
    }

    /**
     * Generate response data based on the current mode
     * @param messages The messages received in the request
     * @returns A response object that mimics the Expo API response format
     */
    private generateResponse(messages: ExpoPushMessage[]): { data: ExpoResponseTicket[] } {
        // In Expo API, the response contains a 'data' array with ticket objects
        const data: ExpoResponseTicket[] = [];

        for (let i = 0; i < messages.length; i++) {
            switch (this.responseMode) {
                case 'success':
                    data.push({
                        status: 'ok',
                        id: `receipt-id-${Date.now()}-${i}`
                    });
                    break;

                case 'deviceNotRegistered':
                    data.push({
                        status: 'error',
                        message: 'ExponentPushToken is not a registered push notification recipient',
                        details: { error: 'DeviceNotRegistered' }
                    });
                    break;

                case 'invalidCredentials':
                    data.push({
                        status: 'error',
                        message: 'Invalid credentials',
                        details: { error: 'InvalidCredentials' }
                    });
                    break;

                case 'messageTooLarge':
                    data.push({
                        status: 'error',
                        message: 'Message too big',
                        details: { error: 'MessageTooBig' }
                    });
                    break;

                case 'mixed':
                    // Alternate between success and error responses
                    if (i % 2 === 0) {
                        data.push({
                            status: 'ok',
                            id: `receipt-id-${Date.now()}-${i}`
                        });
                    } else {
                        data.push({
                            status: 'error',
                            message: 'ExponentPushToken is not a registered push notification recipient',
                            details: { error: 'DeviceNotRegistered' }
                        });
                    }
                    break;
            }
        }

        return { data };
    }
} 