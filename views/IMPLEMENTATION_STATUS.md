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
| **4대 아키타입 & 모델**| `src/domain/character/models.py` | `DONE` | 릴리스/에이라/세라피나/실비아 불변 팩토리 |
| **17x70 비주얼 변이 엔진**| `src/domain/character/visual.py` | `DONE` | 70유전자 불변 DNA ⊗ 텐서 실시간 변이 |
| **화행 및 서사 모델** | `src/domain/narrative/` | `DONE` | 7대 화행 & 롤백 스냅샷 정의 완료 |
| **SQLite 영구 저장소** | `src/infrastructure/` | `DONE` | WAL 모드 & 턴 롤백 스택 검증 완료 |
| **화행 파서 서비스** | `src/application/services/action_parser_service.py` | `DONE` | 정규식 & 17대 텐서 매핑 검증 완료 |
| **캐릭터 공방 서비스** | `src/application/services/character_workshop_service.py` | `DONE` | 마스터 프롬프트 컴파일러 & 시각 태그 생성 |
| **비주얼 합성 서비스** | `src/application/services/visual_synthesis_service.py` | `DONE` | Illustrious 6-Slot & FLUX & Pollinations |
| **Gemini LLM 클라이언트**| `src/infrastructure/llm/gemini_llm_client.py` | `DONE` | API 연동 및 정규식 문학 정제기 검증 완료 |
| **서사 오케스트레이터**| `src/application/services/narrative_orchestrator.py` | `DONE` | 턴 진행 및 Gemini LLM 서사 생성 연동 완료 |
| **전사 단위 테스트** | `tests/unit/` | `DONE` | 25개 테스트 0.10초 100% 통과 |
