import type { Metadata } from "next";
import { ChunkRecovery } from "@/components/layout/chunk-recovery";
import { DevServerRecovery } from "@/components/layout/dev-server-recovery";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sufaraa Al-Maseeh",
  description: "Christian Family Competition Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <ChunkRecovery />
        <DevServerRecovery />
        {children}
      </body>
    </html>
  );
}
