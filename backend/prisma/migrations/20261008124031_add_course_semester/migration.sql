-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "semester" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "courses_semester_idx" ON "courses"("semester");

-- Backfill existing course semester values
UPDATE "courses" SET "semester" = 1 WHERE "code" = 'CSE 1101';
UPDATE "courses" SET "semester" = 1 WHERE "code" = 'EEE 1101';
UPDATE "courses" SET "semester" = 4 WHERE "code" = 'CSE 2115';
UPDATE "courses" SET "semester" = 5 WHERE "code" = 'EEE 2201';
UPDATE "courses" SET "semester" = 7 WHERE "code" = 'CSE 3101';
UPDATE "courses" SET "semester" = 8 WHERE "code" = 'CSE 3201';
