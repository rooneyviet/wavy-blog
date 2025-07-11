import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import QueryProvider from "@/providers/QueryProvider";

const inter = Inter({
  variable: "--font-inter", // Changed variable name
  subsets: ["latin"],
});

// geistMono can be removed if not used, or kept if specific mono font is needed elsewhere
// For now, let's assume Inter covers most needs. If a mono is needed, we can add a specific one.

export const metadata: Metadata = {
  title: "Wavy - Personal Blog",
  description: "Personal Blog Theme",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-pink-50 font-sans antialiased", // font-sans will use the CSS variable, bg-pink-50 added
          inter.variable // Apply Inter font variable
        )}
      >
        <QueryProvider>
          {/* Header will be rendered by page.tsx or individual layouts now */}
          <div className="flex flex-col min-h-screen">
            {/* Adjusted main container width to max-w-7xl, which is a common width for blogs.
              The target site's content appears to be around this width.
              Removed default container class from here, will apply it in page.tsx for more control.
          */}
            <main className="flex-grow">{children}</main>
            {/* Footer will be rendered by page.tsx or individual layouts now */}
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
