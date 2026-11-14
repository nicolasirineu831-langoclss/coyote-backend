import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

// Cria o proprietário a partir de ADMIN_EMAIL e ADMIN_PASSWORD ao iniciar o servidor,
// sem depender do Shell do Render. Se o usuário já existir, não altera a senha.
export async function ensureOwner() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('Bootstrap: ADMIN_EMAIL/ADMIN_PASSWORD não definidos');
    return;
  }
  if (password.length < 12) {
    console.log('Bootstrap: ADMIN_PASSWORD precisa ter pelo menos 12 caracteres');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== 'OWNER' || !existing.active) {
      await prisma.user.update({ where: { email }, data: { role: 'OWNER', active: true } });
      console.log('Bootstrap: usuário existente promovido a proprietário:', email);
    } else {
      console.log('Bootstrap: proprietário já existe:', email);
    }
    return;
  }

  await prisma.user.create({
    data: {
      email,
      name: 'Proprietário',
      passwordHash: await bcrypt.hash(password, 12),
      role: 'OWNER',
    },
  });
  console.log('Bootstrap: proprietário criado:', email);
}
