# back/api/rl_router.py

from fastapi import APIRouter, HTTPException, Body
from typing import List
from ..api.services.rl_diary_service import RLIntegrationService # services 폴더의 rl_diary_service 임포트

router = APIRouter()

# RLIntegrationService 인스턴스 생성
rl_service = RLIntegrationService()

@router.post("/diary/recommend_layout")
async def recommend_diary_layout(
    user_id: str = Body(..., embed=True), # Request Body에서 user_id 추출
    selected_card_ids: List[str] = Body(..., embed=True) # Request Body에서 selected_card_ids 추출
):
    """
    강화학습 모델이 추천하는 일기 레이아웃을 생성합니다.
    """
    if not user_id or not selected_card_ids:
        raise HTTPException(status_code=400, detail="User ID and selected card IDs are required.")

    try:
        recommended_layout = await rl_service.get_recommended_layout(user_id, selected_card_ids)
        return {"message": "Layout recommended successfully", "recommended_layout": recommended_layout}
    except Exception as e:
        # 실제 운영에서는 에러 메시지를 일반화하고 상세 내용은 로깅 시스템에 기록
        raise HTTPException(status_code=500, detail=f"Failed to recommend layout: {e}")

@router.post("/diary/feedback")
async def receive_user_feedback(
    user_id: str = Body(..., embed=True),
    diary_id: str = Body(..., embed=True),
    feedback_type: str = Body(..., embed=True),
    details: dict = Body(None, embed=True)
):
    """
    사용자 피드백을 받아 강화학습 모델 학습에 활용하도록 기록합니다.
    """
    if not user_id or not diary_id or not feedback_type:
        raise HTTPException(status_code=400, detail="User ID, Diary ID, and Feedback type are required.")

    try:
        await rl_service.handle_user_feedback(user_id, diary_id, feedback_type, details)
        return {"message": "Feedback received and logged successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process feedback: {e}")