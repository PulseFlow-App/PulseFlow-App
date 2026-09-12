"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isTransientPhotoUrl, uploadPreparedVillaPhoto } from "@/lib/villas/prepare-photo";

export function useVillaPhotoUpload(
  upload: (file: File) => Promise<string | null>,
) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const jobRef = useRef<Promise<string | null> | null>(null);
  const previewRef = useRef<string | null>(null);
  const genRef = useRef(0);
  const uploadRef = useRef(upload);
  uploadRef.current = upload;

  const clearPreview = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  useEffect(() => () => clearPreview(), [clearPreview]);

  const pickPhoto = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      const gen = ++genRef.current;
      clearPreview();
      const local = URL.createObjectURL(file);
      previewRef.current = local;
      setPreviewUrl(local);
      setPhotoBusy(true);
      setPhotoError(null);
      const job = uploadPreparedVillaPhoto(file, (f) => uploadRef.current(f))
        .then((url) => {
          if (gen !== genRef.current) return null;
          setPhotoUrl(url);
          clearPreview();
          return url;
        })
        .catch((e: unknown) => {
          if (gen !== genRef.current) return null;
          const msg =
            e instanceof Error ? e.message : "Could not upload photo.";
          setPhotoError(msg);
          throw e;
        })
        .finally(() => {
          if (gen === genRef.current) setPhotoBusy(false);
        });
      jobRef.current = job;
    },
    [clearPreview],
  );

  const waitForPhoto = useCallback(async () => {
    if (jobRef.current) {
      const url = await jobRef.current;
      jobRef.current = null;
      return isTransientPhotoUrl(url) ? null : url;
    }
    return isTransientPhotoUrl(photoUrl) ? null : photoUrl;
  }, [photoUrl]);

  const removePhoto = useCallback(() => {
    genRef.current += 1;
    jobRef.current = null;
    clearPreview();
    setPhotoUrl(null);
    setPhotoBusy(false);
    setPhotoError(null);
  }, [clearPreview]);

  const resetPhoto = useCallback(() => {
    genRef.current += 1;
    jobRef.current = null;
    clearPreview();
    setPhotoUrl(null);
    setPhotoBusy(false);
    setPhotoError(null);
  }, [clearPreview]);

  return {
    photoUrl,
    setPhotoUrl,
    displayUrl: previewUrl ?? photoUrl,
    photoBusy,
    photoError,
    pickPhoto,
    waitForPhoto,
    removePhoto,
    resetPhoto,
  };
}
