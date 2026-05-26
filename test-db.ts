import { prisma } from './src/lib/prisma';
async function main() {
  const users = await prisma.user.findMany();
  console.log("All users", users.map(u => ({ email: u.email, role: u.role })));
}
main();

