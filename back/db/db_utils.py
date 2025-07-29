# back/db/db_utils.py
# 통합 데이터베이스 유틸리티 - SQLite와 Supabase 지원

import json
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional
from .connect import db_manager

class DatabaseUtils:
    """SQLite와 Supabase를 통합해서 사용하는 유틸리티 클래스"""
    
    def __init__(self):
        self.db_manager = db_manager
        self.client = db_manager.get_client()
        self.is_sqlite = db_manager.database_type == "sqlite"
    
    def get_user_widgets(self, user_id: str) -> List[Dict[str, Any]]:
        """사용자의 위젯 목록을 가져옵니다."""
        if self.is_sqlite:
            return self._get_user_widgets_sqlite(user_id)
        else:
            return self._get_user_widgets_supabase(user_id)
    
    def _get_user_widgets_sqlite(self, user_id: str) -> List[Dict[str, Any]]:
        """SQLite에서 사용자 위젯 가져오기"""
        cursor = self.client.cursor()
        cursor.execute("""
            SELECT widget_name, widget_config, created_at
            FROM user_widgets
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (user_id,))
        
        widgets = []
        for row in cursor.fetchall():
            widgets.append({
                "widget_name": row["widget_name"],
                "widget_config": json.loads(row["widget_config"]) if row["widget_config"] else {},
                "created_at": row["created_at"]
            })
        
        return widgets
    
    def _get_user_widgets_supabase(self, user_id: str) -> List[Dict[str, Any]]:
        """Supabase에서 사용자 위젯 가져오기"""
        response = self.client.table("user_widgets").select("*").eq("user_id", user_id).execute()
        return response.data
    
    def add_user_widget(self, user_id: str, widget_name: str, widget_config: Dict = None) -> bool:
        """사용자 위젯을 추가합니다."""
        if self.is_sqlite:
            return self._add_user_widget_sqlite(user_id, widget_name, widget_config)
        else:
            return self._add_user_widget_supabase(user_id, widget_name, widget_config)
    
    def _add_user_widget_sqlite(self, user_id: str, widget_name: str, widget_config: Dict = None) -> bool:
        """SQLite에 사용자 위젯 추가"""
        try:
            cursor = self.client.cursor()
            cursor.execute("""
                INSERT INTO user_widgets (user_id, widget_name, widget_config)
                VALUES (?, ?, ?)
            """, (user_id, widget_name, json.dumps(widget_config) if widget_config else None))
            self.client.commit()
            return True
        except Exception as e:
            print(f"SQLite 위젯 추가 에러: {e}")
            return False
    
    def _add_user_widget_supabase(self, user_id: str, widget_name: str, widget_config: Dict = None) -> bool:
        """Supabase에 사용자 위젯 추가"""
        try:
            data = {
                "user_id": user_id,
                "widget_name": widget_name,
                "widget_config": widget_config or {}
            }
            response = self.client.table("user_widgets").insert(data).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Supabase 위젯 추가 에러: {e}")
            return False
    
    def remove_user_widget(self, user_id: str, widget_name: str) -> bool:
        """사용자 위젯을 제거합니다."""
        if self.is_sqlite:
            return self._remove_user_widget_sqlite(user_id, widget_name)
        else:
            return self._remove_user_widget_supabase(user_id, widget_name)
    
    def _remove_user_widget_sqlite(self, user_id: str, widget_name: str) -> bool:
        """SQLite에서 사용자 위젯 제거"""
        try:
            cursor = self.client.cursor()
            cursor.execute("""
                DELETE FROM user_widgets
                WHERE user_id = ? AND widget_name = ?
            """, (user_id, widget_name))
            self.client.commit()
            return cursor.rowcount > 0
        except Exception as e:
            print(f"SQLite 위젯 제거 에러: {e}")
            return False
    
    def _remove_user_widget_supabase(self, user_id: str, widget_name: str) -> bool:
        """Supabase에서 사용자 위젯 제거"""
        try:
            response = self.client.table("user_widgets").delete().eq("user_id", user_id).eq("widget_name", widget_name).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Supabase 위젯 제거 에러: {e}")
            return False
    
    def save_diary(self, user_id: str, content: str, mood: str = None) -> str:
        """일기를 저장합니다."""
        diary_id = str(uuid.uuid4())
        
        if self.is_sqlite:
            return self._save_diary_sqlite(diary_id, user_id, content, mood)
        else:
            return self._save_diary_supabase(diary_id, user_id, content, mood)
    
    def _save_diary_sqlite(self, diary_id: str, user_id: str, content: str, mood: str = None) -> str:
        """SQLite에 일기 저장"""
        try:
            cursor = self.client.cursor()
            cursor.execute("""
                INSERT INTO diaries (id, user_id, content, mood)
                VALUES (?, ?, ?, ?)
            """, (diary_id, user_id, content, mood))
            self.client.commit()
            return diary_id
        except Exception as e:
            print(f"SQLite 일기 저장 에러: {e}")
            return None
    
    def _save_diary_supabase(self, diary_id: str, user_id: str, content: str, mood: str = None) -> str:
        """Supabase에 일기 저장"""
        try:
            data = {
                "id": diary_id,
                "user_id": user_id,
                "content": content,
                "mood": mood
            }
            response = self.client.table("diaries").insert(data).execute()
            return diary_id if response.data else None
        except Exception as e:
            print(f"Supabase 일기 저장 에러: {e}")
            return None
    
    def get_user_diaries(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """사용자의 일기 목록을 가져옵니다."""
        if self.is_sqlite:
            return self._get_user_diaries_sqlite(user_id, limit)
        else:
            return self._get_user_diaries_supabase(user_id, limit)
    
    def _get_user_diaries_sqlite(self, user_id: str, limit: int) -> List[Dict[str, Any]]:
        """SQLite에서 사용자 일기 가져오기"""
        cursor = self.client.cursor()
        cursor.execute("""
            SELECT id, content, mood, created_at
            FROM diaries
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        """, (user_id, limit))
        
        diaries = []
        for row in cursor.fetchall():
            diaries.append({
                "id": row["id"],
                "content": row["content"],
                "mood": row["mood"],
                "created_at": row["created_at"]
            })
        
        return diaries
    
    def _get_user_diaries_supabase(self, user_id: str, limit: int) -> List[Dict[str, Any]]:
        """Supabase에서 사용자 일기 가져오기"""
        response = self.client.table("diaries").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
        return response.data
    
    def get_database_info(self) -> Dict[str, Any]:
        """현재 데이터베이스 정보를 반환합니다."""
        return self.db_manager.get_database_info()

# 전역 인스턴스 생성
db_utils = DatabaseUtils() 