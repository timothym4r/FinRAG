import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "FinRAG",
  description:
    "Financial retrieval-augmented QA for SEC filings, earnings reports, and investor documents."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
