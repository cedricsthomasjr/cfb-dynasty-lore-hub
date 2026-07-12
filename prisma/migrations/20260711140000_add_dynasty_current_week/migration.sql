-- Dynasty's current position in time: a nullable pointer to the Week it is on.
ALTER TABLE "Dynasty" ADD COLUMN "currentWeekId" TEXT;

ALTER TABLE "Dynasty" ADD CONSTRAINT "Dynasty_currentWeekId_fkey"
  FOREIGN KEY ("currentWeekId") REFERENCES "Week"("id") ON DELETE SET NULL ON UPDATE CASCADE;
