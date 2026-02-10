import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ImageGen - Create Beautiful Images with AI",
  description: "Simple AI image generation for everyone. No design skills required.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
