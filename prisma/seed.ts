import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.upsert({
    where: { id: 'seed-event-1' },
    update: {},
    create: {
      id: 'seed-event-1',
      name: 'Hospoda u Vavřince',
      date: new Date('2026-04-18'),
      startTimeMinutes: 780,
      endTimeMinutes: 1260,
      slotMinutes: 15,
      maxPeopleOnPremises: 100,
      avgStayMinutes: 90,
      takeawayPeopleEquivalent: 0,
      burgerTrackingEnabled: true,
    },
  });

  console.log('Event created:', event.name, event.date);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
