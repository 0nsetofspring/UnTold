#!/bin/bash

echo "🚀 Untold 개발 환경 설정을 시작합니다..."

# 백엔드 설정
echo "📦 백엔드 의존성 설치 중..."
cd back
if [ ! -d "venv" ]; then
    echo "Python 가상환경을 생성합니다..."
    python3 -m venv venv
fi

echo "가상환경을 활성화합니다..."
source venv/bin/activate

echo "Python 패키지를 설치합니다..."
pip install -r requirements.txt

echo "✅ 백엔드 설정 완료!"

# 프론트엔드 설정
echo "📦 프론트엔드 의존성 설치 중..."
cd ../front
npm install

echo "✅ 프론트엔드 설정 완료!"

echo ""
echo "🎉 개발 환경 설정이 완료되었습니다!"
echo ""
echo "다음 명령어로 개발 서버를 실행하세요:"
echo ""
echo "백엔드 (새 터미널에서):"
echo "  cd back"
echo "  source venv/bin/activate"
echo "  python main.py"
echo ""
echo "프론트엔드 (새 터미널에서):"
echo "  cd front"
echo "  npm run dev"
echo ""
echo "🌐 브라우저에서 http://localhost:3000 으로 접속하세요!" 