import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import ClientLayout from "@/components/ClientLayout";
import "./globals.css";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: "Absensi RFID Dashboard",
  description: "Sistem absensi menggunakan teknologi RFID",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${poppins.variable} antialiased`} style={{ margin: 0, padding: 0, background: 'transparent', fontFamily: 'var(--font-poppins), sans-serif' }}>
        <ClientLayout>
          <div className="min-h-screen w-full text-[var(--foreground)]" style={{ background: 'transparent' }}>
            {children}
          </div>
        </ClientLayout>
      </body>
    </html>
  );
}
