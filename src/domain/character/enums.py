"""
src/domain/character/enums.py — 캐릭터 생체 역학 및 성향 열거형
"""

from enum import Enum


class LowenArmor(str, Enum):
    """로웬 5대 신체 갑주 유형"""
    RIGID = "Rigid (완벽주의 척추 방어)"
    CONTROLLER = "Controller (상체 팽창 및 지배)"
    ENDURER = "Endurer (신체 억압 및 인내)"
    DEPRIVED = "Deprived (흉곽 함몰 및 애착 갈망)"
    DETACHED = "Detached (체온 냉각 및 해리)"


class PressureStage(str, Enum):
    """신경생리학적 4단계 압력 궤적"""
    STAGE_1_ELASTIC = "Stage 1 (탄성 저항: 꼿꼿한 오만과 반발)"
    STAGE_2_OVERLOAD = "Stage 2 (감각 과부하: 호흡 잠김과 동요)"
    STAGE_3_PLASTIC = "Stage 3 (소성 항복: 가드 크러시 & 무릎 꺾임)"
    STAGE_4_SUCTION = "Stage 4 (역전 흡착: 자발적 안식 & 쾌락 굴종)"


class RelationalVector(str, Enum):
    """5대 범용 관계역학 상성 벡터"""
    DEVOTION_COMFORT = "DEVOTION_COMFORT (순애 및 정서적 위로 벡터)"
    SUBJUGATION = "SUBJUGATION (정복적 압박 벡터)"
    SUBMISSION_FAWN = "SUBMISSION_FAWN (자발적 복종 및 헌신 벡터)"
    SOMATIC_SYNC = "SOMATIC_SYNC (체성 감응 결속 벡터)"
    SUSPENSION = "SUSPENSION (전술적 유예 및 덫 벡터)"
