/**
 * One-time script to seed Firestore with crop schedules and cost catalog.
 * Run: npx ts-node scripts/seed-firestore.ts (after configuring Firebase Admin)
 */
import { CROP_SCHEDULES, COST_CATALOG } from '../src/data/crop-schedules';

console.log('Seed data ready:');
console.log(`- ${CROP_SCHEDULES.length} crop schedules`);
console.log(`- ${COST_CATALOG.length} cost catalog items`);
console.log('Deploy with Firebase Admin SDK or paste into Firestore console.');

CROP_SCHEDULES.forEach((schedule) => {
  console.log(`  cropSchedules/${schedule.id}`);
});

COST_CATALOG.forEach((item) => {
  console.log(`  costCatalog/${item.id}`);
});
