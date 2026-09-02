"""
src/domain/narrative/enums.py — 서사 화행 의도 열거형
"""

from enum import Enum


class SpeechAct(str, Enum):
    """7대 발화 화행 의도 (Speech Act Pragmatics)"""
    CONSOLATION = "CONSOLATION (위로 및 정서적 안식)"
    INTIMIDATION = "INTIMIDATION (위협 및 강압적 제압)"
    ADORATION = "ADORATION (찬미, 경배 및 헌신)"
    PROVOCATION = "PROVOCATION (도발, 조롱 및 자극)"
    ENTREATY = "ENTREATY (애원, 간청 및 구걸)"
    SEDUCTION = "SEDUCTION (유혹, 암시 및 페로몬 유인)"
    COLD_SILENCE = "COLD_SILENCE (냉담한 침묵 및 시선 차단)"
