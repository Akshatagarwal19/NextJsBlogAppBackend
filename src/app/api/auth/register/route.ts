import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// Manually handle CORS headers
function setCorsHeaders(res: NextResponse) {
    res.headers.set('Access-Control-Allow-Origin', 'http://localhost:3001'); // Allow frontend origin
    res.headers.set('Access-Control-Allow-Methods', 'OPTIONS, POST'); // Allow methods
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allow headers
    res.headers.set('Access-Control-Allow-Credentials', 'true'); // Allow credentials (cookies, etc.)
}

// Handle OPTIONS requests (preflight CORS requests)
export async function OPTIONS() {
    const res = new NextResponse(null, { status: 200 });
    setCorsHeaders(res); // Set CORS headers for preflight
    return res;
}

// Handle POST requests (registration logic)
export async function POST(req: NextRequest) {
    try {
        const { name, email, password, profilePhoto } = await req.json();

        // Check if the user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            const res = NextResponse.json({ error: 'User already exists' }, { status: 400 });
            setCorsHeaders(res); // Add CORS headers to error response
            return res;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Handle optional profile photo
        const userProfilePhoto = profilePhoto || null;

        // Create the new user
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

        // Prepare the response
        const res = NextResponse.json(userWithoutPassword, { status: 201 });
        setCorsHeaders(res); // Add CORS headers to success response
        return res;

    } catch (error) {
        console.error('Error during login:', error);
        const res = NextResponse.json({ error: 'User creation failed' }, { status: 500 });
        setCorsHeaders(res); // Add CORS headers to error response
        return res;
    }
}
