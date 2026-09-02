# 🏛️ [GLOBAL CONSTITUTION v2.2 & HITL TRINITY MANDATE]

> **[AI ARCHITECT GLOBAL CONSTITUTION v2.2 : 상시 활성화 / 전역 최고 거버넌스 규격]**  
> 1. **절대 성역 방어 (SACRED ZONE)**: `GEMINI.md`, `.rules/`, `.gitignore`, `.env`에 대한 임의 수정 원천 차단 (제0절 제1조).  
> 2. **사전 명시적 인가 (PRE-AUTHORIZATION)**: 고위험 작업 시 명시적 "승인(APPROVE)" 키워드 득속 전 파일 수정 봉쇄 (제2절 제8조/제9조).  
> 3. **실환경 실측 증명 (AI PROOF)**: 실제 터미널 명령어 원문과 OS Stdout Exit Code 0 입증 없는 완료 선언 절대 금지 (제1절 제2조 / 제6절 제15조).  
> 4. **3계층 심층 영향도 고지 (IMPACT EXPLANATION)**: 데이터 흐름, 방어된 결함 시나리오, DX 체감 코드 변화 필수 해석 (제1절 제2조 4항 / IMPACT_ANALYSIS_GUIDE).  
> 5. **인간 최종 인수권 (HUMAN DECISION)**: 4단계 완료 보고서 제출 후 최종 승인은 오직 인간이 독점 결정한다 (제6절 제15조 4단계).

---

# [Plan] Phase 1 Step 2: SQLite WAL 캐릭터 & 서사 영구 저장소 구축

## 📌 작업 개요
- **목표**: 도메인 엔티티(`Character`, `TurnSnapshot`, `ActionFrame`)를 안전하게 영구 보존하고 원자적 롤백을 지원하는 SQLite WAL 기반 DDL 스키마 및 Repository 어댑터를 구축한다.
- **적용 규칙**: 의존성 역전 원칙(DIP), 도메인 인터페이스 분리, WAL 모드 트랜잭션 보장.

---

## 🛠️ 변경 및 생성 대상 파일 목록

### 1. 도메인 저장소 인터페이스 (src/domain/)
- **[NEW]** [`src/domain/repositories.py`](file:///d:/Development/projects/antigravity/아키텍트%20설계안/src/domain/repositories.py): `CharacterRepository`, `NarrativeSessionRepository` 프로토콜 인터페이스

### 2. 인프라 계층 (src/infrastructure/)
- **[MODIFY]** [`src/infrastructure/database/schema.sql`](file:///d:/Development/projects/antigravity/아키텍트%20설계안/src/infrastructure/database/schema.sql): `characters`, `narrative_sessions`, `turn_history` DDL 테이블 추가
- **[NEW]** [`src/infrastructure/repositories/sqlite_character_repo.py`](file:///d:/Development/projects/antigravity/아키텍트%20설계안/src/infrastructure/repositories/sqlite_character_repo.py): 캐릭터 SQLite 저장소 어댑터
- **[NEW]** [`src/infrastructure/repositories/sqlite_narrative_repo.py`](file:///d:/Development/projects/antigravity/아키텍트%20설계안/src/infrastructure/repositories/sqlite_narrative_repo.py): 서사 세션 및 턴 롤백 어댑터

### 3. 단위 테스트 계층 (tests/unit/infrastructure/)
- **[NEW]** [`tests/unit/infrastructure/test_character_repository.py`](file:///d:/Development/projects/antigravity/아키텍트%20설계안/tests/unit/infrastructure/test_character_repository.py): 캐릭터 저장/조회/갱신 AAA 단위 테스트
- **[NEW]** [`tests/unit/infrastructure/test_narrative_repository.py`](file:///d:/Development/projects/antigravity/아키텍트%20설계안/tests/unit/infrastructure/test_narrative_repository.py): 턴 기록 및 원자적 Undo 롤백 AAA 단위 테스트

---

## 💡 시스템 영향도 심층 분석 (3-Tier Deep-Dive)

#### 1. 💾 데이터 흐름 관점 (Clean 4-Tier DIP Architecture)
* 도메인 계층은 SQLite의 존재를 전혀 알지 못하며, 오직 `CharacterRepository` 인터페이스에만 의존합니다. 인프라 어댑터가 직렬화(JSON)와 역직렬화를 전담하여 도메인 순수성을 100% 보존합니다.

#### 2. 🛡️ 방어된 구체적 결함 시나리오 (Prevented Failures)
* **동시성 락 및 턴 롤백 시 데이터 유실 방어**:
  WAL 모드와 외래키(FK) CASCADE 제약을 적용하여, 롤백 시 단 1개의 고아(Orphan) 레코드도 남지 않고 원자적으로 안전하게 처리됩니다.

#### 3. 🧑‍💻 1인 개발자 체감 변화 (DX)
* 언제든 캐릭터를 저장하고 직전 턴으로 원터치 되돌리기(Undo)할 수 있는 완벽한 세션 매니저를 갖추게 됩니다.
