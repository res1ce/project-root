-- CreateTable
CREATE TABLE "system_settings" (
    "id" SERIAL NOT NULL,
    "defaultCityName" TEXT NOT NULL DEFAULT 'Чита',
    "defaultLatitude" DOUBLE PRECISION NOT NULL DEFAULT 52.0515,
    "defaultLongitude" DOUBLE PRECISION NOT NULL DEFAULT 113.4712,
    "defaultZoom" INTEGER NOT NULL DEFAULT 12,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" INTEGER,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
