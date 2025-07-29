# diary_env.py

import gymnasium as gym
from gymnasium import spaces
import numpy as np
from cards_dummy import get_dummy_cards

class SimpleDiaryEnv(gym.Env):
    """
    카드 UI 배치를 위한 강화학습 환경.
    각 카드는 image/text 여부를 속성으로 가지며,
    agent는 각 카드를 (row, col) 위치에 배치한다.
    """

    def __init__(self):
        super().__init__()

        self.cards_df = get_dummy_cards()               # 카드 데이터 로드
        self.num_cards = len(self.cards_df)
        self.num_rows = 3                               # row, col은 고정된 그리드로 가정
        self.num_cols = 2
        self.grid_size = self.num_rows * self.num_cols

        # action: 각 카드마다 (row, col)을 결정 → 총 2 * N개의 action
        self.action_space = spaces.MultiDiscrete([self.grid_size] * self.num_cards)
        # observation: 각 카드의 image/text 사용 여부 (binary)
        self.observation_space = spaces.Box(
            low=0,
            high=1,
            shape=(self.num_cards, 2),                  # 예: [[1, 1], [1, 0], [0, 1], ...]
            dtype=np.float32
        )

    def reset(self, *, seed=None, options=None):
        super().reset(seed=seed)  # seed 세팅해줌 (중요!)
        obs = self.cards_df[["image_used", "text_used"]].astype(int).values
        return obs, {}  # gymnasium은 tuple로 반환해야 함

    def step(self, action):
        """
        action: [cell_index_0, cell_index_1, ...]
        → 각 카드가 몇 번째 칸(0~5)에 놓일지를 의미
        """
        layout = []
        for i in range(self.num_cards):
            flat_index = action[i]
            row = flat_index // self.num_cols
            col = flat_index % self.num_cols
            layout.append((i, row, col))

        reward = np.random.uniform(0.3, 0.8)
        done = True
        info = {"layout": layout}
        return self.reset()[0], reward, done, False, info
