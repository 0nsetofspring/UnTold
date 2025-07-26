# 📑 Untold

**나도 몰랐던 나를 아는 방법**

하나의 웹 탭에서 **아침 대시보드**(정보·감정 추천)와 **밤 자동 일기**(OCR·AI 초안)를 제공하는 올‑인‑원 서비스

## 🚀 기술 스택

### Frontend
- **React.js / Next.js** - SPA 기반, 서버사이드 렌더링(SSR)
- **TypeScript** - 정적 타입을 통한 안정성 확보
- **Tailwind CSS** - 유틸리티 기반 CSS 프레임워크
- **Axios** - 백엔드 API와의 데이터 통신

### Backend
- **FastAPI (Python)** - 빠르고 모던한 Python 기반 웹 프레임워크
- **SQLAlchemy** - ORM
- **Alembic** - DB 구조 변경 관리
- **SQLite** - 로컬 개발용 데이터베이스

## 📁 프로젝트 구조

```
UnTold/
├── back/                      # 백엔드 (FastAPI + ML)
│   ├── main.py               # FastAPI 앱 진입점
│   ├── api/                  # API 라우터
│   ├── db/                   # 데이터베이스 관련
│   ├── ml/                   # 머신러닝 모듈
│   ├── rl/                   # 강화학습 모듈
│   ├── scripts/              # 유틸리티 스크립트
│   ├── env.local             # 로컬 환경변수
│   └── requirements.txt      # Python 의존성
├── front/                    # 프론트엔드 (Next.js)
│   ├── src/
│   │   ├── pages/           # 페이지 컴포넌트
│   │   ├── components/      # 재사용 컴포넌트
│   │   ├── api/            # API 통신
│   │   └── styles/         # 스타일 파일
│   └── package.json        # Node.js 의존성
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

3. 서버 실행
```bash
python main.py
```

### 프론트엔드 설정

1. 의존성 설치
```bash
cd front
npm install
```

2. 개발 서버 실행
```bash
npm run dev
```

## 🌟 주요 기능

- **아침 대시보드**: 날씨, 뉴스, 환율, NASA, 명언 등 다양한 위젯
- **감정 분석**: KoBERT 기반 감정 분류 및 LSTM 시계열 예측
- **자동 일기 생성**: AI 기반 일기 초안 생성 및 강화학습 개선
- **위젯 마켓**: 사용자 맞춤형 위젯 선택 및 배치

## 📝 개발 가이드

자세한 개발 가이드는 `docs/` 폴더의 문서를 참조하세요.

- `docs/proposal.md` - 프로젝트 기획서
- `docs/api_spec.md` - API 명세서
- `docs/reward_design.md` - 강화학습 보상 설계 