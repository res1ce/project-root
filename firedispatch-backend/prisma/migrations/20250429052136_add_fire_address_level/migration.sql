-- AlterTable
ALTER TABLE "fire_incidents" ADD COLUMN     "address" TEXT;

-- CreateTable
CREATE TABLE "fire_address_levels" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fireLevelId" INTEGER NOT NULL,

    CONSTRAINT "fire_address_levels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fire_address_levels_address_key" ON "fire_address_levels"("address");

-- AddForeignKey
ALTER TABLE "fire_address_levels" ADD CONSTRAINT "fire_address_levels_fireLevelId_fkey" FOREIGN KEY ("fireLevelId") REFERENCES "fire_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
