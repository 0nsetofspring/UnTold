import React from 'react';

const musicList = [
  {
    title: 'Butterfly',
    artist: 'BTS',
    url: 'https://www.youtube.com/watch?v=2cTZTqBU1Rc',
  },
  {
    title: '밤편지',
    artist: '아이유',
    url: 'https://www.youtube.com/watch?v=BzYnNdJhZQw',
  },
  {
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    url: 'https://www.youtube.com/watch?v=JGwWNGJdvx8',
  },
  {
    title: 'Dynamite',
    artist: 'BTS',
    url: 'https://www.youtube.com/watch?v=gdZLi9oWNZg',
  },
  {
    title: 'Permission to Dance',
    artist: 'BTS',
    url: 'https://www.youtube.com/watch?v=CuklIb9d3fI',
  },
];

export default function MusicWidget() {
  // 3개 랜덤 추출
  const shuffled = [...musicList].sort(() => 0.5 - Math.random());
  const showList = shuffled.slice(0, 3);
  return (
    <div className="bg-white rounded-lg p-4">
      <div className="space-y-2">
        {showList.map((music, idx) => (
          <div key={music.title} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-800 truncate">{idx+1}. {music.title}</div>
              <div className="text-sm text-gray-500 truncate">{music.artist}</div>
            </div>
            <a href={music.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs ml-2 hover:underline">듣기</a>
          </div>
        ))}
      </div>
    </div>
  );
} 