import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { mochiy, kosugi } from "@/app/fonts";
import { GoogleTagManager } from "@next/third-parties/google";


export const metadata = {
  metadataBase: new URL("https://www.dqx-tool.com"),
  title: {
    default: "DQX Tools | ドラクエ10向け便利ツール集",
    template: "%s | DQX Tools",
  },
  description:
    "ドラクエ10の装備、宝珠、レアドロップ、モンスター出現位置などをまとめて調べられる便利ツール集。",
  keywords: [
    "DQX Tools",
    "ドラクエ10",
    "ドラゴンクエスト10",
    "宝珠",
    "レアドロップ",
    "モンスター検索",
    "職人",
    "原価計算",
    "装備",
    "マップ",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "DQX Tools | ドラクエ10向け便利ツール集",
    description:
      "ドラクエ10の装備、宝珠、レアドロップ、モンスター出現位置などをまとめて調べられる便利ツール集。",
    url: "https://www.junsan.info",
    siteName: "DQX Tools",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "DQX Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DQX Tools | ドラクエ10向け便利ツール集",
    description:
      "ドラクエ10の装備、宝珠、レアドロップ、モンスター出現位置などをまとめて調べられる便利ツール集。",
    images: ["/og.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={` antialiased ${kosugi.className} ${mochiy.variable}`}>
          <Header />
          {children}
          <Footer />
      </body>
      {process.env.NODE_ENV === "production" && (
        <GoogleTagManager gtmId="GTM-K29NKBTR" />
      )}
    </html>
  );
}

