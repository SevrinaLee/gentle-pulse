import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gentle Pulse",
  description: "Log daily friction, spot the pattern, get one fix.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
