import React from 'react';

const nasaData = [
  {
    title: 'Hubble Sees a Star Set to Explode',
    desc: '허블 망원경이 포착한 초신성 직전의 별',
    url: 'https://apod.nasa.gov/apod/astropix.html',
  },
  {
    title: 'Mars Rover Selfie',
    desc: '화성 탐사 로버의 셀카',
    url: 'https://mars.nasa.gov/',
  },
  {
    title: 'Saturn Rings Close-up',
    desc: '토성 고리의 근접 촬영',
    url: 'https://www.nasa.gov/',
  },
  {
    title: 'Milky Way Over the Desert',
    desc: '사막 위로 펼쳐진 은하수',
    url: 'https://apod.nasa.gov/apod/',
  },
  {
    title: 'Jupiter Storms',
    desc: '목성의 대적점과 폭풍',
    url: 'https://www.nasa.gov/',
  },
];

export default function NasaWidget() {
  // 3개 랜덤 추출
  const shuffled = [...nasaData].sort(() => 0.5 - Math.random());
  const showList = shuffled.slice(0, 3);
  return (
    <div className="bg-white rounded-lg p-4">
      <div className="space-y-2">
        {showList.map((data, idx) => (
          <div key={data.title} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-800 truncate">{idx+1}. {data.title}</div>
              <div className="text-sm text-gray-500 truncate">{data.desc}</div>
            </div>
            <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs ml-2 hover:underline">자세히</a>
          </div>
        ))}
      </div>
    </div>
  );
} 