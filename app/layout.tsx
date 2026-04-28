import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fun Games",
  description: "Internal office typing challenge by Technology & Development Team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
