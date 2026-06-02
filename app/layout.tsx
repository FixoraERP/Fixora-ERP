import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Fixora ERP Online Pro",
  description: "ERP online profissional com login por usuário",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Fixora ERP",
    statusBarStyle: "black-translucent"
  }
};

export const viewport: Viewport = {
  themeColor: "#0078d4",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
