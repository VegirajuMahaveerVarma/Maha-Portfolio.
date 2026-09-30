import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vegiraju Mahaveer Varma — Portfolio",
  description: "A cinematic developer portfolio for Vegiraju Mahaveer Varma.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
