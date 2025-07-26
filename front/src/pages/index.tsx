import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function Home() {
  return (
    <>
      <Head>
        <title>Untold - 나도 몰랐던 나를 아는 방법</title>
        <meta name="description" content="하나의 웹 탭에서 아침 대시보드와 밤 자동 일기를 제공하는 올‑인‑원 서비스" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-6">
              📑 <span className="text-primary-600">Untold</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              나도 몰랐던 나를 아는 방법
            </p>
            <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
              하나의 웹 탭에서 <strong>아침 대시보드</strong>(정보·감정 추천)와 
              <strong>밤 자동 일기</strong>(OCR·AI 초안)를 제공하는 올‑인‑원 서비스
            </p>
            
            {/* 주요 기능 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="card text-center">
                <div className="text-4xl mb-4">🌅</div>
                <h3 className="text-xl font-semibold mb-2">아침 대시보드</h3>
                <p className="text-gray-600 mb-4">날씨, 뉴스, 환율, NASA, 명언 등 다양한 위젯으로 하루를 시작하세요</p>
                <Link href="/dashboard" className="btn-primary">
                  대시보드 보기
                </Link>
              </div>
              
              <div className="card text-center">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-xl font-semibold mb-2">AI 일기 작성</h3>
                <p className="text-gray-600 mb-4">AI가 도와주는 자동 일기 작성으로 하루를 마무리하세요</p>
                <Link href="/write-diary" className="btn-primary">
                  일기 작성하기
                </Link>
              </div>
              
              <div className="card text-center">
                <div className="text-4xl mb-4">🛍️</div>
                <h3 className="text-xl font-semibold mb-2">위젯 스토어</h3>
                <p className="text-gray-600 mb-4">원하는 위젯을 선택하여 나만의 대시보드를 만들어보세요</p>
                <Link href="/widget-store" className="btn-primary">
                  스토어 보기
                </Link>
              </div>
            </div>

            <div className="space-x-4">
              <Link href="/dashboard" className="btn-primary">
                시작하기
              </Link>
              <button className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors">
                더 알아보기
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 