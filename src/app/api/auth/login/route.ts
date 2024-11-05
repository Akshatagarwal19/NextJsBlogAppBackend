import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';


function setCorsHeaders(res: NextResponse) {
    res.headers.set('Access-Control-Allow-Origin', 'http://localhost:3001'); 
    res.headers.set('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE'); 
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
        const { email, password } = await req.json(); 

        
        const user = await prisma.user.findUnique({
            where: { email },
        });

        
        if (!user) {
            const res = NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
            setCorsHeaders(res); 
            return res;
        }

        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            const res = NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
            setCorsHeaders(res); 
            return res;
        }

        
        const token = jwt.sign({ userId: user.id, role: user.role },JWT_SECRET,{ expiresIn: '1h' });
        console.log('Generated Token:', token);

        
        const res = NextResponse.json({
            message: 'Login successful',
            token,
        });
        setCorsHeaders(res); 
        return res;

    } catch (error) {
        console.error('Error during login:', error);
        const res = NextResponse.json({ error: 'An error occurred during login' }, { status: 500 });
        setCorsHeaders(res); 
        return res;
    }
}
