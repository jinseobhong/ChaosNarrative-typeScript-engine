# 🏛️ [GLOBAL CONSTITUTION v2.2 & HITL TRINITY MANDATE]

> **[AI ARCHITECT GLOBAL CONSTITUTION v2.2 : 상시 활성화 / 전역 최고 거버넌스 규격]**  
> 1. **절대 성역 방어 (SACRED ZONE)**: `GEMINI.md`, `.rules/`, `.gitignore`, `.env`에 대한 임의 수정 원천 차단 (제0절 제1조).  
> 2. **사전 명시적 인가 (PRE-AUTHORIZATION)**: 고위험 작업 시 명시적 "승인(APPROVE)" 키워드 득속 전 파일 수정 봉쇄 (제2절 제8조/제9조).  
> 3. **실환경 실측 증명 (AI PROOF)**: 실제 터미널 명령어 원문과 OS Stdout Exit Code 0 입증 없는 완료 선언 절대 금지 (제1절 제2조 / 제6절 제15조).  
> 4. **3계층 심층 영향도 고지 (IMPACT EXPLANATION)**: 데이터 흐름, 방어된 결함 시나리오, DX 체감 코드 변화 필수 해석 (제1절 제2조 4항 / IMPACT_ANALYSIS_GUIDE).  
> 5. **인간 최종 인수권 (HUMAN DECISION)**: 4단계 완료 보고서 제출 후 최종 승인은 오직 인간이 독점 결정한다 (제6절 제15조 4단계).

---

# [Plan] Phase 1 Step 3: Application 계층 (화행 파서 및 서사 턴 오케스트레이터) 구축

## 📌 작업 개요
- **목표**: 사용자의 자연어 발화/행동을 17대 텐서 자극치로 정밀 파싱하는 `ActionParserService`와, 턴 진행 및 원자적 Undo 롤백을 조율하는 `NarrativeOrchestratorService`를 구축한다.
- **적용 규칙**: 도메인/인프라 의존성 주입(DI), 0토큰 결정론적 상태 전이, 3+1 타겟팅 동적 선택지 생성.

---

## 🛠️ 변경 및 생성 대상 파일 목록

### 1. 애플리케이션 DTO 및 서비스 (src/application/)
- **[NEW]** [`src/application/dtos.py`](file:///d:/Development/projects/antigravity/아키텍트%20설계안/src/application/dtos.py): `TurnExecutionRequest`, `TurnExecutionResponse`, `UndoResponse`
- **[NEW]** [`src/application/services/action_parser_service.py`](file:///d:/Development/projects/antigravity/아키텍트%20설계안/src/application/services/action_parser_service.py): 자연어 대사/지문 분할, 7대 화행 의도 분류, 17대 텐서 매핑 파서
- **[NEW]** [`src/application/services/narrative_orchestrator.py`](file:///d:/Development/projects/antigravity/아키텍트%20설계안/src/application/services/narrative_orchestrator.py): 서사 턴 진행, 상태 전이, 3+1 동적 선택지 생성 및 원자적 롤백 서비스

### 2. 단위 테스트 계층 (tests/unit/application/)
- **[NEW]** [`tests/unit/application/test_action_parser.py`](file:///d:/Development/projects/antigravity/아키텍트%20설계안/tests/unit/application/test_action_parser.py): 대사/지문 분할 및 텐서 자극 매핑 AAA 단위 테스트
- **[NEW]** [`tests/unit/application/test_narrative_orchestrator.py`](file:///d:/Development/projects/antigravity/아키텍트%20설계안/tests/unit/application/test_narrative_orchestrator.py): 턴 실행 및 직전 턴 Undo 롤백 조율 AAA 단위 테스트

---

## 💡 시스템 영향도 심층 분석 (3-Tier Deep-Dive)

#### 1. 💾 데이터 흐름 관점 (Application Orchestration Flow)
* `User Input ➔ ActionParserService (ActionFrame) ➔ Character.apply_stimulus ➔ SqliteNarrativeSessionRepository.record_turn ➔ TurnExecutionResponse` 흐름이 완전한 단방향으로 흐르며, 부수 효과가 철저히 통제됩니다.

#### 2. 🛡️ 방어된 구체적 결함 시나리오 (Prevented Failures)
* **비정형 자연어 입력 시 런타임 크래시 0%**:
  사용자가 대사만 입력하거나 지문만 입력하거나 복합 입력을 하더라도 정규식과 방어적 폴백(Fallback)을 통해 항상 유효한 `ActionFrame`을 보장합니다.

#### 3. 🧑‍💻 1인 개발자 체감 변화 (DX)
* 복잡한 LLM 호출 없이도 순수 파이썬만으로 0.001초 만에 캐릭터의 긴장도 전이와 반응 문장을 시뮬레이션할 수 있습니다.
