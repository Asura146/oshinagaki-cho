import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { circles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    const circle = await db.query.circles.findFirst({
      where: eq(circles.id, id),
      columns: {
        avatarPath: true,
      },
    });

    if (!circle || !circle.avatarPath) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const avatarPath = circle.avatarPath;

    // URL の場合はリダイレクト
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return NextResponse.redirect(avatarPath, 307);
    }

    // Data URI (Base64) の場合
    if (avatarPath.startsWith('data:')) {
      const match = avatarPath.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': mimeType,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    }

    return new NextResponse('Invalid Avatar Data', { status: 500 });
  } catch (error) {
    console.error('Failed to serve avatar image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
