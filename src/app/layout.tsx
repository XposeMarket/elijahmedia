import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Elijah Media | Photography",
  description: "Professional photography services by Elijah Media. VHS, Night time, and Day time shoots.",
  keywords: ["photography", "photographer", "VHS", "portrait", "event photography"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-neutral-950 text-white`}>
        {children}
      </body>
    </html>
  );
}
