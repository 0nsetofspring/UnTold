from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

# Supabase 연결 모듈 import (동업자 스타일)
from db.connect import supabase

# 라우터 생성
chrome_router = APIRouter()

def clean_text(text):
    """텍스트에서 특수문자를 제거하는 함수"""
    if not text:
        return text
    
    # 문제가 될 수 있는 문자들을 제거
    replacements = {
        '\u2014': '-',  # em dash
        '\u2013': '-',  # en dash
        '\u2018': "'",  # left single quotation mark
        '\u2019': "'",  # right single quotation mark
        '\u201c': '"',  # left double quotation mark
        '\u201d': '"',  # right double quotation mark
        '\u2026': '...',  # horizontal ellipsis
    }
    
    cleaned = str(text)
    for old, new in replacements.items():
        cleaned = cleaned.replace(old, new)
    
    return cleaned

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
    user_id: Optional[str] = None  # 사용자 ID 추가

# 사용시간 업데이트용 데이터 모델
class DurationUpdateData(BaseModel):
    url: str
    domain: str
    visitStartTime: int
    visitEndTime: int
    duration: int
    user_id: Optional[str] = None  # 사용자 ID 추가

# /log_url 엔드포인트 구현
@chrome_router.post("/log_url")
async def log_url(data: ChromeLogData):
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
        
        # 사용자 ID 처리 (임시로 테스트용 UUID 사용)
        user_id = data.user_id or "7c301fcb-35ad-49e3-8513-79e451f886e1"  # 테스트용 UUID
        
        # Supabase에 저장할 데이터 준비 (특수문자 제거)
        chrome_log_data = {
            "user_id": user_id,
            "url": clean_text(data.url),
            "title": clean_text(data.title),
            "domain": clean_text(data.domain),
            "page_type": clean_text(data.pageType),
            "site_specific_data": data.siteSpecific,  # JSON은 그대로 유지
            "visit_time": data.timestamp.replace('Z', '+00:00'),
            "created_at": datetime.now().isoformat()
        }
        
        # Supabase에 저장 (동업자 스타일)
        response = supabase.table('chrome_logs').insert(chrome_log_data).execute()
        
        if response.data:
            saved_log = response.data[0]
            print(f"✅ 크롬 로그 저장 성공: ID {saved_log['id']}")
            
            # 성공 응답
            return {
                "success": True,
                "message": "URL 로그가 성공적으로 저장되었습니다.",
                "data": {
                    "id": saved_log["id"],
                    "url": data.url,
                    "title": data.title,
                    "domain": data.domain,
                    "page_type": data.pageType,
                    "site_specific_data": data.siteSpecific,
                    "timestamp": data.timestamp,
                    "created_at": datetime.now().isoformat()
                }
            }
        else:
            raise Exception("Supabase 저장 실패: 응답 데이터 없음")
        
    except Exception as e:
        print(f"❌ 에러 발생: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"서버 내부 오류: {str(e)}"
        )

# 사용시간 업데이트 엔드포인트
@chrome_router.post("/update_duration")
async def update_duration(data: DurationUpdateData):
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
        
        # URL과 도메인으로 해당 로그 찾기
        response = supabase.table('chrome_logs').select('*').eq('url', data.url).eq('domain', data.domain).order('created_at', desc=True).limit(1).execute()
        
        if response.data:
            chrome_log = response.data[0]
            
            # duration 업데이트
            update_response = supabase.table('chrome_logs').update({
                "duration": data.duration
            }).eq('id', chrome_log['id']).execute()
            
            if update_response.data:
                updated_log = update_response.data[0]
                print(f"✅ 사용시간 업데이트 성공: ID {updated_log['id']}, 체류시간 {data.duration}초")
                
                # 성공 응답
                return {
                    "success": True,
                    "message": f"사용시간이 성공적으로 업데이트되었습니다. (체류시간: {data.duration}초)",
                    "data": {
                        "id": updated_log["id"],
                        "url": data.url,
                        "domain": data.domain,
                        "duration": data.duration,
                        "updated_at": datetime.now().isoformat()
                    }
                }
            else:
                raise Exception("Supabase 업데이트 실패: 응답 데이터 없음")
        else:
            print(f"⚠️ 해당 로그를 찾을 수 없음: {data.url}")
            return {
                "success": False,
                "message": "해당 로그를 찾을 수 없습니다.",
                "data": None
            }
        
    except Exception as e:
        print(f"❌ 에러 발생: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"서버 내부 오류: {str(e)}"
        )

# 로그 조회 엔드포인트
@chrome_router.get("/logs")
async def get_logs(limit: int = 10):
    """
    저장된 크롬 로그를 조회합니다.
    """
    try:
        response = supabase.table('chrome_logs').select('*').order('created_at', desc=True).limit(limit).execute()
        
        if response.data:
            return {
                "success": True,
                "data": response.data,
                "count": len(response.data)
            }
        return {
            "success": True,
            "data": [],
            "count": 0
        }
    except Exception as e:
        print(f"❌ 로그 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"로그 조회 실패: {str(e)}"
        )
