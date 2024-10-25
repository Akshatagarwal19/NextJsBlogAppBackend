import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/middlewares/verifyJWT';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        try {
            await verifyJWT(req);
        } catch (error) {
            return NextResponse.json({ error: 'Unauthorized: Invalid or missing token' }, { status: 401 });
        }
        const users = await prisma.user.findMany();
        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
