import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'thietsshp@gmail.com';
  const newPassword = 'password123';
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });
  
  console.log('Password reset successfully for:', user.email);
  console.log('New password is:', newPassword);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
