import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Energy Coach",
  description:
    "A dark, single-page household energy dashboard that infers likely contributors to half-hour electricity spikes.",
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
