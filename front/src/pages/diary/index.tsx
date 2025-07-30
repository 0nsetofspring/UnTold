import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Navigation from '@/components/Navigation';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import fetchSentiment from './ml_kobert';
import { supabase } from '@/api/supabaseClient'; 

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface DiaryEntry {
  date: string;
  mood: string;
  hasEntry: boolean;
  content: string; // 추가
}
 
interface DraggedItem {
  id: string;
  type: 'widget' | 'chrome' | 'custom';
  content: string;
  title: string;
  imageUrl?: string; // 사진 카드용 이미지 URL (선택적)
}

interface CustomImage {
  id: string;
  file: File;
  description: string;
  previewUrl: string;
}

export default function WriteDiary() {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'write' | 'read'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [diaryText, setDiaryText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draggedItems, setDraggedItems] = useState<DraggedItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [chromeLogs, setChromeLogs] = useState<DraggedItem[]>([]);
  const [customImages, setCustomImages] = useState<CustomImage[]>([]);
  const [imageCards, setImageCards] = useState<DraggedItem[]>([]);
  const [aiSuggestedLayout, setAiSuggestedLayout] = useState<any>(null);
  const [layoutApplied, setLayoutApplied] = useState(false);
  const [scrapItems, setScrapItems] = useState<DraggedItem[]>([]);
  const today = new Date();
  
  // 실제 DB에서 가져온 일기 데이터
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);

  // 일기 데이터를 DB에서 가져오는 함수
  const fetchDiaries = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.error('사용자 정보를 가져올 수 없습니다.', userError);
        return;
      }

      const userId = userData.user.id;
      
      // 2025년 7월 일기 데이터 가져오기
      const { data, error } = await supabase
        .from('diaries')
        .select('date, mood_vector, final_text, status')
        .eq('user_id', userId)
        .gte('date', '2025-07-01')
        .lte('date', '2025-07-31')
        .order('date', { ascending: true });

      if (error) {
        console.error('일기 데이터 불러오기 실패:', error);
        return;
      }

      console.log('📝 일기 데이터 조회 결과:', {
        userId: userId,
        data: data,
        count: data?.length || 0
      });

      if (data) {
        const formatted: DiaryEntry[] = data.map((diary: any) => {
          // mood_vector를 이모지로 변환
          let moodEmoji = '😊'; // 기본값
          if (diary.mood_vector && Array.isArray(diary.mood_vector)) {
            const [valence, arousal] = diary.mood_vector;
            
            // 2D 감정 벡터를 이모지로 매핑
            if (valence > 0.5 && arousal > 0.3) moodEmoji = '😄'; // 매우 긍정적, 높은 각성
            else if (valence > 0.3 && arousal > 0.3) moodEmoji = '😊'; // 긍정적, 높은 각성
            else if (valence > 0.3 && arousal <= 0.3) moodEmoji = '😌'; // 긍정적, 낮은 각성
            else if (valence > 0 && arousal > 0.3) moodEmoji = '🤔'; // 약간 긍정적, 높은 각성
            else if (valence > 0 && arousal <= 0.3) moodEmoji = '😌'; // 약간 긍정적, 낮은 각성
            else if (valence <= 0 && arousal > 0.3) moodEmoji = '😠'; // 부정적, 높은 각성
            else if (valence <= 0 && arousal <= 0.3) moodEmoji = '😔'; // 부정적, 낮은 각성
            else if (valence < -0.5 && arousal > 0.3) moodEmoji = '😡'; // 매우 부정적, 높은 각성
            else if (valence < -0.5 && arousal <= 0.3) moodEmoji = '😢'; // 매우 부정적, 낮은 각성
          }

          return {
            date: diary.date,
            mood: moodEmoji,
            hasEntry: diary.status === 'completed',
            content: diary.final_text || '일기 내용이 없습니다.'
          };
        });
        
        setDiaries(formatted);
      }
    } catch (error) {
      console.error('일기 데이터 불러오기 실패:', error);
    }
  };

  useEffect(() => {
    // 일기 데이터 가져오기
    fetchDiaries();
    
    const fetchChromeLogs = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.error('사용자 정보를 가져올 수 없습니다.', userError);
        return;
      }
  
            const userId = userData.user.id;
      
      // 한국 시간대로 날짜 처리
      const koreaTime = new Date(selectedDate.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
      const selectedDateString = koreaTime.toISOString().split('T')[0];

      // 날짜 필터링을 위해 한국 시간 기준으로 조정
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const { data, error } = await supabase
        .from('chrome_logs')
        .select('id, title, duration, visit_time, url')
        .eq('user_id', userId)
        .gte('visit_time', startOfDay.toISOString())
        .lt('visit_time', endOfDay.toISOString())
        .not('duration', 'is', null)  // duration이 null이 아닌 것만 조회
        .order('duration', { ascending: false })
        .limit(3);
  
      if (error) {
        console.error('크롬 로그 불러오기 실패:', error);
        return;
      }
  
      console.log('🔍 크롬 로그 조회 결과:', {
        selectedDate: selectedDateString,
        userId: userId,
        data: data,
        count: data?.length || 0
      });
  
      if (data) {
        const formatted: DraggedItem[] = data.map((log: any) => {
          console.log('📊 개별 로그 데이터:', log);
          const duration = log.duration ?? 0;  // null이나 undefined인 경우 0으로 처리
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          const durationText = minutes > 0 
            ? `${minutes}분 ${seconds}초` 
            : `${seconds}초`;
          
          const title = log.title && log.title.trim() !== '' ? log.title : '제목 없음';
          
          return {
            id: `chrome-${log.id}`,
            type: 'chrome',
            title: title,
            content: `${title}\n${log.url}\n${durationText}`,
          };
        });
        setChromeLogs(formatted);
      }
    };

    const fetchScrapItems = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.error('사용자 정보를 가져올 수 없습니다.', userError);
        return;
      }

      const userId = userData.user.id;
      
      // 한국 시간대로 날짜 처리
      const koreaTime = new Date(selectedDate.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
      const selectedDateString = koreaTime.toISOString().split('T')[0];

      console.log('📅 날짜 처리:', {
        selectedDate: selectedDate,
        selectedDateString: selectedDateString,
        selectedDateISO: selectedDate.toISOString(),
        koreaTimeISO: koreaTime.toISOString(),
        selectedDateLocal: selectedDate.toLocaleDateString('ko-KR')
      });

      try {
        // 날짜 필터링과 함께 스크랩 데이터 가져오기
        const response = await fetch(`/api/widgets/scrap/list/${userId}?date=${selectedDateString}`);
        if (!response.ok) {
          console.error('스크랩 데이터를 가져오는 데 실패했습니다.');
          return;
        }

        const scrapData = await response.json();
        console.log('📌 스크랩 데이터 조회 결과:', {
          selectedDate: selectedDateString,
          userId: userId,
          scrapData: scrapData,
          count: scrapData?.length || 0
        });

        if (scrapData && Array.isArray(scrapData)) {
          const formatted: DraggedItem[] = scrapData.map((scrap: any) => {
            // 카테고리별 아이콘 설정
            let icon = '📌';
            switch (scrap.category) {
              case 'weather':
                icon = '🌤️';
                break;
              case 'advice':
                icon = '💭';
                break;
              case 'book':
                icon = '📚';
                break;
              case 'news':
                icon = '📰';
                break;
              case 'randomdog':
                icon = '🐕';
                break;
              case 'cat':
                icon = '🐱';
                break;
              case 'music':
                icon = '🎵';
                break;
              case 'stock':
                icon = '📈';
                break;
              case 'nasa':
                icon = '🚀';
                break;
              default:
                icon = '📌';
            }

            return {
              id: `scrap-${scrap.id}`,
              type: 'widget',
              title: `${icon} ${scrap.category} 스크랩`,
              content: scrap.content || '스크랩된 내용',
            };
          });
          setScrapItems(formatted);
        }
      } catch (error) {
        console.error('스크랩 데이터 불러오기 실패:', error);
      }
    };
  
    fetchChromeLogs();
    fetchScrapItems();
  }, [selectedDate]);

  // 컴포넌트 마운트 시 일기 데이터 가져오기
  useEffect(() => {
    setMounted(true);
    fetchDiaries();
  }, []);
  
  // 오늘 날짜인지 확인하는 함수
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  // 기존 getDiaryInfo를 diaries에서 찾도록 변경
  const getDiaryInfo = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return diaries.find((d) => d.date === dateString);
  };

  // 일기 저장 핸들러 (감정 분석 포함 - kobert)
  const handleSaveDiary = async () => {
    if (!diaryText) {
        alert('일기 내용을 입력해주세요.');
        return;
    }

    // 1. AI 레이아웃 피드백 학습 (레이아웃이 적용된 경우)
    if (aiSuggestedLayout && layoutApplied) {
      try {
        // 현재 레이아웃 수집 (사용자가 수정한 후)
        const currentLayout = getCurrentLayoutFromUI();
        
        // 피드백 학습 API 호출 (나중에 활성화)
        /*
        await fetch('http://localhost:5001/api/rl/learn-from-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aiLayout: aiSuggestedLayout,
            userLayout: currentLayout,
            diaryId: 'temp-diary-id',
            userId: 'temp-user-id'
          })
        });
        */
        
        console.log('📚 사용자 피드백 학습 완료');
        console.log('AI 제안:', aiSuggestedLayout);
        console.log('사용자 수정:', currentLayout);
        
      } catch (error) {
        console.error('피드백 학습 실패:', error);
      }
    }

    // 2. 감정 분석 API 호출
    const sentimentResult = await fetchSentiment(diaryText);

    // 3. 분석 결과에서 감정 라벨을 이모지로 변환
    let moodEmoji = '😊'; // 기본값
    if (sentimentResult) {
        if (sentimentResult.label === 'positive') moodEmoji = '😊';
        else if (sentimentResult.label === 'negative') moodEmoji = '😔';
        else moodEmoji = '😐';
    }

    // 4. DB에 일기 저장
    const dateString = selectedDate.toISOString().split('T')[0];
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        alert('사용자 정보를 가져올 수 없습니다.');
        return;
      }

      const userId = userData.user.id;
      
      // mood_vector 계산 (간단한 감정 분석 결과를 2D 벡터로 변환)
      let moodVector = [0, 0]; // 기본값
      if (sentimentResult) {
        if (sentimentResult.label === 'positive') {
          moodVector = [0.7, 0.4]; // 긍정적, 중간 각성
        } else if (sentimentResult.label === 'negative') {
          moodVector = [-0.5, 0.3]; // 부정적, 중간 각성
        } else {
          moodVector = [0.1, 0.1]; // 중립적, 낮은 각성
        }
      }

      // DB에 저장할 데이터
      const diaryData = {
        user_id: userId,
        date: dateString,
        status: 'completed',
        mood_vector: moodVector,
        final_text: diaryText,
        agent_version: 'v1.0'
      };

      // 기존 일기가 있는지 확인
      const { data: existingDiary } = await supabase
        .from('diaries')
        .select('id')
        .eq('user_id', userId)
        .eq('date', dateString)
        .single();

      let result;
      if (existingDiary) {
        // 기존 일기 업데이트
        result = await supabase
          .from('diaries')
          .update(diaryData)
          .eq('id', existingDiary.id);
      } else {
        // 새 일기 생성
        result = await supabase
          .from('diaries')
          .insert(diaryData);
      }

      if (result.error) {
        console.error('일기 저장 실패:', result.error);
        alert('일기 저장에 실패했습니다.');
        return;
      }

      console.log('✅ 일기 저장 완료:', dateString);
      
      // 로컬 상태 업데이트
      setDiaries((prev) => {
        const exists = prev.some((d) => d.date === dateString);
        if (exists) {
          return prev.map((d) =>
            d.date === dateString ? { ...d, mood: moodEmoji, hasEntry: true, content: diaryText } : d
          );
        } else {
          return [...prev, { date: dateString, mood: moodEmoji, hasEntry: true, content: diaryText }];
        }
      });

    } catch (error) {
      console.error('일기 저장 중 오류:', error);
      alert('일기 저장에 실패했습니다.');
      return;
    }
    
    // 5. 상태 초기화
    setAiSuggestedLayout(null);
    setLayoutApplied(false);
    setViewMode('calendar');
  };

  // 현재 UI의 레이아웃을 수집하는 함수 (시뮬레이션)
  const getCurrentLayoutFromUI = () => {
    // 실제로는 현재 드래그된 카드들의 위치를 수집
    // 현재는 시뮬레이션용으로 AI 제안과 동일하게 반환
    return aiSuggestedLayout;
  };

  // 카드 ID로 카드 데이터를 찾는 함수
  const findCardData = (cardId: string) => {
    // 위젯 카드에서 찾기
    const widgetCard = draggedItems.find(item => item.id === cardId);
    if (widgetCard) return widgetCard;

    // 크롬 로그에서 찾기
    const chromeCard = chromeLogs.find(log => log.id === cardId);
    if (chromeCard) return chromeCard;

    // 이미지 카드에서 찾기
    const imageCard = imageCards.find(card => card.id === cardId);
    if (imageCard) return imageCard;

    return null;
  };

  // 카드 드래그 시작 핸들러
  const handleCardDragStart = (e: React.DragEvent, cardData: DraggedItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(cardData));
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

  // 사진 추가 핸들러
  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const previewUrl = e.target?.result as string;
            const newImage: CustomImage = {
              id: `custom-${Date.now()}-${Math.random()}`,
              file: file,
              description: '',
              previewUrl: previewUrl
            };
            setCustomImages(prev => [...prev, newImage]);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  // 사진 설명 업데이트 핸들러
  const handleImageDescriptionChange = (id: string, description: string) => {
    setCustomImages(prev => 
      prev.map(img => 
        img.id === id ? { ...img, description } : img
      )
    );
  };

  // 사진 설명 엔터 키 핸들러
  const handleImageDescriptionKeyPress = (e: React.KeyboardEvent, image: CustomImage) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // 이미 카드가 있는지 확인
      const existingCard = imageCards.find(card => card.id === image.id);
      if (!existingCard) {
        // 새로운 카드 생성
        const newCard: DraggedItem = {
          id: image.id,
          type: 'custom',
          title: image.description || '설명 없음',
          content: `${image.description || '설명 없음'}\n[사진 첨부됨]`,
          imageUrl: image.previewUrl // 사진 URL 추가
        };
        setImageCards(prev => [...prev, newCard]);
        
        // 카드 생성 후 해당 사진을 customImages에서 제거
        setCustomImages(prev => prev.filter(img => img.id !== image.id));
      } else {
        // 기존 카드 업데이트
        setImageCards(prev => 
          prev.map(card => 
            card.id === image.id 
              ? { ...card, title: image.description || '설명 없음', content: `${image.description || '설명 없음'}\n[사진 첨부됨]`, imageUrl: image.previewUrl }
              : card
          )
        );
        
        // 카드 업데이트 후 해당 사진을 customImages에서 제거
        setCustomImages(prev => prev.filter(img => img.id !== image.id));
      }
    }
  };

  // 사진 삭제 핸들러
  const handleImageRemove = (id: string) => {
    setCustomImages(prev => prev.filter(img => img.id !== id));
    setImageCards(prev => prev.filter(card => card.id !== id));
  };

  // 사진 카드 삭제 핸들러
  const handleImageCardRemove = (id: string) => {
    setImageCards(prev => prev.filter(card => card.id !== id));
  };

  // 사진을 드래그 아이템으로 변환
  const handleImageDragStart = (e: React.DragEvent, image: CustomImage) => {
    const dragItem: DraggedItem = {
      id: image.id,
      type: 'custom',
      title: `사진: ${image.description || '설명 없음'}`,
      content: `${image.description || '설명 없음'}\n[사진 첨부됨]`
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragItem));
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

  // AI 레이아웃 제안 함수
  const handleAutoLayout = async () => {
    try {
      setIsGenerating(true);
      
      // 현재 선택된 모든 카드 수집
      const allCards = [
        ...draggedItems.map(item => ({
          id: item.id,
          type: item.type,
          title: item.title,
          content: item.content,
          imageUrl: item.imageUrl,
          category: 'widget'
        })),
        ...chromeLogs.map(log => ({
          id: log.id,
          type: 'chrome',
          title: log.title,
          content: log.content,
          imageUrl: undefined,
          category: 'browsing'
        })),
        ...imageCards.map(card => ({
          id: card.id,
          type: 'custom',
          title: card.title,
          content: card.content,
          imageUrl: card.imageUrl,
          category: 'photo'
        }))
      ];

      if (allCards.length === 0) {
        alert('배치할 카드가 없습니다. 위젯, 크롬 로그, 또는 사진을 추가해주세요.');
        setIsGenerating(false);
        return;
      }

      // AI API 호출 (현재는 시뮬레이션)
      console.log('🎨 AI 레이아웃 제안 요청:', allCards);
      
      // 실제 API 호출 (나중에 활성화)
      /*
      const response = await fetch('http://localhost:5001/api/rl/suggest-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: allCards,
          diaryId: 'temp-diary-id',
          userId: 'temp-user-id'
        })
      });
      
      const result = await response.json();
      */
      
      // 시뮬레이션 결과 (임시)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const simulatedLayout = generateSimulatedLayout(allCards);
      setAiSuggestedLayout(simulatedLayout);
      
      // 레이아웃을 UI에 적용
      applyLayoutToUI(simulatedLayout);
      setLayoutApplied(true);
      
      console.log('✅ AI 레이아웃 적용 완료:', simulatedLayout);
      
    } catch (error) {
      console.error('AI 레이아웃 제안 실패:', error);
      alert('AI 레이아웃 제안에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 시뮬레이션용 레이아웃 생성 (임시)
  const generateSimulatedLayout = (cards: any[]) => {
    const layout = {
      rows: [],
      card_positions: {}
    };

    // 카드 타입별 분류
    const widgetCards = cards.filter(card => card.type === 'widget');
    const chromeCards = cards.filter(card => card.type === 'chrome');
    const photoCards = cards.filter(card => card.type === 'custom');

    let rowIndex = 0;
    let cardIndex = 0;

    // 1. 위젯 카드들을 첫 번째 row에 배치
    if (widgetCards.length > 0) {
      const row = {
        rowIndex: rowIndex,
        cards: []
      };

      widgetCards.forEach((card, colIdx) => {
        const cardWidth = widgetCards.length === 1 ? '100%' : `${100 / widgetCards.length}%`;
        row.cards.push({
          id: card.id,
          width: cardWidth,
          type: 0,
          hasImage: false
        });

        layout.card_positions[card.id] = {
          row: rowIndex,
          col: colIdx,
          orderIndex: colIdx
        };
        cardIndex++;
      });

      layout.rows.push(row);
      rowIndex++;
    }

    // 2. 크롬 카드들을 두 번째 row에 배치
    if (chromeCards.length > 0) {
      const row = {
        rowIndex: rowIndex,
        cards: []
      };

      chromeCards.forEach((card, colIdx) => {
        const cardWidth = chromeCards.length === 1 ? '100%' : `${100 / chromeCards.length}%`;
        row.cards.push({
          id: card.id,
          width: cardWidth,
          type: 1,
          hasImage: false
        });

        layout.card_positions[card.id] = {
          row: rowIndex,
          col: colIdx,
          orderIndex: colIdx
        };
        cardIndex++;
      });

      layout.rows.push(row);
      rowIndex++;
    }

    // 3. 사진 카드들을 세 번째 row에 배치
    if (photoCards.length > 0) {
      const row = {
        rowIndex: rowIndex,
        cards: []
      };

      photoCards.forEach((card, colIdx) => {
        const cardWidth = photoCards.length === 1 ? '100%' : `${100 / photoCards.length}%`;
        row.cards.push({
          id: card.id,
          width: cardWidth,
          type: 2,
          hasImage: true
        });

        layout.card_positions[card.id] = {
          row: rowIndex,
          col: colIdx,
          orderIndex: colIdx
        };
        cardIndex++;
      });

      layout.rows.push(row);
    }

    return layout;
  };

  // 레이아웃을 UI에 적용하는 함수
  const applyLayoutToUI = (layout: any) => {
    // 레이아웃 정보를 콘솔에 출력
    console.log('📋 적용된 레이아웃:');
    layout.rows.forEach((row: any) => {
      console.log(`  Row ${row.rowIndex}: ${row.cards.length}개 카드`);
      row.cards.forEach((card: any) => {
        console.log(`    - ${card.id} (너비: ${card.width})`);
      });
    });

    // 레이아웃 상태 업데이트 (UI에 시각적으로 표시됨)
    setAiSuggestedLayout(layout);
    setLayoutApplied(true);
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
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-5">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">📝 밤의 일기</h1>
            <p className="text-gray-600 text-lg">AI가 도와주는 자동 일기 작성</p>
          </header>

          {!mounted ? (
            /* 로딩 상태 */
            <div className="h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">로딩 중...</p>
              </div>
            </div>
          ) : viewMode === 'calendar' ? (
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
                  locale="ko-KR"
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
            <div className="max-w-6xl mx-auto">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {mounted ? selectedDate.toLocaleDateString('ko-KR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'long'
                    }) : '일기'} 일기
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
                      {getDiaryInfo(selectedDate)?.content || "일기 내용이 없습니다."}
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
                <div className="flex gap-7">
                  {/* 첫 번째 칸: 위젯 스크랩과 크롬 로그 */}
                  <div className="w-1/4 space-y-6">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                      <h3 className="text-xl font-semibold mb-4">📌 위젯 스크랩</h3>
                      <div className="space-y-3">
                        {scrapItems.length > 0 ? (
                          scrapItems.map((item) => (
                            <div
                              key={item.id}
                              className="bg-blue-50 p-3 rounded-lg border border-blue-200 cursor-move hover:bg-blue-100 transition-colors"
                              draggable
                              onDragStart={(e) => handleDragStart(e, item)}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{item.title.split(' ')[0]}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate" title={item.title}>
                                    {item.title}
                                  </p>
                                  <p className="text-xs text-gray-600 truncate" title={item.content}>
                                    {item.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500 text-sm">
                              {selectedDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] 
                                ? '오늘 스크랩한 위젯이 없습니다.' 
                                : `${selectedDate.toLocaleDateString('ko-KR')}에 스크랩한 위젯이 없습니다.`}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              대시보드에서 위젯을 스크랩하면 여기에 표시됩니다.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 크롬 로그 */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                      <h3 className="text-xl font-semibold mb-4">🌐 크롬 로그</h3>
                      <div className="space-y-2">
                        {chromeLogs.length > 0 ? (
                          chromeLogs.map((item) => (
                            <div
                              key={item.id}
                              className="bg-gray-50 p-2 rounded border border-gray-200 cursor-move hover:bg-gray-100 transition-colors"
                              draggable
                              onDragStart={(e) => handleDragStart(e, item)}
                            >
                              <p className="text-sm font-medium truncate" title={item.title}>{item.title}</p>
                              <p className="text-xs text-gray-500 truncate">{item.content.split('\n')[1]}</p>
                              <p className="text-xs text-gray-600 font-semibold">{item.content.split('\n')[2]}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">
                            {selectedDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] 
                              ? '오늘의 크롬 로그를 불러오는 중이거나 데이터가 없습니다.' 
                              : `${selectedDate.toLocaleDateString('ko-KR')}의 크롬 로그가 없습니다.`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 두 번째 칸: 사진 관리 */}
                  <div className="w-1/4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                    <h3 className="text-xl font-semibold mb-4">📸 사진 관리</h3>
                    
                    {/* 사진 업로드 버튼 */}
                    <div className="mb-6">
                      <label className="block w-full">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageAdd}
                          className="hidden"
                        />
                        <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                          <div className="text-2xl mb-2">📷</div>
                          <p className="text-sm text-gray-600">사진을 선택하거나 여기에 드래그하세요</p>
                          <p className="text-xs text-gray-500 mt-1">여러 장 선택 가능</p>
                        </div>
                      </label>
                    </div>

                    {/* 추가된 사진 목록 */}
                    <div className="space-y-3 mb-6">
                      {customImages.map((image) => (
                        <div
                          key={image.id}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <div className="flex items-start space-x-3">
                            {/* 사진 미리보기 */}
                            <div className="flex-shrink-0">
                              <img
                                src={image.previewUrl}
                                alt="미리보기"
                                className="w-16 h-16 object-cover rounded border border-gray-300"
                                draggable
                                onDragStart={(e) => handleImageDragStart(e, image)}
                              />
                            </div>
                            
                            {/* 설명 입력 */}
                            <div className="flex-1 min-w-0">
                              <textarea
                                value={image.description}
                                onChange={(e) => handleImageDescriptionChange(image.id, e.target.value)}
                                onKeyPress={(e) => handleImageDescriptionKeyPress(e, image)}
                                placeholder="이 사진에 대한 설명을 입력하세요... (엔터로 카드 생성)"
                                className="w-full p-2 text-sm border border-gray-300 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={2}
                              />
                            </div>
                            
                            {/* 삭제 버튼 */}
                            <button
                              onClick={() => handleImageRemove(image.id)}
                              className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="삭제"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 구분선 */}
                    <div className="border-t border-gray-200 mb-4"></div>

                    {/* 사진 카드 섹션 */}
                    <div>
                      <h4 className="text-lg font-semibold mb-3 text-gray-700">🖼️ 생성된 카드</h4>
                      <div className="space-y-2">
                        {imageCards.length > 0 ? (
                          imageCards.map((card) => (
                            <div
                              key={card.id}
                              className="bg-purple-50 p-3 rounded border border-purple-200 cursor-move hover:bg-purple-100 transition-colors"
                              draggable
                              onDragStart={(e) => handleDragStart(e, card)}
                            >
                              <div className="flex items-start space-x-3">
                                {/* 사진 미리보기 */}
                                {card.imageUrl && (
                                  <div className="flex-shrink-0">
                                    <img
                                      src={card.imageUrl}
                                      alt="카드 이미지"
                                      className="w-12 h-12 object-cover rounded border border-purple-300"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate" title={card.title}>{card.title}</p>
                                </div>
                                <button
                                  onClick={() => handleImageCardRemove(card.id)}
                                  className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                  title="카드 삭제"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm text-center py-4">
                            아직 추가된 사진이 없습니다.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 세 번째 칸: 카드 레이아웃 영역 */}
                  <div className="w-1/2">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">🎨 카드 레이아웃</h3>
                        <button
                          className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                            layoutApplied 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white' 
                              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                          }`}
                          onClick={handleAutoLayout}
                          disabled={isGenerating}
                        >
                          {isGenerating ? '🤖 AI 배치 중...' : layoutApplied ? '✅ 레이아웃 적용됨' : '🎨 AI 레이아웃 제안'}
                        </button>
                      </div>

                      {/* 드롭 영역 */}
                      <div 
                        className={`min-h-32 border-2 border-dashed rounded-lg p-4 transition-all duration-200 mb-4 ${
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

                      {/* AI 레이아웃 표시 영역 */}
                      {layoutApplied && aiSuggestedLayout ? (
                        <div className="space-y-4">
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700">
                              ✨ AI가 최적의 레이아웃을 제안했습니다! 
                              카드들을 드래그해서 위치를 조정할 수 있어요.
                            </p>
                          </div>
                          
                          {/* 레이아웃 카드들 */}
                          <div className="space-y-3">
                            {aiSuggestedLayout.rows.map((row: any, rowIndex: number) => (
                              <div key={rowIndex} className="flex gap-2">
                                {row.cards.map((card: any, cardIndex: number) => {
                                  // 카드 데이터 찾기
                                  const cardData = findCardData(card.id);
                                  if (!cardData) return null;

                                  return (
                                    <div
                                      key={card.id}
                                      className={`bg-white border-2 border-gray-200 rounded-lg p-3 shadow-sm transition-all duration-200 hover:shadow-md cursor-move ${
                                        card.type === 0 ? 'border-blue-200 bg-blue-50' :
                                        card.type === 1 ? 'border-green-200 bg-green-50' :
                                        'border-purple-200 bg-purple-50'
                                      }`}
                                      style={{ width: card.width }}
                                      draggable
                                      onDragStart={(e) => handleCardDragStart(e, cardData)}
                                    >
                                      <div className="flex items-start space-x-2">
                                        {/* 카드 타입별 아이콘 */}
                                        <div className="flex-shrink-0 text-lg">
                                          {card.type === 0 ? '📊' : card.type === 1 ? '🌐' : '📸'}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-medium text-sm text-gray-800 truncate">
                                            {cardData.title}
                                          </h4>
                                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                            {cardData.content}
                                          </p>
                                          
                                          {/* 이미지가 있는 경우 */}
                                          {cardData.imageUrl && (
                                            <div className="mt-2">
                                              <img
                                                src={cardData.imageUrl}
                                                alt="카드 이미지"
                                                className="w-full h-16 object-cover rounded border border-gray-300"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* 카드 크기 표시 */}
                                      <div className="mt-2 text-xs text-gray-500 text-center">
                                        {card.width}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* 레이아웃이 적용되지 않은 경우 */
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-4xl mb-2">🎨</div>
                          <p className="text-sm">AI 레이아웃 제안 버튼을 클릭하면</p>
                          <p className="text-sm">카드들이 자동으로 배치됩니다!</p>
                        </div>
                      )}

                      {/* 일기 텍스트 입력 */}
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          📝 일기 내용
                        </label>
                        <textarea
                          value={diaryText}
                          onChange={(e) => setDiaryText(e.target.value)}
                          placeholder="카드들을 보고 일기를 작성하세요..."
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>

                      {/* 저장 버튼 */}
                      <div className="mt-4">
                        <button
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                          onClick={handleSaveDiary}
                        >
                          💾 일기 저장
                        </button>
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