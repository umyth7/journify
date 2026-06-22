-- CreateTable
CREATE TABLE "BetaSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetaSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailNotificationLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "fromUserId" TEXT,
    "setId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BetaSubscriber_email_key" ON "BetaSubscriber"("email");

-- CreateIndex
CREATE INDEX "BetaSubscriber_createdAt_idx" ON "BetaSubscriber"("createdAt");

-- CreateIndex
CREATE INDEX "EmailNotificationLog_toUserId_type_idx" ON "EmailNotificationLog"("toUserId", "type");
