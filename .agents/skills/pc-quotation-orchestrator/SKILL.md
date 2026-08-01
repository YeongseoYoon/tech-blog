---
name: pc-quotation-orchestrator
description: "PC 견적 에이전트 팀을 조율하는 오케스트레이터. 컴퓨터 견적, PC 조립 추천, 부품 구성, 컴퓨터 맞추기, 조립 컴퓨터 견적, 데스크탑 견적 요청 시 반드시 이 스킬을 사용. 후속 작업: 견적 수정, 부품 교체, 예산 변경, 견적 업데이트, 다시 견적, 이전 견적 개선, 부분 재조사 요청 시에도 반드시 이 스킬을 사용."
---

# PC Quotation Orchestrator

PC 견적 에이전트들을 조율하여 용도 분석 → 부품 리서치 → 견적서 생성까지의 전체 워크플로우를 실행한다.

## 실행 모드: 하이브리드 (서브 에이전트)

- Phase 1: 스펙 어드바이저 (서브, 단독)
- Phase 2: 부품 리서처 (서브, 병렬 팬아웃)
- Phase 3: 견적 컴파일러 (서브, 단독)

## 에이전트 구성

| 에이전트 | 정의 파일 | 스킬 | 역할 |
|---------|----------|------|------|
| spec-advisor | agents/spec-advisor.md | pc-spec-advisor | 용도 분석 + 스펙 타겟 + 예산 배분 |
| parts-researcher | agents/parts-researcher.md | pc-parts-research | 카테고리별 부품 조사 (병렬) |
| quotation-compiler | agents/quotation-compiler.md | pc-quotation-compiler | 호환성 검증 + 최종 견적서 |

## 워크플로우

### Phase 0: 컨텍스트 확인

1. `_workspace/` 디렉토리 존재 여부 확인
2. 실행 모드 결정:
   - **`_workspace/` 미존재** → 초기 실행. Phase 1로 진행
   - **`_workspace/` 존재 + 사용자가 부분 수정 요청** → 부분 재실행. 해당 Phase의 에이전트만 재호출
     - "예산 변경" → Phase 1(스펙)부터 재실행
     - "GPU만 바꿔줘" → Phase 2(해당 카테고리 리서치)부터 재실행
     - "견적서 형식 수정" → Phase 3(컴파일)만 재실행
   - **`_workspace/` 존재 + 완전히 새 견적 요청** → 기존 `_workspace/`를 `_workspace_{timestamp}/`로 이동 후 Phase 1 진행

### Phase 1: 요구사항 분석 + 스펙 타겟 결정

**실행 모드:** 서브 에이전트 (단독)

1. 사용자 입력에서 용도, 예산, 선호사항을 파악한다
2. 정보가 부족하면 사용자에게 질문한다:
   - 주 용도가 불명확할 때
   - 예산이 미지정일 때
   - 모니터/주변기기 포함 여부가 불분명할 때
3. `_workspace/` 디렉토리 생성
4. 스펙 어드바이저 에이전트를 호출한다:
   ```
   Agent(
     prompt: "agents/spec-advisor.md를 읽고 역할을 수행하라.
              skills/pc-spec-advisor/SKILL.md를 참조하라.
              사용자 요구사항: {요구사항 정리}
              결과를 _workspace/01_spec_target.md에 저장하라.",
     model: "opus"
   )
   ```
5. 산출물(`_workspace/01_spec_target.md`)을 확인하고, 사용자에게 스펙 타겟 요약을 보여준다
6. 사용자 확인/수정 후 Phase 2로 진행

### Phase 2: 부품 리서치 (병렬 팬아웃)

**실행 모드:** 서브 에이전트 (병렬)

스펙 타겟의 8개 카테고리를 4개 그룹으로 나눠 병렬 조사한다:

- **그룹 A:** CPU + 쿨러 (CPU에 따라 쿨러 결정)
- **그룹 B:** GPU + PSU (GPU TDP에 따라 PSU 결정)
- **그룹 C:** 메인보드 + RAM (플랫폼 연동)
- **그룹 D:** SSD + 케이스 (독립적)

```
Agent(
  prompt: "agents/parts-researcher.md를 읽고 역할을 수행하라.
           skills/pc-parts-research/SKILL.md를 참조하라.
           _workspace/01_spec_target.md에서 스펙 타겟을 읽어라.
           담당 카테고리: {그룹 카테고리}
           결과를 _workspace/02_parts_{category}.md에 저장하라.",
  model: "opus",
  run_in_background: true
)
```

4개 에이전트를 `run_in_background: true`로 병렬 실행한다.
모든 에이전트의 완료를 대기한 후 Phase 3으로 진행한다.

### Phase 3: 견적 컴파일 + 호환성 검증

**실행 모드:** 서브 에이전트 (단독)

```
Agent(
  prompt: "agents/quotation-compiler.md를 읽고 역할을 수행하라.
           skills/pc-quotation-compiler/SKILL.md를 참조하라.
           _workspace/01_spec_target.md와 _workspace/02_parts_*.md를 모두 읽어라.
           호환성 검증 후 최종 견적서를 _workspace/03_quotation.md에 저장하라.",
  model: "opus"
)
```

### Phase 4: 결과 제시 + 정리

1. `_workspace/03_quotation.md`를 읽는다
2. 사용자에게 견적서를 제시한다
3. `_workspace/` 디렉토리를 보존한다 (후속 수정을 위해)
4. 피드백을 요청한다:
   - "견적에서 수정할 부분이 있나요?"
   - "특정 부품을 교체하거나 예산을 조정하고 싶으시면 말씀해주세요."

## 데이터 흐름

```
[사용자 입력]
      ↓
[Phase 1: spec-advisor] → _workspace/01_spec_target.md
      ↓
[Phase 2: parts-researcher ×4 (병렬)]
  ├→ _workspace/02_parts_cpu_cooler.md
  ├→ _workspace/02_parts_gpu_psu.md
  ├→ _workspace/02_parts_mb_ram.md
  └→ _workspace/02_parts_ssd_case.md
      ↓
[Phase 3: quotation-compiler] → _workspace/03_quotation.md
      ↓
[Phase 4: 사용자에게 견적서 제시]
```

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| 스펙 어드바이저 실패 | 1회 재시도. 재실패 시 기본 템플릿(게임용 중급)으로 진행 |
| 부품 리서처 1개 그룹 실패 | 해당 그룹만 1회 재시도. 재실패 시 해당 카테고리 "조사 실패" 표기 후 나머지로 견적 작성 |
| 부품 리서처 과반 실패 | 사용자에게 알리고 웹 검색 환경 확인 요청 |
| 견적 컴파일러 호환성 문제 발견 | 비호환 부품을 같은 카테고리의 다른 옵션으로 자동 교체. 교체 불가 시 해당 카테고리 재조사 |
| 총 비용 예산 초과 | 가성비 옵션 중심으로 재조합. 그래도 초과 시 사용자에게 예산 조정 제안 |

## 테스트 시나리오

### 정상 흐름
1. 사용자: "게임용 PC 150만원 예산으로 견적 내줘"
2. Phase 1: 게임용 스펙 타겟 생성 (GPU 중심 예산 배분)
3. Phase 2: 4개 그룹 병렬 조사 완료
4. Phase 3: 호환성 검증 통과, 3가지 견적 생성
5. Phase 4: 견적서 제시, 피드백 요청

### 부분 수정 흐름
1. 사용자: "GPU를 RTX 4070으로 바꿔줘"
2. Phase 0: _workspace/ 존재 확인 → 부분 재실행 모드
3. Phase 2: GPU+PSU 그룹만 재조사
4. Phase 3: 변경된 부품으로 호환성 재검증 + 견적 갱신
5. Phase 4: 수정된 견적서 제시

### 에러 흐름
1. 사용자: "AI 학습용 PC 500만원"
2. Phase 1: AI/딥러닝용 스펙 타겟 생성
3. Phase 2: GPU 그룹 조사 시 고가 제품 가격 확인 실패
4. 에러 핸들링: GPU 그룹 1회 재시도
5. 재시도 성공 시 정상 진행 / 실패 시 "(추정)" 가격으로 진행
