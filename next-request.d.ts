// next-request.d.ts
import 'next/server';

declare module 'next/server' {
    interface NextRequest {
        file?: {
            path: string; // Adjust based on your needs
        };
    }
}
