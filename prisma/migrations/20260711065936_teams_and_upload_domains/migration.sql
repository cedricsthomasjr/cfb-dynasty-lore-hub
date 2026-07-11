-- CreateEnum
CREATE TYPE "UploadDomain" AS ENUM ('TEAM_LOGO', 'TEAM_IDENTITY', 'TEAM_SEASON_STATS', 'TEAM_GAME_STATS', 'PLAYER_ROSTER', 'PLAYER_PROFILE', 'PLAYER_GAME_STATS', 'PLAYER_SEASON_STATS', 'COACH_PROFILE', 'GAME_BOX_SCORE', 'RANKINGS', 'CONFERENCE_STANDINGS', 'AWARDS');

-- CreateEnum
CREATE TYPE "InputMethod" AS ENUM ('SCREENSHOT', 'MANUAL');

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "catalogTeamId" TEXT,
ADD COLUMN     "isCustom" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Upload" ADD COLUMN     "domain" "UploadDomain",
ADD COLUMN     "inputMethod" "InputMethod" NOT NULL DEFAULT 'SCREENSHOT',
ADD COLUMN     "manualPayload" JSONB,
ADD COLUMN     "teamId" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynastyMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dynastyId" TEXT NOT NULL,
    "controlledTeamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynastyMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamCatalog" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "abbreviation" TEXT,
    "conferenceName" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "defaultLogoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "DynastyMembership_userId_idx" ON "DynastyMembership"("userId");

-- CreateIndex
CREATE INDEX "DynastyMembership_dynastyId_idx" ON "DynastyMembership"("dynastyId");

-- CreateIndex
CREATE UNIQUE INDEX "DynastyMembership_userId_dynastyId_key" ON "DynastyMembership"("userId", "dynastyId");

-- CreateIndex
CREATE UNIQUE INDEX "DynastyMembership_dynastyId_controlledTeamId_key" ON "DynastyMembership"("dynastyId", "controlledTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamCatalog_slug_key" ON "TeamCatalog"("slug");

-- CreateIndex
CREATE INDEX "TeamCatalog_conferenceName_idx" ON "TeamCatalog"("conferenceName");

-- CreateIndex
CREATE INDEX "Team_catalogTeamId_idx" ON "Team"("catalogTeamId");

-- CreateIndex
CREATE INDEX "Upload_userId_idx" ON "Upload"("userId");

-- CreateIndex
CREATE INDEX "Upload_teamId_idx" ON "Upload"("teamId");

-- CreateIndex
CREATE INDEX "Upload_domain_idx" ON "Upload"("domain");

-- AddForeignKey
ALTER TABLE "DynastyMembership" ADD CONSTRAINT "DynastyMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynastyMembership" ADD CONSTRAINT "DynastyMembership_dynastyId_fkey" FOREIGN KEY ("dynastyId") REFERENCES "Dynasty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynastyMembership" ADD CONSTRAINT "DynastyMembership_controlledTeamId_fkey" FOREIGN KEY ("controlledTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_catalogTeamId_fkey" FOREIGN KEY ("catalogTeamId") REFERENCES "TeamCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
