import { NextResponse } from 'next/server';
import { getPostBySlug } from '@/lib/mdParser';

interface Params {
  slug: string;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

