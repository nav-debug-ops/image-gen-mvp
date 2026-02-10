const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = {
  async generateImage(
    prompt: string,
    style: string | null,
    aspectRatio: string
  ) {
    const response = await fetch(`${API_URL}/api/generate/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        style,
        aspect_ratio: aspectRatio,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate image");
    }

    return response.json();
  },

  async getImages(limit = 20, offset = 0) {
    const response = await fetch(
      `${API_URL}/api/images/?limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch images");
    }

    return response.json();
  },

  async getStyles() {
    const response = await fetch(`${API_URL}/api/prompts/styles`);

    if (!response.ok) {
      throw new Error("Failed to fetch styles");
    }

    return response.json();
  },

  async getSuggestions() {
    const response = await fetch(`${API_URL}/api/prompts/suggestions`);

    if (!response.ok) {
      throw new Error("Failed to fetch suggestions");
    }

    return response.json();
  },

  async deleteImage(imageId: string) {
    const response = await fetch(`${API_URL}/api/images/${imageId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete image");
    }

    return response.json();
  },

  getImageUrl(path: string) {
    return `${API_URL}${path}`;
  },
};
