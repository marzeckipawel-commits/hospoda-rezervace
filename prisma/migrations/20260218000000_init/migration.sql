-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReservationType" AS ENUM ('DINE_IN', 'TAKEAWAY');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTimeMinutes" INTEGER NOT NULL,
    "endTimeMinutes" INTEGER NOT NULL,
    "slotMinutes" INTEGER NOT NULL,
    "maxPeopleOnPremises" INTEGER NOT NULL,
    "avgStayMinutes" INTEGER NOT NULL,
    "takeawayPeopleEquivalent" INTEGER NOT NULL DEFAULT 0,
    "burgerTrackingEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "priceCzk" INTEGER NOT NULL,
    "countsTowardBurger" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "type" "ReservationType" NOT NULL,
    "slotStartUtc" TIMESTAMP(3) NOT NULL,
    "slotEndUtc" TIMESTAMP(3) NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "partySize" INTEGER,
    "note" TEXT,
    "hasPreorder" BOOLEAN NOT NULL DEFAULT false,
    "publicCode" TEXT NOT NULL,
    "manageToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationItem" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ReservationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_publicCode_key" ON "Reservation"("publicCode");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_manageToken_key" ON "Reservation"("manageToken");

-- CreateIndex
CREATE INDEX "MenuItem_eventId_idx" ON "MenuItem"("eventId");

-- CreateIndex
CREATE INDEX "Reservation_eventId_idx" ON "Reservation"("eventId");

-- CreateIndex
CREATE INDEX "Reservation_manageToken_idx" ON "Reservation"("manageToken");

-- CreateIndex
CREATE INDEX "Reservation_slotStartUtc_slotEndUtc_idx" ON "Reservation"("slotStartUtc", "slotEndUtc");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationItem_reservationId_menuItemId_key" ON "ReservationItem"("reservationId", "menuItemId");

-- CreateIndex
CREATE INDEX "ReservationItem_reservationId_idx" ON "ReservationItem"("reservationId");

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationItem" ADD CONSTRAINT "ReservationItem_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationItem" ADD CONSTRAINT "ReservationItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
