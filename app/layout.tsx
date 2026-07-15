import type { Metadata } from "next";
import { Fraunces } from "next/font/google";

import { ThemeScript } from "@/components/theme-script";
import { ThemeToggle } from "@/components/theme-toggle";
import { SyncOnLoad } from "@/components/sync-on-load";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces-family",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kupulumuka",
  description: "Navegação e gestão de abrigos em caso de cheias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={`${fraunces.variable} antialiased`}>
        <ThemeScript />
        <SyncOnLoad />
        <ServiceWorkerRegister />
        <div className="fixed right-spacing-screen-x top-spacing-screen-x">
          <ThemeToggle />
        </div>
        {children}
      </body>
    </html>
  );
}
