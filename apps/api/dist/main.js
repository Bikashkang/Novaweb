"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const fs_1 = require("fs");
const path_1 = require("path");
try {
    const envPath = (0, path_1.resolve)(__dirname, '../.env');
    if ((0, fs_1.existsSync)(envPath)) {
        const envFile = (0, fs_1.readFileSync)(envPath, 'utf-8');
        envFile.split('\n').forEach((line) => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                    if (!process.env[key.trim()]) {
                        process.env[key.trim()] = value.trim();
                    }
                }
            }
        });
        console.log('[main.ts] Loaded .env file successfully');
    }
    else {
        console.warn('[main.ts] .env file not found at:', envPath);
    }
}
catch (error) {
    console.warn('[main.ts] Could not load .env file:', error.message);
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const allowedOrigins = [
        'http://localhost:3000',
        'https://novahdl.com',
        'https://www.novahdl.com',
        process.env.FRONTEND_URL,
    ].filter(Boolean);
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    });
    await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
//# sourceMappingURL=main.js.map