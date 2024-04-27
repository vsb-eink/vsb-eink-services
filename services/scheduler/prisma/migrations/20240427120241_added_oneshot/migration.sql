-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EInkJob" (
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
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "oneShot" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_EInkJob" ("command", "content", "cron", "cycle", "description", "disabled", "id", "name", "precise", "priority", "shouldCycle", "target") SELECT "command", "content", "cron", "cycle", "description", "disabled", "id", "name", "precise", "priority", "shouldCycle", "target" FROM "EInkJob";
DROP TABLE "EInkJob";
ALTER TABLE "new_EInkJob" RENAME TO "EInkJob";
CREATE UNIQUE INDEX "EInkJob_target_cron_key" ON "EInkJob"("target", "cron");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
