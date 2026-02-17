import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load .env file manually (since dotenv package may not be installed)
try {
  const envPath = resolve(__dirname, '../.env');
  if (existsSync(envPath)) {
    const envFile = readFileSync(envPath, 'utf-8');
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
  } else {
    console.warn('[main.ts] .env file not found at:', envPath);
  }
} catch (error: any) {
  console.warn('[main.ts] Could not load .env file:', error.message);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  const allowedOrigins = [
    'http://localhost:3000',
    'https://novahdl.com',
    'https://www.novahdl.com',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
