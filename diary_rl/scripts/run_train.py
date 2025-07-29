# scripts/run_train.py

from stable_baselines3 import PPO
from envs.diary_layout_env import DiaryLayoutEnv

def main():
    print("🔧 환경 초기화 중...")
    env = DiaryLayoutEnv()

    print("🧠 PPO 에이전트 생성...")
    model = PPO("MlpPolicy", env, verbose=1)

    print("🏋️‍♀️ 학습 시작 (총 5000 timestep)...")
    model.learn(total_timesteps=5000)

    print("💾 모델 저장 중...")
    model.save("ppo_diary_layout")

    print("✅ 학습 완료!")

if __name__ == "__main__":
    main()
