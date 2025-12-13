import express from 'express';
import cors from 'cors';
import {
  initServer,
  getServerIdentity,
  handleRegistrationStart,
  handleRegistrationFinish,
  handleLoginStart,
  handleLoginFinish
} from './opaque-server.js';
import { listUsers } from './storage.js';

const app = express();
const PORT = 3456;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', users: listUsers(), serverIdentity: getServerIdentity() });
});

app.post('/register/start', async (req, res) => {
  try {
    const { username, registrationRequest } = req.body;
    if (!username || !registrationRequest) {
      return res.status(400).json({ error: 'Missing username or registrationRequest' });
    }
    const result = await handleRegistrationStart(username, registrationRequest);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.post('/register/finish', async (req, res) => {
  try {
    const { username, registrationRecord } = req.body;
    if (!username || !registrationRecord) {
      return res.status(400).json({ error: 'Missing username or registrationRecord' });
    }
    const result = await handleRegistrationFinish(username, registrationRecord);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.post('/login/start', async (req, res) => {
  try {
    const { username, ke1 } = req.body;
    if (!username || !ke1) {
      return res.status(400).json({ error: 'Missing username or ke1' });
    }
    const result = await handleLoginStart(username, ke1);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.post('/login/finish', async (req, res) => {
  try {
    const { username, ke3 } = req.body;
    if (!username || !ke3) {
      return res.status(400).json({ error: 'Missing username or ke3' });
    }
    const result = await handleLoginFinish(username, ke3);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

async function main() {
  await initServer();
  app.listen(PORT, () => {
    console.log(`OPAQUE server running at http://localhost:${PORT}`);
  });
}

main().catch(console.error);
