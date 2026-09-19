import express from 'express';
import cookieParser from 'cookie-parser';
import { config } from './infrastructure/config.js';
import { connectToDatabase } from './infrastructure/database/mongoose/connection.js';
import { authRouter } from './presentation/controllers/auth.controller.js';

const app = express();
const port = Number(config.PORT);

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);

app.get('/health', (_request, response) => {
  response.status(200).json({
    success: true,
    data: { status: 'ok' },
    message: 'Backend is healthy',
  });
});

async function startServer() {
  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });

  try {
    await connectToDatabase(config.MONGODB_URI);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
  }
}

startServer();
