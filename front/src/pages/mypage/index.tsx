import Navigation from '../../components/Navigation';
import { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useRouter } from 'next/router';

export default function MyPage() {
  const [fontSize, setFontSize] = useState(16);
  const router = useRouter();
  // 샘플 스크랩/무드 데이터
  const scraps = [
    { id: 1, title: '명언', content: '작은 진전도 진전이다.' },
    { id: 2, title: '강아지 위젯', content: '귀여운 강아지 사진' },
  ];
  const moods = [
    { date: '2025-07-01', mood: '😊' },
    { date: '2025-07-02', mood: '😌' },
    { date: '2025-07-03', mood: '😔' },
    { date: '2025-07-04', mood: '😊' },
    { date: '2025-07-05', mood: '🤔' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100" style={{ fontSize }}>
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
          <div className="flex justify-end mb-4">
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg shadow transition-all duration-200"
            >
              로그아웃
            </button>
          </div>
          <h1 className="text-4xl font-bold mb-6 text-center">👤 마이페이지</h1>
          {/* 글자 크기 조절 */}
          <section className="bg-white/80 rounded-2xl shadow p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="font-semibold">글자 크기</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFontSize(f => Math.max(12, f - 2))} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-lg">-</button>
              <span className="font-mono text-lg">{fontSize}px</span>
              <button onClick={() => setFontSize(f => Math.min(32, f + 2))} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-lg">+</button>
            </div>
          </section>
          {/* 스크랩 모아보기 */}
          <section className="bg-white/80 rounded-2xl shadow p-6">
            <div className="font-semibold mb-3">스크랩 모아보기</div>
            <div className="flex flex-col gap-2">
              {scraps.map(s => (
                <div key={s.id} className="p-3 rounded-lg bg-cyan-50 border border-cyan-100">
                  <div className="font-bold">{s.title}</div>
                  <div className="text-gray-700 text-sm">{s.content}</div>
                </div>
              ))}
            </div>
          </section>
          {/* 무드 트래커 */}
          <section className="bg-white/80 rounded-2xl shadow p-6">
            <div className="font-semibold mb-3">무드 트래커</div>
            <div className="flex gap-2">
              {moods.map(m => (
                <div key={m.date} className="flex flex-col items-center">
                  <span className="text-2xl">{m.mood}</span>
                  <span className="text-xs text-gray-500">{m.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
} 