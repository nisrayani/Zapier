/*
  Warnings:

  - A unique constraint covering the columns `[zapId]` on the table `Trigger` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Trigger_zapId_key" ON "Trigger"("zapId");
