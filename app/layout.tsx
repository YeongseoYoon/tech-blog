import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '기술 블로그',
  description: '개발자의 기술 블로그',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-white text-gray-900">
        <nav className="border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-2xl font-bold text-primary">
              💻 기술 블로그
            </a>
            <div className="flex gap-6">
              <a href="/" className="text-gray-600 hover:text-primary transition">
                홈
              </a>
              <a href="/#tags" className="text-gray-600 hover:text-primary transition">
                태그
              </a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="border-t border-gray-200 mt-12">
          <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-600">
            <p>&copy; 2025 기술 블로그. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

