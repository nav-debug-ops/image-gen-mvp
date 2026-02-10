"use client";

interface StyleSelectorProps {
  selected: string | null;
  onSelect: (style: string | null) => void;
}

const STYLES = [
  { id: "photorealistic", name: "Photorealistic", emoji: "📷" },
  { id: "anime", name: "Anime", emoji: "🎨" },
  { id: "watercolor", name: "Watercolor", emoji: "🖌️" },
  { id: "digital_art", name: "Digital Art", emoji: "💻" },
  { id: "oil_painting", name: "Oil Painting", emoji: "🎭" },
  { id: "3d_render", name: "3D Render", emoji: "🔮" },
  { id: "sketch", name: "Sketch", emoji: "✏️" },
  { id: "fantasy", name: "Fantasy", emoji: "✨" },
];

export function StyleSelector({ selected, onSelect }: StyleSelectorProps) {
  return (
    <div className="mt-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Style (optional)
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelect(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selected === null
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          None
        </button>
        {STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              selected === style.id
                ? "bg-primary-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span>{style.emoji}</span>
            <span>{style.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
