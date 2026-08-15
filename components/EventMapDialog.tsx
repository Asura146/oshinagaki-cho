'use client';

import { useState, useTransition } from 'react';
import { uploadEventMap, deleteEventMap } from '@/app/actions/maps';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Map as MapIcon, Plus, Trash2, FileText, Image as ImageIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface EventMap {
  id: string;
  name: string;
  mimeType: string;
  storagePath: string;
}

interface EventMapDialogProps {
  eventId: string;
  eventMaps: EventMap[];
}

export function EventMapDialog({ eventId, eventMaps }: EventMapDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(eventMaps.length > 0 ? eventMaps[0].id : null);
  
  const [deleteMapId, setDeleteMapId] = useState<string | null>(null);

  const handleUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('eventId', eventId);

    startTransition(async () => {
      const result = await uploadEventMap(formData);
      if (result.ok) {
        setIsUploading(false);
        form.reset();
        // The page will revalidate and new map will appear
      } else {
        setError(result.error || 'マップの登録に失敗しました。');
      }
    });
  };

  const handleDelete = () => {
    if (!deleteMapId) return;
    
    startTransition(async () => {
      const result = await deleteEventMap(deleteMapId, eventId);
      if (result.ok) {
        setDeleteMapId(null);
        if (selectedMapId === deleteMapId) {
          setSelectedMapId(eventMaps.filter(m => m.id !== deleteMapId)[0]?.id || null);
        }
      } else {
        alert(result.error || '削除に失敗しました。');
      }
    });
  };

  const selectedMap = eventMaps.find((m) => m.id === selectedMapId);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={
          <Button
            variant="outline"
            className="h-9 gap-2 border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80"
          >
            <MapIcon className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold text-sm">会場マップ</span>
          </Button>
        } />
        <DialogContent className="w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] md:max-w-6xl h-[95vh] sm:h-[90vh] overflow-hidden flex flex-col p-0 border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
          <DialogHeader className="p-4 sm:px-6 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between pr-8 sm:pr-6">
              <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                会場マップ
              </DialogTitle>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setIsUploading(!isUploading)}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {isUploading ? 'キャンセル' : (
                  <>
                    <Plus className="mr-1.5 h-4 w-4" />
                    マップを追加
                  </>
                )}
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col md:flex-row gap-6">
            {/* Sidebar / List */}
            <div className="w-full md:w-64 shrink-0 space-y-2">
              {isUploading && (
                <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-400 mb-3 text-sm">
                    新規マップ登録
                  </h4>
                  <form onSubmit={handleUploadSubmit} className="space-y-3">
                    {error && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded dark:bg-red-950/30 dark:text-red-400">
                        {error}
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label htmlFor="map-name" className="text-xs">マップ名</Label>
                      <Input
                        id="map-name"
                        name="name"
                        required
                        placeholder="例: 東1-3ホール"
                        className="h-8 text-xs bg-white dark:bg-zinc-900"
                        disabled={isPending}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="map-file" className="text-xs">ファイル (PDF/画像)</Label>
                      <Input
                        id="map-file"
                        name="file"
                        type="file"
                        required
                        accept="application/pdf,image/*"
                        className="h-8 text-xs bg-white dark:bg-zinc-900 file:text-xs"
                        disabled={isPending}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isPending}
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 h-8"
                    >
                      {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                      登録する
                    </Button>
                  </form>
                </div>
              )}

              {eventMaps.length === 0 && !isUploading ? (
                <div className="text-sm text-zinc-500 text-center p-4 border border-dashed rounded-lg border-zinc-200 dark:border-zinc-800">
                  マップが登録されていません。
                </div>
              ) : (
                <div className="space-y-1">
                  {eventMaps.map((map) => (
                    <div
                      key={map.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedMapId === map.id
                          ? 'bg-zinc-200/60 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                      }`}
                      onClick={() => setSelectedMapId(map.id)}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {map.mimeType === 'application/pdf' ? (
                          <FileText className="h-4 w-4 shrink-0" />
                        ) : (
                          <ImageIcon className="h-4 w-4 shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate">{map.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="h-6 w-6 shrink-0 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteMapId(map.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Main Preview Area */}
            <div className="flex-1 bg-zinc-200 dark:bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner border border-zinc-200/50 dark:border-zinc-800">
              {selectedMap ? (
                selectedMap.mimeType === 'application/pdf' ? (
                  <iframe
                    src={`/api/maps/${selectedMap.id}`}
                    className="w-full h-full absolute inset-0"
                    title={selectedMap.name}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/maps/${selectedMap.id}`}
                    alt={selectedMap.name}
                    className="max-w-full max-h-full object-contain p-2"
                  />
                )
              ) : (
                <div className="text-zinc-400 dark:text-zinc-600 flex flex-col items-center gap-2">
                  <MapIcon className="h-10 w-10 opacity-50" />
                  <span className="text-sm font-medium">マップを選択してください</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteMapId} onOpenChange={(open) => !open && setDeleteMapId(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>マップを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
