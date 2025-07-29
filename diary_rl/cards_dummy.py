# cards_dummy.py

import pandas as pd

def get_dummy_cards():
    """
    테스트용 카드 데이터프레임을 생성합니다.
    각 카드는 다음 속성을 가집니다:
    - source_type: "dashboard", "url", "user_input"
    - category: 카드의 콘텐츠 주제
    - image_used: 이미지가 존재하는가
    - text_used: 텍스트가 존재하는가
    """
    return pd.DataFrame([
        {
            "id": "card_1",
            "source_type": "dashboard",
            "category": "news",
            "image_used": True,
            "text_used": True
        },
        {
            "id": "card_2",
            "source_type": "user_input",
            "category": "photo",
            "image_used": True,
            "text_used": False
        },
        {
            "id": "card_3",
            "source_type": "url",
            "category": "youtube",
            "image_used": False,
            "text_used": True
        },
        {
            "id": "card_4",
            "source_type": "dashboard",
            "category": "quote",
            "image_used": False,
            "text_used": True
        },
        {
            "id": "card_5",
            "source_type": "user_input",
            "category": "sunset",
            "image_used": True,
            "text_used": True
        }
    ])
