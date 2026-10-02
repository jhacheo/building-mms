import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
