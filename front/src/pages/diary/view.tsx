import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Navigation from '@/components/Navigation';
import { supabase } from '@/api/supabaseClient';
import { useRouter } from 'next/router';

interface Card {
  id: string;
  diary_id: string;
  source_type: string;
  category: string;
  content: string;
  image_url?: string;
  layout_type: string;
  row?: number;
  col?: number;
  order_index?: number;
  text_generated: boolean;
  text_final: string;
  created_at: string;
}

interface Diary {
  id: string;
  user_id: string;
  date: string;
  status: string;
  mood_vector: number[];
  final_text: string;
  agent_version: string;
  created_at: string;
  updated_at: string;
}

export default function DiaryView() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [diary, setDiary] = useState<Diary | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiLayout, setAiLayout] = useState<any>(null);

  // 한국 시간으로 날짜 문자열 생성
  const getKoreanDateString = (date: Date) => {
    const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
    return koreanTime.toISOString().split('T')[0];
  };

  // URL 파라미터에서 날짜 가져오기
  useEffect(() => {
    if (router.isReady) {
      const { date } = router.query;
      if (date && typeof date === 'string') {
        const parsedDate = new Date(date);
        console.log(`📅 view URL에서 날짜 파싱: ${date} → ${parsedDate.toISOString()}`);
        setSelectedDate(parsedDate);
      }
    }
  }, [router.isReady, router.query]);

  // 일기 데이터 로드
  useEffect(() => {
    const loadDiaryData = async () => {
      try {
        setIsLoading(true);
        
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          console.error('사용자 정보를 가져올 수 없습니다.', userError);
          router.push('/');
          return;
        }

        const dateString = getKoreanDateString(selectedDate);
        console.log(`📅 view 일기 데이터 로드: ${selectedDate.toISOString()} → ${dateString}`);
        console.log(`📅 사용자 ID: ${userData.user.id}`);

        // 일기 데이터 가져오기
        const { data: diaryData, error: diaryError } = await supabase
          .from('diaries')
          .select('*')
          .eq('user_id', userData.user.id)
          .eq('date', dateString)
          .maybeSingle();

        console.log(`📅 일기 조회 결과:`, diaryData ? '찾음' : '없음', diaryError);

        if (diaryError) {
          console.error('일기 데이터 로드 실패:', diaryError);
          return;
        }

        if (diaryData) {
          setDiary(diaryData);
          
          // 카드 데이터 가져오기 (사용자 레이아웃 순서대로)
          const { data: cardsData, error: cardsError } = await supabase
            .from('cards')
            .select('*')
            .eq('diary_id', diaryData.id)
            .order('row', { ascending: true })
            .order('col', { ascending: true });

          if (!cardsError && cardsData) {
            setCards(cardsData);
            
            // AI 레이아웃 생성 (카드들의 row, col 정보로)
            const layout: any = {};
            cardsData.forEach(card => {
              if (card.row !== undefined && card.col !== undefined) {
                layout[card.id] = {
                  row: card.row,
                  col: card.col,
                  order_index: card.order_index
                };
              }
            });
            setAiLayout(layout);
          }
        }
        
      } catch (error) {
        console.error('일기 데이터 로드 중 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedDate) {
      loadDiaryData();
    }
  }, [selectedDate, router]);

  // AI 레이아웃 그리드 렌더링
  const renderAiLayoutGrid = () => {
    const grid = Array(3).fill(null).map(() => Array(4).fill(null));
    
    if (aiLayout) {
      Object.entries(aiLayout).forEach(([cardId, layout]: [string, any]) => {
        if (layout.row >= 0 && layout.row < 3 && layout.col >= 0 && layout.col < 4) {
          grid[layout.row][layout.col] = { cardId, layout };
        }
      });
    }

    return (
      <div className="grid grid-cols-4 gap-3 p-4 bg-blue-50 rounded-lg">
        {grid.map((row, rowIndex) => 
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`
                aspect-square border-2 rounded-lg p-2 flex items-center justify-center text-xs
                ${cell ? 'border-blue-400 bg-white shadow-sm' : 'border-gray-200 bg-white'}
              `}
            >
              {cell ? (
                <div className="text-center w-full">
                  <div className="font-medium text-blue-800 truncate text-xs">
                    {(() => {
                      const card = cards.find(c => c.id === cell.cardId);
                      if (!card) return '제목 없음';
                      
                      // 사용자 업로드 이미지의 경우 제목을 간단하게 표시
                      if (card.source_type === 'custom') {
                        return '사용자 이미지';
                      }
                      
                      return card.text_final || '제목 없음';
                    })()}
                  </div>
                  <div className="text-gray-500 text-xs mt-1">
                    {(() => {
                      const sourceType = cards.find(c => c.id === cell.cardId)?.source_type;
                      if (sourceType === 'custom') return '사용자 업로드';
                      if (sourceType === 'chrome') return '브라우징';
                      if (sourceType === 'widget') return '위젯';
                      return sourceType || 'unknown';
                    })()}
                  </div>
                  {cards.find(c => c.id === cell.cardId)?.image_url && (
                    <div className="mt-1">
                      <img
                        src={cards.find(c => c.id === cell.cardId)?.image_url}
                        alt="카드 이미지"
                        className="w-12 h-12 object-cover rounded mx-auto"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400 text-xs"></div>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <title>일기 보기 - Untold</title>
          <meta name="description" content="저장된 일기 보기" />
        </Head>
        <Navigation />
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-5">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">일기를 불러오는 중...</p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!diary || diary.status !== 'finalized') {
    return (
      <>
        <Head>
          <title>일기 보기 - Untold</title>
          <meta name="description" content="저장된 일기 보기" />
        </Head>
        <Navigation />
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-5">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="text-6xl mb-6">📝</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
              </h1>
              <p className="text-gray-600 mb-6">
                이 날짜에 저장된 일기가 없습니다.
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => router.push(`/diary?date=${selectedDate.toISOString().split('T')[0]}`)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  ✍️ 일기 작성하기
                </button>
                <button
                  onClick={() => router.push('/diary/calendar')}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  📅 캘린더로 돌아가기
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>일기 보기 - Untold</title>
        <meta name="description" content="저장된 일기 보기" />
      </Head>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-5">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  📖 {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일기
                </h1>
                <p className="text-gray-600">
                  AI가 추천한 레이아웃으로 구성된 일기입니다
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => router.push(`/diary?date=${selectedDate.toISOString().split('T')[0]}`)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  ✏️ 수정하기
                </button>
                <button
                  onClick={() => router.push('/diary/calendar')}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  📅 캘린더로
                </button>
              </div>
            </div>
          </header>

          {/* 일기 내용 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
            <h2 className="text-xl font-semibold mb-4">📝 LoRA 생성 일기 내용</h2>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border-l-4 border-purple-400">
              <div className="flex items-center mb-3">
                <span className="text-purple-600 mr-2">🤖</span>
                <span className="text-sm font-medium text-purple-700">AI가 개인화하여 생성한 텍스트</span>
              </div>
              <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {diary.final_text}
              </p>
            </div>
          </div>

          {/* 사용자 레이아웃 배치 */}
          {cards.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
              <h2 className="text-xl font-semibold mb-4">🎯 사용자 드래그앤드롭 레이아웃</h2>
              <p className="text-gray-600 mb-4">
                사용자가 드래그 앤 드롭으로 직접 수정한 카드들의 최종 위치입니다.
              </p>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-l-4 border-green-400 mb-4">
                <div className="flex items-center mb-2">
                  <span className="text-green-600 mr-2">👆</span>
                  <span className="text-sm font-medium text-green-700">사용자가 직접 배치한 위치</span>
                </div>
                <p className="text-xs text-green-600">
                  각 카드를 드래그하여 원하는 위치에 배치한 결과입니다.
                </p>
              </div>
              {renderAiLayoutGrid()}
            </div>
          )}

          {/* 감정 분석 */}
          {diary.mood_vector && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
              <h2 className="text-xl font-semibold mb-4">🎭 감정 분석</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">😊</span>
                    <h3 className="text-lg font-semibold text-green-800">Valence (긍정성)</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    {diary.mood_vector[0]?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {diary.mood_vector[0] > 0.5 ? '매우 긍정적' : 
                     diary.mood_vector[0] > 0 ? '긍정적' : 
                     diary.mood_vector[0] > -0.5 ? '중립적' : '부정적'}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">⚡</span>
                    <h3 className="text-lg font-semibold text-blue-800">Arousal (각성도)</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    {diary.mood_vector[1]?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    {diary.mood_vector[1] > 0.5 ? '매우 활발' : 
                     diary.mood_vector[1] > 0 ? '활발' : 
                     diary.mood_vector[1] > -0.5 ? '보통' : '차분'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 카드 목록 */}
          {cards.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <h2 className="text-xl font-semibold mb-4">📋 사용된 카드들 ({cards.length}개)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card) => (
                  <div key={card.id} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-start space-x-3">
                      {card.image_url && (
                        <div className="flex-shrink-0">
                          <img
                            src={card.image_url}
                            alt="카드 이미지"
                            className="w-12 h-12 object-cover rounded border"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {card.text_final}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {card.source_type} • {card.category}
                        </p>
                        {card.row !== undefined && card.col !== undefined && (
                          <p className="text-xs text-blue-600 mt-1">
                            위치: ({card.row}, {card.col})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
} 