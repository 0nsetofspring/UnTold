import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navigation from '@/components/Navigation';
import { useRouter } from 'next/router';
import Masonry from 'react-masonry-css'; // Masonry 컴포넌트 import

import RandomDogWidget from '../../components/widget/randomdogWidget';
import AdviceWidget from '../../components/widget/adviceWidget';
import BookWidget from '../../components/widget/bookWidget';
import WeatherWidget from '../../components/widget/weatherWidget';
import NewsWidget from '../../components/widget/newsWidget';

interface Widget {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  isInstalled: boolean;
}

export default function Dashboard() {
  const [installedWidgets, setInstalledWidgets] = useState<string[]>([]);
  const router = useRouter();

  // localStorage에서 설치된 위젯 불러오기
  useEffect(() => {
    const savedWidgets = localStorage.getItem('installedWidgets');
    if (savedWidgets) {
      const widgets = JSON.parse(savedWidgets);
      setInstalledWidgets(widgets);
    }
  }, []);

  // 위젯 데이터
  const widgetData = {
    'random-dog': {
      name: '오늘의 강아지',
      icon: '🐶',
      component: RandomDogWidget
    },
    'advice': {
      name: '오늘의 명언',
      icon: '💭',
      component: AdviceWidget
    },
    'book': {
      name: '주목할 만한 신간 리스트',
      icon: '📚',
      component: BookWidget
    },
    'weather': {
      name: '날씨',
      icon: '🌤️',
      component: WeatherWidget
    },
    'news': {
      name: '뉴스',
      icon: '📰',
      component: NewsWidget
    }
  };

  // Masonry 레이아웃의 반응형 컬럼 개수를 설정합니다.
  const breakpointColumnsObj = {
    default: 3, // 기본 3칸
    1024: 2,    // 1024px 이하에서는 2칸
    768: 1      // 768px 이하에서는 1칸
  };

  const handleAddWidget = () => {
    router.push('/widget-store');
  };

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
          {installedWidgets.length > 0 ? (
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="my-masonry-grid"
              columnClassName="my-masonry-grid_column"
            >
              {installedWidgets.map(widgetId => {
                const widget = widgetData[widgetId as keyof typeof widgetData];
                if (!widget) {
                  return null;
                }
                
                return (
                  <div key={widgetId} className="card">
                    <h3 className="text-lg font-semibold mb-4">{widget.icon} {widget.name}</h3>
                    <widget.component />
                  </div>
                );
              })}
            </Masonry>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📱</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">위젯을 추가해보세요!</h2>
              <p className="text-gray-600 mb-8">대시보드에 표시할 위젯을 선택하여 개인화된 대시보드를 만들어보세요.</p>
              <button onClick={handleAddWidget} className="btn-primary">
                🛍️ 위젯 스토어 가기
              </button>
            </div>
          )}

          {/* 위젯 추가 버튼 */}
          {installedWidgets.length > 0 && (
            <div className="mt-8 text-center">
              <button onClick={handleAddWidget} className="btn-primary">
                + 위젯 추가하기
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
} 