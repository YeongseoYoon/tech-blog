import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";

export const metadata: Metadata = {
  title: "yeongseo-blog",
  description: "개발자의 기술 블로그",
  icons: {
    icon: [
      {
        url: "/static/favicons/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/static/favicons/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      { url: "/static/favicons/favicon.ico", sizes: "any" },
    ],
    apple: [
      {
        url: "/static/favicons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/static/favicons/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-white text-gray-900 antialiased">
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <a
                href="/"
                className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
              >
                <Image
                  src="/static/images/logo.png"
                  alt="yeongseo-blog logo"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                yeongseo-blog
              </a>
              <div className="flex items-center gap-8">
                <a
                  href="/"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  홈
                </a>
                <a
                  href="/about"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  About
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-gray-100 mt-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
            <div className="text-center text-sm text-gray-500">
              <p>&copy; 2025 yeongseo-blog. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
