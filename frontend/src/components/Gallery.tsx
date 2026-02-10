"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";

interface Image {
  id: string;
  prompt: string;
  created_at: string;
}

interface GalleryProps {
  onSelect: (url: string) => void;
}

export function Gallery({ onSelect }: GalleryProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = async () => {
    try {
      const data = await api.getImages();
      setImages(data.images || []);
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    // Refresh gallery periodically
    const interval = setInterval(fetchImages, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteImage(imageId);
      setImages(images.filter((img) => img.id !== imageId));
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No images yet. Generate your first one above!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {images.map((image) => (
        <div
          key={image.id}
          className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
          onClick={() => onSelect(`/images/${image.id}.png`)}
        >
          <img
            src={api.getImageUrl(`/images/${image.id}.png`)}
            alt={image.prompt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
            <button
              onClick={(e) => handleDelete(image.id, e)}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-white text-xs truncate">{image.prompt}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
