#!/usr/bin/env python3
# 파인튜닝된 2D 감정 분석 모델을 Hugging Face Hub에 업로드

import os
import shutil
from huggingface_hub import HfApi, create_repo
from transformers import AutoTokenizer
import json

# 설정
MODEL_NAME = "untold-2d-emotion-model"  # Hub에서 사용할 모델 이름
REPO_ID = f"kjy8402/{MODEL_NAME}"  # 실제 사용자명으로 변경
LOCAL_MODEL_PATH = "back/ml/best_emotion_regressor"  # 파인튜닝된 모델 경로
TEMP_UPLOAD_DIR = "temp_upload"

def prepare_model_for_upload():
    """업로드할 모델 파일들을 임시 디렉토리에 정리"""
    print(f"📁 모델 파일들을 {TEMP_UPLOAD_DIR}에 준비 중...")
    
    # 임시 디렉토리 생성
    if os.path.exists(TEMP_UPLOAD_DIR):
        shutil.rmtree(TEMP_UPLOAD_DIR)
    os.makedirs(TEMP_UPLOAD_DIR)
    
    # 필요한 파일들만 복사
    files_to_copy = [
        "model.safetensors",      # 파인튜닝된 모델 가중치
        "tokenizer.json",         # 토크나이저
        "tokenizer_config.json",  # 토크나이저 설정
        "special_tokens_map.json", # 특수 토큰 맵
        "training_args.bin"       # 훈련 설정
    ]
    
    for file in files_to_copy:
        src = os.path.join(LOCAL_MODEL_PATH, file)
        dst = os.path.join(TEMP_UPLOAD_DIR, file)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"✅ 복사 완료: {file}")
        else:
            print(f"⚠️  파일 없음: {file}")
    
    # config.json 생성 (모델 설정 정보)
    config = {
        "architectures": ["EmotionRegressor"],
        "model_type": "emotion_regressor",
        "base_model": "intfloat/multilingual-e5-large-instruct",
        "task": "2d-emotion-regression",
        "num_labels": 2,
        "label_names": ["valence", "arousal"],
        "emotion_labels": ["excited", "pleasant", "calm", "angry", "unpleasant", "sad", "tense", "relaxed", "neutral"],
        "torch_dtype": "float32",
        "transformers_version": "4.54.0"
    }
    
    with open(os.path.join(TEMP_UPLOAD_DIR, "config.json"), "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    print("✅ config.json 생성 완료")
    
    # README.md 생성
    readme_content = f"""---
license: mit
base_model: intfloat/multilingual-e5-large-instruct
tags:
- emotion-analysis
- korean
- sentiment-analysis
- russell-model
- valence-arousal
language:
- ko
pipeline_tag: text-classification
---

# UnTold 2D Emotion Analysis Model

이 모델은 Russell의 감정 모델을 기반으로 한 2차원 감정 분석 모델입니다.

## 모델 설명
- **Base Model**: intfloat/multilingual-e5-large-instruct
- **Task**: 2차원 감정 회귀 (Valence-Arousal)
- **Dataset**: KOTE (Korean Online That Emotion)
- **Languages**: 한국어

## 사용법

```python
from transformers import AutoTokenizer, AutoModel
import torch

# 모델과 토크나이저 로드
tokenizer = AutoTokenizer.from_pretrained("{REPO_ID}")
base_model = AutoModel.from_pretrained("intfloat/multilingual-e5-large-instruct")

# EmotionRegressor 클래스 정의 필요 (GitHub 참조)
# model = EmotionRegressor(base_model)
# model.load_state_dict(torch.load("model.safetensors"))

# 감정 분석
text = "오늘 정말 기분이 좋아요!"
# result = analyze_sentiment(text)
# {{"valence": 0.25, "arousal": 0.34, "emotion_label": "excited"}}
```

## 감정 레이블
- excited (흥분), pleasant (즐거움), calm (평온)
- angry (분노), unpleasant (불쾌), sad (슬픔)  
- tense (긴장), relaxed (이완), neutral (중립)

## 출력 형식
```json
{{
  "valence": float,      // -1(부정) ~ 1(긍정)
  "arousal": float,      // -1(낮은 각성) ~ 1(높은 각성)
  "emotion_label": str,  // Russell 모델 기반 감정 레이블
  "confidence": float    // 예측 신뢰도
}}
```

## GitHub Repository
전체 코드: [UnTold Repository](https://github.com/0nsetofspring/UnTold)
"""
    
    with open(os.path.join(TEMP_UPLOAD_DIR, "README.md"), "w", encoding="utf-8") as f:
        f.write(readme_content)
    print("✅ README.md 생성 완료")

def upload_to_hub(token):
    """Hugging Face Hub에 모델 업로드"""
    try:
        print(f"🚀 Hugging Face Hub에 업로드 시작...")
        print(f"📍 Repository: {REPO_ID}")
        
        # API 객체 생성
        api = HfApi(token=token)
        
        # 레포지토리 생성 (이미 존재하면 무시)
        try:
            create_repo(repo_id=REPO_ID, token=token, exist_ok=True)
            print(f"✅ Repository 생성/확인 완료: {REPO_ID}")
        except Exception as e:
            print(f"⚠️  Repository 생성 실패 (이미 존재할 수 있음): {e}")
        
        # 모델 파일들 업로드
        api.upload_folder(
            folder_path=TEMP_UPLOAD_DIR,
            repo_id=REPO_ID,
            token=token,
            commit_message="Upload fine-tuned 2D emotion analysis model"
        )
        
        print(f"🎉 업로드 완료!")
        print(f"🔗 모델 URL: https://huggingface.co/{REPO_ID}")
        
        return True
        
    except Exception as e:
        print(f"❌ 업로드 실패: {e}")
        return False

def cleanup():
    """임시 디렉토리 정리"""
    if os.path.exists(TEMP_UPLOAD_DIR):
        shutil.rmtree(TEMP_UPLOAD_DIR)
        print("🧹 임시 파일들 정리 완료")

def main():
    print("🤗 UnTold 2D 감정 분석 모델 업로드 스크립트")
    print("=" * 50)
    
    # 1. 모델 파일 준비
    prepare_model_for_upload()
    
    # 2. 토큰 입력 받기
    print("\n🔑 Hugging Face 토큰이 필요합니다.")
    print("   1. https://huggingface.co/settings/tokens 에서 토큰 생성")
    print("   2. Write 권한으로 생성해주세요")
    
    token = input("\n토큰을 입력해주세요 (hf_로 시작): ").strip()
    
    if not token.startswith("hf_"):
        print("❌ 올바른 토큰 형식이 아닙니다.")
        cleanup()
        return
    
    # 3. 업로드 실행
    success = upload_to_hub(token)
    
    # 4. 정리
    cleanup()
    
    if success:
        print("\n🎉 모델 업로드가 완료되었습니다!")
        print(f"🔗 URL: https://huggingface.co/{REPO_ID}")
        print("\n협업자는 다음과 같이 사용할 수 있습니다:")
        print(f"```python")
        print(f"from huggingface_hub import hf_hub_download")
        print(f"model_path = hf_hub_download(repo_id='{REPO_ID}', filename='model.safetensors')")
        print(f"```")
    else:
        print("\n❌ 업로드에 실패했습니다.")

if __name__ == "__main__":
    main() 