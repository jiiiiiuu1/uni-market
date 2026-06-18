"use client";

import React, { useState, useRef } from "react";
import { Upload, X, AlertCircle, GripHorizontal, Check } from "lucide-react";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  onShowNotification: (msg: string, type: "success" | "info") => void;
}

export default function ImageUploader({
  images,
  onChange,
  onShowNotification,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compress and resize image client-side using Canvas
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Resize max dimensions to 800px for web storage efficiency
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Return compressed JPEG data URL at 70% quality
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const validateAndAddFiles = async (fileList: FileList) => {
    const currentCount = images.length;
    if (currentCount >= 5) {
      alert("⚠️ 사진은 최대 5장까지만 등록 가능합니다.");
      return;
    }

    const filesArray = Array.from(fileList);
    const validFiles: File[] = [];

    // Validate MIME types and size
    for (const file of filesArray) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        alert(`❌ 이미지 파일만 업로드 가능합니다 (jpg, png, webp). \n오류 파일: ${file.name}`);
        continue;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert(`❌ 파일 크기는 최대 5MB 이하여야 합니다. \n오류 파일: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Constrain to maximum of 5 images total
    const allowedNewCount = Math.max(0, 5 - currentCount);
    const filesToProcess = validFiles.slice(0, allowedNewCount);

    if (validFiles.length > allowedNewCount) {
      alert(`⚠️ 5장 초과분은 제외하고 처음 ${allowedNewCount}장만 추가됩니다.`);
    }

    onShowNotification("이미지 압축 및 처리 중...", "info");

    try {
      const compressionPromises = filesToProcess.map((file) => compressImage(file));
      const base65Urls = await Promise.all(compressionPromises);

      // Append new Base64 strings
      // If default placeholder is still there, replace it
      if (images.length === 1 && images[0].includes("unsplash.com")) {
        onChange(base65Urls);
      } else {
        onChange([...images, ...base65Urls].slice(0, 5));
      }
      
      onShowNotification(`사진 ${base65Urls.length}장 등록 완료!`, "success");
    } catch (err) {
      console.error(err);
      alert("이미지 처리 도중 오류가 발생했습니다.");
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndAddFiles(e.target.files);
    }
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
    onShowNotification("사진이 삭제되었습니다.", "info");
  };

  // HTML5 Drag-and-drop sort handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Set transparent image helper for custom UI styling if desired
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setHoveredIndex(index);
  };

  const handleDragLeave = () => {
    setHoveredIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setHoveredIndex(null);
  };

  const handleDropSort = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    // Swap / Reorder
    const reordered = [...images];
    const draggedItem = reordered[draggedIndex];
    reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);

    onChange(reordered);
    setDraggedIndex(null);
    setHoveredIndex(null);
    onShowNotification("사진의 순서가 변경되었습니다 (대표 이미지 갱신).", "success");
  };

  return (
    <div className="space-y-3 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
      
      {/* Label and Count */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          물품 사진 관리 ({images.length}/5장) *
        </label>
        <span className="text-[10px] font-bold text-slate-400">대표 이미지는 첫 번째 사진으로 자동 설정됩니다.</span>
      </div>

      {/* Drag Zone Drop Box */}
      {images.length < 5 && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center py-6 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            dragActive
              ? "border-blue-600 bg-blue-50/15"
              : "border-slate-200 hover:border-slate-350 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className={`h-8 w-8 ${dragActive ? "text-blue-600 animate-bounce" : "text-slate-400"} mb-1.5`} />
          <p className="text-xs font-bold text-slate-750 dark:text-slate-300">
            드래그 앤 드롭 또는 클릭하여 사진 업로드
          </p>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
            JPG, PNG, WEBP 지원 | 각 파일 최대 5MB | 업로드 시 자동 크기 압축
          </p>
        </div>
      )}

      {/* Thumbnail Drag & Drop Sort List */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {images.map((url, index) => {
            const isRepresentative = index === 0;
            const isHovered = hoveredIndex === index;
            const isDragged = draggedIndex === index;

            return (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDropSort(e, index)}
                className={`relative aspect-square rounded-xl overflow-hidden border bg-white dark:bg-slate-950 transition-all ${
                  isDragged ? "opacity-35 border-blue-500 scale-95" : "opacity-100"
                } ${
                  isHovered ? "border-blue-600 ring-2 ring-blue-500/25 scale-[1.03]" : "border-slate-150 dark:border-slate-800"
                } group cursor-grab active:cursor-grabbing`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Listing thumbnail ${index + 1}`}
                  className="h-full w-full object-cover select-none pointer-events-none"
                />

                {/* Badges / Controls overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />

                {/* Drag Handle display */}
                <div className="absolute top-1 left-1 p-1 bg-black/45 text-white rounded-md opacity-60 group-hover:opacity-100 transition-opacity">
                  <GripHorizontal className="h-3 w-3" />
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-650 text-white rounded-full transition-colors cursor-pointer"
                  title="사진 삭제"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* Representative Thumbnail Badge */}
                {isRepresentative ? (
                  <div className="absolute inset-x-0 bottom-0 bg-blue-600 text-white text-[9px] font-bold py-1 text-center flex items-center justify-center gap-0.5 shadow-inner">
                    <Check className="h-3 w-3 shrink-0" />
                    <span>대표 이미지</span>
                  </div>
                ) : (
                  <div className="absolute inset-x-0 bottom-0 bg-black/40 text-white/95 text-[8px] font-semibold py-0.5 text-center truncate">
                    {index + 1}번 슬롯
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
