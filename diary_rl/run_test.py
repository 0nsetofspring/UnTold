# run_test.py

from stable_baselines3 import PPO
from diary_env import SimpleDiaryEnv
import gymnasium as gym
from gymnasium import spaces

def main():
    print("🔧 환경 초기화 중...")
    env = SimpleDiaryEnv()

    print("🧠 PPO 에이전트 생성...")
    model = PPO("MlpPolicy", env, verbose=1)

    print("🏋️‍♀️ 학습 시작 (총 1000 timestep)...")
    model.learn(total_timesteps=1000)

    print("📦 학습 완료. 이제 추론 실행!")
    obs, _ = env.reset()
    action, _ = model.predict(obs)

    _, reward, _, _, info = env.step(action)

    print("\n✅ 강화학습이 배치한 카드 레이아웃:")
    for card_index, row, col in info["layout"]:
        print(f"  - 카드 {card_index}: Row {row}, Col {col}")

    print(f"\n🏁 보상(Reward): {reward:.2f}")

if __name__ == "__main__":
    main()
