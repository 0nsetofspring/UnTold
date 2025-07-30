import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Navigation from '@/components/Navigation';
import fetchSentiment from './ml_kobert';
import { supabase } from '@/api/supabaseClient';
import { useRouter } from 'next/router';

interface DraggedItem {
  id: string;
  type: 'chrome' | 'custom' | 'widget';
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

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [diaryText, setDiaryText] = useState('');
  const [chromeLogs, setChromeLogs] = useState<DraggedItem[]>([]);
  const [customImages, setCustomImages] = useState<CustomImage[]>([]);
  const [imageCards, setImageCards] = useState<DraggedItem[]>([]);
  const [scrapItems, setScrapItems] = useState<DraggedItem[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [currentDiaryId, setCurrentDiaryId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestedLayout, setAiSuggestedLayout] = useState<any>(null);
  const [userLayout, setUserLayout] = useState<any>(null);
  const [rewardInfo, setRewardInfo] = useState<any>(null);
  const [learningStatus, setLearningStatus] = useState<any>(null);
  const [existingDiary, setExistingDiary] = useState<any>(null);

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

  // 학습 상태 확인 함수
  const fetchLearningStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/rl/learning-status');
      if (response.ok) {
        const status = await response.json();
        setLearningStatus(status);
      }
    } catch (error) {
      console.error('학습 상태 조회 실패:', error);
    }
  };

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
          .maybeSingle();

        if (existingData) {
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

          setCurrentDiaryId(diaryId);
        }
        
        fetchLearningStatus();
        
      } catch (error) {
        console.error('일기 초기화 중 오류:', error);
      }
    };

    if (selectedDate) {
      initializeDiary();
    }
  }, [selectedDate]);

  // 크롬 로그 및 스크랩 데이터 가져오기
  useEffect(() => {
    const fetchChromeLogs = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        return;
      }

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const { data, error } = await supabase
        .from('chrome_logs')
        .select('id, title, duration, visit_time, url')
        .eq('user_id', userData.user.id)
        .gte('visit_time', startOfDay.toISOString())
        .lt('visit_time', endOfDay.toISOString())
        .not('duration', 'is', null)
        .order('duration', { ascending: false })
        .limit(3);

      if (error) {
        console.error('크롬 로그 불러오기 실패:', error);
        return;
      }

      if (data) {
        const formatted: DraggedItem[] = data.map((log: any) => {
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
        return;
      }

      const userId = userData.user.id;
      const koreaTime = new Date(selectedDate.getTime() + (9 * 60 * 60 * 1000));
      const selectedDateString = koreaTime.toISOString().split('T')[0];

      try {
        const response = await fetch(`/api/widgets/scrap/list/${userId}?date=${selectedDateString}`);
        if (!response.ok) {
          return;
        }

        const scrapData = await response.json();

        if (scrapData && Array.isArray(scrapData)) {
          const formatted: DraggedItem[] = scrapData.map((scrap: any) => {
            let icon = '📌';
            switch (scrap.category) {
              case 'weather': icon = '🌤️'; break;
              case 'advice': icon = '💭'; break;
              case 'book': icon = '📚'; break;
              case 'news': icon = '📰'; break;
              case 'randomdog': icon = '🐕'; break;
              case 'cat': icon = '🐱'; break;
              case 'music': icon = '🎵'; break;
              case 'stock': icon = '📈'; break;
              case 'nasa': icon = '🚀'; break;
              default: icon = '📌';
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

  // 크롬 로그 클릭 핸들러
  const handleChromeLogClick = async (item: DraggedItem) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        return;
      }

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

      if (data && data[0]) {
        setSelectedCards(prev => [...prev, data[0]]);
      }
      
    } catch (error) {
      console.error('크롬 로그 카드 저장 중 오류:', error);
    }
  };

  // 스크랩 아이템 클릭 핸들러
  const handleScrapItemClick = async (item: DraggedItem) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        return;
      }

      const cardId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      const cardData = {
        id: cardId,
        diary_id: currentDiaryId,
        source_type: 'widget',
        category: 'scrap',
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

      if (data && data[0]) {
        setSelectedCards(prev => [...prev, data[0]]);
      }
      
    } catch (error) {
      console.error('스크랩 카드 저장 중 오류:', error);
    }
  };

  // 사진 카드 클릭 핸들러
  const handleImageCardClick = async (card: DraggedItem) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        return;
      }

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

      if (data && data[0]) {
        setSelectedCards(prev => [...prev, data[0]]);
      }
      
    } catch (error) {
      console.error('이미지 카드 저장 중 오류:', error);
    }
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
      
      const existingCard = imageCards.find(card => card.id === image.id);
      if (!existingCard) {
        const newCard: DraggedItem = {
          id: image.id,
          type: 'custom',
          title: image.description || '설명 없음',
          content: `${image.description || '설명 없음'}\n[사진 첨부됨]`,
          imageUrl: image.previewUrl
        };
        setImageCards(prev => [...prev, newCard]);
        setCustomImages(prev => prev.filter(img => img.id !== image.id));
      } else {
        setImageCards(prev => 
          prev.map(card => 
            card.id === image.id 
              ? { ...card, title: image.description || '설명 없음', content: `${image.description || '설명 없음'}\n[사진 첨부됨]`, imageUrl: image.previewUrl }
              : card
          )
        );
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

  // AI 레이아웃 제안 함수
  const handleAutoLayout = async () => {
    try {
      setIsGenerating(true);
      
      const selectedCardIds = selectedCards.map(card => card.id);
      
      if (selectedCardIds.length === 0) {
        alert('배치할 카드가 없습니다. 크롬 로그나 사진을 선택해주세요.');
        setIsGenerating(false);
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setIsGenerating(false);
        return;
      }

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
        setAiSuggestedLayout(result.layout);
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

  // 일기 생성 및 보상 계산
  const handleGenerateDiary = async () => {
    if (!diaryText) {
      alert('일기 내용을 입력해주세요.');
      return;
    }

    // 2D 감정 분석 API 호출
    const sentimentResult = await fetchSentiment(diaryText);

    // 2D 감정 분석 결과 처리
    let finalMoodVector = [0, 0]; // 기본값
    
    if (sentimentResult) {
      // 2D 감정 분석 모델의 실제 결과 사용
      const valence = sentimentResult.valence || 0;
      const arousal = sentimentResult.arousal || 0;
      const emotionLabel = sentimentResult.emotion_label || 'neutral';
      
      // mood_vector에 실제 2D 좌표값 저장
      finalMoodVector = [valence, arousal];
      
      console.log('🎭 2D 감정 분석 결과:', {
        valence,
        arousal,
        emotionLabel,
        finalMoodVector
      });
    } else {
      console.log('⚠️ 감정 분석 결과가 없습니다.');
    }

    // 레이아웃 차이 기반 보상 계산
    let layoutReward = 0;
    let layoutDifference = 0;
    let rewardDetails = {};

    if (aiSuggestedLayout && userLayout) {
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
        layoutReward = -layoutDifference * 20;
        
        rewardDetails = {
          avg_row_diff: avgRowDiff,
          avg_col_diff: avgColDiff,
          total_difference: layoutDifference,
          compared_cards: comparedCards
        };
      }
    } else if (aiSuggestedLayout && !userLayout) {
      layoutReward = 50;
      rewardDetails = { used_ai_layout: true };
    }

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
          const selectedCardIds = selectedCards.map(card => card.id);
          
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
            setTimeout(() => fetchLearningStatus(), 1000);
          } else {
            const errorText = await feedbackResponse.text();
            console.error('❌ RL 피드백 전송 실패:', feedbackResponse.status, errorText);
          }
        }
      } catch (error) {
        console.error('❌ RL 피드백 전송 중 오류:', error);
      }
    }

    alert('일기가 생성되었습니다!');
    // 일기 보기 페이지로 이동
    router.push(`/diary/view?date=${selectedDate.toISOString().split('T')[0]}`);
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

          {/* 3칸 레이아웃 */}
          <div className="grid grid-cols-3 gap-6">
            {/* 첫 번째 칸: 대시보드/크롬 로그 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-xl font-semibold mb-4">🌐 크롬 로그</h3>
              <div className="space-y-2 mb-6">
                {chromeLogs.length > 0 ? (
                  chromeLogs.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 p-3 rounded border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleChromeLogClick(item)}
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

              <h3 className="text-xl font-semibold mb-4">📌 위젯 스크랩</h3>
              <div className="space-y-2">
                {scrapItems.length > 0 ? (
                  scrapItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-blue-50 p-3 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleScrapItemClick(item)}
                    >
                      <p className="font-medium text-sm break-words" title={item.title}>
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-600 break-words mt-1" title={item.content}>
                        {item.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">
                    {selectedDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] 
                      ? '오늘 스크랩한 위젯이 없습니다.' 
                      : `${selectedDate.toLocaleDateString('ko-KR')}에 스크랩한 위젯이 없습니다.`}
                  </p>
                )}
              </div>
            </div>

            {/* 두 번째 칸: 사진 관리 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
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
                      <div className="flex-shrink-0">
                        <img
                          src={image.previewUrl}
                          alt="미리보기"
                          className="w-16 h-16 object-cover rounded border border-gray-300"
                        />
                      </div>
                      
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

              {/* 생성된 사진 카드들 */}
              <h4 className="text-lg font-semibold mb-3 text-gray-700">🖼️ 생성된 카드</h4>
              <div className="space-y-2">
                {imageCards.length > 0 ? (
                  imageCards.map((card) => (
                    <div
                      key={card.id}
                      className="bg-purple-50 p-3 rounded border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
                      onClick={() => handleImageCardClick(card)}
                    >
                      <div className="flex items-start space-x-3">
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

            {/* 세 번째 칸: 일기 생성 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-xl font-semibold mb-4">📝 일기 생성</h3>
              
              {/* 선택된 카드들 */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3">📋 선택된 카드들 ({selectedCards.length}개)</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedCards.map((card) => (
                    <div key={card.id} className="p-2 border rounded-lg bg-gray-50">
                      <p className="text-xs font-medium text-gray-600">{card.source_type}</p>
                      <p className="text-xs text-gray-800 truncate">{card.text_final}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI 레이아웃 제안 */}
              {selectedCards.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold">🤖 AI 레이아웃 제안</h4>
                    <button
                      onClick={handleAutoLayout}
                      disabled={isGenerating}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                    >
                      {isGenerating ? '생성 중...' : '레이아웃 생성'}
                    </button>
                  </div>
                  
                  {aiSuggestedLayout && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800 mb-2">AI 추천 레이아웃이 생성되었습니다!</p>
                      <div className="text-xs text-blue-600">
                        {Object.entries(aiSuggestedLayout).map(([cardId, layout]: [string, any]) => (
                          <div key={cardId}>
                            {cardId.slice(0, 8)}... → ({layout.row}, {layout.col})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 일기 텍스트 입력 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 일기 내용
                </label>
                <textarea
                  value={diaryText}
                  onChange={(e) => setDiaryText(e.target.value)}
                  placeholder="선택한 카드들을 보고 일기를 작성하세요..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* 보상 정보 표시 */}
              {rewardInfo && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">💰 보상 계산 정보</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-green-600">레이아웃 보상:</p>
                      <p className={`font-bold ${rewardInfo.layoutReward >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {rewardInfo.layoutReward.toFixed(1)}점
                      </p>
                    </div>
                    <div>
                      <p className="text-green-600">레이아웃 차이:</p>
                      <p className="font-bold text-gray-800">{rewardInfo.layoutDifference.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 생성 버튼 */}
              <button
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                onClick={handleGenerateDiary}
              >
                🚀 일기 생성
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 학습 상태 표시 */}
      {learningStatus && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-blue-800">🤖 강화학습 모델 상태</h3>
            <button
              onClick={fetchLearningStatus}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
            >
              🔄 새로고침
            </button>
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
        </div>
      )}
    </>
  );
}
