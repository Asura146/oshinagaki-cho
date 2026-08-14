/**
 * クライアント側で画像をリサイズ・圧縮するユーティリティ関数
 */

export interface CompressImageOptions {
  maxDimension?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

/**
 * 画像ファイルを読み込み、指定された最大長辺と画質で圧縮した File オブジェクトを返します。
 * HEIC などの形式や縦向き・横向き画像も Canvas 経由で適切に JPEG/WebP に正規化されます。
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  const {
    maxDimension = 1800,
    quality = 0.85,
    mimeType = 'image/jpeg',
  } = options;

  // 画像形式でない場合はそのまま返す
  if (!file.type.startsWith('image/') && !file.name.match(/\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i)) {
    return file;
  }

  // GIFはアニメーションが失われるのを防ぐためそのまま返す
  if (file.type === 'image/gif') {
    return file;
  }

  try {
    const imageBitmap = await createImageBitmap(file).catch(async () => {
      // createImageBitmap が失敗した場合は HTMLImageElement で読み込み
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = URL.createObjectURL(file);
      });
    });

    const origWidth = 'width' in imageBitmap ? imageBitmap.width : (imageBitmap as HTMLImageElement).naturalWidth;
    const origHeight = 'height' in imageBitmap ? imageBitmap.height : (imageBitmap as HTMLImageElement).naturalHeight;

    let targetWidth = origWidth;
    let targetHeight = origHeight;

    // 長辺が maxDimension を超える場合はリサイズ計算
    if (origWidth > maxDimension || origHeight > maxDimension) {
      if (origWidth > origHeight) {
        targetWidth = maxDimension;
        targetHeight = Math.round((origHeight * maxDimension) / origWidth);
      } else {
        targetHeight = maxDimension;
        targetWidth = Math.round((origWidth * maxDimension) / origHeight);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }

    // 描画品質の向上
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

    // ImageBitmap を解放
    if ('close' in imageBitmap && typeof imageBitmap.close === 'function') {
      imageBitmap.close();
    } else if ('src' in imageBitmap) {
      URL.revokeObjectURL((imageBitmap as HTMLImageElement).src);
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (b) => resolve(b),
        mimeType,
        quality
      );
    });

    if (!blob) {
      return file;
    }

    // 拡張子の置き換え
    const extension = mimeType === 'image/webp' ? '.webp' : mimeType === 'image/png' ? '.png' : '.jpg';
    const newFileName = file.name.replace(/\.[^/.]+$/, '') + extension;

    return new File([blob], newFileName, {
      type: mimeType,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn('Image compression failed, using original file:', error);
    return file;
  }
}
