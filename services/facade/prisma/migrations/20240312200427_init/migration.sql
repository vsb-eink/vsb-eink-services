-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "Scope" AS ENUM ('HOSTED_READ', 'HOSTED_WRITE', 'PANELS_READ', 'PANELS_WRITE', 'USERS_READ', 'USERS_WRITE', 'SCHEDULE_READ', 'SCHEDULE_WRITE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "scopes" "Scope"[],

    CONSTRAINT "UserGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Panel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Panel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PanelGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PanelGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserToUserGroup" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_PanelToPanelGroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PanelGroupToUserGroup" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "UserGroup_name_key" ON "UserGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Panel_name_key" ON "Panel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PanelGroup_name_key" ON "PanelGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_UserToUserGroup_AB_unique" ON "_UserToUserGroup"("A", "B");

-- CreateIndex
CREATE INDEX "_UserToUserGroup_B_index" ON "_UserToUserGroup"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PanelToPanelGroup_AB_unique" ON "_PanelToPanelGroup"("A", "B");

-- CreateIndex
CREATE INDEX "_PanelToPanelGroup_B_index" ON "_PanelToPanelGroup"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PanelGroupToUserGroup_AB_unique" ON "_PanelGroupToUserGroup"("A", "B");

-- CreateIndex
CREATE INDEX "_PanelGroupToUserGroup_B_index" ON "_PanelGroupToUserGroup"("B");

-- AddForeignKey
ALTER TABLE "_UserToUserGroup" ADD CONSTRAINT "_UserToUserGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserToUserGroup" ADD CONSTRAINT "_UserToUserGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "UserGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PanelToPanelGroup" ADD CONSTRAINT "_PanelToPanelGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "Panel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PanelToPanelGroup" ADD CONSTRAINT "_PanelToPanelGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "PanelGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PanelGroupToUserGroup" ADD CONSTRAINT "_PanelGroupToUserGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "PanelGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PanelGroupToUserGroup" ADD CONSTRAINT "_PanelGroupToUserGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "UserGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
