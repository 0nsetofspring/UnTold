# db/db_utils.py

import sqlite3
import pandas as pd
import uuid
from datetime import datetime

def connect_db(db_path):
    return sqlite3.connect(db_path)

def get_cards(conn, diary_id):
    """해당 일기에 속한 카드들을 불러옵니다"""
    query = """
    SELECT id, source_type, category, image_used, text_used, row, col
    FROM cards
    WHERE diary_id = ?
    """
    return pd.read_sql_query(query, conn, params=(diary_id,))

def update_card_position(conn, card_id, row, col):
    """카드의 row, col 값을 업데이트합니다"""
    query = """
    UPDATE cards
    SET row = ?, col = ?
    WHERE id = ?
    """
    conn.execute(query, (row, col, card_id))
    conn.commit()

def insert_layout_log(conn, diary_id, card_id, prev_row, prev_col, new_row, new_col, step):
    """layout_logs 테이블에 로그를 남깁니다"""
    query = """
    INSERT INTO layout_logs (
        id, diary_id, card_id,
        prev_row, prev_col, new_row, new_col,
        step, created_at, moved_by_user
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    log_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    conn.execute(query, (
        log_id, diary_id, card_id,
        prev_row, prev_col, new_row, new_col,
        step, now, False
    ))
    conn.commit()
