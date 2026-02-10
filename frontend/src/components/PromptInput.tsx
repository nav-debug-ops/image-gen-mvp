"use client";

import { Sparkles, Loader2 } from "lucide-react";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const QUICK_PROMPTS = [
  "A cozy coffee shop on a rainy day",
  "A magical forest with glowing butterflies",
  "A futuristic city at sunset",
  "A cute cat wearing a tiny hat",
];

export function PromptInput({
  value,
  onChange,
  onGenerate,
  isGenerating,
}: PromptInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Describe your image
      </label>
      <div className="flex gap-3">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="A peaceful mountain lake at sunset with snow-capped peaks..."
          className="flex-1 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          rows={3}
          disabled={isGenerating}
        />
        <button
          onClick={onGenerate}
          disabled={isGenerating || !value.trim()}
          className="px-6 py-4 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate
            </>
          )}
        </button>
      </div>

      {/* Quick prompts for beginners */}
      <div className="mt-4">
        <p className="text-sm text-gray-500 mb-2">Try one of these:</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onChange(prompt)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
