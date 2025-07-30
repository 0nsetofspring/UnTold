import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Navigation from '@/components/Navigation';
import fetchSentiment from './ml_kobert';
import { supabase } from '@/api/supabaseClient';
import { useRouter } from 'next/router';

interface DiaryEntry {
  date: string;
  mood: string;
  hasEntry: boolean;
  content: string;
}
 
interface DraggedItem {
  id: string;
  type: 'chrome' | 'custom';
  content: string;
  title: string;
  imageUrl?: string;
}

interface CustomImage {
  id: string;
  file: File;
  description: string;
  previewUrl: string;
}

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

export default function WriteDiary() {

  const router = useRouter();
=======


  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [diaryText, setDiaryText] = useState('');
  const [draggedItems, setDraggedItems] = useState<DraggedItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [chromeLogs, setChromeLogs] = useState<DraggedItem[]>([]);
  const [customImages, setCustomImages] = useState<CustomImage[]>([]);
  const [imageCards, setImageCards] = useState<DraggedItem[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [currentDiaryId, setCurrentDiaryId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestedLayout, setAiSuggestedLayout] = useState<any>(null);
  const [layoutApplied, setLayoutApplied] = useState(false);

  const [learningStatus, setLearningStatus] = useState<any>(null);
  const [existingDiary, setExistingDiary] = useState<any>(null);
  const [userLayout, setUserLayout] = useState<any>(null); // 사용자가 편집한 레이아웃
  const [rewardInfo, setRewardInfo] = useState<any>(null); // 보상 계산 정보
  const [isDragging, setIsDragging] = useState(false);
  const [draggedCard, setDraggedCard] = useState<any>(null);
  const today = new Date();
  

=======
  const [scrapItems, setScrapItems] = useState<DraggedItem[]>([]);
  
  
  

  // 학습 상태 확인 함수
  const fetchLearningStatus = async () => {
    try {
      console.log('🔄 학습 상태 조회 시작...');
      const response = await fetch('http://localhost:8000/api/rl/learning-status');
      console.log('📡 API 응답 상태:', response.status, response.statusText);
      
      if (response.ok) {
        const status = await response.json();
        console.log('📊 받은 학습 상태:', status);
        setLearningStatus(status);
      } else {
        console.error('❌ API 호출 실패:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('📋 에러 내용:', errorText);
      }
    } catch (error) {
      console.error('❌ 학습 상태 조회 실패:', error);
      console.error('🔍 에러 상세:', error);
    }
  };

  // URL 파라미터에서 날짜 가져오기
  useEffect(() => {
    if (router.isReady) {
      const { date } = router.query;
      if (date && typeof date === 'string') {
        const parsedDate = new Date(date);
        setSelectedDate(parsedDate);
      }
    }
  }, [router.isReady, router.query]);

  // 페이지 로드 시 일기 ID 생성 및 기존 일기 확인
  useEffect(() => {
    const initializeDiary = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          console.error('사용자 정보를 가져올 수 없습니다.', userError);
          return;
        }

        const dateString = selectedDate.toISOString().split('T')[0];

        // 기존 일기 확인
        const { data: existingData, error: existingError } = await supabase
          .from('diaries')
          .select('*')
          .eq('user_id', userData.user.id)
          .eq('date', dateString)
          .single();

        if (existingData) {
          console.log('✅ 기존 일기 발견:', existingData);
          setExistingDiary(existingData);
          setCurrentDiaryId(existingData.id);
          setDiaryText(existingData.final_text || '');
        } else {
          // 새로운 일기 생성
          const diaryId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });

          const diaryData = {
            id: diaryId,
            user_id: userData.user.id,
            date: dateString,
            status: 'draft',
            mood_vector: [0, 0],
            final_text: '',
            agent_version: 'v1.0'
          };

          const { data, error } = await supabase
            .from('diaries')
            .insert([diaryData])
            .select();

          if (error) {
            console.error('일기 생성 실패:', error);
            return;
          }

          console.log('✅ 새 일기 생성 완료:', data);
          setCurrentDiaryId(diaryId);
        }
        
        // 학습 상태 확인
        fetchLearningStatus();
        
      } catch (error) {
        console.error('일기 초기화 중 오류:', error);
      }
    };

    if (selectedDate) {
      initializeDiary();
    }
  }, [selectedDate]);

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
        .not('duration', 'is', null)
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
          const duration = log.duration ?? 0;
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


  // 크롬 로그 클릭 핸들러 - cards DB에 저장
  const handleChromeLogClick = async (item: DraggedItem) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.error('사용자 정보를 가져올 수 없습니다.', userError);
        return;
      }

      // UUID 생성
      const cardId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      const cardData = {
        id: cardId,
        diary_id: currentDiaryId,
        source_type: 'chrome',
        category: 'browsing',
        content: item.content,
        image_url: null,
        layout_type: 'text',
        row: 0,
        col: 0,
        order_index: selectedCards.length,
        text_generated: false,
        text_final: item.title
      };

      const { data, error } = await supabase
        .from('cards')
        .insert([cardData])
        .select();

      if (error) {
        console.error('카드 저장 실패:', error);
        return;
      }

      console.log('✅ 크롬 로그 카드 저장 완료:', data);
      
      // 선택된 카드 목록에 추가
      if (data && data[0]) {
        setSelectedCards(prev => [...prev, data[0]]);
      }

      // 드래그 아이템에도 추가
      setDraggedItems(prev => [...prev, item]);
      
    } catch (error) {
      console.error('크롬 로그 카드 저장 중 오류:', error);
    }
=======
  // 컴포넌트 마운트 시 일기 데이터 가져오기
  useEffect(() => {
    setMounted(true);
    fetchDiaries();
  }, []);
  
  // 오늘 날짜인지 확인하는 함수
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();

  };

  // 사진 카드 클릭 핸들러 - cards DB에 저장
  const handleImageCardClick = async (card: DraggedItem) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.error('사용자 정보를 가져올 수 없습니다.', userError);
        return;
      }

      // UUID 생성
      const cardId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      const cardData = {
        id: cardId,
        diary_id: currentDiaryId,
        source_type: 'image',
        category: 'photo',
        content: card.content,
        image_url: card.imageUrl || null,
        layout_type: 'image',
        row: 0,
        col: 0,
        order_index: selectedCards.length,
        text_generated: false,
        text_final: card.title
      };

      const { data, error } = await supabase
        .from('cards')
        .insert([cardData])
        .select();

      if (error) {
        console.error('카드 저장 실패:', error);
        return;
      }

      console.log('✅ 이미지 카드 저장 완료:', data);
      
      // 선택된 카드 목록에 추가
      if (data && data[0]) {
        setSelectedCards(prev => [...prev, data[0]]);
      }

      // 드래그 아이템에도 추가
      setDraggedItems(prev => [...prev, card]);
      
    } catch (error) {
      console.error('이미지 카드 저장 중 오류:', error);
    }
  };

  // 일기 저장 핸들러
  const handleSaveDiary = async () => {
    if (!diaryText) {
        alert('일기 내용을 입력해주세요.');
        return;
    }

    // 감정 분석 API 호출
    const sentimentResult = await fetchSentiment(diaryText);

    // 랜덤 감정 벡터 생성 (valence: -1~1, arousal: -1~1)
    const randomValence = (Math.random() - 0.5) * 2; // -1 ~ 1
    const randomArousal = (Math.random() - 0.5) * 2; // -1 ~ 1
    const moodVector = [randomValence, randomArousal];

    // 감정 분석 결과가 있으면 그것을 우선 사용, 없으면 랜덤 값 사용
    let finalMoodVector = moodVector;
    if (sentimentResult) {
        if (sentimentResult.label === 'positive') {
          finalMoodVector = [0.5 + Math.random() * 0.5, -0.5 + Math.random() * 1]; // 긍정적
        } else if (sentimentResult.label === 'negative') {
          finalMoodVector = [-0.5 - Math.random() * 0.5, -0.5 + Math.random() * 1]; // 부정적
        } else {
          finalMoodVector = [-0.2 + Math.random() * 0.4, -0.2 + Math.random() * 0.4]; // 중립적
        }
    }

    // 레이아웃 차이 기반 보상 계산
    let layoutReward = 0;
    let layoutDifference = 0;
    let rewardDetails = {};

    if (aiSuggestedLayout && userLayout) {
      // AI 추천과 사용자 레이아웃 간의 차이 계산
      let totalRowDiff = 0;
      let totalColDiff = 0;
      let comparedCards = 0;

      Object.keys(aiSuggestedLayout).forEach(cardId => {
        if (userLayout[cardId]) {
          const aiPos = aiSuggestedLayout[cardId];
          const userPos = userLayout[cardId];
          
          const rowDiff = Math.abs(aiPos.row - userPos.row);
          const colDiff = Math.abs(aiPos.col - userPos.col);
          
          totalRowDiff += rowDiff;
          totalColDiff += colDiff;
          comparedCards++;
        }
      });

      if (comparedCards > 0) {
        const avgRowDiff = totalRowDiff / comparedCards;
        const avgColDiff = totalColDiff / comparedCards;
        layoutDifference = avgRowDiff + avgColDiff;
        
        // 차이가 클수록 부정적 보상 (사용자가 많이 수정했다는 의미)
        layoutReward = -layoutDifference * 20; // 차이당 -20점
        
        rewardDetails = {
          avg_row_diff: avgRowDiff,
          avg_col_diff: avgColDiff,
          total_difference: layoutDifference,
          compared_cards: comparedCards
        };
      }
    } else if (aiSuggestedLayout && !userLayout) {
      // AI 추천을 그대로 사용한 경우 (긍정적 보상)
      layoutReward = 50;
      rewardDetails = { used_ai_layout: true };
    }

    // 보상 정보 저장
    setRewardInfo({
      layoutReward,
      layoutDifference,
      details: rewardDetails
    });

    // diaries 테이블 업데이트
    try {
      const { data, error } = await supabase
        .from('diaries')
        .update({
          status: 'finalized',
          mood_vector: finalMoodVector,
          final_text: diaryText,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentDiaryId)
        .select();

      if (error) {
        console.error('일기 업데이트 실패:', error);
        return;
      }

      console.log('✅ 일기 업데이트 완료:', data);
      console.log('🎭 감정 벡터:', finalMoodVector);
      console.log('💰 레이아웃 보상:', layoutReward, '차이:', layoutDifference);
    } catch (error) {
      console.error('일기 업데이트 중 오류:', error);
    }


    // RL 모델에 피드백 전송
    if (aiSuggestedLayout) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          // 선택된 카드 ID들을 관련 카드로 전달
          const selectedCardIds = selectedCards.map(card => card.id);
          
          console.log('🔄 RL 피드백 전송 시작...');
          console.log('📊 전송할 데이터:', {
            diary_id: currentDiaryId,
            feedback_type: 'save',
            selected_cards: selectedCardIds,
            layout_reward: layoutReward,
            layout_difference: layoutDifference
          });
          
          const feedbackResponse = await fetch('http://localhost:8000/api/rl/learn-from-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              diary_id: currentDiaryId,
              feedback_type: 'save',
              details: {
                user_id: userData.user.id,
                original_layout: aiSuggestedLayout,
                user_layout: userLayout,
                layout_reward: layoutReward,
                layout_difference: layoutDifference,
                reward_details: rewardDetails,
                final_text_length: diaryText.length,
                mood_vector: finalMoodVector,
                related_card_id: selectedCardIds.length > 0 ? selectedCardIds[0] : null
              }
            })
          });
          
          if (feedbackResponse.ok) {
            const result = await feedbackResponse.json();
            console.log('✅ RL 피드백 전송 완료:', result);
            // 학습 상태 업데이트
            setTimeout(() => fetchLearningStatus(), 1000);
          } else {
            const errorText = await feedbackResponse.text();
            console.error('❌ RL 피드백 전송 실패:', feedbackResponse.status, errorText);
          }
        }
      } catch (error) {
        console.error('❌ RL 피드백 전송 중 오류:', error);
      }
    } else {
      console.log('⚠️ AI 레이아웃이 없어서 RL 피드백을 전송하지 않습니다.');
    }
=======
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


    alert('일기가 저장되었습니다!');
    
    // 캘린더 페이지로 이동
    router.push('/diary/calendar');
  };

  // 카드 ID로 카드 데이터를 찾는 함수
  const findCardData = (cardId: string) => {
    // 크롬 로그에서 찾기
    const chromeCard = chromeLogs.find(log => log.id === cardId);
    if (chromeCard) return chromeCard;

    // 이미지 카드에서 찾기
    const imageCard = imageCards.find(card => card.id === cardId);
    if (imageCard) return imageCard;

    return null;
  };

  // 드래그 앤 드롭 이벤트 핸들러
  const handleDragStart = (e: React.DragEvent, card: Card) => {
    setIsDragging(true);
    setDraggedCard(card);
    e.dataTransfer.setData('text/plain', card.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetRow: number, targetCol: number) => {
    e.preventDefault();
    if (!draggedCard) return;

    // 새로운 레이아웃 생성
    const newLayout = userLayout ? { ...userLayout } : {};
    newLayout[draggedCard.id] = { row: targetRow, col: targetCol, order_index: 0 };
    
    setUserLayout(newLayout);
    setIsDragging(false);
    setDraggedCard(null);
    
    console.log('🎯 카드 이동:', draggedCard.id, '→', `(${targetRow}, ${targetCol})`);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedCard(null);
  };

  // 기존 드래그 핸들러들 (DraggedItem용)
  const handleCardDragStart = (e: React.DragEvent, cardData: DraggedItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(cardData));
  };

  const handleItemDragStart = (e: React.DragEvent, item: DraggedItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
  };

  const handleItemDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleItemDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleItemDrop = (e: React.DragEvent) => {
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

  // 레이아웃 그리드 렌더링
  const renderLayoutGrid = () => {
    const grid = Array(3).fill(null).map(() => Array(4).fill(null));
    
    // AI 추천 레이아웃 적용
    if (aiSuggestedLayout && !userLayout) {
      Object.entries(aiSuggestedLayout).forEach(([cardId, layout]: [string, any]) => {
        if (layout.row >= 0 && layout.row < 3 && layout.col >= 0 && layout.col < 4) {
          grid[layout.row][layout.col] = { cardId, layout, type: 'ai' };
        }
      });
    }
    
    // 사용자 편집 레이아웃 적용
    if (userLayout) {
      Object.entries(userLayout).forEach(([cardId, layout]: [string, any]) => {
        if (layout.row >= 0 && layout.row < 3 && layout.col >= 0 && layout.col < 4) {
          grid[layout.row][layout.col] = { cardId, layout, type: 'user' };
        }
      });
    }

    return (
      <div className="grid grid-cols-4 gap-2 p-4 bg-gray-50 rounded-lg">
        {grid.map((row, rowIndex) => 
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`
                aspect-square border-2 border-dashed rounded-lg p-2
                ${cell ? 'border-solid bg-white' : 'border-gray-300 bg-gray-100'}
                ${isDragging ? 'border-blue-400 bg-blue-50' : ''}
                transition-all duration-200
              `}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
            >
              {cell ? (
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, selectedCards.find(c => c.id === cell.cardId)!)}
                  onDragEnd={handleDragEnd}
                  className={`
                    w-full h-full flex items-center justify-center text-xs font-medium
                    ${cell.type === 'ai' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                    cursor-move hover:scale-105 transition-transform
                  `}
                >
                  {cell.cardId.slice(0, 8)}...
                  {cell.type === 'ai' && <span className="ml-1">🤖</span>}
                  {cell.type === 'user' && <span className="ml-1">👤</span>}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  빈칸
                </div>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  // 사진 추가 핸들러
  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
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
          imageUrl: image.previewUrl
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

  // AI 레이아웃 제안 함수
  const handleAutoLayout = async () => {
    try {
      setIsGenerating(true);
      
      // 선택된 카드들의 ID 수집
      const selectedCardIds = selectedCards.map(card => card.id);
      
      if (selectedCardIds.length === 0) {
        alert('배치할 카드가 없습니다. 크롬 로그나 사진을 선택해주세요.');
        setIsGenerating(false);
        return;
      }

      // 사용자 정보 가져오기
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.error('사용자 정보를 가져올 수 없습니다.', userError);
        setIsGenerating(false);
        return;
      }

      // RL API 호출
      const response = await fetch('http://localhost:8000/api/rl/suggest-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diary_id: currentDiaryId,
          user_id: userData.user.id,
          selected_card_ids: selectedCardIds
        })
      });
      
      if (!response.ok) {
        throw new Error(`RL API 호출 실패: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ AI 레이아웃 제안 완료:', result.layout);
        
        // 레이아웃을 UI에 적용
        applyLayoutToUI(result.layout);
        setLayoutApplied(true);
      } else {
        throw new Error(result.message || '레이아웃 제안 실패');
      }
      
    } catch (error) {
      console.error('AI 레이아웃 제안 실패:', error);
      alert('AI 레이아웃 제안에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 레이아웃을 UI에 적용하는 함수
  const applyLayoutToUI = (layout: any) => {
    // 레이아웃 정보를 콘솔에 출력
    console.log('📋 적용된 레이아웃:');
    Object.entries(layout).forEach(([cardId, position]: [string, any]) => {
      console.log(`  - ${cardId}: row=${position.row}, col=${position.col}, order=${position.order_index}`);
    });

    // 레이아웃 상태 업데이트 (UI에 시각적으로 표시됨)
    setAiSuggestedLayout(layout);
    setLayoutApplied(true);
  };

  // 배치 학습 핸들러
  const handleBatchTrain = async () => {
    try {
      console.log('🔄 배치 학습 시작...');
      
      const response = await fetch('http://localhost:8000/api/rl/batch-train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`배치 학습 실패: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ 배치 학습 완료:', result);
      
      if (result.success) {
        alert(`배치 학습 완료!\n처리된 에피소드: ${result.episodes_processed}개\n수행된 업데이트: ${result.updates_performed}개\n평균 손실: ${result.average_loss}`);
      } else {
        alert(`배치 학습 실패: ${result.message}`);
      }
      
      setTimeout(() => fetchLearningStatus(), 1000); // 학습 상태 업데이트
    } catch (error) {
      console.error('배치 학습 중 오류:', error);
      alert('배치 학습에 실패했습니다.');
    }
  };

  // 테스트 데이터 생성 핸들러
  const handleCreateTestData = async () => {
    try {
      console.log('🧪 테스트 데이터 생성 시작...');
      
      const response = await fetch('http://localhost:8000/api/rl/create-test-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`테스트 데이터 생성 실패: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ 테스트 데이터 생성 완료:', result);
      
      if (result.success) {
        alert(`테스트 데이터 생성 완료!\n테스트 일기 ID: ${result.test_diary_id}\n테스트 카드 ID: ${result.test_card_id}`);
      } else {
        alert(`테스트 데이터 생성 실패: ${result.message}`);
      }
      
      setTimeout(() => fetchLearningStatus(), 1000); // 학습 상태 업데이트
    } catch (error) {
      console.error('테스트 데이터 생성 중 오류:', error);
      alert('테스트 데이터 생성에 실패했습니다.');
    }
  };

  return (
    <>
      <Head>
        <title>일기 작성 - Untold</title>
        <meta name="description" content="AI가 도와주는 자동 일기 작성" />
      </Head>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-5">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  📝 {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일기
                </h1>
                <p className="text-gray-600">
                  {existingDiary ? '기존 일기를 수정하고 있습니다' : '새로운 일기를 작성하고 있습니다'}
                </p>
              </div>
              <button
                onClick={() => router.push('/diary/calendar')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                📅 캘린더로 돌아가기
              </button>
            </div>
          </header>


          {/* 일기 작성 뷰 */}
          <div className="max-w-6xl mx-auto">
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
                <p className="text-gray-600">카드를 클릭하여 선택하고 일기를 작성하세요</p>
              </div>
            </div>

            {/* 작성 모드 */}
            <div className="flex gap-7">
              {/* 첫 번째 칸: 크롬 로그 */}
              <div className="w-1/2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                <h3 className="text-xl font-semibold mb-4">🌐 크롬 로그</h3>
                <div className="space-y-2">
                  {chromeLogs.length > 0 ? (
                    chromeLogs.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gray-50 p-3 rounded border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleChromeLogClick(item)}
                        draggable
                        onDragStart={(e) => handleItemDragStart(e, item)}
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
=======

                </div>
              </div>

              {/* 두 번째 칸: 사진 관리 */}
              <div className="w-1/2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
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
=======
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
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm break-words" title={item.title}>
                                  {item.title}
                                </p>
                                <p className="text-xs text-gray-600 break-words mt-1" title={item.content}>
                                  {item.content}
                                </p>
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
                          className="bg-purple-50 p-3 rounded border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
                          onClick={() => handleImageCardClick(card)}
                          draggable
                          onDragStart={(e) => handleItemDragStart(e, card)}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImageCardRemove(card.id);
                              }}
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
            </div>

            {/* 선택된 카드들 */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-4">📋 선택된 카드들 ({selectedCards.length}개)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCards.map((card) => (
                  <div key={card.id} className="p-3 border rounded-lg bg-gray-50">
                    <p className="text-sm font-medium">{card.source_type}</p>
                    <p className="text-xs text-gray-600 truncate">{card.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI 레이아웃 제안 */}
            {selectedCards.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">🤖 AI 레이아웃 제안</h3>
                  <button
                    onClick={handleAutoLayout}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                  >
                    {isGenerating ? '생성 중...' : '레이아웃 생성'}
                  </button>
                </div>
                
                {aiSuggestedLayout && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">AI 추천 레이아웃:</h4>
                    {renderLayoutGrid()}
                  </div>
                )}
              </div>
            )}

            {/* 사용자 레이아웃 편집 */}
            {aiSuggestedLayout && (
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold mb-4">✏️ 레이아웃 편집</h3>
                <p className="text-sm text-gray-600 mb-4">
                  카드를 드래그하여 위치를 변경할 수 있습니다. AI 추천과 다를수록 보상이 감소합니다.
                </p>
                {renderLayoutGrid()}
                
                {/* 보상 정보 표시 */}
                {rewardInfo && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">💰 보상 계산 정보</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-600">레이아웃 보상:</p>
                        <p className={`font-bold ${rewardInfo.layoutReward >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {rewardInfo.layoutReward.toFixed(1)}점
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-600">레이아웃 차이:</p>
                        <p className="font-bold text-gray-800">{rewardInfo.layoutDifference.toFixed(2)}</p>
                      </div>
                    </div>
                    {rewardInfo.details.avg_row_diff !== undefined && (
                      <div className="mt-2 text-xs text-gray-600">
                        평균 행 차이: {rewardInfo.details.avg_row_diff.toFixed(2)}, 
                        평균 열 차이: {rewardInfo.details.avg_col_diff.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 일기 텍스트 입력 */}
            <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 일기 내용
              </label>
              <textarea
                value={diaryText}
                onChange={(e) => setDiaryText(e.target.value)}
                placeholder="선택한 카드들을 보고 일기를 작성하세요..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              
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
      </main>

      {/* 학습 상태 표시 */}
      {learningStatus && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-blue-800">🤖 강화학습 모델 상태</h3>
            <div className="flex gap-2">
              <button
                onClick={fetchLearningStatus}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
              >
                🔄 새로고침
              </button>
              <button
                onClick={handleBatchTrain}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
              >
                🎓 배치 학습
              </button>
              <button
                onClick={handleCreateTestData}
                className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
              >
                🧪 테스트 데이터
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-blue-600 font-medium">모델 로드</p>
              <p className={learningStatus.model_status.loaded ? 'text-green-600' : 'text-red-600'}>
                {learningStatus.model_status.loaded ? '✅ 완료' : '❌ 실패'}
              </p>
            </div>
            <div>
              <p className="text-blue-600 font-medium">총 피드백</p>
              <p className="text-gray-800">{learningStatus.learning_progress.total_feedback}개</p>
            </div>
            <div>
              <p className="text-blue-600 font-medium">긍정 피드백</p>
              <p className="text-green-600">{learningStatus.learning_progress.positive_feedback}개</p>
            </div>
            <div>
              <p className="text-blue-600 font-medium">평균 보상</p>
              <p className="text-gray-800">{learningStatus.learning_progress.average_reward}</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            마지막 업데이트: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}
      
      {/* 학습 상태 로딩 중 표시 */}
      {!learningStatus && (
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg max-w-2xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
            <p className="text-gray-600">강화학습 모델 상태 로딩 중...</p>
          </div>
        </div>
      )}
    </>
  );
} 