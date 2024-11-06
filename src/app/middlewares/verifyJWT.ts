import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

interface AuthenticateRequest extends NextRequest {
    user?: {
        userId: string;
        role: string;
    };
}
export async function verifyJWT(req: AuthenticateRequest) {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Unauthorized: No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthenticateRequest['user'];
        req.user = decoded; 
        return NextResponse.next();
    } catch (err) {
        console.error('Error : Unauthorized: Invalid token', err);
        return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
}


export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;

    
    if (path === '/api/auth/login' || path === '/api/auth/register') {
        return NextResponse.next();
    }

    return verifyJWT(req);
}


export const config = {
    matcher: ['/api/:path*'], 
};


export async function verifyAdmin(req: AuthenticateRequest) {
    const user = req.user;

    if (user?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    return NextResponse.next();
}


export async function adminMiddleware(req: NextRequest) {
    await verifyJWT(req); 
    return verifyAdmin(req); 
}


export const adminConfig = {
    matcher: ['/api/admin/:path*'], 
};
