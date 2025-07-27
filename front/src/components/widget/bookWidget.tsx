import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';

interface Book {
  title: string;
  link: string;
  cover: string;
  author: string;
}

export default function BookWidget() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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