import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();


function setCorsHeaders(res: NextResponse) {
    res.headers.set('Access-Control-Allow-Origin', '*'); 
    res.headers.set('Access-Control-Allow-Methods', 'OPTIONS, POST'); 
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization'); 
    res.headers.set('Access-Control-Allow-Credentials', 'true'); 
}


export async function OPTIONS() {
    const res = new NextResponse(null, { status: 200 });
    setCorsHeaders(res); 
    return res;
}


export async function POST(req: NextRequest) {
    try {
        const { name, email, password, profilePhoto } = await req.json();

        
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            const res = NextResponse.json({ error: 'User already exists' }, { status: 400 });
            setCorsHeaders(res); 
            return res;
        }

        
        const hashedPassword = await bcrypt.hash(password, 10);

        
        const userProfilePhoto = profilePhoto || null;

        
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                profilePhoto: userProfilePhoto,
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userWithoutPassword } = user;

        
        const res = NextResponse.json(userWithoutPassword, { status: 201 });
        setCorsHeaders(res); 
        return res;

    } catch (error) {
        console.error('Error during login:', error);
        const res = NextResponse.json({ error: 'User creation failed' }, { status: 500 });
        setCorsHeaders(res); 
        return res;
    }
}
