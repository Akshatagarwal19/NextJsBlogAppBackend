import { NextRequest, NextResponse } from 'next/server';
import Post from '@/models/Post';
import { uploadHandler } from '@/app/middlewares/uploadMiddleware';
import { connectToDatabase } from '@/lib/db';
import { verifyJWT } from '@/middlewares/verifyJWT';

interface PostFields {
    userId: string;
    title: string;
    description: string;
    mediaPath?: string;
    mediaType?: string;
}

interface UploadedFiles {
    mediaPath?: {
        filepath: string;
        mimetype: string;
    }[];
}

// CORS setup
const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:3001', // Allow all origins, replace with a specific domain if needed
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: corsHeaders,
    });
}

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    try {
        await verifyJWT(req);
    } catch (error) {
        return NextResponse.json({ error: 'Unauthorized: Invalid or missing token' }, { status: 401, headers: corsHeaders });
    }
    await connectToDatabase();

    try {
        const userId = (req as any).user?.userId;

        const { fields, files } = await uploadHandler(req) as { fields: PostFields, files: UploadedFiles };
        console.log("Fields from upload:", fields);
        console.log("Files from upload:", files);

        const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
        const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;

        if (!title || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders });
        }

        const mediaFiles = files.mediaPath;
        const mediaPath = mediaFiles && mediaFiles.length > 0 ? mediaFiles[0].filepath : null;
        const mediaType = mediaFiles && mediaFiles.length > 0 ? mediaFiles[0].mimetype : null;

        const postData = {
            userId,
            title,
            description,
            mediaPath,
            mediaType: mediaType ? mediaType.split('/')[0] : null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const newPost = await Post.create(postData);
        console.log('New Post created:', newPost);
        return NextResponse.json({ message: 'Post created successfully', post: newPost }, { status: 201, headers: {...corsHeaders,'Content-Type': 'application/json'}});
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500, headers: corsHeaders });
    }
}

export async function GET(req: NextRequest) {
    try {
        await verifyJWT(req);
    } catch (error) {
        return NextResponse.json({ error: 'Unauthorized: Invalid or missing token' }, { status: 401, headers: corsHeaders });
    }
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    try {
        if (id) {
            const post = await Post.findById(id);
            if (!post) {
                return NextResponse.json({ error: 'Post not found' }, { status: 404, headers: corsHeaders });
            }
            return NextResponse.json(post, { headers: corsHeaders });
        }

        const posts = await Post.find({});
        return NextResponse.json(posts, { headers: corsHeaders });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500, headers: corsHeaders });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await verifyJWT(req);
        console.log('User after JWT verification:',(req as any).user);
    } catch (error) {
        console.error('JWT Verification failed:', error);
        return NextResponse.json(
            { error: 'Unauthorized: Invalid or missing token' }, 
            { status: 401, headers: corsHeaders }
        );
    }
    console.log('JWT verified, proceeding with Update');
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('id');

    if (!postId) {
        return NextResponse.json({ error: 'Post ID is required' }, { status: 400, headers: corsHeaders });
    }

    const { userId, role } = (req as any).user;

    try {
        const post = await Post.findById(postId);
        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404, headers: corsHeaders });
        }

        if (post.userId === userId || role === 'admin') {
            const { fields, files } = await uploadHandler(req) as { fields: PostFields; files: UploadedFiles };

            const updateData: Partial<PostFields> = {};

            if (fields.title && Array.isArray(fields.title)) {
                updateData.title = fields.title[0];
            }
            if (fields.description && Array.isArray(fields.description)) {
                updateData.description = fields.description[0];
            }
            if (files.mediaPath && files.mediaPath.length > 0) {
                updateData.mediaPath = files.mediaPath[0].filepath;
            }
            if (fields.mediaType && Array.isArray(fields.mediaType)) {
                updateData.mediaType = fields.mediaType[0];
            }

            const updatedPost = await Post.findByIdAndUpdate(postId, updateData, { new: true });
            return NextResponse.json(updatedPost, { headers: corsHeaders });
        } else {
            return NextResponse.json({ error: 'Forbidden: Not allowed to update this post' }, { status: 403, headers: corsHeaders });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update post' }, { status: 500, headers: corsHeaders });
    }
}

export async function DELETE(req: NextRequest) {
    console.log('Received DELETE request');
    try {
        await verifyJWT(req);
        console.log('User after JWT verification:',(req as any).user);
    } catch (error) {
        console.error('JWT Verification failed:', error);
        return NextResponse.json(
            { error: 'Unauthorized: Invalid or missing token' }, 
            { status: 401, headers: corsHeaders }
        );
    }

    console.log('JWT verified, proceeding with delete');
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('id');

    if (!postId) {
        return NextResponse.json(
            { error: 'Post ID is required' }, 
            { status: 400, headers: corsHeaders }
        );
    }

    const { userId, role } = (req as any).user; // Log to check if user info is available
    console.log('User ID:', userId, 'Role:', role);

    try {
        const post = await Post.findById(postId);
        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' }, 
                { status: 404, headers: corsHeaders }
            );
        }

        if (post.userId === userId || role === 'admin') {
            await Post.findByIdAndDelete(postId);
            return NextResponse.json(
                { message: 'Post deleted successfully' }, 
                { headers: corsHeaders }
            );
        } else {
            return NextResponse.json(
                { error: 'Forbidden: Not allowed to delete this post' }, 
                { status: 403, headers: corsHeaders }
            );
        }
    } catch (error) {
        console.error('Error during post deletion:', error);
        return NextResponse.json(
            { error: 'Failed to delete post' }, 
            { status: 500, headers: corsHeaders }
        );
    }
}

