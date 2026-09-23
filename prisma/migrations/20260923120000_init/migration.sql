-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "trackingYear" INTEGER NOT NULL,
    "calendarId" TEXT NOT NULL DEFAULT '',
    "googleConnected" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goalPercent" DOUBLE PRECISION NOT NULL,
    "color" TEXT NOT NULL,
    "includes" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "CategoryGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subcategoryId" TEXT,
    "secondarySubcategoryId" TEXT,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "hours" DOUBLE PRECISION NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualitativeDay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "motivation" INTEGER,
    "sleepScore" INTEGER,
    "workScore" INTEGER,
    "lifeScore" INTEGER,
    "healthScore" INTEGER,

    CONSTRAINT "QualitativeDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL,

    CONSTRAINT "HabitLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportError" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventTitle" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "functionName" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ImportError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryGroup_userId_slug_key" ON "CategoryGroup"("userId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_userId_key_key" ON "Subcategory"("userId", "key");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_date_idx" ON "TimeEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_externalId_idx" ON "TimeEntry"("userId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "QualitativeDay_userId_date_key" ON "QualitativeDay"("userId", "date");

-- CreateIndex
CREATE INDEX "HabitLog_userId_date_idx" ON "HabitLog"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "HabitLog_habitId_date_key" ON "HabitLog"("habitId", "date");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryGroup" ADD CONSTRAINT "CategoryGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CategoryGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_secondarySubcategoryId_fkey" FOREIGN KEY ("secondarySubcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualitativeDay" ADD CONSTRAINT "QualitativeDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitLog" ADD CONSTRAINT "HabitLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitLog" ADD CONSTRAINT "HabitLog_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportError" ADD CONSTRAINT "ImportError_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

