# 🏛️ [GLOBAL CONSTITUTION v2.2 & HITL TRINITY MANDATE]

> **[AI ARCHITECT GLOBAL CONSTITUTION v2.2 : 상시 활성화 / 전역 최고 거버넌스 규격]**  
> 1. **절대 성역 방어 (SACRED ZONE)**: `GEMINI.md`, `.rules/`, `.gitignore`, `.env`에 대한 임의 수정 원천 차단 (제0절 제1조).  
> 2. **사전 명시적 인가 (PRE-AUTHORIZATION)**: 고위험 작업 시 명시적 "승인(APPROVE)" 키워드 득속 전 파일 수정 봉쇄 (제2절 제8조/제9조).  
> 3. **실환경 실측 증명 (AI PROOF)**: 실제 터미널 명령어 원문과 OS Stdout Exit Code 0 입증 없는 완료 선언 절대 금지 (제1절 제2조 / 제6절 제15조).  
> 4. **3계층 심층 영향도 고지 (IMPACT EXPLANATION)**: 데이터 흐름, 방어된 결함 시나리오, DX 체감 코드 변화 필수 해석 (제1절 제2조 4항 / IMPACT_ANALYSIS_GUIDE).  
> 5. **인간 최종 인수권 (HUMAN DECISION)**: 4단계 완료 보고서 제출 후 최종 승인은 오직 인간이 독점 결정한다 (제6절 제15조 4단계).

---

# 시스템 요구사항 명세서 (AbyssEmpire Somatic Narrative Engine)

| 항목 | 내용 |
| :--- | :--- |
| **문서 ID** | `SRS-ABYSS-2026-v2.2` |
| **시스템 명칭** | `AbyssEmpire (Constraint-First Somatic Narrative & Character Dynamics Engine)` |
| **개발 패러다임** | `Clean Architecture 4-Tier Pattern` + `Deterministic AI Governance` |
| **작성일 / 개정일** | `2026-09-02` |
| **상태** | `APPROVED (설계 승인)` |

---

## 🎯 1. 시스템 비전 및 핵심 목적 (Vision & Goals)

본 시스템은 LLM의 확률적 환각을 배제하고, **순수 파이썬의 결정론적 생체 역학(17대 텐서 매트릭스 & 4단계 압력 궤적)과 고밀도 문학적 서사 생성을 융합한 차세대 롤플레이 엔진**이다.

---

## 🧬 2. 핵심 도메인 모델 요구사항 (Domain Models)

### 2.1 [DOM-01] 17대 생체·물리 텐서 매트릭스 (`TensorMatrix`)
- 17개 신체 부위(두상, 동공, 성대, 경추, 쇄골, 흉곽, 등줄기, 의복, 손가락, 복부, 골반, 족부 등)의 긴장도를 $0.0 \sim 1.0$ 부동소수점으로 관리.
- 외력 자극 시 **신체 운동 연쇄 파동(`Kinematic Chain`: 시선 ➔ 성대 ➔ 경추 ➔ 흉곽 ➔ 의복 ➔ 손끝)** 전이 알고리즘 내장.
- 상태 변경 시 기존 인스턴스를 변형하지 않고 새로운 불변 `TensorMatrix`를 반환.

### 2.2 [DOM-02] 로웬 5대 신체 갑주 & 4단계 압력 전이 (`PressureStage`)
- `Stage 1 (탄성 저항)` ➔ `Stage 2 (감각 과부하)` ➔ `Stage 3 (소성 항복)` ➔ `Stage 4 (역전 흡착)`
- 에고 내구도(`ego_resilience`)와 긴장도 수치에 따른 결정론적 상태 전이.

### 2.3 [DOM-03] 캐릭터 불변 엔티티 (`Character`)
- `seed_hash`, `name`, `armor_type`, `relational_vector`, `tensors`, `stage`, `ego_resilience`를 캡슐화한 불변 객체.
