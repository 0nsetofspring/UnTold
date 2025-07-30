# 📑 Untold

**나도 몰랐던 나를 아는 방법**

하나의 웹 탭에서 **아침 대시보드**(정보·감정 추천)와 **밤 자동 일기**(OCR·AI 초안)를 제공하는 올‑인‑원 서비스

## 🚀 기술 스택

### Frontend
- **React.js / Next.js** - SPA 기반, 서버사이드 렌더링(SSR)
- **TypeScript** - 정적 타입을 통한 안정성 확보
- **Tailwind CSS** - 유틸리티 기반 CSS 프레임워크
- **Axios** - 백엔드 API와의 데이터 통신
- **Supabase** - 인증 및 데이터베이스 서비스

### Backend
- **FastAPI (Python)** - 빠르고 모던한 Python 기반 웹 프레임워크
- **SQLAlchemy** - ORM
- **Alembic** - DB 구조 변경 관리
- **Supabase** - PostgreSQL 기반 백엔드 서비스
- **Hugging Face Transformers** - 2D 감정 분석 모델

### Machine Learning
- **2D 감정 분석 모델** - Valence & Arousal 기반 감정 분류
- **KoBERT** - 한국어 감정 분석
- **Sentence Transformers** - 다국어 텍스트 임베딩

## 📁 프로젝트 구조

```
UnTold/
├── back/                      # 백엔드 (FastAPI + ML)
│   ├── main.py               # FastAPI 앱 진입점
│   ├── api/                  # API 라우터
│   │   ├── widget/          # 위젯 관련 API
│   │   └── ml_router.py     # ML API
│   ├── db/                   # 데이터베이스 관련
│   ├── ml/                   # 머신러닝 모듈
│   │   ├── emotion_classifier.py  # 2D 감정 분석
│   │   └── best_emotion_regressor/ # 훈련된 모델
│   ├── rl/                   # 강화학습 모듈
│   ├── scripts/              # 유틸리티 스크립트
│   ├── test_emotion_model.py # 모델 테스트 코드
│   ├── test_emotion_curl.sh  # curl 테스트 스크립트
│   ├── .env                  # 환경변수
│   └── requirements.txt      # Python 의존성
├── front/                    # 프론트엔드 (Next.js)
│   ├── src/
│   │   ├── pages/           # 페이지 컴포넌트
│   │   │   ├── index.tsx    # 스플래시/로그인 페이지
│   │   │   ├── dashboard/   # 대시보드
│   │   │   └── widget-store/ # 위젯 스토어
│   │   ├── components/      # 재사용 컴포넌트
│   │   │   └── widget/      # 위젯 컴포넌트들
│   │   ├── api/            # API 통신
│   │   └── styles/         # 스타일 파일
│   └── package.json        # Node.js 의존성
├── extension/               # 크롬 익스텐션
└── docs/                    # 문서
    └── proposal.md          # 기획서
```

## 🛠️ 개발 환경 설정

### 백엔드 설정

1. Python 가상환경 생성 및 활성화
```bash
cd back
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. 의존성 설치
```bash
pip install -r requirements.txt
```

3. 환경변수 설정
```bash
# back/.env 파일 생성
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

4. 서버 실행
```bash
python main.py
```

### 프론트엔드 설정

1. 의존성 설치
```bash
cd front
npm install
```

2. 환경변수 설정
```bash
# front/.env.local 파일 생성
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. 개발 서버 실행
```bash
npm run dev
```

## 🌟 주요 기능

### 🔐 인증 시스템
- **카카오 로그인** - OAuth 기반 소셜 로그인
- **Google 로그인** - OAuth 기반 소셜 로그인  
- **GitHub 로그인** - OAuth 기반 소셜 로그인
- **Supabase Auth** - 사용자 관리 및 세션 관리

### 📊 아침 대시보드
- **날씨 위젯** - 실시간 날씨 정보
- **뉴스 위젯** - 최신 뉴스 헤드라인
- **NASA 위젯** - 우주 사진 및 정보
- **명언 위젯** - 일일 명언
- **주식 위젯** - 실시간 주식 정보
- **음악 위젯** - 추천 음악
- **고양이 위젯** - 귀여운 고양이 사진
- **강아지 위젯** - 랜덤 강아지 사진
- **책 추천 위젯** - 개인화된 책 추천

### 🧠 2D 감정 분석
- **Valence (긍정성)** - -1 ~ 1 (부정적 ~ 긍정적)
- **Arousal (활성도)** - -1 ~ 1 (낮은 활성도 ~ 높은 활성도)
- **7가지 감정 레이블**: excited, calm, pleasant, angry, sad, unpleasant, tense, relaxed, neutral
- **높은 정확도**: 57-81% 신뢰도

### 📝 자동 일기 생성
- **AI 기반 초안 생성** - 사용자 감정 기반 맞춤형 일기
- **강화학습 개선** - 사용자 피드백 기반 모델 개선
- **OCR 기능** - 이미지에서 텍스트 추출

### 🛍️ 위젯 마켓
- **사용자 맞춤형 위젯** - 개인화된 위젯 선택
- **드래그 앤 드롭** - 직관적인 위젯 배치
- **실시간 저장** - 사용자 설정 자동 저장

## 🧪 테스트

### 모델 테스트
```bash
# Python 테스트 실행
cd back
python test_emotion_model.py

# Curl 테스트 실행  
cd back
./test_emotion_curl.sh

# 개별 API 테스트
curl -X POST "http://localhost:8000/api/ml/sentiment" \
  -H "Content-Type: application/json" \
  -d '{"text": "오늘은 정말 행복한 하루였어요!"}'
```

### API 엔드포인트
- `GET /health` - 서버 상태 확인
- `GET /api/ml/test` - ML API 테스트
- `POST /api/ml/sentiment` - 2D 감정 분석
- `GET /api/widgets/user/{user_id}` - 사용자 위젯 조회
- `POST /api/widgets/user/{user_id}` - 사용자 위젯 저장
