import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useScrap } from '@/hooks/useScrap';

interface Book {
  title: string;
  link: string;
  cover: string;
  author: string;
}

export default function BookWidget() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 스크랩 기능 추가
  const scrapContent = books.length > 0 ? 
    `${books[0].title} - ${books[0].author}` : '';
  const { isScrapped, isLoading: scrapLoading, toggleScrap } = useScrap('widget', 'book', scrapContent);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get('/api/widgets/book');
        if (response.data && Array.isArray(response.data.item)) {
          setBooks(response.data.item);
        }
      } catch (error) {
        console.error('책 정보를 가져오는 데 실패했습니다:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      {/* 스크랩 버튼 */}
      {!isLoading && books.length > 0 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={toggleScrap}
            disabled={scrapLoading}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              isScrapped 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
            } ${scrapLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {scrapLoading ? '처리중...' : isScrapped ? '스크랩됨' : '스크랩하기'}
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-500">책 정보를 불러오는 중...</p>
      ) : books.length > 0 ? (
        <div className="space-y-3">
          {books.map((book, index) => (
            <a 
              key={index} 
              href={book.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <img src={book.cover} alt={book.title} className="w-10 h-14 object-cover rounded" />
              <div className="flex-1 min-w-0">
                {/* 👇 truncate 클래스를 제거하고, 줄바꿈 관련 클래스를 추가했습니다. */}
                <p className="text-sm font-medium text-gray-800 break-words whitespace-normal">
                  {book.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">{book.author}</p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">책 정보를 불러올 수 없어요.</p>
      )}
    </>
  );
}