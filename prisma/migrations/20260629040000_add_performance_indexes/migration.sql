-- CreateIndex: performance indexes for Set queries (TASK-018)
CREATE INDEX IF NOT EXISTS "Set_userId_idx" ON "Set"("userId");
CREATE INDEX IF NOT EXISTS "Set_status_idx" ON "Set"("status");
CREATE INDEX IF NOT EXISTS "Set_mood_idx" ON "Set"("mood");
CREATE INDEX IF NOT EXISTS "Set_status_createdAt_idx" ON "Set"("status", "createdAt" DESC);
