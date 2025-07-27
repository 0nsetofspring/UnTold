// front/src/components/widget/adviceWidget.tsx

import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';

// API 응답 데이터 타입을 새로운 형식에 맞게 수정
interface AdviceData {
  message: string;
  author: string;
}

export default function AdviceWidget() {
  const [advice, setAdvice] = useState<AdviceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get('/api/widgets/advice');
        setAdvice(response.data);
      } catch (error) {
        console.error('명언 데이터를 가져오는 데 실패했습니다:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      {isLoading ? (
        <p className="text-gray-500">명언을 불러오는 중...</p>
      ) : advice ? (
        <div>
          {/* content를 message로 변경 */}
          <blockquote className="italic text-gray-700 mb-3">
            "{advice.message}"
          </blockquote>
          <p className="text-sm text-gray-500 text-right">- {advice.author}</p>
        </div>
      ) : (
        <p className="text-gray-500">명언을 불러올 수 없어요.</p>
      )}
    </>
  );
}