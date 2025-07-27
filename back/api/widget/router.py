# api/widget/router.py
# 위젯 관련 API 라우터 모듈

from fastapi import APIRouter
from . import randomDog, advice, book, weather, news  

router = APIRouter(
    prefix="/widgets",
    tags=["Widgets"],
)

@router.get("/randomDog")
async def get_random_dog_widget_data():
    """오늘의 강아지 위젯 데이터를 반환합니다."""
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