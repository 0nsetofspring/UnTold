import React, { useState } from 'react';
import Head from 'next/head';
import Navigation from '@/components/Navigation';

interface Widget {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  isInstalled: boolean;
}

export default function WidgetStore() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const widgets: Widget[] = [
    {
      id: 'weather',
      name: '날씨',
      description: '실시간 날씨 정보를 확인하세요',
      icon: '🌤️',
      category: 'information',
      isInstalled: true
    },
    {
      id: 'news',
      name: '뉴스',
      description: '최신 뉴스를 한눈에 보세요',
      icon: '📰',
      category: 'information',
      isInstalled: true
    },
    {
      id: 'exchange',
      name: '환율',
      description: '실시간 환율 정보를 확인하세요',
      icon: '💱',
      category: 'information',
      isInstalled: true
    },
    {
      id: 'nasa',
      name: 'NASA',
      description: '매일 새로운 우주 사진을 감상하세요',
      icon: '🚀',
      category: 'entertainment',
      isInstalled: true
    },
    {
      id: 'quote',
      name: '명언',
      description: '영감을 주는 명언을 매일 받아보세요',
      icon: '💭',
      category: 'entertainment',
      isInstalled: true
    },
    {
      id: 'emotion',
      name: '감정 분석',
      description: 'AI가 분석한 당신의 감정 상태',
      icon: '😊',
      category: 'ai',
      isInstalled: true
    },
    {
      id: 'todo',
      name: '할 일',
      description: '오늘의 할 일을 관리하세요',
      icon: '✅',
      category: 'productivity',
      isInstalled: false
    },
    {
      id: 'calendar',
      name: '캘린더',
      description: '일정을 한눈에 확인하세요',
      icon: '📅',
      category: 'productivity',
      isInstalled: false
    },
    {
      id: 'music',
      name: '음악 추천',
      description: '기분에 맞는 음악을 추천받으세요',
      icon: '🎵',
      category: 'entertainment',
      isInstalled: false
    },
    {
      id: 'health',
      name: '건강 체크',
      description: '일일 건강 상태를 기록하세요',
      icon: '💪',
      category: 'health',
      isInstalled: false
    }
  ];

  const categories = [
    { id: 'all', name: '전체', icon: '📦' },
    { id: 'information', name: '정보', icon: '📊' },
    { id: 'entertainment', name: '엔터테인먼트', icon: '🎮' },
    { id: 'productivity', name: '생산성', icon: '⚡' },
    { id: 'ai', name: 'AI', icon: '🤖' },
    { id: 'health', name: '건강', icon: '🏥' }
  ];

  const filteredWidgets = widgets.filter(widget => {
    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
    const matchesSearch = widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         widget.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <Head>
        <title>위젯 스토어 - Untold</title>
        <meta name="description" content="다양한 위젯을 선택하여 대시보드를 커스터마이징하세요" />
      </Head>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🛍️ 위젯 스토어</h1>
            <p className="text-gray-600">원하는 위젯을 선택하여 대시보드를 커스터마이징하세요</p>
          </header>

          {/* 검색 및 필터 */}
          <div className="card mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="위젯 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category.icon} {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 위젯 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWidgets.map(widget => (
              <div key={widget.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{widget.icon}</div>
                  {widget.isInstalled && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      설치됨
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold mb-2">{widget.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{widget.description}</p>
                
                <button
                  className={`w-full py-2 px-4 rounded-lg transition-colors ${
                    widget.isInstalled
                      ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                      : 'btn-primary'
                  }`}
                  disabled={widget.isInstalled}
                >
                  {widget.isInstalled ? '설치됨' : '설치하기'}
                </button>
              </div>
            ))}
          </div>

          {/* 설치된 위젯 관리 */}
          <div className="card mt-8">
            <h2 className="text-xl font-semibold mb-4">⚙️ 설치된 위젯 관리</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {widgets.filter(w => w.isInstalled).map(widget => (
                <div key={widget.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{widget.icon}</span>
                    <span className="font-medium">{widget.name}</span>
                  </div>
                  <button className="text-red-500 hover:text-red-700 text-sm">
                    제거
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 