import React from 'react';
import Head from 'next/head';
import Navigation from '@/components/Navigation';

export default function Dashboard() {
  return (
    <>
      <Head>
        <title>대시보드 - Untold</title>
        <meta name="description" content="아침 대시보드 - 정보와 감정 추천" />
      </Head>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🌅 아침 대시보드</h1>
            <p className="text-gray-600">오늘의 정보와 감정을 확인해보세요</p>
          </header>

          {/* 위젯 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 날씨 위젯 */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">🌤️ 날씨</h3>
              <div className="text-center">
                <div className="text-4xl mb-2">☀️</div>
                <div className="text-2xl font-bold">23°C</div>
                <div className="text-gray-600">맑음</div>
                <div className="text-sm text-gray-500 mt-2">서울시 강남구</div>
              </div>
            </div>

            {/* 뉴스 위젯 */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">📰 뉴스</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-blue-500 pl-3">
                  <div className="text-sm font-medium">주요 뉴스 제목</div>
                  <div className="text-xs text-gray-500">2시간 전</div>
                </div>
                <div className="border-l-4 border-green-500 pl-3">
                  <div className="text-sm font-medium">기술 뉴스 제목</div>
                  <div className="text-xs text-gray-500">4시간 전</div>
                </div>
              </div>
            </div>

            {/* 환율 위젯 */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">💱 환율</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>USD</span>
                  <span className="font-semibold">1,350원</span>
                </div>
                <div className="flex justify-between">
                  <span>EUR</span>
                  <span className="font-semibold">1,480원</span>
                </div>
                <div className="flex justify-between">
                  <span>JPY</span>
                  <span className="font-semibold">9.2원</span>
                </div>
              </div>
            </div>

            {/* NASA 이미지 위젯 */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">🚀 NASA</h3>
              <div className="bg-gray-200 rounded-lg h-32 mb-3 flex items-center justify-center">
                <span className="text-gray-500">우주 이미지</span>
              </div>
              <div className="text-sm text-gray-600">오늘의 우주 사진</div>
            </div>

            {/* 명언 위젯 */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">💭 명언</h3>
              <blockquote className="italic text-gray-700 mb-3">
                "성공은 최종 목표가 아니라, 매일의 노력의 결과입니다."
              </blockquote>
              <div className="text-sm text-gray-500">- 알베르트 아인슈타인</div>
            </div>

            {/* 감정 분석 위젯 */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">😊 감정 분석</h3>
              <div className="text-center">
                <div className="text-4xl mb-2">😊</div>
                <div className="text-lg font-semibold text-green-600">긍정적</div>
                <div className="text-sm text-gray-600 mt-2">기분이 좋은 하루</div>
              </div>
            </div>
          </div>

          {/* 위젯 추가 버튼 */}
          <div className="mt-8 text-center">
            <button className="btn-primary">
              + 위젯 추가하기
            </button>
          </div>
        </div>
      </main>
    </>
  );
} 