import React, { useState, useEffect } from 'react';
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
  const [widgets, setWidgets] = useState<Widget[]>([]);

  // 초기 위젯 데이터
  const initialWidgets: Widget[] = [
    {
      id: 'random-dog',
      name: '오늘의 강아지',
      description: '매일 새로운 강아지 사진을 감상하세요',
      icon: '🐶',
      category: 'entertainment',
      isInstalled: false
    },
    {
      id: 'advice',
      name: '오늘의 명언',
      description: '매일 새로운 명언을 감상하세요',
      icon: '💭',
      category: 'information',
      isInstalled: false
    },
    {
      id: 'book',
      name: '주목할 만한 신간 리스트',
      description: '알라딘 주목할 만한 신간 리스트를 감상하세요',
      icon: '📚',
      category: 'information',
      isInstalled: false
    },
    {
      id: 'weather',
      name: '날씨',
      description: '오늘의 날씨를 확인하세요',
      icon: '🌤️',
      category: 'information',
      isInstalled: false
    },
    {
      id: 'news',
      name: '뉴스',
      description: '오늘의 뉴스를 확인하세요',
      icon: '📰',
      category: 'information',
      isInstalled: false
    }
  ];

  const categories = [
    { id: 'all', name: '전체', icon: '📦' },
    { id: 'entertainment', name: '엔터테인먼트', icon: '🎮' },
    { id: 'information', name: '정보', icon: '📊' }
  ];

  // localStorage에서 설치된 위젯 불러오기
  useEffect(() => {
    const savedWidgets = localStorage.getItem('installedWidgets');
    if (savedWidgets) {
      const installedIds = JSON.parse(savedWidgets);
      const updatedWidgets = initialWidgets.map(widget => ({
        ...widget,
        isInstalled: installedIds.includes(widget.id)
      }));
      setWidgets(updatedWidgets);
    } else {
      setWidgets(initialWidgets);
    }
  }, []);

  // 위젯 설치/제거 함수
  const toggleWidget = (widgetId: string) => {
    const updatedWidgets = widgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, isInstalled: !widget.isInstalled }
        : widget
    );
    setWidgets(updatedWidgets);

    // localStorage에 저장
    const installedIds = updatedWidgets
      .filter(w => w.isInstalled)
      .map(w => w.id);
    localStorage.setItem('installedWidgets', JSON.stringify(installedIds));
  };

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
                  onClick={() => toggleWidget(widget.id)}
                  className={`w-full py-2 px-4 rounded-lg transition-colors ${
                    widget.isInstalled
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'btn-primary'
                  }`}
                >
                  {widget.isInstalled ? '제거하기' : '추가하기'}
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
                  <button 
                    onClick={() => toggleWidget(widget.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    제거
                  </button>
                </div>
              ))}
              {widgets.filter(w => w.isInstalled).length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-8">
                  아직 추가된 위젯이 없습니다. 위에서 원하는 위젯을 추가해보세요!
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 