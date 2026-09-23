import { prisma } from "../lib/db";
import { ensureDatabase } from "../lib/bootstrap";

async function main() {
  await ensureDatabase();
  const count = await prisma.user.count();
  console.log(`Balance database ready (${count} user${count === 1 ? "" : "s"}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
