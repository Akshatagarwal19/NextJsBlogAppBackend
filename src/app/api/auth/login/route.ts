import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Manually handle CORS headers
function setCorsHeaders(res: NextResponse) {
    res.headers.set('Access-Control-Allow-Origin', 'http://localhost:3001'); // Allow frontend origin
    res.headers.set('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE'); // Allow methods
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allow headers
    res.headers.set('Access-Control-Allow-Credentials', 'true'); // Allow credentials (cookies, etc.)
}

// Handle OPTIONS requests (preflight CORS requests)
export async function OPTIONS(req: NextRequest) {
    const res = new NextResponse(null, { status: 200 });
    setCorsHeaders(res); // Set CORS headers for preflight
    return res;
}

// Handle POST requests (login logic)
export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json(); // Extract email and password from request

        // Find the user in the database
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // If user not found, return error
        if (!user) {
            const res = NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
            setCorsHeaders(res); // Add CORS headers to error response
            return res;
        }

        // Check if password is valid
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            const res = NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
            setCorsHeaders(res); // Add CORS headers to error response
            return res;
        }

        // Create JWT token
        const token = jwt.sign({ userId: user.id, role: user.role },JWT_SECRET,{ expiresIn: '1h' });
        console.log('Generated Token:', token);

        // Prepare response
        const res = NextResponse.json({
            message: 'Login successful',
            token,
        });
        setCorsHeaders(res); // Add CORS headers to success response
        return res;

    } catch (error) {
        const res = NextResponse.json({ error: 'An error occurred during login' }, { status: 500 });
        setCorsHeaders(res); // Add CORS headers to error response
        return res;
    }
}
