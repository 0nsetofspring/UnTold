import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [logoSize, setLogoSize] = useState('text-8xl');
  const router = useRouter();

  useEffect(() => {
    // 1초 후에 로고 크기 줄이기
    const timer1 = setTimeout(() => {
      setLogoSize('text-6xl');
    }, 1000);

    // 2초 후에 로그인 버튼 나타나기
    const timer2 = setTimeout(() => {
      setShowLogin(true);
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleLogin = () => {
    // 로그인 버튼 클릭 시 메인 페이지로 이동
    router.push('/dashboard');
  };

  return (
    <>
      <Head>
        <title>Untold - 나도 몰랐던 나를 아는 방법</title>
        <meta name="description" content="하나의 웹 탭에서 아침 대시보드와 밤 자동 일기를 제공하는 올‑인‑원 서비스" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          {/* 로고 */}
          <div className={`font-bold text-gray-900 mb-8 transition-all duration-1000 ease-in-out ${logoSize}`}>
            📑 <span className="text-primary-600">Untold</span>
          </div>
          
          {/* 서브타이틀 */}
          <div className="text-xl text-gray-600 mb-12 transition-opacity duration-1000 ease-in-out">
            나도 몰랐던 나를 아는 방법
          </div>

          {/* 로그인 버튼 */}
          <div 
            className={`transition-all duration-1000 ease-in-out transform ${
              showLogin 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}
          >
            <button
              onClick={handleLogin}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-8 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              🚀 로그인/회원가입 하기
            </button>
          </div>

          {/* 추가 설명 */}
          <div 
            className={`mt-6 text-gray-500 transition-opacity duration-1000 ease-in-out delay-500 ${
              showLogin ? 'opacity-100' : 'opacity-0'
            }`}
          >
            하나의 웹 탭에서 아침 대시보드와 밤 자동 일기를 제공하는 올‑인‑원 서비스
          </div>
        </div>
      </main>
    </>
  );
} 