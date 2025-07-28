import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  source: {
    name: string;
  };
}

export default function NewsWidget() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNewsData = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get('/api/widgets/news');
        if (response.data && Array.isArray(response.data.articles)) {
          setArticles(response.data.articles);
          console.log(response.data.articles);
        }
      } catch (error) {
        console.error('뉴스 정보를 가져오는 데 실패했습니다:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNewsData();
  }, []);

  return (
    <div className="bg-white rounded-lg flex flex-col items-start justify-start overflow-hidden p-2">
      {isLoading ? (
        <p className="text-gray-500">로딩 중...</p>
      ) : articles.length > 0 ? (
        <div className="space-y-3">
          {articles.slice(0, 5).map((article, index) => (
            <a 
              key={index} 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {article.urlToImage && (
                <img
                  src={article.urlToImage}
                  alt="뉴스 썸네일"
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 break-words line-clamp-2">
                  {article.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {article.source.name}  
                </p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">뉴스 정보를 불러올 수 없어요.</p>
      )}
    </div>
  );
}