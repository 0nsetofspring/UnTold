# back/api/services/rl_diary_service.py

import uuid
from typing import List, Dict, Any, Optional
import asyncio

# Supabase 클라이언트 임포트
from back.db.connect import supabase
# DB 모델 임포트
from back.models.db_models import User, Card, LayoutLog, RewardLog
# RL Core 모듈 임포트
from back.rl_core.rl_env import RLEnvironment, RLConfig
from back.rl_core.rl_model import PPOModel, PPOConfig # PPOModel, PPOConfig 임포트
import os
import numpy as np # np.zeros_like 등을 위해 임포트

class RLIntegrationService:
    def __init__(self):
        self.rl_config = RLConfig()
        self.ppo_config = PPOConfig() # PPOConfig 초기화
        self.rl_env = RLEnvironment(self.rl_config)
        self.rl_model = PPOModel(state_dim=self.rl_config.STATE_DIM, action_dim=self.rl_config.ACTION_SPACE_SIZE, ppo_config=self.ppo_config)
        
        # 모델 로드 (서버 시작 시 한 번만 로드)
        model_checkpoint_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                                             "..", "rl_core", "checkpoints", "layout_policy.pth")
        self.rl_model.load_model(model_checkpoint_path)

    async def _get_user_profile_data(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Supabase에서 사용자 프로필 데이터를 조회합니다."""
        try:
            response = await supabase.table('users').select('*').eq('id', user_id).limit(1).execute()
            if response.data:
                # Pydantic 모델로 변환 (선택적)
                # return User(**response.data[0]).model_dump()
                return response.data[0] # Dict 형태로 반환
            return None
        except Exception as e:
            print(f"Error fetching user profile for {user_id}: {e}")
            return None

    async def _get_cards_detail_data(self, card_ids: List[str]) -> Dict[str, Dict[str, Any]]:
        """Supabase에서 여러 카드 데이터를 조회합니다."""
        if not card_ids:
            return {}
        try:
            response = await supabase.table('cards').select('*').in_('id', card_ids).execute()
            # return {str(card['id']): Card(**card).model_dump() for card in response.data}
            return {card['id']: card for card in response.data} # Dict 형태로 반환
        except Exception as e:
            print(f"Error fetching cards detail data for {card_ids}: {e}")
            return {}

    async def _log_layout_to_db(self, layout_log_data: Dict[str, Any]) -> Optional[str]:
        """생성된 레이아웃 로그를 DB에 저장합니다."""
        try:
            # Pydantic 모델을 사용하여 유효성 검사 및 to_dict 변환
            layout_log_to_insert = LayoutLog(**layout_log_data)
            response = await supabase.table('layout_logs').insert(layout_log_to_insert.model_dump()).execute()
            if response.data:
                return response.data[0]['id']
            return None
        except Exception as e:
            print(f"Error logging layout to DB: {e}")
            return None
            
    async def _log_reward_to_db(self, reward_log_data: Dict[str, Any]):
        """사용자 피드백에 대한 보상 로그를 DB에 저장합니다."""
        try:
            reward_log_to_insert = RewardLog(**reward_log_data)
            await supabase.table('reward_logs').insert(reward_log_to_insert.model_dump()).execute()
        except Exception as e:
            print(f"Error logging reward to DB: {e}")

    async def _update_layout_log_final_layout(self, diary_id: str, final_layout: Dict[str, Dict[str, int]]):
        """layout_logs 테이블의 final_layout을 업데이트합니다."""
        try:
            await supabase.table('layout_logs').update({'final_layout': final_layout}).eq('id', diary_id).execute()
            print(f"Updated final_layout for diary {diary_id}")
        except Exception as e:
            print(f"Error updating final_layout for diary {diary_id}: {e}")

    async def get_recommended_layout(self, user_id: str, selected_card_ids: List[str]) -> Optional[Dict[str, Any]]:
        """
        AI 모델을 사용하여 추천 레이아웃을 생성하고 DB에 기록합니다.
        """
        print(f"User {user_id} requested layout for cards: {selected_card_ids}")

        user_profile_data = await self._get_user_profile_data(user_id)
        if not user_profile_data:
            print(f"User profile not found for {user_id}")
            return None

        all_cards_data_raw = await self._get_cards_detail_data(selected_card_ids)
        if not all_cards_data_raw:
            print(f"No card details found for {selected_card_ids}")
            return None
        
        # 환경 초기화 및 초기 상태 벡터 생성
        initial_state_vector = self.rl_env.reset(
            user_id=user_id,
            selected_card_ids=selected_card_ids,
            all_cards_data_raw=all_cards_data_raw,
            user_profile_data_raw=user_profile_data
        )

        # AI 모델로부터 레이아웃 추천 받기 (실제 PPO 추론)
        # grid_state_initial을 넘겨주어, predict_action 내부에서 그리드 상태를 초기화할 수 있도록 함
        recommended_layout_dict = self.rl_model.predict_action(
            state_vector=initial_state_vector,
            selected_card_ids=selected_card_ids,
            max_rows=self.rl_config.MAX_ROWS,
            max_cols=self.rl_config.MAX_COLS,
            grid_state_initial=np.zeros((self.rl_config.MAX_ROWS, self.rl_config.MAX_COLS), dtype=np.int32)
        )
        
        if not recommended_layout_dict:
            print("AI model returned an empty layout.")
            return None

        # 레이아웃 로그 생성 및 DB에 저장
        diary_id = str(uuid.uuid4()) # 새 일기 ID 생성
        layout_log_data = {
            "id": diary_id,
            "user_id": user_id,
            "selected_card_ids": selected_card_ids,
            "generated_layout": recommended_layout_dict,
            "final_layout": None, # 초기에는 final_layout이 없음
            "created_at": datetime.now().isoformat()
        }
        logged_diary_id = await self._log_layout_to_db(layout_log_data)

        if logged_diary_id:
            return {
                "diary_id": logged_diary_id,
                "recommended_layout": recommended_layout_dict
            }
        return None

    async def handle_user_feedback(self, 
                                   user_id: str, 
                                   diary_id: str, 
                                   feedback_type: str, 
                                   details: Dict[str, Any]):
        """
        사용자 피드백을 처리하고 보상 로그를 DB에 저장합니다.
        """
        print(f"User {user_id} provided feedback '{feedback_type}' for diary {diary_id}")

        # 보상 계산 (환경의 calculate_reward 사용)
        reward_value = self.rl_env.calculate_reward(feedback_type, details)

        # 보상 로그 DB에 저장
        reward_log_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "diary_id": diary_id,
            "feedback_type": feedback_type,
            "reward_value": reward_value,
            "created_at": datetime.now().isoformat(),
            "details": details # 원본 레이아웃, 최종 레이아웃 등의 정보 포함
        }
        await self._log_reward_to_db(reward_log_data)

        # 'modify' 피드백의 경우 final_layout 업데이트
        if feedback_type == 'modify' and 'final_layout' in details:
            await self._update_layout_log_final_layout(diary_id, details['final_layout'])

        return {"message": "Feedback received and logged successfully."}