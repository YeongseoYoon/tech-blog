import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "기술 블로그",
  description: "개발자의 기술 블로그",
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
                className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
              >
                기술 블로그
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
              <p>&copy; 2025 기술 블로그. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
