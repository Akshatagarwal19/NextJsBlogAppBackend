import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Middleware to verify JWT for general routes
export async function verifyJWT(req: NextRequest) {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Decoded JWT:',decoded);
        (req as any).user = decoded;
        return NextResponse.next();
    } catch (err) {
        return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
}

// Main middleware function
export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    // Skip middleware for login and register routes
    if (path === '/api/auth/login' || path === '/api/auth/register') {
        return NextResponse.next();
    }

    return verifyJWT(req);
}

// Configuration for middleware matcher
export const config = {
    matcher: ['/api/:path*'], // Apply to all /api routes except excluded ones
};

// Admin-specific verification
export async function verifyAdmin(req: NextRequest) {
    const user = (req as any).user;

    if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    return NextResponse.next();
}

// Middleware for admin routes
export async function adminMiddleware(req: NextRequest) {
    await verifyJWT(req); // First, verify JWT
    return verifyAdmin(req); // Then check if the user is an admin
}

// Configuration for admin middleware matcher
export const adminConfig = {
    matcher: ['/api/admin/:path*'], // Apply only to admin routes
};
