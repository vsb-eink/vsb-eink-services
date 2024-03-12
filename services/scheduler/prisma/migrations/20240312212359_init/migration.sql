-- CreateTable
CREATE TABLE "EInkJob" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cron" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '[]',
    "precise" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "cycle" INTEGER NOT NULL DEFAULT 0,
    "shouldCycle" BOOLEAN NOT NULL DEFAULT false,
    "disabled" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "EInkJob_target_cron_key" ON "EInkJob"("target", "cron");
