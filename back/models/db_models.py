# back/models/db_models.py

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid # UUID 타입 사용을 위해 임포트

# Users 테이블 (users DB 스키마 참조)
class User(BaseModel):
    id: uuid.UUID # UUID 타입으로 변경
    kakao_id: Optional[str] = None
    nickname: Optional[str] = None
    # rl_env.py에서 사용할 필드들. 실제 DB 컬럼명에 맞게 변경하세요.
    # 예: user_profile 테이블에 average_satisfaction, total_diaries 컬럼이 있다고 가정
    average_satisfaction: Optional[float] = 0.5
    total_diaries: Optional[int] = 0

# Cards 테이블 (이전에 보내주신 Supabase 스키마 사진 기반)
class Card(BaseModel):
    id: uuid.UUID        # 'uuid' 타입
    user_id: uuid.UUID   # 'uuid' 타입, users.id 참조
    source: str          # 'text' 타입, 'diary_entry', 'chrome_log', 'user_widget' 등
    category: str        # 'text' 타입, 'food', 'travel', 'emotion' 등
    content: Optional[str] = None # 'text' 타입, Nullable
    image_url: Optional[str] = None # 'text' 타입, Nullable
    created_at: datetime # 'timestamptz' 타입

# Diaries 테이블 (diaries DB 스키마 참조 - 필요한 경우 추가)
# 현재 DB 사진에 'diaries' 테이블이 명확히 보이진 않지만,
# 'reward_logs'와 'layout_logs'가 'diary_id'를 참조하므로, 기본 구조를 가정하여 추가합니다.
class Diary(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    date: datetime # 또는 다른 적절한 컬럼
    emotion_vector: Optional[List[float]] = None
    reward_total: Optional[float] = None
    reward_breakdown: Optional[Dict[str, float]] = None
    created_at: datetime


# Reward Logs 테이블 (reward_logs DB 스키마 참조)
# DB 사진에서 'reward_logs' 테이블의 스키마도 확인했습니다.
# id (uuid), diary_id (uuid), user_id (uuid), feedback_type (text), reward_value (float), details (jsonb), created_at (timestamptz)
class RewardLog(BaseModel):
    id: uuid.UUID
    diary_id: uuid.UUID
    user_id: uuid.UUID # reward_logs에 user_id가 직접 있다면 추가
    feedback_type: str # 'save', 'modify', 'regenerate' 등
    reward_value: float
    details: Optional[Dict[str, Any]] = None # jsonb 타입
    created_at: datetime

# Layout Logs 테이블 (layout_logs DB 스키마 참조)
# DB 사진에서 'layout_logs' 테이블의 스키마도 확인했습니다.
# id (uuid), diary_id (uuid), user_id (uuid), generated_layout (jsonb), final_layout (jsonb), created_at (timestamptz)
class LayoutLog(BaseModel):
    id: uuid.UUID
    diary_id: uuid.UUID
    user_id: uuid.UUID
    generated_layout: Dict[str, Dict[str, int]] # {card_id: {row: int, col: int, order_index: int}}
    final_layout: Optional[Dict[str, Dict[str, int]]] = None # 사용자가 수정한 최종 레이아웃
    created_at: datetime

# User Widgets 테이블 (user_widgets DB 스키마 참조 - 필요한 경우 추가)
# DB 사진에 'user_widgets' 테이블이 명확히 보이진 않지만,
# 만약 있다면 다음과 같이 정의할 수 있습니다.
# class UserWidget(BaseModel):
#    id: uuid.UUID
#    user_id: uuid.UUID
#    widget_name: str
#    data: Optional[Dict[str, Any]] = None # 위젯 관련 데이터 (JSONB)
#    created_at: datetime

# Chrome Logs 테이블 (chrome_logs DB 스키마 참조 - 필요한 경우 추가)
# DB 사진에 'chrome_logs' 테이블이 명확히 보이진 않지만,
# 만약 있다면 다음과 같이 정의할 수 있습니다.
# class ChromeLog(BaseModel):
#    id: uuid.UUID
#    user_id: uuid.UUID
#    url: str
#    title: str
#    domain: str
#    visit_time: datetime
#    duration_seconds: Optional[int] = None
#    category: Optional[str] = None
#    created_at: datetime