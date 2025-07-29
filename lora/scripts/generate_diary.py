# scripts/generate_diary.py
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import torch
import os

# 모델 로딩 경로 설정
BASE_MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
LORA_MODEL_DIR = "./models/lora"

print(f"--- 모델 로딩 시작: {BASE_MODEL_NAME} ---")

tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

base_model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL_NAME,
    torch_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16,
    load_in_4bit=True,
    device_map="auto"
)

# LoRA 가중치 로드 및 병합
model = PeftModel.from_pretrained(base_model, LORA_MODEL_DIR)
print("--- LoRA 가중치 병합 중 ---")
model = model.merge_and_unload()
print("--- LoRA 가중치 병합 완료! ---")
model.eval()

print(f"--- 모델 로딩 및 병합 완료! ({LORA_MODEL_DIR} 적용) ---\n")

# 텍스트 생성 함수
def generate_diary_text(category: str, content: str, max_new_tokens: int = 256):
    prompt = f"<s>[INST] 카테고리가 {category}인 글을 내 말투로 작성해줘. 내용은 '{content}'야.[/INST]\n"

    input_ids = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=tokenizer.model_max_length).input_ids.to(model.device)

    generated_ids = model.generate(
        input_ids,
        do_sample=True,
        top_k=50,
        top_p=0.95,
        num_beams=1,
        temperature=0.7,
        max_new_tokens=max_new_tokens,
        pad_token_id=tokenizer.pad_token_id,
        eos_token_id=tokenizer.eos_token_id
    )

    generated_text = tokenizer.decode(generated_ids[0], skip_special_tokens=True)
    
    response_start_index = generated_text.find("[/INST]")
    if response_start_index != -1:
        generated_text = generated_text[response_start_index + len("[/INST]\n"):].strip()
    
    if generated_text.endswith("</s>"):
        generated_text = generated_text[:-len("</s>")].strip()

    return generated_text

# 사용자 입력 및 생성 실행
if __name__ == "__main__":
    print("--- 내 말투 일기 생성기 ---")
    print("종료하려면 'exit'을 입력하세요.")

    while True:
        category_input = input("생성할 글의 카테고리를 입력하세요 (예: 일기, 뉴스_요약, 명언, 감정_기록): ").strip()
        if category_input.lower() == 'exit':
            break

        content_input = input("글의 핵심 내용을 입력하세요 (예: 기분 좋았던 날의 산책): ").strip()
        if content_input.lower() == 'exit':
            break

        if not category_input or not content_input:
            print("카테고리와 내용을 모두 입력해야 합니다. 다시 시도해주세요.")
            continue

        print("\n--- 일기 생성 중... 잠시 기다려주세요 ---")
        try:
            generated_diary = generate_diary_text(category_input, content_input, max_new_tokens=150)
            print("\n--- 생성된 일기 ---")
            print(generated_diary)
            print("--------------------\n")
        except Exception as e:
            print(f"텍스트 생성 중 오류 발생: {e}")
            print("GPU 메모리가 부족할 수 있습니다. 배치 크기 또는 max_new_tokens를 줄여보세요.")

    print("생성기를 종료합니다.")