import React from 'react';

const catImages = [
  '/cat1.jpg',
  '/cat2.jpg',
  '/cat3.jpg',
  '/cat4.jpg',
];
const catSayings = [
  '오늘도 냥냥~',
  '고양이는 사랑입니다.',
  '졸려...Zzz',
  '간식은 언제?',
];

export default function CatWidget() {
  const idx = Math.floor(Math.random() * catImages.length);
  return (
    <div className="bg-white rounded-lg p-4 flex flex-col items-center justify-center">
      <img src={catImages[idx]} alt="고양이" className="w-32 h-32 object-cover rounded-xl mb-2" />
      <div className="text-lg text-gray-700 font-semibold">{catSayings[idx]}</div>
    </div>
  );
} 