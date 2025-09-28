/*
  Warnings:

  - You are about to drop the column `patientId` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the `CallMessage` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[plivoCallUUID]` on the table `Call` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."Call" DROP CONSTRAINT "Call_patientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CallMessage" DROP CONSTRAINT "CallMessage_callId_fkey";

-- DropIndex
DROP INDEX "public"."Patient_phone_key";

-- AlterTable
ALTER TABLE "public"."Call" DROP COLUMN "patientId",
ADD COLUMN     "aiReply" TEXT,
ADD COLUMN     "from" TEXT,
ADD COLUMN     "plivoCallUUID" TEXT,
ADD COLUMN     "to" TEXT,
ALTER COLUMN "status" SET DEFAULT 'initiated';

-- AlterTable
ALTER TABLE "public"."Patient" DROP COLUMN "createdAt",
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."CallMessage";

-- CreateTable
CREATE TABLE "public"."_CallToPatient" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CallToPatient_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CallToPatient_B_index" ON "public"."_CallToPatient"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Call_plivoCallUUID_key" ON "public"."Call"("plivoCallUUID");

-- AddForeignKey
ALTER TABLE "public"."_CallToPatient" ADD CONSTRAINT "_CallToPatient_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CallToPatient" ADD CONSTRAINT "_CallToPatient_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
