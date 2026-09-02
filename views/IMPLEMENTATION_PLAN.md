# 🏛️ [GLOBAL CONSTITUTION v2.2 & HITL TRINITY MANDATE]

> **[AI ARCHITECT GLOBAL CONSTITUTION v2.2 : 상시 활성화 / 전역 최고 거버넌스 규격]**  
> 1. **절대 성역 방어 (SACRED ZONE)**: `GEMINI.md`, `.rules/`, `.gitignore`, `.env`에 대한 임의 수정 원천 차단 (제0절 제1조).  
> 2. **사전 명시적 인가 (PRE-AUTHORIZATION)**: 고위험 작업 시 명시적 "승인(APPROVE)" 키워드 득속 전 파일 수정 봉쇄 (제2절 제8조/제9조).  
> 3. **실환경 실측 증명 (AI PROOF)**: 실제 터미널 명령어 원문과 OS Stdout Exit Code 0 입증 없는 완료 선언 절대 금지 (제1절 제2조 / 제6절 제15조).  
> 4. **3계층 심층 영향도 고지 (IMPACT EXPLANATION)**: 데이터 흐름, 방어된 결함 시나리오, DX 체감 코드 변화 필수 해석 (제1절 제2조 4항 / IMPACT_ANALYSIS_GUIDE).  
> 5. **인간 최종 인수권 (HUMAN DECISION)**: 4단계 완료 보고서 제출 후 최종 승인은 오직 인간이 독점 결정한다 (제6절 제15조 4단계).

---

# [Plan] Phase 1 Step 1: 순수 도메인 생체 역학 및 17대 텐서 불변 모델 구축

## 📌 작업 개요
- **목표**: `legacy/`에서 추출한 17대 신체 텐서, 로웬 신체갑주, 4단계 압력 궤적 및 캐릭터 불변 모델을 Clean Architecture 순수 도메인 계층(`src/domain/`)에 구축하고 100% AAA 단위 테스트로 입증한다.
- **적용 규칙**: PEP 484 정적 타입, `@dataclass(frozen=True)` 불변 패턴, 외부 의존성 0% 순수 도메인.

---

## 🛠️ 변경 및 생성 대상 파일 목록

### 1. 도메인 계층 (Pure Domain Layer)
- **[NEW]** [`src/domain/character/enums.py`](file:///d:/Development/projects/antigravity/아키텍트%20설계안/src/domain/character/enums.py): `LowenArmor`, `PressureStage`, `RelationalVector`
- **[NEW]** [`src/domain/character/tensor.py`](file:///d:/Development/projects/antigravity/아키텍트%20설계안/src/domain/character/tensor.py): `TENSOR_REGISTRY` (17대 텐서), `TensorMatrix` (불변 운동 연쇄 전이)
- **[NEW]** [`src/domain/character/models.py`](file:///d:/Development/projects/antigravity/아키텍트%20설계안/src/domain/character/models.py): `SomaticGene`, `Character` (순수 불변 엔티티)
- **[NEW]** [`src/domain/narrative/enums.py`](file:///d:/Development/projects/antigravity/아키텍트%20설계안/src/domain/narrative/enums.py): `SpeechAct` (7대 화행 의도)
- **[NEW]** [`src/domain/narrative/models.py`](file:///d:/Development/projects/antigravity/아키텍트%20설계안/src/domain/narrative/models.py): `ActionFrame`, `TurnSnapshot` (원자적 롤백 스택)

### 2. 단위 테스트 계층 (Unit Tests)
- **[NEW]** [`tests/unit/domain/test_tensor_matrix.py`](file:///d:/Development/projects/antigravity/아키텍트%20설계안/tests/unit/domain/test_tensor_matrix.py): 17대 텐서 외력 자극 및 운동 연쇄 파동 전이 검증 (AAA 패턴)
- **[NEW]** [`tests/unit/domain/test_character.py`](file:///d:/Development/projects/antigravity/아키텍트%20설계안/tests/unit/domain/test_character.py): 캐릭터 불변성, 압력 단계(Stage 1~4) 전이 검증 (AAA 패턴)

---

## 💡 시스템 영향도 심층 분석 (3-Tier Deep-Dive)

#### 1. 💾 데이터 흐름 관점 (Pure Functional Immutability)
* 모든 텐서 및 캐릭터 상태 변경은 기존 인스턴스를 변형하지 않고 **새로운 불변 객체(New Immutable Instance)**를 반환하여, 롤플레이 진행 중 발생할 수 있는 상태 꼬임 및 동시성 데이터 오염을 0%로 차단합니다.

#### 2. 🛡️ 방어된 구체적 결함 시나리오 (Prevented Failures)
* **레거시 가변 딕셔너리 오염 버그 100% 방어**:
  과거 `character.py`에서 딕셔너리를 직접 조작하여 발생하던 '되돌리기(Undo) 시 과거 상태 파괴' 결함이 불변 스냅샷 구조를 통해 물리적으로 완벽히 방어됩니다.

#### 3. 🧑‍💻 1인 개발자 체감 변화 (DX)
* `py -3 .agents/scripts/run_checks.py` 실행 시 0.001초 만에 텐서 역학 및 캐릭터 상태 전이 공식을 100% 자동 검증할 수 있습니다.

---

## 🧪 검증 계획 (Verification Plan)
1. **단위 테스트**: `py -3 -m unittest discover -s tests/unit -p "test_*.py" -v`
2. **원클릭 전사 무결성 검증**: `py -3 .agents/scripts/run_checks.py` (Exit Code 0 필수)
