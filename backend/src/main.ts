import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('HTTP');

  app.use((request: import('express').Request, response: import('express').Response, next: import('express').NextFunction) => {
    const startedAt = Date.now();
    response.on('finish', () => {
      const duration = Date.now() - startedAt;
      const method = request.method;
      const path = request.path;
      const status = response.statusCode;
      const message = `${method} ${path} ${status} ${duration}ms`;

      if (status >= 500) {
        logger.error(message);
      } else if (status >= 400) {
        logger.warn(message);
      } else if (process.env.NODE_ENV !== 'production') {
        logger.log(message);
      }
    });
    next();
  });

  app.use(helmet());

  app.use(
    '/auth/login',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

await bootstrap();