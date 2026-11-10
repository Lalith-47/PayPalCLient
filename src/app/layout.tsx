import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusVault | College Essentials & Student Notes Subscriptions",
  description: "Official student store for college supplies, lab kits, and subscription-style academic notes vaults integrated with Revenue Guardian PayPal recovery.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
