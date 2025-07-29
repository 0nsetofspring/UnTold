# scripts/run_infer.py

from stable_baselines3 import PPO
from envs.diary_layout_env import DiaryLayoutEnv

def main():
    print("📂 모델 로딩 중...")
    model = PPO.load("ppo_diary_layout")

    print("🔧 환경 초기화 중...")
    env = DiaryLayoutEnv()
    obs, _ = env.reset()

    print("🧠 예측 실행 중...")
    action, _ = model.predict(obs)

    print("🏗️ 배치 결과 반영 중...")
    _, _, _, _, info = env.step(action)

    print("\n✅ 강화학습이 배치한 카드 레이아웃:")
    for card_index, row, col in info["layout"]:
        print(f"  - 카드 {card_index} → Row {row}, Col {col}")

if __name__ == "__main__":
    main()
