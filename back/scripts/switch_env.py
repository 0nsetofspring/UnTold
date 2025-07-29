#!/usr/bin/env python3
"""
환경 전환 스크립트
개발/로컬 환경과 협업/배포 환경을 쉽게 전환할 수 있습니다.
"""

import os
import shutil
import sys
from pathlib import Path

def switch_environment(env_type: str):
    """환경을 전환합니다."""
    
    back_dir = Path(__file__).parent.parent
    env_files = {
        "local": back_dir / ".env.local",
        "remote": back_dir / ".env.remote"
    }
    
    target_env = env_files.get(env_type)
    if not target_env or not target_env.exists():
        print(f"❌ {env_type} 환경 설정 파일이 없습니다.")
        print(f"   {target_env} 파일을 생성해주세요.")
        return False
    
    # .env 파일로 복사
    env_file = back_dir / ".env"
    shutil.copy2(target_env, env_file)
    
    print(f"✅ 환경이 {env_type}로 전환되었습니다!")
    
    # 현재 설정 정보 출력
    os.environ.clear()
    with open(env_file, 'r') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value
    
    print(f"🔧 현재 설정:")
    print(f"   환경: {os.environ.get('ENVIRONMENT', 'unknown')}")
    print(f"   DB 타입: {os.environ.get('DATABASE_TYPE', 'unknown')}")
    
    return True

def show_current_env():
    """현재 환경 설정을 보여줍니다."""
    env_file = Path(__file__).parent.parent / ".env"
    
    if not env_file.exists():
        print("❌ .env 파일이 없습니다.")
        return
    
    print("🔧 현재 환경 설정:")
    with open(env_file, 'r') as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                print(f"   {line.strip()}")

def main():
    if len(sys.argv) < 2:
        print("사용법:")
        print("  python switch_env.py local    # 로컬 환경으로 전환")
        print("  python switch_env.py remote   # 협업 환경으로 전환")
        print("  python switch_env.py status   # 현재 환경 확인")
        return
    
    command = sys.argv[1].lower()
    
    if command == "local":
        switch_environment("local")
    elif command == "remote":
        switch_environment("remote")
    elif command == "status":
        show_current_env()
    else:
        print(f"❌ 알 수 없는 명령어: {command}")

if __name__ == "__main__":
    main() 