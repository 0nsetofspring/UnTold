import React, { useState } from 'react';
import Head from 'next/head';
import Navigation from '@/components/Navigation';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface DiaryEntry {
  date: string;
  mood: string;
  hasEntry: boolean;
}

interface DraggedItem {
  id: string;
  type: 'widget' | 'chrome';
  content: string;
  title: string;
}

export default function WriteDiary() {
  const [viewMode, setViewMode] = useState<'calendar' | 'write' | 'read'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [diaryText, setDiaryText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draggedItems, setDraggedItems] = useState<DraggedItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const today = new Date();
  
  // 샘플 일기 데이터 (실제로는 API에서 가져올 예정)
  const [diaries, setDiaries] = useState<DiaryEntry[]>([
    { date: '2025-07-01', mood: '😊', hasEntry: true },
    { date: '2025-07-03', mood: '😌', hasEntry: true },
    { date: '2025-07-05', mood: '🤔', hasEntry: true },
    { date: '2025-07-08', mood: '😊', hasEntry: true },
    { date: '2025-07-10', mood: '😔', hasEntry: true },
    { date: '2025-07-12', mood: '😌', hasEntry: true },
    { date: '2025-07-15', mood: '😊', hasEntry: true },
    { date: '2025-07-17', mood: '🤔', hasEntry: true },
    { date: '2025-07-19', mood: '😌', hasEntry: true },
    { date: '2025-07-22', mood: '😊', hasEntry: true },
    { date: '2025-07-24', mood: '😔', hasEntry: true },
    { date: '2025-07-26', mood: '😌', hasEntry: true },
    { date: '2025-07-28', mood: '😊', hasEntry: true },
  ]);
  
  // 오늘 날짜인지 확인하는 함수
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  // 기존 getDiaryInfo를 diaries에서 찾도록 변경
  const getDiaryInfo = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return diaries.find((d) => d.date === dateString);
  };

  // 일기 저장 핸들러
  const handleSaveDiary = (mood: string) => {
    const dateString = selectedDate.toISOString().split('T')[0];
    setDiaries((prev) => {
      // 이미 있으면 수정, 없으면 추가
      const exists = prev.some((d) => d.date === dateString);
      if (exists) {
        return prev.map((d) =>
          d.date === dateString ? { ...d, mood, hasEntry: true } : d
        );
      } else {
        return [...prev, { date: dateString, mood, hasEntry: true }];
      }
    });
    setViewMode('calendar');
  };

  // 일기 작성 모드로 전환
  const handleWriteDiary = (date?: Date) => {
    setSelectedDate(date || today);
    setViewMode('write');
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    const diaryInfo = getDiaryInfo(date);
    if (diaryInfo && diaryInfo.hasEntry) {
      setViewMode('read');
    } else {
      setViewMode('write');
    }
    setSelectedDate(date);
  };

  // 드래그 앤 드롭 핸들러들
  const handleDragStart = (e: React.DragEvent, item: DraggedItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const itemData = e.dataTransfer.getData('application/json');
      const item: DraggedItem = JSON.parse(itemData);
      
      setDraggedItems(prev => [...prev, item]);
      
      // 일기 텍스트에 추가
      const newContent = `\n\n[${item.title}]\n${item.content}`;
      setDiaryText(prev => prev + newContent);
    } catch (error) {
      console.error('드롭 데이터 파싱 오류:', error);
    }
  };

  // 캘린더로 돌아가기
  const handleBackToCalendar = () => {
    setViewMode('calendar');
    setDiaryText('');
  };

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

  // 캘린더 타일 렌더링 커스터마이징
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const diaryInfo = getDiaryInfo(date);
      const isTodayDate = isToday(date);
      
      return (
        <div className="relative w-full h-full flex flex-col items-center justify-start cursor-pointer pt-2" onClick={() => handleDateClick(date)}>
          {/* 날짜 - 상단에 배치 */}
          <div className={`font-bold ${isTodayDate ? 'text-blue-600 text-xl' : 'text-gray-700'} mb-2`}>
            {date.getDate()}
          </div>
          
          {/* 일기 상태 표시 - 이모지만 (더 크게) */}
          {diaryInfo && diaryInfo.hasEntry && (
            <div className="text-4xl">
              {diaryInfo.mood}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // 캘린더 타일 클래스 커스터마이징
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const diaryInfo = getDiaryInfo(date);
      const isTodayDate = isToday(date);
      
      // 공휴일 체크 (2025년 7월 기준)
      const holidays = [
        '2025-07-01', // 없음
        '2025-07-17', // 제헌절
      ];
      const dateString = date.toISOString().split('T')[0];
      const isHoliday = holidays.includes(dateString);
      
      // 주말 체크 (일요일: 0, 토요일: 6)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      let className = '';
      
      if (isTodayDate) {
        className = 'bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-300 rounded-full shadow-lg transform scale-110';
      } else if (diaryInfo && diaryInfo.hasEntry) {
        className = 'bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all duration-200';
      } else if (isHoliday) {
        className = 'hover:bg-red-50 rounded-lg transition-all duration-200';
      } else if (isWeekend) {
        className = 'hover:bg-red-50 rounded-lg transition-all duration-200';
      } else {
        className = 'hover:bg-blue-50 rounded-lg transition-all duration-200';
      }
      
      return className;
    }
    return '';
  };

  return (
    <>
      <Head>
        <title>일기 작성 - Untold</title>
        <meta name="description" content="AI가 도와주는 자동 일기 작성" />
      </Head>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">📝 밤의 일기</h1>
            <p className="text-gray-600 text-lg">AI가 도와주는 자동 일기 작성</p>
          </header>

          {viewMode === 'calendar' ? (
            /* 캘린더 뷰 */
            <div className="h-screen flex flex-col">
              <div className="flex-1 flex items-center justify-center p-6">
                <Calendar
                  onChange={(value) => { if (value instanceof Date) { setSelectedDate(value); } }}
                  value={selectedDate}
                  tileContent={tileContent}
                  tileClassName={tileClassName}
                  className="w-full h-full border-0 bg-transparent text-3xl"
                  formatDay={(locale, date) => ''}
                  calendarType="gregory"
                />
              </div>
              <div className="flex justify-center p-6">
                <button
                  onClick={() => handleWriteDiary()}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-4 px-10 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
                >
                  ✏️ 오늘 일기 쓰기
                </button>
              </div>
            </div>
          ) : (
            /* 일기 작성/읽기 뷰 */
            <div className="max-w-4xl mx-auto">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedDate.toLocaleDateString('ko-KR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'long'
                    })} 일기
                  </h2>
                  <p className="text-gray-600">
                    {viewMode === 'read' ? '기존 일기 보기' : 'AI가 도와주는 자동 일기 작성'}
                  </p>
                </div>
                <button
                  onClick={handleBackToCalendar}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  ← 캘린더로
                </button>
              </div>

              {viewMode === 'read' ? (
                /* 읽기 모드 */
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">📖 일기 읽기</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getDiaryInfo(selectedDate)?.mood}</span>
                      <span className="text-sm text-gray-600">기분</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <p className="text-gray-800 leading-relaxed">
                      오늘은 정말 바쁜 하루였다. 아침에 일어나서 대시보드를 확인했는데, 날씨가 맑아서 기분이 좋았다. 
                      <br /><br />
                      점심에는 새로운 프로젝트에 대해 회의를 했는데, 팀원들과 좋은 아이디어를 많이 나눌 수 있었다. 
                      <br /><br />
                      저녁에는 집에서 조용히 시간을 보내며 내일을 위한 계획을 세웠다. 
                      <br /><br />
                      전반적으로 만족스러운 하루였다.
                    </p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setViewMode('write')}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex-1"
                    >
                      ✏️ 수정하기
                    </button>
                    <button className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex-1">
                      📤 공유하기
                    </button>
                  </div>
                </div>
              ) : (
                /* 작성 모드 */
                <div className="grid grid-cols-3 gap-8">
                  {/* 왼쪽: Context 창 (30%) */}
                  <div className="space-y-6">
                    {/* 위젯 스크랩 */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                      <h3 className="text-xl font-semibold mb-4">📌 위젯 스크랩</h3>
                      <div className="space-y-3">
                        <div 
                          className="bg-blue-50 p-3 rounded-lg border border-blue-200 cursor-move hover:bg-blue-100 transition-colors"
                          draggable
                          onDragStart={(e) => handleDragStart(e, {
                            id: 'weather-1',
                            type: 'widget',
                            title: '오늘 날씨',
                            content: '오늘 날씨: 맑음, 26°C\n체감온도 27°C, 습도 90%'
                          })}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">🌤️</span>
                            <div>
                              <p className="font-medium text-sm">오늘 날씨: 맑음, 26°C</p>
                              <p className="text-xs text-gray-600">체감온도 27°C, 습도 90%</p>
                            </div>
                          </div>
                        </div>
                        <div 
                          className="bg-green-50 p-3 rounded-lg border border-green-200 cursor-move hover:bg-green-100 transition-colors"
                          draggable
                          onDragStart={(e) => handleDragStart(e, {
                            id: 'book-1',
                            type: 'widget',
                            title: '새로 읽은 책',
                            content: '새로 읽은 책: "눈 맞추는 소설"\n개와 고양이와 새와 그리고'
                          })}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">📚</span>
                            <div>
                              <p className="font-medium text-sm">새로 읽은 책: "눈 맞추는 소설"</p>
                              <p className="text-xs text-gray-600">개와 고양이와 새와 그리고</p>
                            </div>
                          </div>
                        </div>
                        <div 
                          className="bg-purple-50 p-3 rounded-lg border border-purple-200 cursor-move hover:bg-purple-100 transition-colors"
                          draggable
                          onDragStart={(e) => handleDragStart(e, {
                            id: 'quote-1',
                            type: 'widget',
                            title: '오늘의 명언',
                            content: '오늘의 명언\n"작은 진전도 진전이다"'
                          })}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">💭</span>
                            <div>
                              <p className="font-medium text-sm">오늘의 명언</p>
                              <p className="text-xs text-gray-600">"작은 진전도 진전이다"</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 크롬 로그 */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                      <h3 className="text-xl font-semibold mb-4">🌐 크롬 로그</h3>
                      <div className="space-y-2">
                        <div 
                          className="bg-gray-50 p-2 rounded border border-gray-200 cursor-move hover:bg-gray-100 transition-colors"
                          draggable
                          onDragStart={(e) => handleDragStart(e, {
                            id: 'chrome-1',
                            type: 'chrome',
                            title: 'GitHub - 프로젝트 관리',
                            content: 'GitHub - 프로젝트 관리\ngithub.com/untold-project'
                          })}
                        >
                          <p className="text-sm font-medium">GitHub - 프로젝트 관리</p>
                          <p className="text-xs text-gray-600">github.com/untold-project</p>
                        </div>
                        <div 
                          className="bg-gray-50 p-2 rounded border border-gray-200 cursor-move hover:bg-gray-100 transition-colors"
                          draggable
                          onDragStart={(e) => handleDragStart(e, {
                            id: 'chrome-2',
                            type: 'chrome',
                            title: 'Stack Overflow - React 문제 해결',
                            content: 'Stack Overflow - React 문제 해결\nstackoverflow.com/questions/...'
                          })}
                        >
                          <p className="text-sm font-medium">Stack Overflow - React 문제 해결</p>
                          <p className="text-xs text-gray-600">stackoverflow.com/questions/...</p>
                        </div>
                        <div 
                          className="bg-gray-50 p-2 rounded border border-gray-200 cursor-move hover:bg-gray-100 transition-colors"
                          draggable
                          onDragStart={(e) => handleDragStart(e, {
                            id: 'chrome-3',
                            type: 'chrome',
                            title: 'Medium - AI 기술 트렌드',
                            content: 'Medium - AI 기술 트렌드\nmedium.com/ai-trends-2025'
                          })}
                        >
                          <p className="text-sm font-medium">Medium - AI 기술 트렌드</p>
                          <p className="text-xs text-gray-600">medium.com/ai-trends-2025</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 오른쪽: 일기 작성 영역 (70%) */}
                  <div className="col-span-2">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                      <h3 className="text-xl font-semibold mb-4">📝 일기 작성</h3>
                      <div className="space-y-4">
                        {/* 드롭 영역 */}
                        <div 
                          className={`min-h-32 border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
                            isDragOver 
                              ? 'border-blue-400 bg-blue-50' 
                              : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <div className="text-center text-gray-500">
                            <p className="text-sm">
                              {isDragOver ? '여기에 놓으세요!' : '위젯 스크랩이나 크롬 로그를 여기로 드래그하세요'}
                            </p>
                            <p className="text-xs mt-1">또는 이미지/텍스트를 직접 추가하세요</p>
                          </div>
                        </div>

                        {/* 일기 편집 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            일기 내용
                          </label>
                          <textarea
                            value={diaryText}
                            onChange={(e) => setDiaryText(e.target.value)}
                            placeholder="일기를 작성하세요..."
                            rows={12}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          />
                        </div>
                        
                        <div className="flex space-x-3">
                          <button
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                            onClick={() => handleSaveDiary('😊')} // 임시로 '😊'로 저장, 실제로는 감정 선택값 사용
                          >
                            💾 일기 저장
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
} 