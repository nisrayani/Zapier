/*
  Warnings:

  - Changed the type of `status` on the `ZapRun` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "ZapRun" DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL;

-- CreateTable
CREATE TABLE "ZapOutbox" (
    "id" SERIAL NOT NULL,
    "zapRunId" INTEGER NOT NULL,
    "status" "Status" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZapOutbox_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ZapOutbox" ADD CONSTRAINT "ZapOutbox_zapRunId_fkey" FOREIGN KEY ("zapRunId") REFERENCES "ZapRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
