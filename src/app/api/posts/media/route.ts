import { NextRequest, NextResponse } from 'next/server';
import Post from '@/models/Post';
import { connectToDatabase } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { verifyJWT } from '@/middlewares/verifyJWT';

export async function GET(req: NextRequest) {
    await connectToDatabase(); // Ensure the database is connected

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    try {
        const post = await Post.findById(id);
        if (!post || !post.mediaPath) {
            return NextResponse.json({ error: 'Media not found for this post', id }, { status: 404 });
        }

        const mediaPath = post.mediaPath;
        const filePath = path.resolve(mediaPath);  // This is for reading the file on the server
        const stat = fs.statSync(filePath);
        const ext = path.extname(mediaPath).toLowerCase();
        let contentType = 'application/octet-stream'; // Default to binary stream

        // Set content type based on file extension
        if (ext === '.mp4') contentType = 'video/mp4';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.mp3') contentType = 'audio/mpeg';

        const range = req.headers.get('range');
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;

            const contentLength = (end - start) + 1;
            const readStream = fs.createReadStream(filePath, { start, end });

            const stream = new ReadableStream({
                start(controller) {
                    readStream.on('data', (chunk) => {
                        if (controller.desiredSize !== null && controller.desiredSize > 0) {
                            controller.enqueue(chunk);
                        } else {
                            readStream.pause();
                        }
                    });
                    readStream.on('end', () => {
                        controller.close();
                    });
                    readStream.on('error', (err) => {
                        console.error('Stream Error: ', err)
                        controller.error(err);
                    });
                    readStream.on('pause', () => {
                        // Optionally handle pause event
                    });
                    
                    readStream.on('resume', () => {
                        // If there is space in the internal queue, resume the stream
                        if (controller.desiredSize !== null && controller.desiredSize > 0) {
                            readStream.resume();
                        }
                    });
                },
            });

            return new Response(stream, {
                headers: {
                    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': contentLength.toString(),
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*', // Adjust this according to your needs
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
                status: 206, // Partial Content
            });
        } else {
            const readStream = fs.createReadStream(filePath);
            const stream = new ReadableStream({
                start(controller) {
                    readStream.on('data', (chunk) => {
                        controller.enqueue(chunk);
                    });
                    readStream.on('end', () => {
                        controller.close();
                    });
                    readStream.on('error', (err) => {
                        controller.error(err);
                    });
                },
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Length': stat.size.toString(),
                    'Accept-Ranges': 'bytes',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
            });
        }
    } catch (error) {
        console.error('Error streaming media:', error);
        return NextResponse.json({ error: 'Failed to stream media' }, { status: 500 });
    }
}
