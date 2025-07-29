# api/widget/router.py
# 위젯 관련 API 라우터 모듈

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import uuid

from . import randomDog, advice, book, weather, news  
from db.db_utils import db_utils


router = APIRouter(
    prefix="/widgets",
    tags=["Widgets"],
)

@router.get("/randomDog")
async def get_random_dog_widget_data():
    """랜덤 강아지 위젯 데이터를 반환합니다."""
    return await random_dog.get_random_dog_image()

@router.get("/advice")
async def get_advice_widget_data():
    """오늘의 명언 위젯 데이터를 반환합니다."""
    return await advice.get_random_advice()

@router.get("/book")
async def get_book_widget_data():
    """알라딘 신간 추천 리스트 위젯 데이터를 반환합니다."""
    return await book.get_new_book_list()

@router.get("/weather")
async def get_weather_widget_data():
    """날씨 정보 위젯 데이터를 반환합니다."""
    return await weather.get_weather_data()

@router.get("/news")
async def get_news_widget_data():
    """뉴스 정보 위젯 데이터를 반환합니다."""
    return await news.get_news_data()


# --- Supabase DB 연동 API ---
# 사용자가 설정한 위젯 목록을 관리

class UserWidget(BaseModel):
    widget_name: str
    position: int

@router.get("/user/{user_id}")
async def get_user_widgets(user_id: uuid.UUID):
    """특정 사용자가 설정한 위젯 목록과 순서를 DB에서 가져옵니다."""
    try:
        widgets = db_utils.get_user_widgets(str(user_id))
        return widgets
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/user/{user_id}")
async def set_user_widgets(user_id: uuid.UUID, widgets: List[UserWidget]):
    """사용자의 위젯 설정을 DB에 저장(업데이트)합니다."""
    try:
        # 기존 위젯들을 모두 제거
        existing_widgets = db_utils.get_user_widgets(str(user_id))
        for widget in existing_widgets:
            db_utils.remove_user_widget(str(user_id), widget["widget_name"])
        
        # 새로운 위젯들을 추가
        success_count = 0
        for widget in widgets:
            widget_config = {"position": widget.position}
            if db_utils.add_user_widget(str(user_id), widget.widget_name, widget_config):
                success_count += 1
        
        return {
            "message": f"User widgets updated successfully. {success_count} widgets saved.",
            "saved_count": success_count
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
