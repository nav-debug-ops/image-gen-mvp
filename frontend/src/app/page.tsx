"use client";

import { useState } from "react";
import { PromptInput } from "@/components/PromptInput";
import { StyleSelector } from "@/components/StyleSelector";
import { ImageDisplay } from "@/components/ImageDisplay";
import { Gallery } from "@/components/Gallery";
import { api } from "@/lib/api";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await api.generateImage(prompt, style, aspectRatio);
      setCurrentImage(result.image_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="gradient-bg text-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-2">ImageGen</h1>
          <p className="text-lg opacity-90">
            Create beautiful images with AI. No design skills needed.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Prompt Input */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />

          {/* Style Selector */}
          <StyleSelector
            selected={style}
            onSelect={setStyle}
          />

          {/* Aspect Ratio */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aspect Ratio
            </label>
            <div className="flex gap-2">
              {["1:1", "16:9", "9:16"].map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    aspectRatio === ratio
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Generated Image */}
        <ImageDisplay
          imageUrl={currentImage}
          isGenerating={isGenerating}
          prompt={prompt}
        />

        {/* Gallery */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Creations</h2>
          <Gallery onSelect={(url) => setCurrentImage(url)} />
        </div>
      </div>
    </main>
  );
}
