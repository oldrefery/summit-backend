// src/components/ui/image-upload.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { X, Upload } from 'lucide-react';
import Image from 'next/image';
import { useToastContext } from '@/components/providers/toast-provider';
import { FILE_LIMITS } from '@/app/constants';

interface ImageUploadProps {
  onChange: (file: File | null) => void;
  value?: string | null;
  className?: string;
}

export function ImageUpload({ onChange, value, className }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const { showError } = useToastContext();

  useEffect(() => {
    if (value) {
      // If the value is already a full URL, we use it
      if (value.startsWith('http')) {
        setPreview(value);
      } else {
        // otherwise create full url
        const fullUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${value}`;
        console.log('Setting preview URL:', fullUrl);
        setPreview(fullUrl);
      }
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (!file) {
        return;
      }

      // size validation
      if (file.size > FILE_LIMITS.DEFAULT) {
        showError(
          `File size should not exceed ${Math.floor(FILE_LIMITS.DEFAULT / (1024 * 1024))}MB`
        );
        return;
      }

      //type validation
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !['jpg', 'jpeg', 'png'].includes(fileExt)) {
        showError('Only JPG and PNG files are allowed');
        return;
      }

      if (!file.type.startsWith('image/')) {
        showError('File must be an image');
        return;
      }

      // create preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      onChange(file);

      // remove object
      return () => URL.revokeObjectURL(objectUrl);
    },
    [onChange, showError]
  );

  const handleRemove = useCallback(() => {
    setPreview(null);
    onChange(null);
  }, [onChange]);

  return (
    <div className={className}>
      <Label>Photo</Label>
      <div className="mt-2 flex items-center gap-4">
        {preview ? (
          <div className="relative">
            <Image
              key={preview}
              src={preview}
              alt="Preview"
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover"
              unoptimized
            />
            <button
              onClick={handleRemove}
              className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="photo-upload"
            className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-muted-foreground bg-muted hover:bg-muted/80"
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <input
              id="photo-upload"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}
