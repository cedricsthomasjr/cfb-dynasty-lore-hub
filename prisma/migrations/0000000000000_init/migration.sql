-- CreateEnum
CREATE TYPE "ScreenType" AS ENUM ('DYNASTY_HOME', 'TOP_25', 'CFP_RANKINGS', 'CONFERENCE_STANDINGS', 'TEAM_SCHEDULE', 'TEAM_STATS', 'NATIONAL_LEADERS', 'BOX_SCORE', 'PLAYER_STATS', 'TEAM_ROSTER', 'AWARDS', 'HEISMAN_WATCH', 'SCHOOL_RECORDS', 'PLAYER_CARD', 'GAME_RESULTS', 'SEASON_STATISTICS', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('UPLOADED', 'DETECTING', 'PARSING', 'NEEDS_REVIEW', 'VALIDATED', 'FAILED', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "WeekType" AS ENUM ('PRESEASON', 'REGULAR', 'CONFERENCE_CHAMPIONSHIP', 'BOWL', 'PLAYOFF', 'NATIONAL_CHAMPIONSHIP', 'OFFSEASON');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINAL');

-- CreateEnum
CREATE TYPE "PollType" AS ENUM ('AP', 'COACHES', 'CFP', 'PLAYOFF_COMMITTEE');

-- CreateEnum
CREATE TYPE "ClassYear" AS ENUM ('FR', 'SO', 'JR', 'SR', 'RS_FR', 'RS_SO', 'RS_JR', 'RS_SR');

-- CreateEnum
CREATE TYPE "CoachRole" AS ENUM ('HEAD_COACH', 'OFFENSIVE_COORDINATOR', 'DEFENSIVE_COORDINATOR', 'POSITION_COACH');

-- CreateEnum
CREATE TYPE "RecordScope" AS ENUM ('SCHOOL', 'LEAGUE', 'CONFERENCE');

-- CreateEnum
CREATE TYPE "HistoricalRecordKind" AS ENUM ('NATIONAL_CHAMPIONSHIP', 'CONFERENCE_CHAMPIONSHIP', 'BOWL_APPEARANCE', 'BOWL_WIN', 'PLAYOFF_APPEARANCE', 'RIVALRY_RESULT', 'UNDEFEATED_SEASON', 'COACHING_MILESTONE');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('CHAMPIONSHIP', 'UPSET', 'RECORD_BROKEN', 'AWARD', 'MILESTONE', 'RIVALRY', 'COACHING_CHANGE', 'HISTORIC_GAME');

-- CreateEnum
CREATE TYPE "ArticleType" AS ENUM ('BREAKING_NEWS', 'WEEKLY_HEADLINE', 'WEEKEND_RECAP', 'GAME_PREVIEW', 'GAME_RECAP', 'POWER_RANKINGS', 'AWARD_ARTICLE', 'CONFERENCE_RACE', 'CFP_RACE', 'RIVALRY_FEATURE', 'RECORD_ALERT', 'HISTORICAL_MILESTONE', 'SEASON_REVIEW');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Dynasty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schoolName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dynasty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "dynastyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Week" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "type" "WeekType" NOT NULL DEFAULT 'REGULAR',

    CONSTRAINT "Week_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conference" (
    "id" TEXT NOT NULL,
    "dynastyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,

    CONSTRAINT "Conference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "dynastyId" TEXT NOT NULL,
    "conferenceId" TEXT,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "abbreviation" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "logoUrl" TEXT,
    "isUserControlled" BOOLEAN NOT NULL DEFAULT false,
    "sourceUploadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "dynastyId" TEXT NOT NULL,
    "teamId" TEXT,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "jersey" INTEGER,
    "classYear" "ClassYear",
    "heightIn" INTEGER,
    "weightLb" INTEGER,
    "hometown" TEXT,
    "sourceUploadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "dynastyId" TEXT NOT NULL,
    "teamId" TEXT,
    "name" TEXT NOT NULL,
    "role" "CoachRole" NOT NULL DEFAULT 'HEAD_COACH',
    "careerWins" INTEGER NOT NULL DEFAULT 0,
    "careerLosses" INTEGER NOT NULL DEFAULT 0,
    "sourceUploadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "weekId" TEXT,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "status" "GameStatus" NOT NULL DEFAULT 'SCHEDULED',
    "kickoff" TIMESTAMP(3),
    "venue" TEXT,
    "isRivalry" BOOLEAN NOT NULL DEFAULT false,
    "isNeutralSite" BOOLEAN NOT NULL DEFAULT false,
    "isConferenceGame" BOOLEAN NOT NULL DEFAULT false,
    "sourceUploadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamGameStat" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "totalYards" INTEGER,
    "passingYards" INTEGER,
    "rushingYards" INTEGER,
    "firstDowns" INTEGER,
    "turnovers" INTEGER,
    "penalties" INTEGER,
    "penaltyYards" INTEGER,
    "possessionSec" INTEGER,
    "thirdDownConv" TEXT,
    "fourthDownConv" TEXT,

    CONSTRAINT "TeamGameStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerGameStat" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "passComp" INTEGER,
    "passAtt" INTEGER,
    "passYards" INTEGER,
    "passTd" INTEGER,
    "passInt" INTEGER,
    "rushAtt" INTEGER,
    "rushYards" INTEGER,
    "rushTd" INTEGER,
    "rec" INTEGER,
    "recYards" INTEGER,
    "recTd" INTEGER,
    "tackles" INTEGER,
    "sacks" DOUBLE PRECISION,
    "defInt" INTEGER,
    "forcedFumbles" INTEGER,
    "fgMade" INTEGER,
    "fgAtt" INTEGER,
    "sourceUploadId" TEXT,

    CONSTRAINT "PlayerGameStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSeasonStat" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "gamesPlayed" INTEGER,
    "passYards" INTEGER DEFAULT 0,
    "passTd" INTEGER DEFAULT 0,
    "passInt" INTEGER DEFAULT 0,
    "rushYards" INTEGER DEFAULT 0,
    "rushTd" INTEGER DEFAULT 0,
    "recYards" INTEGER DEFAULT 0,
    "recTd" INTEGER DEFAULT 0,
    "tackles" INTEGER DEFAULT 0,
    "sacks" DOUBLE PRECISION DEFAULT 0,
    "defInt" INTEGER DEFAULT 0,

    CONSTRAINT "PlayerSeasonStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamSeasonStat" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "confWins" INTEGER NOT NULL DEFAULT 0,
    "confLosses" INTEGER NOT NULL DEFAULT 0,
    "pointsFor" INTEGER NOT NULL DEFAULT 0,
    "pointsAgainst" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TeamSeasonStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingSnapshot" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "weekId" TEXT,
    "pollType" "PollType" NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceUploadId" TEXT,

    CONSTRAINT "RankingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingEntry" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "previousRank" INTEGER,
    "record" TEXT,
    "points" INTEGER,

    CONSTRAINT "RankingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConferenceStandingSnapshot" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "weekId" TEXT,
    "conferenceId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceUploadId" TEXT,

    CONSTRAINT "ConferenceStandingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandingEntry" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "confWins" INTEGER NOT NULL,
    "confLosses" INTEGER NOT NULL,
    "overallWins" INTEGER NOT NULL,
    "overallLosses" INTEGER NOT NULL,
    "rank" INTEGER,

    CONSTRAINT "StandingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Award" (
    "id" TEXT NOT NULL,
    "dynastyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AwardWinner" (
    "id" TEXT NOT NULL,
    "awardId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "playerId" TEXT,
    "isFinalist" BOOLEAN NOT NULL DEFAULT false,
    "rank" INTEGER,
    "sourceUploadId" TEXT,

    CONSTRAINT "AwardWinner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolRecord" (
    "id" TEXT NOT NULL,
    "dynastyId" TEXT NOT NULL,
    "teamId" TEXT,
    "scope" "RecordScope" NOT NULL DEFAULT 'SCHOOL',
    "category" TEXT NOT NULL,
    "holder" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "context" TEXT,
    "year" INTEGER,
    "sourceUploadId" TEXT,

    CONSTRAINT "SchoolRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricalRecord" (
    "id" TEXT NOT NULL,
    "dynastyId" TEXT NOT NULL,
    "kind" "HistoricalRecordKind" NOT NULL,
    "year" INTEGER,
    "teamName" TEXT,
    "detail" TEXT,
    "data" JSONB,

    CONSTRAINT "HistoricalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "dynastyId" TEXT NOT NULL,
    "type" "TimelineEventType" NOT NULL,
    "seasonYear" INTEGER,
    "weekNumber" INTEGER,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "data" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL,
    "dynastyId" TEXT NOT NULL,
    "type" "ArticleType" NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "headline" TEXT NOT NULL,
    "subhead" TEXT,
    "body" TEXT NOT NULL,
    "seasonYear" INTEGER,
    "weekNumber" INTEGER,
    "heroImageUrl" TEXT,
    "sourceData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "dynastyId" TEXT,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "screenType" "ScreenType" NOT NULL DEFAULT 'UNKNOWN',
    "status" "UploadStatus" NOT NULL DEFAULT 'UPLOADED',
    "detectionConfidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParseResult" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "screenType" "ScreenType" NOT NULL,
    "parserVersion" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParseResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractedEntity" (
    "id" TEXT NOT NULL,
    "parseResultId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "mergedIntoId" TEXT,

    CONSTRAINT "ExtractedEntity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dynasty_name_idx" ON "Dynasty"("name");

-- CreateIndex
CREATE INDEX "Season_dynastyId_idx" ON "Season"("dynastyId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_dynastyId_year_key" ON "Season"("dynastyId", "year");

-- CreateIndex
CREATE INDEX "Week_seasonId_idx" ON "Week"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "Week_seasonId_number_type_key" ON "Week"("seasonId", "number", "type");

-- CreateIndex
CREATE INDEX "Conference_dynastyId_idx" ON "Conference"("dynastyId");

-- CreateIndex
CREATE UNIQUE INDEX "Conference_dynastyId_name_key" ON "Conference"("dynastyId", "name");

-- CreateIndex
CREATE INDEX "Team_dynastyId_idx" ON "Team"("dynastyId");

-- CreateIndex
CREATE INDEX "Team_conferenceId_idx" ON "Team"("conferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_dynastyId_name_key" ON "Team"("dynastyId", "name");

-- CreateIndex
CREATE INDEX "Player_dynastyId_idx" ON "Player"("dynastyId");

-- CreateIndex
CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");

-- CreateIndex
CREATE INDEX "Player_name_idx" ON "Player"("name");

-- CreateIndex
CREATE INDEX "Coach_dynastyId_idx" ON "Coach"("dynastyId");

-- CreateIndex
CREATE INDEX "Coach_teamId_idx" ON "Coach"("teamId");

-- CreateIndex
CREATE INDEX "Game_seasonId_idx" ON "Game"("seasonId");

-- CreateIndex
CREATE INDEX "Game_weekId_idx" ON "Game"("weekId");

-- CreateIndex
CREATE INDEX "Game_homeTeamId_idx" ON "Game"("homeTeamId");

-- CreateIndex
CREATE INDEX "Game_awayTeamId_idx" ON "Game"("awayTeamId");

-- CreateIndex
CREATE INDEX "TeamGameStat_teamId_idx" ON "TeamGameStat"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamGameStat_gameId_teamId_key" ON "TeamGameStat"("gameId", "teamId");

-- CreateIndex
CREATE INDEX "PlayerGameStat_playerId_idx" ON "PlayerGameStat"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerGameStat_gameId_playerId_key" ON "PlayerGameStat"("gameId", "playerId");

-- CreateIndex
CREATE INDEX "PlayerSeasonStat_playerId_idx" ON "PlayerSeasonStat"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeasonStat_seasonId_playerId_key" ON "PlayerSeasonStat"("seasonId", "playerId");

-- CreateIndex
CREATE INDEX "TeamSeasonStat_teamId_idx" ON "TeamSeasonStat"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSeasonStat_seasonId_teamId_key" ON "TeamSeasonStat"("seasonId", "teamId");

-- CreateIndex
CREATE INDEX "RankingSnapshot_seasonId_idx" ON "RankingSnapshot"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "RankingSnapshot_seasonId_weekId_pollType_key" ON "RankingSnapshot"("seasonId", "weekId", "pollType");

-- CreateIndex
CREATE INDEX "RankingEntry_teamId_idx" ON "RankingEntry"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "RankingEntry_snapshotId_rank_key" ON "RankingEntry"("snapshotId", "rank");

-- CreateIndex
CREATE INDEX "ConferenceStandingSnapshot_seasonId_idx" ON "ConferenceStandingSnapshot"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "ConferenceStandingSnapshot_seasonId_weekId_conferenceId_key" ON "ConferenceStandingSnapshot"("seasonId", "weekId", "conferenceId");

-- CreateIndex
CREATE INDEX "StandingEntry_teamId_idx" ON "StandingEntry"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "StandingEntry_snapshotId_teamId_key" ON "StandingEntry"("snapshotId", "teamId");

-- CreateIndex
CREATE INDEX "Award_dynastyId_idx" ON "Award"("dynastyId");

-- CreateIndex
CREATE UNIQUE INDEX "Award_dynastyId_name_key" ON "Award"("dynastyId", "name");

-- CreateIndex
CREATE INDEX "AwardWinner_awardId_idx" ON "AwardWinner"("awardId");

-- CreateIndex
CREATE INDEX "AwardWinner_seasonId_idx" ON "AwardWinner"("seasonId");

-- CreateIndex
CREATE INDEX "SchoolRecord_dynastyId_idx" ON "SchoolRecord"("dynastyId");

-- CreateIndex
CREATE INDEX "SchoolRecord_teamId_idx" ON "SchoolRecord"("teamId");

-- CreateIndex
CREATE INDEX "HistoricalRecord_dynastyId_idx" ON "HistoricalRecord"("dynastyId");

-- CreateIndex
CREATE INDEX "HistoricalRecord_kind_idx" ON "HistoricalRecord"("kind");

-- CreateIndex
CREATE INDEX "TimelineEvent_dynastyId_idx" ON "TimelineEvent"("dynastyId");

-- CreateIndex
CREATE INDEX "TimelineEvent_type_idx" ON "TimelineEvent"("type");

-- CreateIndex
CREATE INDEX "NewsArticle_dynastyId_idx" ON "NewsArticle"("dynastyId");

-- CreateIndex
CREATE INDEX "NewsArticle_type_idx" ON "NewsArticle"("type");

-- CreateIndex
CREATE INDEX "NewsArticle_status_idx" ON "NewsArticle"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Upload_contentHash_key" ON "Upload"("contentHash");

-- CreateIndex
CREATE INDEX "Upload_dynastyId_idx" ON "Upload"("dynastyId");

-- CreateIndex
CREATE INDEX "Upload_status_idx" ON "Upload"("status");

-- CreateIndex
CREATE INDEX "Upload_screenType_idx" ON "Upload"("screenType");

-- CreateIndex
CREATE INDEX "ParseResult_uploadId_idx" ON "ParseResult"("uploadId");

-- CreateIndex
CREATE INDEX "ExtractedEntity_parseResultId_idx" ON "ExtractedEntity"("parseResultId");

-- CreateIndex
CREATE INDEX "ExtractedEntity_entityType_idx" ON "ExtractedEntity"("entityType");

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_dynastyId_fkey" FOREIGN KEY ("dynastyId") REFERENCES "Dynasty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Week" ADD CONSTRAINT "Week_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conference" ADD CONSTRAINT "Conference_dynastyId_fkey" FOREIGN KEY ("dynastyId") REFERENCES "Dynasty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_dynastyId_fkey" FOREIGN KEY ("dynastyId") REFERENCES "Dynasty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "Conference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_sourceUploadId_fkey" FOREIGN KEY ("sourceUploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_dynastyId_fkey" FOREIGN KEY ("dynastyId") REFERENCES "Dynasty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_sourceUploadId_fkey" FOREIGN KEY ("sourceUploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_dynastyId_fkey" FOREIGN KEY ("dynastyId") REFERENCES "Dynasty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_sourceUploadId_fkey" FOREIGN KEY ("sourceUploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_sourceUploadId_fkey" FOREIGN KEY ("sourceUploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGameStat" ADD CONSTRAINT "TeamGameStat_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGameStat" ADD CONSTRAINT "TeamGameStat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGameStat" ADD CONSTRAINT "PlayerGameStat_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGameStat" ADD CONSTRAINT "PlayerGameStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGameStat" ADD CONSTRAINT "PlayerGameStat_sourceUploadId_fkey" FOREIGN KEY ("sourceUploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonStat" ADD CONSTRAINT "PlayerSeasonStat_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonStat" ADD CONSTRAINT "PlayerSeasonStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeasonStat" ADD CONSTRAINT "TeamSeasonStat_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeasonStat" ADD CONSTRAINT "TeamSeasonStat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingSnapshot" ADD CONSTRAINT "RankingSnapshot_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingSnapshot" ADD CONSTRAINT "RankingSnapshot_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingSnapshot" ADD CONSTRAINT "RankingSnapshot_sourceUploadId_fkey" FOREIGN KEY ("sourceUploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingEntry" ADD CONSTRAINT "RankingEntry_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "RankingSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingEntry" ADD CONSTRAINT "RankingEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConferenceStandingSnapshot" ADD CONSTRAINT "ConferenceStandingSnapshot_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConferenceStandingSnapshot" ADD CONSTRAINT "ConferenceStandingSnapshot_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConferenceStandingSnapshot" ADD CONSTRAINT "ConferenceStandingSnapshot_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "Conference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConferenceStandingSnapshot" ADD CONSTRAINT "ConferenceStandingSnapshot_sourceUploadId_fkey" FOREIGN KEY ("sourceUploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandingEntry" ADD CONSTRAINT "StandingEntry_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "ConferenceStandingSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandingEntry" ADD CONSTRAINT "StandingEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Award" ADD CONSTRAINT "Award_dynastyId_fkey" FOREIGN KEY ("dynastyId") REFERENCES "Dynasty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardWinner" ADD CONSTRAINT "AwardWinner_awardId_fkey" FOREIGN KEY ("awardId") REFERENCES "Award"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardWinner" ADD CONSTRAINT "AwardWinner_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardWinner" ADD CONSTRAINT "AwardWinner_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardWinner" ADD CONSTRAINT "AwardWinner_sourceUploadId_fkey" FOREIGN KEY ("sourceUploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolRecord" ADD CONSTRAINT "SchoolRecord_dynastyId_fkey" FOREIGN KEY ("dynastyId") REFERENCES "Dynasty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolRecord" ADD CONSTRAINT "SchoolRecord_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolRecord" ADD CONSTRAINT "SchoolRecord_sourceUploadId_fkey" FOREIGN KEY ("sourceUploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricalRecord" ADD CONSTRAINT "HistoricalRecord_dynastyId_fkey" FOREIGN KEY ("dynastyId") REFERENCES "Dynasty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_dynastyId_fkey" FOREIGN KEY ("dynastyId") REFERENCES "Dynasty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsArticle" ADD CONSTRAINT "NewsArticle_dynastyId_fkey" FOREIGN KEY ("dynastyId") REFERENCES "Dynasty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_dynastyId_fkey" FOREIGN KEY ("dynastyId") REFERENCES "Dynasty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParseResult" ADD CONSTRAINT "ParseResult_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedEntity" ADD CONSTRAINT "ExtractedEntity_parseResultId_fkey" FOREIGN KEY ("parseResultId") REFERENCES "ParseResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

