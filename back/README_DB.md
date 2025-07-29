# 🗄️ 데이터베이스 환경 전환 가이드

이 프로젝트는 **로컬 SQLite**와 **클라우드 Supabase**를 환경에 따라 전환해서 사용할 수 있습니다.

## 🏠 언제 어떤 DB를 사용할까요?

### **로컬 SQLite 사용 시기**
- 🚀 **개발/테스트 단계**
- 💻 **개인 작업** (혼자 작업할 때)
- 🔒 **민감한 데이터** 다룰 때
- 📱 **오프라인 환경**에서 작업
- 🧪 **프로토타이핑** 및 실험

### **Supabase 사용 시기**
- 👥 **협업 단계** (동업자와 데이터 공유)
- 🌐 **배포/프로덕션** (실제 사용자 서비스)
- 🔐 **사용자 인증/권한** 관리
- 📊 **실시간 데이터** 동기화 필요
- 💾 **데이터 백업/복구** 필요

## ⚙️ 환경 설정 방법

### 1. 환경 설정 파일 생성

#### **로컬 개발용** (`back/.env.local`)
```bash
# 로컬 개발 환경 설정 (SQLite 사용)
ENVIRONMENT=development
DATABASE_TYPE=sqlite
SQLITE_DB_PATH=data/local.db

# API 키들
ALADIN_TTB_KEY=your_aladin_key_here
WEATHER_MAP_KEY=your_weather_key_here
```

#### **협업/배포용** (`back/.env.remote`)
```bash
# 협업/배포 환경 설정 (Supabase 사용)
ENVIRONMENT=production
DATABASE_TYPE=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here

# API 키들
ALADIN_TTB_KEY=your_aladin_key_here
WEATHER_MAP_KEY=your_weather_key_here
```

### 2. 환경 전환 스크립트 사용

```bash
# 로컬 환경으로 전환
cd back
python scripts/switch_env.py local

# 협업 환경으로 전환
python scripts/switch_env.py remote

# 현재 환경 확인
python scripts/switch_env.py status
```

## 🔧 사용법

### 1. **개인 개발 시**
```bash
# 1. 로컬 환경으로 전환
python scripts/switch_env.py local

# 2. 서버 실행
python main.py

# 3. 브라우저에서 확인
# http://localhost:8000/debug/env
```

### 2. **협업 시**
```bash
# 1. 협업 환경으로 전환
python scripts/switch_env.py remote

# 2. 서버 실행
python main.py

# 3. 동업자와 같은 데이터 공유
```

## 📊 데이터베이스 정보 확인

### API 엔드포인트
```bash
GET /debug/env
```

응답 예시:
```json
{
  "ENVIRONMENT": "development",
  "DATABASE_TYPE": "sqlite",
  "database_info": {
    "environment": "development",
    "database_type": "sqlite",
    "is_local": true
  }
}
```

### 코드에서 확인
```python
from db.db_utils import db_utils

# 현재 DB 정보 확인
info = db_utils.get_database_info()
print(f"현재 DB: {info['database_type']}")
print(f"로컬 여부: {info['is_local']}")
```

## 🗂️ 데이터베이스 스키마

### SQLite 테이블 구조
```sql
-- 사용자 테이블
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 위젯 테이블
CREATE TABLE user_widgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    widget_name TEXT,
    widget_config TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 일기 테이블
CREATE TABLE diaries (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    content TEXT,
    mood TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### Supabase 테이블 구조
- `users` - 사용자 정보
- `user_widgets` - 사용자별 위젯 설정
- `diaries` - 사용자 일기

## 🔄 데이터 마이그레이션

### SQLite → Supabase
```python
from db.db_utils import db_utils

# SQLite에서 데이터 읽기
sqlite_data = db_utils.get_user_widgets("user123")

# Supabase로 데이터 복사
for widget in sqlite_data:
    db_utils.add_user_widget("user123", widget["widget_name"], widget["widget_config"])
```

### Supabase → SQLite
```python
# Supabase에서 데이터 읽기
supabase_data = db_utils.get_user_widgets("user123")

# SQLite로 데이터 복사 (환경 전환 후)
for widget in supabase_data:
    db_utils.add_user_widget("user123", widget["widget_name"], widget["widget_config"])
```

## 🚨 주의사항

1. **환경 변수 파일 보안**
   - `.env.local`, `.env.remote` 파일은 `.gitignore`에 포함
   - API 키는 절대 공개 저장소에 올리지 않기

2. **데이터 동기화**
   - 로컬과 클라우드 데이터는 별도 관리
   - 필요시 수동으로 데이터 마이그레이션

3. **테이블 스키마**
   - SQLite와 Supabase 테이블 구조가 동일해야 함
   - 스키마 변경 시 양쪽 모두 업데이트

## 🛠️ 문제 해결

### 에러: "SUPABASE_URL 환경 변수가 설정되지 않았습니다"
```bash
# 로컬 환경으로 전환
python scripts/switch_env.py local
```

### 에러: "SQLite DB 파일을 찾을 수 없습니다"
```bash
# data 디렉토리 생성 확인
mkdir -p back/data
```

### 데이터베이스 연결 확인
```bash
# 현재 환경 확인
python scripts/switch_env.py status

# 서버 실행 후 API 확인
curl http://localhost:8000/debug/env
``` 