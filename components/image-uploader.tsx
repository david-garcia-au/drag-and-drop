"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";

interface ImageUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  isUploading: boolean;
}

export function ImageUploader({ onUpload, isUploading }: ImageUploaderProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      await onUpload(acceptedFiles);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
        ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400"
        }`}
    >
      <input {...getInputProps()} />
      <div className="flex items-center justify-center space-x-4">
        <UploadCloud className="h-8 w-8 text-gray-400" />
        <div className="text-left">
          <p className="text-sm text-gray-600">
            {isDragActive
              ? "Drop the images here..."
              : "Drag 'n' drop images here, or click to select"}
          </p>
          <p className="text-xs text-gray-500">Supports multiple images</p>
        </div>
      </div>
      {isUploading && <p className="mt-2 text-sm text-primary">Uploading...</p>}
    </div>
  );
}
