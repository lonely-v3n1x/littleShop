import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/providers/cart-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://littleshop.gh";

export const metadata: Metadata = {
  title: "littleShop — Mobile data for Ghana",
  description: "Buy MTN, Telecel and AT data bundles instantly, straight from our live Jehucal store.",
  keywords: ["Ghana", "mobile data", "AirtelTigo", "Telecel", "MTN", "data bundles", "bundle prices", "AT"],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "littleShop — Mobile data for Ghana",
    description: "Buy MTN, Telecel and AT data bundles instantly.",
    url: SITE_URL,
    siteName: "littleShop",
    locale: "en_GH",
  },
  alternates: { canonical: SITE_URL + "/" },
  twitter: {
    card: "summary_large_image",
    title: "littleShop — Mobile data for Ghana",
    description: "Buy MTN, Telecel and AT data bundles instantly.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
