from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.widget.router import router as widget_router
from dotenv import load_dotenv
import os

# 환경변수 로드
load_dotenv('env.local')

app = FastAPI(
    title="Untold API",
    description="나도 몰랐던 나를 아는 방법 - Untold Backend API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 프론트엔드 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(widget_router, prefix="/api")

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