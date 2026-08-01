# Korean FE Article 번역 용어집

Korean FE Article 팀원의 공개 번역글에서 반복 확인한 표기를 `tech-blog` 외부 글 번역의 기본값으로 사용한다. 이는 공식 용어집을 복제한 것이 아니라 공개 선례를 정리한 작업용 용어집이다.

## 적용 순서

1. 제품·프로젝트의 공식 한국어 표기
2. 이 용어집의 선호 표기
3. 국내 기술 문서에서 널리 쓰이는 표기
4. 문맥에 맞춘 번역

한 글 안에서는 한 표기로 통일한다. 코드, API 이름, 패키지명, 명령어, 파일명은 번역하지 않는다. 독자에게 낯선 용어만 첫 등장에 `한국어(English)`로 병기하고 이후에는 한국어 또는 고유명사만 쓴다.

## 기본 선호 표기

| 영어 | 선호 표기 | 사용 메모 |
|---|---|---|
| frontend / front-end | 프런트엔드 | `프론트엔드` 대신 사용 |
| backend / back-end | 백엔드 | |
| full-stack | 풀 스택 | 고유 직함·제품 표기는 원문 우선 |
| JavaScript | 자바스크립트 | 코드와 정식 명칭을 강조할 때 `JavaScript` 허용 |
| TypeScript | 타입스크립트 | 코드와 정식 명칭을 강조할 때 `TypeScript` 허용 |
| React | 리액트 | 패키지명·코드에서는 `React` 유지 |
| React Native | 리액트 네이티브 | |
| framework | 프레임워크 | |
| library | 라이브러리 | |
| runtime | 런타임 | |
| tooling | 툴링 | 단일 도구는 `도구`가 자연스러우면 번역 |
| developer experience | 개발자 경험 | 약어가 핵심이면 첫 등장에 `개발자 경험(DX)` |
| codebase | 코드 베이스 | 글 안에서 `코드베이스`와 혼용 금지 |
| open source | 오픈 소스 | |
| workflow | 워크플로 | |
| trade-off | 트레이드오프 | 문맥상 선택의 득실이면 `절충안` 허용 |
| production | 프로덕션 | 배포 환경을 뜻할 때 사용 |
| deploy / deployment | 배포 | |
| build | 빌드 | 일반 동사 `만들다`가 자연스러우면 문맥 번역 |
| bundle / bundling | 번들 / 번들링 | |
| compiler | 컴파일러 | |
| compile | 컴파일 | |
| memoization | 메모화 | React 문맥에서도 동일 |
| refactoring | 리팩터링 | `리팩토링` 대신 사용 |
| naming convention | 네이밍 컨벤션 | 단순 규칙을 뜻하면 `이름 규칙` 허용 |
| type-safe / type safety | 타입 안전한 / 타입 안정성 | 문장 성분에 맞춰 구분 |
| asynchronous / async | 비동기 | 코드 식별자 `async`는 유지 |
| debounce / debouncing | 디바운스 / 디바운싱 | 동작·기법 문맥에 맞춰 구분 |
| controlled input | 제어 입력 | |
| uncontrolled input | 비제어 입력 | |
| reactive subscription | 반응형 구독 | |
| atomic CSS / atomic class | 아토믹 CSS / 아토믹 클래스 | |
| colocation | 코로케이션(Colocation) | 첫 등장 병기 후 `코로케이션` |
| native CSS | 네이티브 CSS | |
| source of truth | 단일 진실 공급원 | 문맥상 `원천`이 더 자연스러우면 설명형 번역 |
| edge case | 엣지 케이스 | |
| race condition | 경쟁 상태 | 첫 등장에 `경쟁 상태(race condition)` 허용 |
| backward compatibility | 하위 호환성 | |
| interoperability | 상호 운용성 | |
| maintainability | 유지보수성 | |
| scalability | 확장성 | |

## 원형을 유지하는 표기

- 제품·프레임워크·도구: Next.js, TanStack Form, React Hook Form, StyleX, Sass, Vite, Bun, Node.js
- 웹·개발 약어: API, CSS, HTML, DOM, SSR, RSC, RFC, DX, UI, GPU, LLM
- 코드 요소: `useCallback`, `useMemo`, `memo`, `AbortController`, 패키지명과 명령어

약어 자체가 글의 핵심 개념이고 독자에게 생소하면 첫 등장에만 뜻을 덧붙인다. 예: `RFC(Request for Comments)`.

## 피해야 할 표기와 번역투

- `프론트엔드`와 `프런트엔드` 혼용
- `리팩토링`과 `리팩터링` 혼용
- 표준 기술 용어를 매번 한영 병기
- `~를 통해`, `~에 있어서`, `~에 의해`, `가지고 있다`의 기계적 반복
- 영어 복수형을 그대로 살린 불필요한 복수 표현
- 제품명, 패키지명, 코드 식별자의 임의 번역

## 검증 방법

1. 초안에서 영문 기술 용어와 음역어를 추출한다.
2. 이 표의 선호 표기와 대조한다.
3. 같은 개념이 여러 표기로 쓰였는지 검색한다.
4. 표에 없는 핵심 용어는 최근 Korean FE Article 번역글 2편 이상에서 용례를 확인한다.
5. 새 표기를 추가할 때 확인한 글의 URL과 확인 날짜를 아래 근거에 남긴다.

## 공개 선례

- https://ykss.netlify.app/translation/2026/what-to-know-in-js-2026/
- https://ykss.netlify.app/translation/tanstack_form_vs_react_hook_form/
- https://ykss.netlify.app/translation/2025_react_trends/
- https://ykss.netlify.app/translation/good_refactoring_vs_bad_refactoring/
- https://ykss.netlify.app/translation/navigating_the_future_of_frontend/
- https://emewjin.github.io/introducing-stylex/
- https://emewjin.github.io/you-should-know-this-before-choosing-nextjs/

마지막 확인: 2026-08-01
