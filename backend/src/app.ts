import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';

const app = express();

app.use(cors({
  origin: env.FRONTEND_URL,
}));

app.use(express.json());

// Routes
app.use(healthRouter);
app.use('/api/auth', authRouter);

export default app;
