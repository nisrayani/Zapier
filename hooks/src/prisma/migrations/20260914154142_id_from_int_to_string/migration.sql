/*
  Warnings:

  - The primary key for the `Action` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ActionType` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Trigger` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `TriggerType` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Zap` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ZapOutbox` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ZapRun` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Action" DROP CONSTRAINT "Action_typeId_fkey";

-- DropForeignKey
ALTER TABLE "Action" DROP CONSTRAINT "Action_zapId_fkey";

-- DropForeignKey
ALTER TABLE "Trigger" DROP CONSTRAINT "Trigger_typeId_fkey";

-- DropForeignKey
ALTER TABLE "Trigger" DROP CONSTRAINT "Trigger_zapId_fkey";

-- DropForeignKey
ALTER TABLE "Zap" DROP CONSTRAINT "Zap_userId_fkey";

-- DropForeignKey
ALTER TABLE "ZapOutbox" DROP CONSTRAINT "ZapOutbox_zapRunId_fkey";

-- DropForeignKey
ALTER TABLE "ZapRun" DROP CONSTRAINT "ZapRun_zapId_fkey";

-- AlterTable
ALTER TABLE "Action" DROP CONSTRAINT "Action_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "typeId" SET DATA TYPE TEXT,
ALTER COLUMN "zapId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Action_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Action_id_seq";

-- AlterTable
ALTER TABLE "ActionType" DROP CONSTRAINT "ActionType_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "ActionType_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ActionType_id_seq";

-- AlterTable
ALTER TABLE "Trigger" DROP CONSTRAINT "Trigger_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "typeId" SET DATA TYPE TEXT,
ALTER COLUMN "zapId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Trigger_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Trigger_id_seq";

-- AlterTable
ALTER TABLE "TriggerType" DROP CONSTRAINT "TriggerType_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "TriggerType_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "TriggerType_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AlterTable
ALTER TABLE "Zap" DROP CONSTRAINT "Zap_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Zap_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Zap_id_seq";

-- AlterTable
ALTER TABLE "ZapOutbox" DROP CONSTRAINT "ZapOutbox_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "zapRunId" SET DATA TYPE TEXT,
ADD CONSTRAINT "ZapOutbox_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ZapOutbox_id_seq";

-- AlterTable
ALTER TABLE "ZapRun" DROP CONSTRAINT "ZapRun_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "zapId" SET DATA TYPE TEXT,
ADD CONSTRAINT "ZapRun_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ZapRun_id_seq";

-- AddForeignKey
ALTER TABLE "Zap" ADD CONSTRAINT "Zap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trigger" ADD CONSTRAINT "Trigger_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "TriggerType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trigger" ADD CONSTRAINT "Trigger_zapId_fkey" FOREIGN KEY ("zapId") REFERENCES "Zap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ActionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_zapId_fkey" FOREIGN KEY ("zapId") REFERENCES "Zap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZapRun" ADD CONSTRAINT "ZapRun_zapId_fkey" FOREIGN KEY ("zapId") REFERENCES "Zap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZapOutbox" ADD CONSTRAINT "ZapOutbox_zapRunId_fkey" FOREIGN KEY ("zapRunId") REFERENCES "ZapRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
