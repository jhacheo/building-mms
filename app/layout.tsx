import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const jakarta = localFont({
  src: [
    { path: "../public/fonts/jakarta-400.ttf", weight: "400" },
    { path: "../public/fonts/jakarta-500.ttf", weight: "500" },
    { path: "../public/fonts/jakarta-600.ttf", weight: "600" },
    { path: "../public/fonts/jakarta-700.ttf", weight: "700" },
  ],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Building MMS · Maintenance workspace",
  description: "Report, assign and resolve building maintenance issues.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} antialiased`}>{children}</body>
    </html>
  );
}
