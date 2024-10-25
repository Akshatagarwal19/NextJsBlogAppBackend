import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/middlewares/verifyJWT';

const prisma = new PrismaClient();

// Handling Prisma disconnection for better connection management in long-running processes
async function prismaDisconnect() {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error disconnecting Prisma:', error);
  }
}

export const dynamic = 'auto';
export const revalidate = 0;
export const fetchCache = 'auto';

export async function GET(req: NextRequest) {
  try {
    await verifyJWT(req);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing token' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: String(id) } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  try {
    await verifyJWT(req);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing token' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { id: String(id) } });
  if (!existingUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { name, email, role } = await req.json(); // Assuming you are sending JSON data

  const updateData = {
    name: name ? String(name) : existingUser.name,
    email: email ? String(email) : existingUser.email,
    role: role ? String(role) : existingUser.role,
  };

  try {
    const updatedUser = await prisma.user.update({
      where: { id: String(id) },
      data: updateData,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  } finally {
    await prismaDisconnect(); // Ensures Prisma disconnection after handling the request
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await verifyJWT(req);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing token' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id: String(id) } });
    return NextResponse.json({ message: 'User deleted successfully' }, { status: 204 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally {
    await prismaDisconnect();
  }
}
