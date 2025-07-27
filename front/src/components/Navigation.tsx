import React from 'react';
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
              📑 Untold
            </Link>
          </div>
          <div className="hidden md:flex space-x-8">
            <Link href="/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors">
              🌅 대시보드
            </Link>
            <Link href="/diary/writeDiary" className="text-gray-700 hover:text-primary-600 transition-colors">
              📝 일기 작성
            </Link>
            <Link href="/widget-store" className="text-gray-700 hover:text-primary-600 transition-colors">
              🛍️ 위젯 스토어
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 