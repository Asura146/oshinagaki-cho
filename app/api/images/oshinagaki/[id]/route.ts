import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { oshinagakiImages } from '@/lib/db/schema';
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

    const image = await db.query.oshinagakiImages.findFirst({
      where: eq(oshinagakiImages.id, id),
      columns: {
        storagePath: true,
      },
    });

    if (!image || !image.storagePath) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const storagePath = image.storagePath;

    // URL の場合はリダイレクト
    if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
      return NextResponse.redirect(storagePath, 307);
    }

    // Data URI (Base64) の場合
    if (storagePath.startsWith('data:')) {
      const match = storagePath.match(/^data:([^;]+);base64,(.+)$/);
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

    return new NextResponse('Invalid Image Data', { status: 500 });
  } catch (error) {
    console.error('Failed to serve oshinagaki image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
