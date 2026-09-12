-- AlterTable
ALTER TABLE "ZapOutbox" ALTER COLUMN "status" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ZapRun" ALTER COLUMN "status" DROP NOT NULL;
