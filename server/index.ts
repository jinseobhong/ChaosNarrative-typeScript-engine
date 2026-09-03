import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { characterRouter } from './routes/characterGenerator';
import { chatRouter } from './routes/chatStream';
import { MODEL_REGISTRY, DEFAULT_CASCADE_LIST } from './models/modelRegistry';
import { getApiProviderStatus } from './services/cascadeEngine';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount routes
app.use('/api', characterRouter);
app.use('/api', chatRouter);

// Models registry endpoint
app.get('/api/models', (req, res) => {
  const providerStatus = getApiProviderStatus();
  res.json({
    models: MODEL_REGISTRY,
    defaultCascade: DEFAULT_CASCADE_LIST,
    providers: providerStatus,
  });
});

// Healthcheck & config check
app.get('/api/health', (req, res) => {
  const providerStatus = getApiProviderStatus();
  res.json({
    status: 'ok',
    providers: providerStatus,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  const providerStatus = getApiProviderStatus();
  console.log(`[Abyss Backend Server] Running on http://localhost:${PORT}`);
  console.log(`[Gemini API Status]: ${providerStatus.google ? 'Active ✅' : 'Missing Key ⚠️'}`);
  console.log(`[Claude API Status]: ${providerStatus.anthropic ? 'Active ✅' : 'Missing Key ⚠️'}`);
});
