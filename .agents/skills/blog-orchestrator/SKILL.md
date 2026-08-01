---
name: blog-orchestrator
description: "기술블로그 포스트 작성을 위한 에이전트 파이프라인을 조율하는 오케스트레이터. 블로그 글 써줘, 포스트 작성해줘, 기술블로그, 글 작성, 주제로 글 써줘 등의 요청 시 반드시 이 스킬을 사용. 후속 작업: 글 수정, 보완, 다시 써줘, 리뷰 반영, 초안 수정, 결과 개선, 부분 재작성, 이전 글 업데이트 요청 시에도 반드시 이 스킬을 사용. 초안 또는 최종본 완성 후 notify-blog-submission 스킬로 주차별 제출 댓글 등록 여부를 사용자에게 확인한다."
---

# Blog Orchestrator

기술블로그 포스트 작성을 위한 에이전트 파이프라인을 조율한다. 일반 글과 외부 아티클 번역을 먼저 구분하고, 각 모드의 검증 관문을 통과한 글만 최종본으로 발행한다.

## 실행 모드 결정

- 사용자가 외부 글의 번역, 전문 번역, 원문 링크를 제공한 번역을 요청하면 **번역 모드**를 사용한다.
- 그 밖의 글은 **일반 글 모드**를 사용한다.
- 일반 글의 개인 경험 도입부, 구조 재편, 위트 있는 요약 규칙을 번역문에 적용하지 않는다. 번역 모드에서는 원저자의 구조와 어조가 우선한다.
- 번역 모드는 아래 `외부 아티클 번역 워크플로`를 따르며 일반 리서치·집필 단계로 대체하지 않는다.

## 실행 모드: 서브 에이전트

순차 파이프라인으로 각 에이전트의 산출물이 다음 에이전트의 입력이 된다. 에이전트 간 실시간 통신이 불필요하므로 서브 에이전트 모드를 사용한다.

## 에이전트 구성

| 에이전트 | subagent_type | 역할 | 스킬 | 출력 |
|---------|--------------|------|------|------|
| blog-researcher | blog-researcher | 주제 리서치 | blog-research | `_workspace/01_researcher_material.md` |
| blog-writer | blog-writer | 포스트 집필 | blog-write | `_workspace/02_writer_draft.md` |
| blog-reviewer | blog-reviewer | 품질 검토 | blog-review | `_workspace/03_reviewer_feedback.md` |
| blog-writer (2차) | blog-writer | 리뷰 반영 최종본 | blog-write | `posts/{slug}.md` |

## 워크플로우

### 외부 아티클 번역 워크플로

번역 작업은 다음 관문을 순서대로 통과해야 한다.

1. **KFA 중복 확인:** 원문 URL을 정규화한 뒤 Korean FE Article의 전체 open/closed 이슈·PR과 모든 연도의 번역 파일을 검색한다. 동일 글이 있으면 번역을 시작하지 않고 사용자에게 해당 링크를 보고한다.
2. **허락 확인:** 전문 번역 허락 여부와 조건을 확인한다. 허락이 확인되지 않으면 전문 번역을 시작하거나 게시하지 않는다.
3. **KFA 작업 등록:** KFA 제출을 전제로 하는 작업이면 원문 URL로 이슈를 만들고 자신을 assignee로 지정한 뒤 허락 완료 사실을 기록한다. 이슈 생성은 사용자의 승인이나 명시적 요청 없이 실행하지 않는다.
4. **원문 수집:** 원문 URL, 제목, 저자, 원문 게시일, 확인일, 링크·이미지·코드·강조 요소를 수집한다.
5. **작업 공간 분리:** `_workspace/translations/{slug}/`를 만들고 원문 전체 대신 검증용 `manifest.json`을 저장한다. 비공개 허락 메시지 원문은 커밋하지 않는다.
6. **번역:** `blog-write`의 외부 아티클 번역 규칙과 KFA 공식 `.hanspell-typos`를 적용한다.
7. **번역 대조 검토:** `blog-review`의 번역 전용 기준으로 문단, 제목, 목록, 코드, 강조, 숫자, 날짜, 고유명사, 링크 URL, 용어를 대조한다.
8. **자동 검증:** `npm run check:translation -- posts/{slug}.md _workspace/translations/{slug}/manifest.json`을 실행한다.
9. **사람 승인:** 원문 충실도 검토와 자동 검증이 모두 성공한 최종본을 사용자에게 제시한다. main 푸시 요청이 이미 명시된 경우에는 별도 재승인 없이 푸시할 수 있다.
10. **렌더링·배포 검증:** 로컬 빌드와 `/blog/{slug}` 렌더링을 확인한다. 푸시 후 공개 URL의 200 응답, 메타데이터, 사이트맵 반영 여부를 확인한다.
11. **KFA 제출본 생성:** 사용자가 KFA 제출을 요청하면 개인 블로그 파일을 직접 복사하지 말고 KFA 저장소 형식으로 별도 변환한 뒤 KFA의 `translate-full` 검토 절차를 실행한다.
12. **제출 알림:** `notify-blog-submission` 규칙에 따라 주차 이슈 댓글 등록 여부를 확인한다. 사용자가 댓글까지 명시적으로 요청한 경우 바로 등록한다.

번역 검토 또는 자동 검증이 실패하거나 원문을 신뢰성 있게 수집하지 못하면 **게시하지 않고 실패 원인을 보고한다.** 초안을 최종본으로 승격하는 폴백은 번역 모드에서 금지한다.

### Phase 0: 컨텍스트 확인

기존 산출물 존재 여부를 확인하여 실행 모드를 결정한다:

1. `_workspace/` 디렉토리 존재 여부 확인
2. 실행 모드 결정:
   - **`_workspace/` 미존재** → 초기 실행. Phase 1로 진행
   - **`_workspace/` 존재 + 사용자가 부분 수정 요청** → 부분 재실행. 해당 에이전트만 재호출
     - "리서치 다시" → Phase 2만 재실행
     - "글 수정" / "리뷰 반영" → Phase 4만 재실행 (기존 피드백 활용)
     - "리뷰 다시" → Phase 3만 재실행
   - **`_workspace/` 존재 + 새 주제 제공** → 새 실행. `_workspace/`를 `_workspace_{timestamp}/`로 이동 후 Phase 1 진행
3. 부분 재실행 시: 이전 산출물 경로를 에이전트 프롬프트에 포함

### Phase 1: 준비

1. 사용자 입력에서 주제와 요구사항 파악:
   - 주제 키워드
   - 대상 독자 수준 (명시되지 않으면 중급 기본)
   - 특별 요구사항 (특정 기술 비교, 실무 사례 중심 등)
2. `_workspace/` 디렉토리 생성
3. 파일명 슬러그 결정 (영문 케밥 케이스)

### Phase 2: 리서치

```
Agent(
  description: "기술 주제 리서치",
  prompt: "
    당신은 blog-researcher입니다. .codex/agents/blog-researcher.toml의 역할을 수행하세요.
    .agents/skills/blog-research/SKILL.md를 읽고 리서치 절차를 따르세요.

    주제: {topic}
    요구사항: {requirements}

    리서치 결과를 _workspace/01_researcher_material.md에 저장하세요.
  ",
  subagent_type: "blog-researcher",
  model: "opus"
)
```

**완료 확인:** `_workspace/01_researcher_material.md` 파일 존재 및 내용 확인

### Phase 3: 집필

```
Agent(
  description: "블로그 포스트 집필",
  prompt: "
    당신은 blog-writer입니다. .codex/agents/blog-writer.toml의 역할을 수행하세요.
    .agents/skills/blog-write/SKILL.md를 읽고 집필 가이드를 따르세요.
    스타일 참고가 필요하면 .agents/skills/blog-write/references/style-guide.md도 읽으세요.

    리서치 자료: _workspace/01_researcher_material.md를 읽고 활용하세요.
    기존 포스트 참고: posts/ 디렉토리의 기존 글 2~3개를 읽어 톤과 스타일을 파악하세요.

    주제: {topic}
    슬러그: {slug}
    요구사항: {requirements}

    초안을 _workspace/02_writer_draft.md에 저장하세요.
  ",
  subagent_type: "blog-writer",
  model: "opus"
)
```

**완료 확인:** `_workspace/02_writer_draft.md` 파일 존재 및 frontmatter 포함 확인

### Phase 4: 검토

```
Agent(
  description: "포스트 품질 검토",
  prompt: "
    당신은 blog-reviewer입니다. .codex/agents/blog-reviewer.toml의 역할을 수행하세요.
    .agents/skills/blog-review/SKILL.md를 읽고 검토 기준을 따르세요.

    검토 대상: _workspace/02_writer_draft.md를 읽으세요.
    기존 포스트 참고: posts/ 디렉토리의 기존 글 2~3개를 읽어 스타일 일관성을 확인하세요.

    리뷰 결과를 _workspace/03_reviewer_feedback.md에 저장하세요.
  ",
  subagent_type: "blog-reviewer",
  model: "opus"
)
```

**완료 확인:** `_workspace/03_reviewer_feedback.md` 파일 존재 확인

### Phase 5: 리뷰 반영 및 최종본 생성

```
Agent(
  description: "리뷰 반영 최종본 작성",
  prompt: "
    당신은 blog-writer입니다. .codex/agents/blog-writer.toml의 역할을 수행하세요.
    .agents/skills/blog-write/SKILL.md를 읽고 포맷 규칙을 따르세요.

    초안: _workspace/02_writer_draft.md를 읽으세요.
    리뷰 피드백: _workspace/03_reviewer_feedback.md를 읽으세요.

    MUST FIX 항목은 반드시 반영하고, NICE TO HAVE는 판단하여 반영하세요.
    최종본을 posts/{slug}.md에 저장하세요.
    변경 사항 요약을 _workspace/04_revision_summary.md에 저장하세요.
  ",
  subagent_type: "blog-writer",
  model: "opus"
)
```

**완료 확인:** `posts/{slug}.md` 파일 존재 및 frontmatter 검증

### Phase 6: 정리 및 보고

1. `_workspace/` 보존 (사후 검증용)
2. 사용자에게 결과 보고:
   - 생성된 파일 경로: `posts/{slug}.md`
   - 포스트 제목, 태그, 분량
   - 리뷰 종합 평가 요약
   - MUST FIX 반영 사항
3. `notify-blog-submission` 스킬을 실행해 해당 주차 이슈와 댓글 문안을 준비한다.
4. 사용자에게 댓글 등록 여부를 묻는다. 명시적으로 승인받기 전에는 GitHub 댓글을 작성하지 않는다.
5. "결과에서 개선할 부분이 있나요?" 피드백 요청

## 데이터 흐름

```
[오케스트레이터]
    │
    ├→ Agent(blog-researcher) → _workspace/01_researcher_material.md
    │                                       │
    ├→ Agent(blog-writer) ←── Read ─────────┘
    │         │
    │         └→ _workspace/02_writer_draft.md
    │                        │
    ├→ Agent(blog-reviewer) ←── Read ──────┘
    │         │
    │         └→ _workspace/03_reviewer_feedback.md
    │                        │
    ├→ Agent(blog-writer) ←── Read (draft + feedback)
    │         │
    │         └→ posts/{slug}.md (최종본)
    │
    └→ 결과 보고
```

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| researcher 실패 | 1회 재시도. 재실패 시 오케스트레이터가 자체 지식으로 간략한 리서치 자료 생성 후 진행 |
| writer 실패 | 1회 재시도. 재실패 시 리서치 자료를 사용자에게 전달하고 수동 작성 안내 |
| reviewer 실패 | 1회 재시도. 재실패 시 리뷰 없이 초안을 최종본으로 사용 (사용자에게 "리뷰 미수행" 명시) |
| 최종본 writer 실패 | 초안(_workspace/02_writer_draft.md)을 posts/에 복사하고 피드백 파일 전달 |

위 일반 폴백은 일반 글에만 적용한다. 번역 모드에서 reviewer, 원문 대조, 자동 검증 중 하나라도 실패하면 작업을 중단하고 게시·푸시하지 않는다.

## 테스트 시나리오

### 정상 흐름
1. 사용자가 "JavaScript의 Proxy 객체에 대해 블로그 글 써줘" 요청
2. Phase 1: 주제="JavaScript Proxy", 슬러그="javascript-proxy" 결정
3. Phase 2: researcher가 MDN, TC39 자료 수집 → `01_researcher_material.md`
4. Phase 3: writer가 리서치 기반 초안 작성 → `02_writer_draft.md`
5. Phase 4: reviewer가 기술 정확성, 스타일 검토 → `03_reviewer_feedback.md`
6. Phase 5: writer가 피드백 반영 → `posts/javascript-proxy.md`
7. Phase 6: 결과 보고

### 에러 흐름
1. Phase 2에서 researcher가 웹 검색 실패
2. 1회 재시도 후 재실패
3. 오케스트레이터가 자체 지식으로 간략 리서치 자료 생성
4. Phase 3부터 정상 진행
5. 최종 보고에 "웹 검색 미수행, 자체 지식 기반" 명시
