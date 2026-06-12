import { useCallback, useRef, useState } from 'react';
import { Upload, X, Star, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const RECOMMENDED_SHOTS = [
  'Vooraanzicht',
  'Achteraanzicht',
  'Linkerzijde',
  'Rechterzijde',
  'Interieur',
  'Dashboard / kilometerstand',
  'Motorruimte',
];

const MAX_PHOTOS = 20;

async function compressImage(file: File, maxDim = 1920, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1_500_000) return file;
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export interface PhotoItem {
  file?: File;
  preview: string;
}

interface Props {
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
}

export function PhotoUploader({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(0);

  const addFiles = useCallback(
    async (files: File[]) => {
      const remaining = MAX_PHOTOS - photos.length;
      if (remaining <= 0) return;
      const slice = files.slice(0, remaining);
      setProcessing(slice.length);
      const next: PhotoItem[] = [];
      for (const f of slice) {
        const compressed = await compressImage(f);
        next.push({ file: compressed, preview: URL.createObjectURL(compressed) });
        setProcessing((p) => p - 1);
      }
      onChange([...photos, ...next]);
    },
    [photos, onChange]
  );

  const remove = (idx: number) => onChange(photos.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= photos.length) return;
    const copy = [...photos];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    onChange(copy);
  };
  const makePrimary = (idx: number) => {
    if (idx === 0) return;
    const copy = [...photos];
    const [item] = copy.splice(idx, 1);
    copy.unshift(item);
    onChange(copy);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
          if (files.length) addFiles(files);
        }}
        className={cn(
          'rounded-xl border-2 border-dashed p-6 text-center transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/20'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length) addFiles(files);
            e.target.value = '';
          }}
          className="hidden"
        />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Upload className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-medium">Sleep foto's hierheen of klik om te uploaden</p>
        <p className="text-xs text-muted-foreground mt-1">
          {photos.length}/{MAX_PHOTOS} foto's · JPG/PNG · automatisch gecomprimeerd
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            <Upload className="mr-1.5 h-4 w-4" /> Foto's kiezen
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.setAttribute('capture', 'environment');
                inputRef.current.click();
              }
            }}
          >
            <Camera className="mr-1.5 h-4 w-4" /> Camera
          </Button>
        </div>
        {processing > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">Bezig met verwerken ({processing})...</p>
        )}
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Aanbevolen foto's
        </p>
        <div className="flex flex-wrap gap-1.5">
          {RECOMMENDED_SHOTS.map((s) => (
            <Badge key={s} variant="outline" className="font-normal">
              {s}
            </Badge>
          ))}
        </div>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((p, idx) => (
            <div
              key={p.preview}
              className="group relative aspect-video overflow-hidden rounded-xl border border-border/60 bg-muted"
            >
              <img src={p.preview} alt={`Foto ${idx + 1}`} className="h-full w-full object-cover" />
              {idx === 0 && (
                <Badge className="absolute left-2 top-2 gap-1 bg-primary text-primary-foreground">
                  <Star className="h-3 w-3" /> Hoofdfoto
                </Badge>
              )}
              <button
                type="button"
                onClick={() => remove(idx)}
                aria-label="Foto verwijderen"
                className="absolute right-2 top-2 rounded-full bg-background/90 p-1 text-foreground shadow-sm transition-opacity opacity-80 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    aria-label="Naar links"
                    className="rounded-md bg-background/90 p-1 text-foreground disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, 1)}
                    disabled={idx === photos.length - 1}
                    aria-label="Naar rechts"
                    className="rounded-md bg-background/90 p-1 text-foreground disabled:opacity-40"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => makePrimary(idx)}
                    className="rounded-md bg-background/90 px-2 py-1 text-[10px] font-medium text-foreground"
                  >
                    Maak hoofdfoto
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
