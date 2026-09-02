# 🏛️ [GLOBAL CONSTITUTION v2.2 & HITL TRINITY MANDATE]

> **[AI ARCHITECT GLOBAL CONSTITUTION v2.2 : 상시 활성화 / 전역 최고 거버넌스 규격]**  
> 1. **절대 성역 방어 (SACRED ZONE)**: `GEMINI.md`, `.rules/`, `.gitignore`, `.env`에 대한 임의 수정 원천 차단 (제0절 제1조).  
> 2. **사전 명시적 인가 (PRE-AUTHORIZATION)**: 고위험 작업 시 명시적 "승인(APPROVE)" 키워드 득속 전 파일 수정 봉쇄 (제2절 제8조/제9조).  
> 3. **실환경 실측 증명 (AI PROOF)**: 실제 터미널 명령어 원문과 OS Stdout Exit Code 0 입증 없는 완료 선언 절대 금지 (제1절 제2조 / 제6절 제15조).  
> 4. **3계층 심층 영향도 고지 (IMPACT EXPLANATION)**: 데이터 흐름, 방어된 결함 시나리오, DX 체감 코드 변화 필수 해석 (제1절 제2조 4항 / IMPACT_ANALYSIS_GUIDE).  
> 5. **인간 최종 인수권 (HUMAN DECISION)**: 4단계 완료 보고서 제출 후 최종 승인은 오직 인간이 독점 결정한다 (제6절 제15조 4단계).

---

# IMPLEMENTATION_STATUS.md — 컴포넌트별 구현 현황도

| 컴포넌트 | 담당 모듈 경로 | 상태 마커 | 최근 검증 결과 |
| :--- | :--- | :---: | :--- |
| **17대 텐서 매트릭스** | `src/domain/character/tensor.py` | `DONE` | 17개 텐서 & 운동 연쇄 전이 검증 완료 |
| **로웬 갑주 & 압력 궤적**| `src/domain/character/enums.py` | `DONE` | 5대 갑주 & 4단계 궤적 정의 완료 |
| **캐릭터 불변 모델** | `src/domain/character/models.py` | `DONE` | `@dataclass(frozen=True)` 불변 모델 검증 |
| **화행 및 서사 모델** | `src/domain/narrative/` | `DONE` | 7대 화행 & 롤백 스냅샷 정의 완료 |
| **도메인 단위 테스트** | `tests/unit/domain/` | `DONE` | 6개 AAA 단위 테스트 100% 통과 |
| **SQLite 영구 저장소** | `src/infrastructure/` | `DONE` | WAL 모드 & 턴 롤백 스택 검증 완료 |
| **인프라 단위 테스트** | `tests/unit/infrastructure/` | `DONE` | 저장/조회/롤백 테스트 100% 통과 |
| **서사 오케스트레이터**| `src/application/` | `TODO` | Step 3 대기 |
