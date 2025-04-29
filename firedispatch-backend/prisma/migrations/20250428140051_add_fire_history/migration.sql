-- CreateTable
CREATE TABLE "fire_history" (
    "id" SERIAL NOT NULL,
    "fireIncidentId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fire_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fire_history" ADD CONSTRAINT "fire_history_fireIncidentId_fkey" FOREIGN KEY ("fireIncidentId") REFERENCES "fire_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
