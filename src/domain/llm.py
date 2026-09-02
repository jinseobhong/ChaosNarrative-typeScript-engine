"""
src/domain/llm.py — LLM 클라이언트 도메인 인터페이스 계약
"""

from typing import Protocol, Optional


class LLMClient(Protocol):
    """LLM 서사 생성 및 프롬프트 처리 계약 인터페이스"""

    def generate_narrative(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 2048,
        temperature: float = 0.85
    ) -> str:
        """시스템/사용자 프롬프트를 바탕으로 고밀도 서사 산문을 생성한다."""
        ...
