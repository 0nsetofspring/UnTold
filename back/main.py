from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.widget.router import router as widget_router
from api.ml_router import router as ml_router
from dotenv import load_dotenv
import os
# 크롬 익스텐션 API 라우터 추가
from chrome_api.chrome_router import chrome_router

# 환경변수 로드
load_dotenv()

app = FastAPI(
    title="Untold API",
    description="나도 몰랐던 나를 아는 방법 - Untold Backend API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",
    "chrome-extension://*", 
    ],  # 프론트엔드 주소, 크롬 익스텐션 (모든 익스텐션)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(widget_router, prefix="/api")
app.include_router(ml_router, prefix="/api")   

# 크롬 익스텐션 라우터 추가
# - /api/log_url: 크롬 익스텐션에서 URL 로그를 받는 엔드포인트
app.include_router(chrome_router, prefix="/api", tags=["chrome"])

@app.get("/")
async def root():
    return {"message": "Welcome to Untold API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/debug/env")
async def debug_env():
    """환경변수 디버그용 엔드포인트"""
    return {
        "ALADIN_TTB_KEY": os.getenv("ALADIN_TTB_KEY"),
        "DATABASE_URL": os.getenv("DATABASE_URL"),
        "ENVIRONMENT": os.getenv("ENVIRONMENT")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 