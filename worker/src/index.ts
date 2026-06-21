import express from "express";
import { processTranscodeJob } from "./transcode";

const app = express();
app.use(express.json());

const WORKER_SECRET = process.env.WORKER_SECRET;

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const secret = req.headers["x-worker-secret"];
  if (!WORKER_SECRET || secret !== WORKER_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.post("/transcode", authMiddleware, async (req, res) => {
  const { setId, key } = req.body as { setId?: string; key?: string };

  if (!setId || !key) {
    res.status(400).json({ error: "Missing setId or key" });
    return;
  }

  // Acknowledge immediately — transcoding runs in background
  res.json({ ok: true, setId });

  // Run async (don't await — response already sent)
  processTranscodeJob(setId, key).catch((err) => {
    console.error(`[worker] Unhandled error for set ${setId}:`, err);
  });
});

const PORT = parseInt(process.env.PORT ?? "3001");
app.listen(PORT, () => {
  console.log(`[worker] Listening on port ${PORT}`);
});
