# back/ml/emotion_classifier.py
from sentence_transformers import SentenceTransformer
from sentence_transformers.util import cos_sim

# 모델 로드 (최초 실행 시 자동으로 다운로드)
# 이 모델은 CPU로도 충분히 동작하지만, GPU가 있으면 더 빠릅니다.
model = SentenceTransformer("intfloat/multilingual-e5-large-instruct")

def analyze_sentiment(text: str):
    """
    Instruction-following 임베딩 모델을 사용하여 텍스트의 감정을 분석합니다.
    """
    if not text:
        return {"label": "neutral", "score": 1.0}

    try:
        # 비교할 감정 레이블 정의
        sentiment_labels = ["긍정적인 내용", "부정적인 내용"]
        
        # 1. 모델에 '지시'와 함께 입력 텍스트를 전달하여 임베딩 생성
        # 이 모델은 query 앞에 'instruction'을 붙여주는 것이 중요합니다.
        query = f"query: {text}"
        text_embedding = model.encode(query, convert_to_tensor=True)

        # 2. 감정 레이블들을 임베딩
        # 레이블은 'passage'로 처리하여 문서처럼 다룹니다.
        passages = [f"passage: {label}" for label in sentiment_labels]
        label_embeddings = model.encode(passages, convert_to_tensor=True)

        # 3. 코사인 유사도 계산
        similarities = cos_sim(text_embedding, label_embeddings)

        # 4. 가장 높은 점수를 가진 레이블을 결과로 선택
        top_index = similarities.argmax()
        top_score = similarities[0][top_index].item()
        
        if top_index == 0:
            label = "positive"
        else:
            label = "negative"
            
        return {"label": label, "score": top_score}

    except Exception as e:
        print(f"Error during sentiment analysis: {e}")
        return {"label": "error", "score": 0.0}