import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chatter - Bruce Wayne AI",
  description: "Private one-room chat with your AI persona"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
