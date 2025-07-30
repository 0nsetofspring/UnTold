# back/rl_core/rl_env.py

import numpy as np
from typing import List, Dict, Any, Tuple, Optional
import math # 올림 연산을 위해 import
import torch # torch.Tensor 타입을 위해 임포트 (PPOModel과 연동)

class RLConfig:
    """강화학습 환경의 설정을 정의하는 클래스"""
    MAX_ROWS = 3 # 일기 레이아웃의 최대 행 수 (그리드 크기)
    MAX_COLS = 4 # 일기 레이아웃의 최대 열 수 (그리드 크기)
    
    # 보상 값
    REWARD_SAVE = 100.0        # 일기 저장 시 보상 (긍정적)
    REWARD_MODIFY = -50.0      # 레이아웃 수정 시 보상 (수고로움, AI 추천 불만족으로 해석)
    REWARD_REGENERATE = -100.0 # 레이아웃 재추천 요청 시 보상 (불만족 심화)
    REWARD_INVALID_ACTION = -1000.0 # 유효하지 않은 행동 (예: 이미 점유된 칸에 배치)

    # 상태 벡터 차원 관련 설정
    MAX_CARDS_IN_LAYOUT = MAX_ROWS * MAX_COLS # 레이아웃에 들어갈 수 있는 최대 카드 개수 (최대 12개)

    # 카드 특징 정의
    # 현재: has_image(1), has_content(1)
    NUM_CARD_FEATURES = 2 

    # 사용자 특징 정의
    # 현재: average_satisfaction(1), total_diaries(1)
    NUM_USER_FEATURES = 2 

    # 상태 벡터의 최종 차원 계산
    # 사용자 특징 + 현재 배치하려는 카드 인덱스 + 선택된 카드 개수 + (최대 카드 개수 * 카드당 특징) + 그리드 상태 (각 칸의 점유 여부)
    STATE_DIM = NUM_USER_FEATURES + \
                1 + \
                1 + \
                (MAX_CARDS_IN_LAYOUT * NUM_CARD_FEATURES) + \
                (MAX_ROWS * MAX_COLS) # 그리드 칸 수 (0: 비어있음, 1: 점유됨)

    # 행동 공간의 크기 (Discrete Action Space: 각 그리드 셀의 인덱스)
    # 0부터 (MAX_ROWS * MAX_COLS - 1)까지의 정수 (예: 0~11)
    ACTION_SPACE_SIZE = MAX_ROWS * MAX_COLS


class RLEnvironment:
    """
    일기 UI 배치 강화를 위한 환경 클래스
    에이전트가 상호작용할 환경을 정의합니다.
    """
    def __init__(self, config: RLConfig):
        self.config = config
        self.current_user_id: str = None
        self.selected_cards_data: List[Dict[str, Any]] = [] # 카드 ID가 아닌, 실제 카드 상세 데이터 딕셔너리 리스트
        self.num_selected_cards: int = 0
        self.user_profile_data: Dict[str, Any] = {}
        self.grid_state: np.ndarray = np.zeros((self.config.MAX_ROWS, self.config.MAX_COLS), dtype=np.int32) # 그리드 점유 상태 (0: 비어있음, 1: 점유됨)
        self.current_card_index_to_place: int = 0 # 현재 배치하려는 카드 인덱스 (selected_cards_data 리스트 내 인덱스)

    def reset(self, 
              user_id: str, 
              selected_card_ids: List[str], 
              all_cards_data_raw: Dict[str, Dict[str, Any]], 
              user_profile_data_raw: Dict[str, Any]) -> np.ndarray:
        """
        환경을 초기화하고 초기 상태를 반환합니다.
        Args:
            user_id (str): 현재 일기를 생성하려는 사용자 ID.
            selected_card_ids (List[str]): 사용자가 글감으로 선택한 카드 ID (문자열) 리스트.
            all_cards_data_raw (Dict[str, Dict[str, Any]]): 각 카드 ID에 해당하는 상세 데이터 (Dict[card_id_str, card_data_dict]).
            user_profile_data_raw (Dict[str, Any]): 사용자 프로필 데이터 (dict 형태).
        Returns:
            np.ndarray: 강화학습 모델의 입력으로 사용될 초기 상태 벡터.
        """
        self.current_user_id = user_id
        # selected_card_ids에 해당하는 카드들만 필터링하여 저장
        self.selected_cards_data = [all_cards_data_raw[cid] for cid in selected_card_ids if cid in all_cards_data_raw]
        self.num_selected_cards = len(self.selected_cards_data)
        self.user_profile_data = user_profile_data_raw
        self.grid_state = np.zeros((self.config.MAX_ROWS, self.config.MAX_COLS), dtype=np.int32) # 그리드 점유 상태 초기화 (모두 비어있음)
        self.current_card_index_to_place = 0 # 첫 번째 카드부터 배치 시작

        # print(f"RLEnvironment reset for user {user_id} with {self.num_selected_cards} cards.")
        return self._get_state_vector()

    def _get_state_vector(self) -> np.ndarray:
        """
        강화학습 모델의 입력으로 사용될 상태 벡터를 생성합니다.
        사용자 프로필 데이터, 현재 배치하려는 카드 인덱스, 선택된 카드 데이터, 현재 그리드 상태를 활용합니다.
        """
        # 1. 사용자 특징
        user_features = np.array([
            self.user_profile_data.get('average_satisfaction', 0.5), 
            self.user_profile_data.get('total_diaries', 1.0) / 100.0 # 스케일링 (최대 100개 일기 가정)
        ])
        
        # 2. 현재 배치하려는 카드 인덱스 (정규화)
        current_card_idx_feature = np.array([self.current_card_index_to_place / self.config.MAX_CARDS_IN_LAYOUT])

        # 3. 선택된 카드 개수 (정규화)
        num_cards_feature = np.array([self.num_selected_cards / self.config.MAX_CARDS_IN_LAYOUT])

        # 4. 각 카드의 특징 (패딩/트렁케이션 포함)
        card_features_list = []
        for card in self.selected_cards_data:
            has_image = 1.0 if card.get('image_url') else 0.0
            has_content = 1.0 if card.get('content') else 0.0
            # TODO: 카테고리 (source, category) 원-핫 인코딩 등 더 많은 특징 추가 가능
            card_features_list.append([has_image, has_content])
        
        # 선택된 카드 특징들을 하나의 벡터로 평탄화. MAX_CARDS_IN_LAYOUT에 맞춰 패딩/트렁케이션.
        flat_card_features = np.array(card_features_list).flatten()
        
        expected_card_features_dim = self.config.MAX_CARDS_IN_LAYOUT * self.config.NUM_CARD_FEATURES
        if len(flat_card_features) < expected_card_features_dim:
            # 부족하면 0으로 패딩
            card_features_padded = np.pad(flat_card_features, (0, expected_card_features_dim - len(flat_card_features)), 'constant')
        elif len(flat_card_features) > expected_card_features_dim:
            # 많으면 잘라냄
            card_features_padded = flat_card_features[:expected_card_features_dim]
        else:
            card_features_padded = flat_card_features

        # 5. 그리드 상태 (어떤 칸이 점유되었는지)
        grid_flat = self.grid_state.flatten().astype(np.float32) # PPO 모델 입력을 위해 float32로 변환

        # 모든 특징 벡터를 연결하여 최종 상태 벡터 생성
        state_vector = np.concatenate([
            user_features, 
            current_card_idx_feature, 
            num_cards_feature, 
            card_features_padded, 
            grid_flat
        ]).astype(np.float32) # 최종적으로 float32로 변환

        # 정의된 STATE_DIM과 실제 생성된 벡터의 크기가 일치하는지 확인 (디버깅용)
        if state_vector.shape[0] != self.config.STATE_DIM:
            print(f"Warning: State vector dimension mismatch! Expected {self.config.STATE_DIM}, got {state_vector.shape[0]}.")
            # 필요에 따라 패딩/트렁케이션 로직 추가
            if state_vector.shape[0] < self.config.STATE_DIM:
                state_vector = np.pad(state_vector, (0, self.config.STATE_DIM - state_vector.shape[0]), 'constant')
            else:
                state_vector = state_vector[:self.config.STATE_DIM]

        return state_vector

    def step(self, action_idx: int) -> Tuple[np.ndarray, float, bool, Dict[str, Any]]:
        """
        에이전트의 행동(그리드 셀 선택)을 실행하고 다음 상태, 보상, 에피소드 종료 여부, 추가 정보를 반환합니다.
        Args:
            action_idx (int): 모델이 선택한 그리드 셀의 인덱스 (0 ~ MAX_ROWS*MAX_COLS - 1).
        Returns:
            Tuple[np.ndarray, float, bool, Dict[str, Any]]:
                - next_state: 다음 상태 벡터.
                - reward: 이 행동으로 얻은 보상 (단일 스텝 보상).
                - done: 에피소드 종료 여부 (모든 카드가 배치되었거나 유효하지 않은 행동).
                - info: 추가 정보 (현재 배치된 카드 정보 등).
        """
        reward = 0.0
        done = False
        info = {"placed_card_id": None, "row": -1, "col": -1}

        # action_idx를 (row, col)으로 변환
        row = action_idx // self.config.MAX_COLS
        col = action_idx % self.config.MAX_COLS

        # 1. 유효하지 않은 행동 처리 (이미 점유된 칸에 배치 시도)
        if not (0 <= row < self.config.MAX_ROWS and 0 <= col < self.config.MAX_COLS):
            reward = self.config.REWARD_INVALID_ACTION # 범위를 벗어난 행동
            done = True
            print(f"Invalid action: row={row}, col={col} out of bounds.")
        elif self.grid_state[row, col] == 1:
            reward = self.config.REWARD_INVALID_ACTION # 이미 점유된 칸
            done = True
            print(f"Invalid action: Cell ({row}, {col}) already occupied.")
        else:
            # 2. 유효한 행동: 현재 카드를 해당 위치에 배치
            current_card_data = self.selected_cards_data[self.current_card_index_to_place]
            card_id = current_card_data['id']
            
            self.grid_state[row, col] = 1 # 해당 칸을 점유됨으로 표시

            info["placed_card_id"] = card_id
            info["row"] = row
            info["col"] = col
            info["order_index"] = self.current_card_index_to_place

            # 3. 다음 카드 인덱스로 이동
            self.current_card_index_to_place += 1

            # 4. 에피소드 종료 조건 확인
            if self.current_card_index_to_place >= self.num_selected_cards:
                done = True # 모든 카드를 배치했으면 에피소드 종료
                # 이 스텝에서는 보상을 0으로 두고, 최종 보상은 episode_finish_reward에서 처리.
                # 또는 각 스텝마다 작은 보상을 줄 수도 있음 (예: 카드 배치 성공 보상)
                reward = 1.0 # 카드 하나 성공적으로 배치에 대한 작은 긍정 보상

        next_state = self._get_state_vector()
        return next_state, reward, done, info

    def calculate_reward(self, feedback_type: str, details: Dict[str, Any] = None) -> float:
        """
        사용자 피드백에 따라 최종 보상 값을 계산합니다.
        이 함수는 back/api/services/rl_diary_service.py에서 호출됩니다.
        """
        if feedback_type == 'save':
            return self.config.REWARD_SAVE
        elif feedback_type == 'modify':
            # 사용자가 수정한 정도에 따라 보상을 조절할 수도 있습니다.
            # 예: AI 추천 레이아웃과 사용자 수정 레이아웃의 유사도 등 (details에 original_layout, final_layout이 있다면)
            # 여기서는 단순히 고정된 MODIFY 보상 반환
            return self.config.REWARD_MODIFY
        elif feedback_type == 'regenerate':
            return self.config.REWARD_REGENERATE
        else:
            return 0.0 # 알 수 없는 피드백