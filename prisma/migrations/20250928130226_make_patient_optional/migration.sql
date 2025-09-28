-- DropForeignKey
ALTER TABLE "public"."Call" DROP CONSTRAINT "Call_patientId_fkey";

-- AlterTable
ALTER TABLE "public"."Call" ALTER COLUMN "patientId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Call" ADD CONSTRAINT "Call_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
