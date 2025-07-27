// front/src/components/widget/randomdogWidget.tsx

import React, { useState, useEffect } from 'react';

export default function RandomDogWidget() {
  const [dogImageUrl, setDogImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDogImage = async () => {
      setIsLoading(true);
      try {
        // Dog API 직접 호출 (백엔드 없이)
        const response = await fetch('https://dog.ceo/api/breeds/image/random');
        const data = await response.json();
        
        if (data.status === 'success') {
          setDogImageUrl(data.message);
        } else {
          console.error('강아지 이미지를 가져올 수 없습니다.');
        }
      } catch (error) {
        console.error('강아지 이미지 로딩 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDogImage();
  }, []);

  return (
    <div className="bg-white rounded-lg h-48 flex items-center justify-center overflow-hidden">
      {isLoading ? (
        <div className="text-gray-500">🐕</div>
      ) : dogImageUrl ? (
        <img 
          src={dogImageUrl} 
          alt="Random Dog" 
          className="w-full h-full object-contain" 
        />
      ) : (
        <div className="text-gray-500">🐕</div>
      )}
    </div>
  );
}