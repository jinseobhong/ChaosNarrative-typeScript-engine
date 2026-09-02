"""
src/application/services/action_parser_service.py — 자연어 대사/지문 분할, 화행 분류, 17대 텐서 매핑 파서
"""

import re
from typing import Tuple, Optional, List, Dict
from src.domain.narrative.enums import SpeechAct
from src.domain.narrative.models import ActionFrame
from src.domain.character.tensor import TENSOR_REGISTRY


class ActionParserService:
    """자연어 입력을 분석하여 정형화된 ActionFrame으로 변환하는 순수 파이썬 파서 서비스"""

    TENSOR_PATTERNS: List[Tuple[str, List[str]]] = [
        ("10_manual", [r"손가락", r"손바닥", r"손목", r"손끝", r"악력", r"뺨", r"손"]),
        ("14_pedal", [r"발목", r"발끝", r"구두", r"발"]),
        ("04_cervical", [r"목덜미", r"초커", r"경추", r"목선", r"(?<![손발])목"]),
        ("02_ocular", [r"시선", r"바라보", r"눈빛", r"동공", r"쳐다보", r"눈가", r"눈"]),
        ("03_vocal", [r"목소리", r"속삭", r"신음", r"호흡", r"입술", r"혀", r"말", r"숨"]),
        ("05_clavicular", [r"쇄골", r"어깨", r"목뼈"]),
        ("06_thoracic", [r"가슴팍", r"흉곽", r"심장", r"심박", r"가슴"]),
        ("07_appendage", [r"귓가", r"귓불", r"꼬리", r"날개", r"귀"]),
        ("08_dorsal", [r"등줄기", r"기립근", r"척추", r"등"]),
        ("09_sartorial", [r"의복", r"단추", r"셔츠", r"지퍼", r"코르셋", r"치마", r"스타킹", r"옷"]),
        ("11_abdominal", [r"복부", r"배꼽", r"명치", r"배"]),
        ("12_pelvic", [r"엉덩이", r"골반", r"요추", r"허리"]),
        ("13_femoral", [r"허벅지", r"대퇴", r"무릎", r"다리"]),
        ("15_integumentary", [r"살결", r"체온", r"홍조", r"피부", r"땀"]),
        ("16_tactile", [r"접촉", r"마찰", r"온기"]),
        ("17_aura", [r"압박", r"분위기", r"밀실", r"공간"]),
    ]

    INTENSITY_MODIFIERS = {
        "격렬하게": 1.0,
        "짓누르": 0.85,
        "세게": 0.75,
        "강하게": 0.7,
        "거칠게": 0.9,
        "살짝": 0.3,
        "부드럽게": 0.3,
        "조심스레": 0.25,
        "가볍게": 0.25,
        "살며시": 0.2,
    }

    def parse(self, user_input: str) -> ActionFrame:
        """자연어 입력을 분석하여 ActionFrame 불변 객체를 생성한다."""
        raw_text = user_input.strip()

        # 1. 대사("...") 및 지문(*...*) 정규식 분리
        dialogue_match = re.search(r'["“]([^"”]+)["”]', raw_text)
        action_match = re.search(r'\*([^*]+)\*', raw_text)

        dialogue = dialogue_match.group(1).strip() if dialogue_match else None
        action = action_match.group(1).strip() if action_match else None

        if not dialogue and not action:
            if any(verb in raw_text for verb in ["다.", "하다", "본다", "만진다", "누른다", "속삭인다"]):
                action = raw_text
            else:
                dialogue = raw_text

        # 2. 화행(SpeechAct) 분류 (대사 우선)
        speech_act = self._classify_speech_act(dialogue or raw_text)

        # 3. 주 자극 텐서 매핑 (지문 우선)
        target_text_for_tensor = action if action else raw_text
        primary_tensor = self._extract_primary_tensor(target_text_for_tensor)

        # 4. 자극 강도 산정
        intensity = self._assess_intensity(raw_text)

        return ActionFrame(
            raw_input=raw_text,
            dialogue_segment=dialogue,
            action_segment=action,
            speech_act=speech_act,
            intensity=intensity,
            primary_tensor=primary_tensor
        )

    def _classify_speech_act(self, text: str) -> SpeechAct:
        if any(w in text for w in ["괜찮아", "울지마", "쉬어", "안심해", "내가 있어", "착하지"]):
            return SpeechAct.CONSOLATION
        elif any(w in text for w in ["꿇어", "복종해", "조용히 해", "명령이야", "벌", "가만히"]):
            return SpeechAct.INTIMIDATION
        elif any(w in text for w in ["아름다워", "예뻐", "빛나", "사랑해", "숭배", "완벽해"]):
            return SpeechAct.ADORATION
        elif any(w in text for w in ["겨우", "이 정도", "겁쟁이", "웃기네", "애송이", "어디 봐"]):
            return SpeechAct.PROVOCATION
        elif any(w in text for w in ["제발", "부탁", "용서", "빌게", "살려줘"]):
            return SpeechAct.ENTREATY
        elif any(w in text for w in ["달콤", "안아줘", "키스", "만져줘", "가까이", "맡아봐"]):
            return SpeechAct.SEDUCTION
        elif len(text.strip()) == 0 or text.strip() in ["...", "…"]:
            return SpeechAct.COLD_SILENCE
        return SpeechAct.CONSOLATION

    def _extract_primary_tensor(self, text: str) -> str:
        for tensor_key, patterns in self.TENSOR_PATTERNS:
            for pat in patterns:
                if re.search(pat, text):
                    return tensor_key
        return "04_cervical"

    def _assess_intensity(self, text: str) -> float:
        for mod, val in self.INTENSITY_MODIFIERS.items():
            if mod in text:
                return val
        return 0.40
