from fastapi import FastAPI
from pydantic import BaseModel
from ml.emotion_classifier import analyze_sentiment

app = FastAPI(
    title="Emotion Analysis Test API",
    description="2D 감정 분석 모델 테스트용 API",
    version="1.0.0"
)

# 요청 시 받을 데이터 형식을 정의
class SentimentRequest(BaseModel):
    text: str

@app.post("/sentiment")
async def get_sentiment(request: SentimentRequest):
    """텍스트를 받아 2D 감성 분석 결과를 반환"""
    return analyze_sentiment(request.text)

@app.get("/")
async def root():
    return {"message": "2D Emotion Analysis API Test Server"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": "2D Emotion Regression Model"}

if __name__ == "__main__":
    import uvicorn
    print("2D 감정 분석 API 테스트 서버를 시작합니다...")
    uvicorn.run(app, host="0.0.0.0", port=8001) 