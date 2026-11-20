import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/providers/cart-provider";
import { ToastProvider } from "@/components/motion/toast";
import { RegisterSW } from "@/components/pwa/register-sw";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

// Self-hosted at build time (no render-blocking Google Fonts request on 3G).
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://littleshop.gh";

export const metadata: Metadata = {
  title: "blink — Mobile data for Ghana",
  description: "Buy MTN, Telecel and AT data bundles instantly, straight from our live Jehucal store.",
  keywords: ["Ghana", "mobile data", "AirtelTigo", "Telecel", "MTN", "data bundles", "bundle prices", "AT"],
  robots: { index: true, follow: true },
  applicationName: "blink",
  openGraph: {
    type: "website",
    title: "blink — Mobile data for Ghana",
    description: "Buy MTN, Telecel and AT data bundles instantly.",
    url: SITE_URL,
    siteName: "blink",
    locale: "en_GH",
  },
  alternates: { canonical: SITE_URL + "/" },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "blink",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "blink — Mobile data for Ghana",
    description: "Buy MTN, Telecel and AT data bundles instantly.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f4ef",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="flex min-h-dvh flex-col">
        <CartProvider>
          <ToastProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <RegisterSW />
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}