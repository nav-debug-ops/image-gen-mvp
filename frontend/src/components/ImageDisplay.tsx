"use client";

import { Download, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface ImageDisplayProps {
  imageUrl: string | null;
  isGenerating: boolean;
  prompt: string;
}

export function ImageDisplay({
  imageUrl,
  isGenerating,
  prompt,
}: ImageDisplayProps) {
  const handleDownload = async () => {
    if (!imageUrl) return;

    const fullUrl = api.getImageUrl(imageUrl);
    const response = await fetch(fullUrl);
    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `imagegen-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isGenerating) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="aspect-square max-w-md mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-gray-600">Creating your image...</p>
            <p className="text-sm text-gray-400 mt-2">This may take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="aspect-square max-w-md mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-400">
            <p className="text-lg">Your image will appear here</p>
            <p className="text-sm mt-2">Enter a prompt and click Generate</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="max-w-md mx-auto">
        <img
          src={api.getImageUrl(imageUrl)}
          alt={prompt}
          className="w-full rounded-lg shadow-md"
        />
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-500 truncate flex-1 mr-4">{prompt}</p>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
