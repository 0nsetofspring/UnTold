from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import json
from sqlalchemy.orm import Session

# 크롬 DB 연결 모듈 import (절대 경로로 수정)
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from chrome_db.chromedb_connect import get_db, save_chrome_log, create_tables, update_chrome_log_duration

# 라우터 생성
chrome_router = APIRouter()

# 데이터 모델 정의
class ChromeLogData(BaseModel):
    url: str
    title: str
    domain: str
    timestamp: str
    pageType: str
    siteSpecific: Dict[str, Any]
    visitStartTime: Optional[int] = None
    currentTime: Optional[int] = None

# 🆕 사용시간 업데이트용 데이터 모델
class DurationUpdateData(BaseModel):
    url: str
    domain: str
    visitStartTime: int
    visitEndTime: int
    duration: int

# /log_url 엔드포인트 구현
@chrome_router.post("/log_url")
async def log_url(data: ChromeLogData, db: Session = Depends(get_db)):
    """
    크롬 익스텐션에서 보낸 URL 로그를 받아서 처리하고 DB에 저장
    """
    try:
        # 받은 데이터 로그 출력
        print(f"📥 크롬 익스텐션에서 데이터 수신:")
        print(f"  - URL: {data.url}")
        print(f"  - 제목: {data.title}")
        print(f"  - 도메인: {data.domain}")
        print(f"  - 페이지 유형: {data.pageType}")
        print(f"  - 사이트별 정보: {data.siteSpecific}")
        if data.visitStartTime:
            print(f"  - 방문 시작 시간: {datetime.fromtimestamp(data.visitStartTime/1000).strftime('%H:%M:%S')}")
        
        # 🆕 데이터베이스에 저장
        saved_log = save_chrome_log(db, data)
        
        # 성공 응답
        return {
            "success": True,
            "message": "URL 로그가 성공적으로 저장되었습니다.",
            "data": {
                "id": saved_log.id,
                "url": data.url,
                "title": data.title,
                "domain": data.domain,
                "pageType": data.pageType,
                "timestamp": data.timestamp,
                "created_at": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        print(f"❌ 에러 발생: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"서버 내부 오류: {str(e)}"
        )

# 🆕 사용시간 업데이트 엔드포인트
@chrome_router.post("/update_duration")
async def update_duration(data: DurationUpdateData, db: Session = Depends(get_db)):
    """
    크롬 익스텐션에서 보낸 사용시간 정보를 받아서 기존 로그를 업데이트
    """
    try:
        # 받은 데이터 로그 출력
        print(f"⏰ 사용시간 업데이트 요청:")
        print(f"  - URL: {data.url}")
        print(f"  - 도메인: {data.domain}")
        print(f"  - 체류 시간: {data.duration}초")
        print(f"  - 방문 시작: {datetime.fromtimestamp(data.visitStartTime/1000).strftime('%H:%M:%S')}")
        print(f"  - 방문 종료: {datetime.fromtimestamp(data.visitEndTime/1000).strftime('%H:%M:%S')}")
        
        # 🆕 데이터베이스에서 해당 로그 찾아서 duration 업데이트
        updated_log = update_chrome_log_duration(db, data)
        
        # 성공 응답
        return {
            "success": True,
            "message": f"사용시간이 성공적으로 업데이트되었습니다. (체류시간: {data.duration}초)",
            "data": {
                "id": updated_log.id,
                "url": data.url,
                "duration": data.duration,
                "updated_at": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        print(f"❌ 사용시간 업데이트 에러: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"사용시간 업데이트 오류: {str(e)}"
        )

# 🆕 저장된 로그 조회 엔드포인트
@chrome_router.get("/logs")
async def get_logs(limit: int = 10, db: Session = Depends(get_db)):
    """
    저장된 크롬 로그를 조회
    """
    try:
        from chrome_db.chromedb_connect import get_chrome_logs
        logs = get_chrome_logs(db, limit)
        
        return {
            "success": True,
            "message": f"최근 {len(logs)}개의 로그를 조회했습니다.",
            "data": logs
        }
        
    except Exception as e:
        print(f"❌ 로그 조회 에러: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"로그 조회 오류: {str(e)}"
        )
