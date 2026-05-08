import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "moj univerzitet - Studentska platforma",
  description:
    "moj univerzitet je studentska platforma za razmjenu znanja, postavljanje upita, pronalazak instruktora i dijeljenje studijskih materijala.",
  icons: { icon: "/mojun-logo.png", apple: "/mojun-logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bs" className={geist.variable}>
      <body className="min-h-screen bg-[#f8fafb] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
