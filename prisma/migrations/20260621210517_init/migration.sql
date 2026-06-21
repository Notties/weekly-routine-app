-- CreateTable
CREATE TABLE "Profile" (
    "userId" UUID NOT NULL,
    "goal" TEXT,
    "heightCm" INTEGER,
    "age" INTEGER,
    "workoutWindow" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Swap" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,

    CONSTRAINT "Swap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckedItem" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "CheckedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayLog" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "workoutDone" BOOLEAN NOT NULL DEFAULT false,
    "waterMl" INTEGER NOT NULL DEFAULT 0,
    "extraKcal" INTEGER,
    "extraProtein" INTEGER,

    CONSTRAINT "DayLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealCheck" (
    "id" TEXT NOT NULL,
    "dayLogId" TEXT NOT NULL,
    "mealIndex" INTEGER NOT NULL,

    CONSTRAINT "MealCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiftSet" (
    "id" TEXT NOT NULL,
    "dayLogId" TEXT NOT NULL,
    "exercise" TEXT NOT NULL,
    "setIndex" INTEGER NOT NULL,
    "kg" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,

    CONSTRAINT "LiftSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Swap_userId_idx" ON "Swap"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Swap_userId_key_key" ON "Swap"("userId", "key");

-- CreateIndex
CREATE INDEX "CheckedItem_userId_idx" ON "CheckedItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckedItem_userId_key_key" ON "CheckedItem"("userId", "key");

-- CreateIndex
CREATE INDEX "DayLog_userId_idx" ON "DayLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DayLog_userId_date_key" ON "DayLog"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MealCheck_dayLogId_mealIndex_key" ON "MealCheck"("dayLogId", "mealIndex");

-- CreateIndex
CREATE INDEX "LiftSet_exercise_idx" ON "LiftSet"("exercise");

-- CreateIndex
CREATE UNIQUE INDEX "LiftSet_dayLogId_exercise_setIndex_key" ON "LiftSet"("dayLogId", "exercise", "setIndex");

-- AddForeignKey
ALTER TABLE "MealCheck" ADD CONSTRAINT "MealCheck_dayLogId_fkey" FOREIGN KEY ("dayLogId") REFERENCES "DayLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiftSet" ADD CONSTRAINT "LiftSet_dayLogId_fkey" FOREIGN KEY ("dayLogId") REFERENCES "DayLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
