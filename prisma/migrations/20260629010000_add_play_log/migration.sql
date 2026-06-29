-- CreateTable
CREATE TABLE "PlayLog" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayLog_setId_ip_createdAt_idx" ON "PlayLog"("setId", "ip", "createdAt");
