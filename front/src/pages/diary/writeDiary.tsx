import React, { useState } from 'react';
import Head from 'next/head';
import Navigation from '@/components/Navigation';

export default function WriteDiary() {
  const [diaryText, setDiaryText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDiary = () => {
    setIsGenerating(true);
    // 실제로는 AI API 호출
    setTimeout(() => {
      setDiaryText(`오늘은 정말 바쁜 하루였다. 아침에 일어나서 대시보드를 확인했는데, 날씨가 맑아서 기분이 좋았다. 

점심에는 새로운 프로젝트에 대해 회의를 했는데, 팀원들과 좋은 아이디어를 많이 나눌 수 있었다. 

저녁에는 집에서 조용히 시간을 보내며 내일을 위한 계획을 세웠다. 

전반적으로 만족스러운 하루였다.`);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <>
      <Head>
        <title>일기 작성 - Untold</title>
        <meta name="description" content="AI가 도와주는 자동 일기 작성" />
      </Head>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📝 밤의 일기</h1>
            <p className="text-gray-600">AI가 도와주는 자동 일기 작성</p>
          </header>

          {/* 일기 생성 섹션 */}
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">✨ AI 일기 생성</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    오늘의 키워드
                  </label>
                  <input
                    type="text"
                    placeholder="예: 회의, 운동, 독서..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    오늘의 감정
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>😊 기쁨</option>
                    <option>😔 슬픔</option>
                    <option>😡 화남</option>
                    <option>😌 평온</option>
                    <option>🤔 고민</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={handleGenerateDiary}
                disabled={isGenerating}
                className="btn-primary w-full"
              >
                {isGenerating ? '일기 생성 중...' : '🤖 AI로 일기 생성하기'}
              </button>
            </div>
          </div>

          {/* 일기 편집 섹션 */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">✏️ 일기 편집</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  일기 내용
                </label>
                <textarea
                  value={diaryText}
                  onChange={(e) => setDiaryText(e.target.value)}
                  placeholder="AI가 생성한 일기를 편집하거나 직접 작성하세요..."
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
              
              <div className="flex space-x-3">
                <button className="btn-primary flex-1">
                  💾 일기 저장
                </button>
                <button className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex-1">
                  📤 공유하기
                </button>
              </div>
            </div>
          </div>

          {/* 최근 일기 목록 */}
          <div className="card mt-6">
            <h2 className="text-xl font-semibold mb-4">📚 최근 일기</h2>
            <div className="space-y-3">
              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="font-medium">2024년 1월 15일</div>
                <div className="text-sm text-gray-600">오늘은 정말 바쁜 하루였다...</div>
              </div>
              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="font-medium">2024년 1월 14일</div>
                <div className="text-sm text-gray-600">주말이라서 여유롭게...</div>
              </div>
              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="font-medium">2024년 1월 13일</div>
                <div className="text-sm text-gray-600">새로운 프로젝트를 시작했다...</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 