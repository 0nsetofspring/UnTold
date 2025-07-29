# envs/diary_layout_env.py

import gymnasium as gym
from gymnasium import spaces
import numpy as np

from db.db_utils import get_cards, update_card_position, insert_layout_log
from config import DB_PATH, DIARY_ID
import sqlite3

class DiaryLayoutEnv(gym.Env):
    """
    DB 기반 강화학습 환경.
    카드들을 불러와서 → 에이전트가 배치하면 → DB에 반영하고 → 로그도 남긴다.
    """

    def __init__(self):
        super().__init__()

        self.conn = sqlite3.connect(DB_PATH)
        self.diary_id = DIARY_ID

        self.cards_df = get_cards(self.conn, self.diary_id)
        self.num_cards = len(self.cards_df)

        self.num_rows = 3
        self.num_cols = 2
        self.grid_size = self.num_rows * self.num_cols

        self.action_space = spaces.MultiDiscrete([self.grid_size] * self.num_cards)
        self.observation_space = spaces.Box(low=0, high=1, shape=(self.num_cards, 2), dtype=np.float32)

    def reset(self, *, seed=None, options=None):
        super().reset(seed=seed)
        self.cards_df = get_cards(self.conn, self.diary_id)
        obs = self.cards_df[["image_used", "text_used"]].astype(int).values
        return obs, {}

    def step(self, action):
        layout = []
        for i in range(self.num_cards):
            card = self.cards_df.iloc[i]
            card_id = card["id"]
            prev_row = card["row"] if card["row"] is not None else -1
            prev_col = card["col"] if card["col"] is not None else -1

            flat_idx = action[i]
            new_row = flat_idx // self.num_cols
            new_col = flat_idx % self.num_cols

            update_card_position(self.conn, card_id, new_row, new_col)
            insert_layout_log(self.conn, self.diary_id, card_id, prev_row, prev_col, new_row, new_col, step=0)

            layout.append((i, new_row, new_col))

        # 현재는 reward 없음 (v2에서 구현 예정)
        reward = 0.0
        done = True
        truncated = False
        info = {"layout": layout}
        obs, _ = self.reset()
        return obs, reward, done, truncated, info
