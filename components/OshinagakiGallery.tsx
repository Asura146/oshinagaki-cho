'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { uploadOshinagakiImage, deleteOshinagakiImage } from '@/app/actions/oshinagaki';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImagePlus, Trash2, Loader2, ZoomIn } from 'lucide-react';

interface OshinagakiImageItem {
  id: string;
  storagePath: string;
}

interface OshinagakiGalleryProps {
  circleId: string;
  eventId: string;
  images: OshinagakiImageItem[];
}

export function OshinagakiGallery({ circleId, eventId, images }: OshinagakiGalleryProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('circleId', circleId);
    formData.append('eventId', eventId);
    formData.append('imageFile', file);

    const result = await uploadOshinagakiImage(formData);

    if (result.ok) {
      router.refresh();
    } else {
      alert(result.error || '画像のアップロードに失敗しました');
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('このお品書き画像を削除しますか？')) return;

    setDeletingId(imageId);
    const result = await deleteOshinagakiImage(imageId, eventId);
    if (result.ok) {
      router.refresh();
    } else {
      alert(result.error || '画像の削除に失敗しました');
    }
    setDeletingId(null);
  };

  return (
    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          お品書き画像 ({images.length})
        </span>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="border-dashed border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer font-normal"
        >
          {isUploading ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <ImagePlus className="mr-1 h-3 w-3" />
          )}
          画像を追加
        </Button>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              onClick={() => setSelectedImage(img.storagePath)}
              className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 cursor-pointer dark:border-zinc-800 dark:bg-zinc-950"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.storagePath}
                alt="お品書き"
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <ZoomIn className="h-4 w-4 text-white" />
                <button
                  type="button"
                  disabled={deletingId === img.id}
                  onClick={(e) => handleDelete(img.id, e)}
                  className="rounded p-1 text-white hover:bg-red-600/80 transition-colors"
                >
                  {deletingId === img.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 拡大表示モーダル (ライトボックス) */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-2xl p-2 border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-900/95 backdrop-blur">
          <DialogHeader className="sr-only">
            <DialogTitle>お品書き画像の拡大表示</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative flex items-center justify-center max-h-[80vh] overflow-auto rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt="お品書き拡大"
                className="max-h-[80vh] w-auto object-contain rounded"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
