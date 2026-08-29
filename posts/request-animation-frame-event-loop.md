---
title: "requestAnimationFrame은 이벤트 루프 어디에 줄을 설까"
date: "2026-08-29T00:00:00.000Z"
summary: "16ms마다 재촉하지 말고, 브라우저의 렌더링 박자에 맞추기"
tags: ["JavaScript", "Browser"]
---

많은 화면은 60Hz로 동작하며 약 16.67ms마다 새 프레임을 표시합니다. 이 주기에 맞춰 애니메이션을 갱신하려고 `setTimeout`을 약 16ms 간격으로 반복하는 방식이 쓰이곤 했습니다. 숫자만 보면 화면 주기와 얼추 맞아 보입니다. 하지만 타이머의 실행 간격과 브라우저가 실제로 화면을 렌더링하는 시점은 서로 다릅니다. 그렇다면 `requestAnimationFrame`은 이 간극을 어떻게 다루며, 콜백은 어디에서 언제 실행될까요?

저도 처음에는 `requestAnimationFrame`을 우선순위가 조금 높은 타이머 정도로 이해했습니다. 그러다 이벤트 루프를 다시 살펴보니 질문부터 잘못됐다는 걸 알게 됐습니다. `requestAnimationFrame` 콜백은 task queue에도, microtask queue에도 들어가지 않습니다. 콜백을 보관하는 곳도 다르고, 실행을 결정하는 조건도 다릅니다.

이 글에서는 task와 microtask의 저장소부터 시작해 `rendering opportunity`와 `update the rendering`을 거쳐 rAF 콜백이 실행되는 흐름을 따라가 보겠습니다. HTML 명세가 정의한 추상 구조와 Chromium/Blink가 프레임을 만드는 구현 이야기도 구분해서 살펴봅니다.

# 먼저 세 개의 저장소를 분리해보자

이벤트 루프를 설명할 때 흔히 모든 비동기 콜백이 하나의 대기열에 들어가는 그림을 사용합니다. 입문 단계에서는 편리하지만 rAF까지 이해하기에는 부족합니다.

| 종류 | HTML 명세상 주된 저장소 | 실행 계기 | 렌더링과의 관계 |
| --- | --- | --- | --- |
| task | 이벤트 루프의 하나 이상의 `task queues` | 사용자 에이전트가 선택한 queue의 첫 runnable task를 고를 때 | 프레임 직전 실행을 보장하지 않음 |
| microtask | 이벤트 루프의 `microtask queue` | microtask checkpoint | 렌더링보다 먼저 소진되며, 계속 추가하면 렌더링을 늦출 수 있음 |
| rAF callback | Window와 연결된 Document의 `map of animation frame callbacks` | `update the rendering` 안의 animation frame callback 단계 | 본격적인 style/layout 갱신보다 앞에서 실행됨 |

여기서 흔히 말하는 “매크로태스크”는 HTML 명세의 정식 분류명이 아닙니다. Promise의 microtask와 대비하려고 교육 자료에서 자주 쓰는 표현입니다. 명세는 `task`, `task queue`, `task source`라는 용어를 사용합니다.

task queue가 하나뿐이라는 설명도 정확하지 않습니다. 이벤트 루프에는 하나 이상의 task queue가 있을 수 있고, 사용자 에이전트는 입력 반응성 같은 조건을 고려해 어느 queue에서 task를 꺼낼지 결정할 수 있습니다. 이름은 queue지만 명세의 추상 모델에서는 Infra의 set으로 표현됩니다. 선택한 queue에서 첫 runnable task를 찾기 때문입니다.

microtask queue는 task queue와 별개입니다. Promise reaction이나 `queueMicrotask`로 등록한 작업은 microtask checkpoint가 시작되면 queue가 빌 때까지 실행됩니다.

```js
setTimeout(() => console.log("task"), 0);

queueMicrotask(() => console.log("microtask"));

requestAnimationFrame(() => console.log("animation frame"));
```

이 코드만 보고 항상 `microtask → task → rAF`처럼 고정된 결과를 기대하면 안 됩니다. microtask가 checkpoint에서 먼저 처리된다는 규칙은 있지만, task와 렌더링 갱신이 번갈아 한 번씩 실행된다는 규칙은 없습니다. 사용자 에이전트는 여러 timer callback을 처리한 뒤 렌더링할 수도 있고, 현재 문서를 렌더링할 필요가 없다면 갱신을 건너뛸 수도 있습니다.

따라서 “rAF는 매크로태스크인가요, 마이크로태스크인가요?”라는 질문에는 둘 다 아니라고 답해야 합니다. 다만 한 가지가 더 있습니다. 현행 HTML 명세에서는 UA가 navigable에 rendering opportunity가 있을 수 있다고 판단해 기다림을 마치면 rendering task source에 `update the rendering` global task를 큐잉합니다. 이 task의 알고리즘 안에서 rAF 콜백을 실행합니다. 자세한 절차는 [HTML Standard의 window event loop](https://html.spec.whatwg.org/multipage/webappapis.html#window-event-loop)와 [`update the rendering`](https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering)에서 확인할 수 있습니다.

`update the rendering`을 구동하는 task와 rAF 콜백 자체는 같은 것이 아닙니다. 이 둘을 구분하면 “task 안에서 실행되는데 왜 task가 아니지?”라는 혼란도 풀립니다.

# requestAnimationFrame을 호출하면 어디에 저장될까

Window에서 `requestAnimationFrame(callback)`을 호출하면 HTML 명세는 연결된 `Document`를 target object로 정합니다. 그리고 Document가 가진 `map of animation frame callbacks`에 콜백을 저장합니다. 이 map은 삽입 순서를 보존하는 ordered map입니다. 등록과 취소 절차는 [HTML Standard의 animation frames](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames)에, 자료구조의 의미는 [Infra Standard의 ordered map](https://infra.spec.whatwg.org/#ordered-map)에 정의돼 있습니다.

명세의 동작을 JavaScript처럼 옮기면 다음과 같습니다. 이해를 위한 의사 코드이며 브라우저의 실제 구현 코드는 아닙니다.

```js
function requestAnimationFrame(callback) {
  // 명세의 target object 선택을 표현한 의사 코드입니다.
  // 실제 JavaScript의 cross-realm 판별식으로 사용하면 안 됩니다.
  const target = getTargetObject(this);

  const handle = ++target.animationFrameCallbackIdentifier;
  target.animationFrameCallbacks.set(handle, callback);

  return handle;
}
```

이 코드에서 눈여겨볼 부분은 두 가지입니다.

첫째, Window API를 호출하지만 Window 환경에서 콜백 상태의 명세상 주인은 연결된 Document입니다. 둘째, 반환값은 콜백을 찾는 handle입니다. `cancelAnimationFrame(handle)`은 target의 map에서 해당 entry를 제거합니다.

```js
const rafId = requestAnimationFrame(render);

function stop() {
  cancelAnimationFrame(rafId);
}
```

handle의 구체적인 값에 의미를 부여해서는 안 됩니다. 장시간 실행되는 환경에서는 구현 카운터가 overflow할 수 있으므로 0이 절대 나오지 않는다는 가정도 안전하지 않습니다.

## 실행할 콜백은 현재 batch로 잘라낸다

렌더링 갱신이 rAF 단계에 도달하면 명세는 현재 callback map의 key 목록을 먼저 얻습니다. 그 목록을 순서대로 순회하면서 아직 map에 남아 있는 콜백만 실행합니다. 실행 직전에는 entry를 map에서 제거합니다.

```js
function runAnimationFrameCallbacks(target, now) {
  const handles = [...target.animationFrameCallbacks.keys()];

  for (const handle of handles) {
    if (!target.animationFrameCallbacks.has(handle)) continue;

    const callback = target.animationFrameCallbacks.get(handle);
    target.animationFrameCallbacks.delete(handle);
    invokeCallbackThroughWebIDL(callback, now);
  }
}
```

마지막 줄은 단순한 함수 호출처럼 보이지만 실제 명세의 `invoke`에는 Web IDL과 HTML이 정의한 스크립트 실행 준비·정리 과정이 연결됩니다. 이 과정은 아래에서 콜백 사이의 microtask 순서를 설명할 때 다시 살펴보겠습니다.

이 의사 코드에서 몇 가지 중요한 동작이 나옵니다.

1. rAF는 one-shot입니다. 다음 프레임에도 실행하려면 콜백 안에서 다시 등록해야 합니다.
2. key 목록을 먼저 복사하므로 실행 중에 새로 등록한 콜백은 현재 batch에 포함되지 않습니다.
3. 아직 실행하지 않은 다른 콜백을 취소하면 그 콜백은 같은 batch에서도 건너뜁니다.
4. 같은 렌더링 갱신에 포함된 콜백은 동일한 `now` timestamp를 받습니다.

실제로 코드로 확인해보겠습니다.

```js
let b;

requestAnimationFrame((timestamp) => {
  console.log("A", timestamp);

  cancelAnimationFrame(b);

  requestAnimationFrame((nextTimestamp) => {
    console.log("C: next rendering update", nextTimestamp);
  });
});

b = requestAnimationFrame(() => {
  console.log("B: 실행되지 않음");
});
```

A가 실행될 때 B는 현재 batch의 목록에는 들어 있지만 map에서는 삭제됩니다. B의 차례가 왔을 때 존재 여부 검사를 통과하지 못해 실행되지 않습니다. A 안에서 등록한 C는 애초에 현재 key 목록에 없으므로 다음 렌더링 갱신을 기다립니다.

이 스냅샷 방식은 콜백이 실행 중에 목록을 바꾸더라도 현재 batch의 경계를 유지합니다. 다만 ordered map과 key 스냅샷은 어디까지나 명세가 관찰 가능한 동작을 표현하는 추상 자료구조입니다. Chromium이 반드시 C++의 특정 map 타입 하나로 구현해야 한다는 뜻은 아닙니다. key 스냅샷, 존재 여부 재확인, remove-before-invoke 순서는 [`run the animation frame callbacks`](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#run-the-animation-frame-callbacks)에 규정돼 있습니다.

# 콜백은 정확히 언제 실행될까

이제 등록한 콜백이 실행되는 길을 따라가 보겠습니다. 흔히 이벤트 루프를 다음처럼 요약합니다.

```text
task 하나 → microtasks 전부 → 필요하면 rendering → 반복
```

직관을 잡는 데는 쓸 만하지만 현행 HTML Standard의 window 렌더링 모델은 조금 더 구체적입니다. UA가 navigable에 rendering opportunity가 있을 수 있다고 판단할 때까지 기다리는 병렬 절차가 있고, 기다림을 마치면 rendering task source에 `update the rendering` global task를 큐잉합니다.

```text
navigable에 rendering opportunity가 있을 때까지 기다림
  ↓
last render opportunity time 갱신
  ↓
rendering task source에 update the rendering task 큐잉
  ↓
이벤트 루프가 task 선택 규칙에 따라 해당 task를 실행
  ↓
렌더링할 Document 선별
  ↓
resize / scroll / media query / Web Animations 갱신 ...
  ↓
animation frame callbacks 실행  ← requestAnimationFrame
  ↓
style 재계산 / layout / ResizeObserver / IntersectionObserver ...
  ↓
paint / composite / presentation으로 이어질 수 있음
```

`rendering opportunity`는 지금 새 화면을 만들 기회가 있는지를 나타냅니다. 디스플레이 주사율만 보고 기계적으로 16.67ms마다 생기는 신호가 아닙니다. 하드웨어 주사율과 사용자 에이전트의 성능 정책 등을 함께 고려합니다. 이후 `update the rendering`은 문서의 가시성이나 render-blocked 상태 등을 따져 실제 갱신할 Document를 다시 선별합니다. [rendering opportunity 판단과 문서 필터링 절차](https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering)는 같은 알고리즘 안에서도 서로 다른 단계입니다.

기회가 생겨도 모든 Document를 반드시 갱신하지는 않습니다. 문서가 숨겨져 있거나 렌더링이 막혀 있을 때, 갱신해도 보이는 효과가 없고 rAF 콜백도 없을 때는 대상에서 빠질 수 있습니다. 사용자 에이전트가 현재 렌더링을 건너뛰는 편이 낫다고 판단할 여지도 있습니다.

실제 브라우저에서도 백그라운드 탭이나 hidden iframe의 Window rAF는 대개 일시 정지되거나 강하게 제한됩니다. 다만 구체적인 정책은 브라우저마다 다르며, timer throttling은 프레임 정렬과 별개의 스케줄러 정책입니다. Chromium의 [Blink core/frame 문서](https://chromium.googlesource.com/chromium/src/+/HEAD/third_party/blink/renderer/core/frame/README.md#Render-throttling)는 render throttling과 timer throttling을 구분해 설명합니다.

대상으로 선택된 Document에서는 resize와 scroll 단계, media query 평가, Web Animations 갱신 등을 거친 뒤 animation frame callbacks를 실행합니다. 그 뒤에 본격적인 style/layout 갱신과 관찰자 단계가 이어집니다.

그래서 rAF를 “paint 직전”이라고 부르는 설명은 실무적인 줄임말입니다. 명세에 더 가까운 표현은 “`update the rendering` 알고리즘의 animation frame callbacks 단계에서 실행된다”입니다. 콜백이 반환되자마자 픽셀이 화면에 나타난다고 보장하지도 않습니다. style, layout, paint, 합성, 실제 디스플레이 표시까지 남은 과정이 있기 때문입니다.

## microtask가 렌더링을 굶길 수도 있다

microtask checkpoint는 queue가 빌 때까지 microtask를 실행합니다. microtask 안에서 다음 microtask를 끝없이 추가하면 이벤트 루프가 다음 task를 선택할 기회를 얻지 못합니다. rendering task도 실행되지 못하므로 rAF와 화면 갱신이 함께 밀립니다.

```js
function starve() {
  queueMicrotask(starve);
}

requestAnimationFrame(() => {
  console.log("frame");
});

starve(); // 페이지가 멈출 수 있으므로 실제 서비스에서 실행하지 마세요.
```

rAF는 microtask보다 우선순위가 낮은 queue에 들어가는 것이 아닙니다. 저장소부터 별개입니다. 다만 렌더링 갱신을 실행할 기회가 microtask chain 때문에 늦어질 수 있습니다.

## 같은 batch의 콜백 사이에도 microtask가 실행된다

`run the animation frame callbacks`는 현재 batch를 통째로 JavaScript 함수 하나에 넘기지 않습니다. 각 rAF 콜백을 Web IDL 방식으로 하나씩 `invoke`합니다. 사용자 콜백 호출을 정리할 때 JavaScript execution context stack이 비면 HTML의 script cleanup이 microtask checkpoint를 수행합니다. 그래서 A가 예약한 microtask는 A가 반환한 뒤, 같은 batch의 다음 B 콜백보다 먼저 실행될 수 있습니다.

```js
requestAnimationFrame(() => {
  console.log("A");
  queueMicrotask(() => console.log("A microtask"));
});

requestAnimationFrame(() => {
  console.log("B");
});

// A
// A microtask
// B
```

규범 경로는 [Web IDL의 callback function invocation](https://webidl.spec.whatwg.org/#invoke-a-callback-function)에서 HTML의 스크립트 실행 준비·정리로 이어지고, [`clean up after running script`](https://html.spec.whatwg.org/multipage/webappapis.html#clean-up-after-running-script)가 stack이 비었을 때 microtask checkpoint를 수행하는 데서 확인할 수 있습니다. 이 순서가 rAF 콜백 자체를 microtask로 만든다는 뜻은 아닙니다. rAF의 저장소는 여전히 animation frame callback map이고, A가 만든 후속 작업만 microtask queue에서 처리됩니다.

# setTimeout 16ms로는 왜 충분하지 않을까

`setTimeout(fn, 16)`은 약 16ms 뒤에 화면을 갱신하겠다는 요청처럼 보입니다. 실제 의미는 다릅니다. 지정한 timeout 이후 [timer task source](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timer-task-source)에 task가 큐잉되더라도 그 시각에 즉시 실행된다는 보장은 없습니다. 16ms는 실행 마감 시간이 아니며, 화면이 곧 표시될지도 알지 못합니다.

반면 rAF는 다음 렌더링 갱신에 시각 작업을 참여시키는 요청입니다. 둘의 차이는 숫자의 정밀도가 아니라 스케줄링 계약에 있습니다.

## 디스플레이의 박자와 맞지 않는다

60Hz 화면의 한 주기는 약 16.67ms지만 모든 화면이 60Hz는 아닙니다. 120Hz에서는 약 8.33ms, 144Hz에서는 약 6.94ms마다 새 프레임을 표시할 수 있습니다. 16ms를 상수로 넣은 타이머는 이런 디스플레이의 표현력을 활용하지 못합니다. 가변 주사율이나 메인 스레드 혼잡까지 고려하면 오차는 더 커집니다.

타이머가 화면 갱신 직후 실행되면 다음 표시까지 결과가 기다립니다. 반대로 너무 늦게 실행되면 현재 프레임의 마감을 놓칩니다. 화면 갱신 사이에 여러 번 상태를 계산하더라도 중간 결과는 사용자에게 보이지 않습니다.

rAF는 사용자 에이전트가 알고 있는 프레임 생산 시점에 작업을 묶습니다. 이것이 rAF의 핵심 가치입니다. rAF가 코드를 빠르게 만들거나 항상 60fps를 보장하는 것은 아닙니다. 콜백이 프레임 예산을 넘기면 똑같이 끊깁니다.

## 시간 기반으로 움직여야 한다

프레임마다 고정된 거리를 더하는 코드도 주사율을 가정합니다.

```js
function move() {
  x += 4;
  box.style.transform = `translateX(${x}px)`;
  requestAnimationFrame(move);
}

requestAnimationFrame(move);
```

고주사율 화면에서는 같은 시간 동안 콜백이 더 자주 실행돼 물체가 빨라지고, 프레임을 놓치면 느려집니다. rAF가 전달한 timestamp로 진행률을 계산하면 전체 재생 시간을 유지할 수 있습니다.

```js
const box = document.querySelector(".box");
const duration = 600;

let start;
let rafId;

function frame(timestamp) {
  start ??= timestamp;

  const progress = Math.min((timestamp - start) / duration, 1);
  box.style.transform = `translateX(${progress * 240}px)`;

  if (progress < 1) {
    rafId = requestAnimationFrame(frame);
  }
}

rafId = requestAnimationFrame(frame);

// 중단할 때
// cancelAnimationFrame(rafId);
```

같은 렌더링 갱신에 포함된 rAF 콜백은 동일한 timestamp를 받습니다. 앞의 콜백이 오래 걸려 실제 시간이 흘렀더라도 뒤의 콜백에 전달되는 프레임 시각은 같습니다. 애니메이션 진행률에는 `Date.now()`를 각 콜백에서 다시 읽기보다 이 timestamp를 사용하는 편이 맞습니다.

# 실무에서는 프레임당 한 번만 반영하기

pointer나 scroll 이벤트는 한 프레임 사이에도 여러 번 발생할 수 있습니다. 이벤트마다 DOM을 갱신할 필요가 없다면 최신 값만 저장하고 rAF에서 한 번 반영할 수 있습니다.

```js
const indicator = document.querySelector(".indicator");

let latestX = 0;
let scheduled = false;

window.addEventListener("pointermove", (event) => {
  latestX = event.clientX;

  if (scheduled) return;
  scheduled = true;

  requestAnimationFrame(() => {
    indicator.style.transform = `translateX(${latestX}px)`;
    scheduled = false;
  });
});
```

이 코드에서 pointer 이벤트는 최신 좌표만 덮어씁니다. 이미 rAF를 등록했다면 콜백을 추가하지 않습니다. 다음 렌더링 갱신에는 가장 최근 좌표 하나만 반영됩니다. 입력 빈도와 화면 갱신 빈도를 분리해 표시되지 않을 중간 상태를 계산하지 않는 패턴입니다.

rAF가 어울리는 작업은 Canvas/WebGL의 프레임별 상태 계산, JavaScript 애니메이션, 입력 coalescing처럼 화면과 직접 연결된 일입니다. 네트워크 재시도, debounce의 시간 제한, 일정 시간이 지난 뒤 실행해야 하는 작업에는 `setTimeout`이 더 알맞습니다. 단순한 `transform`이나 `opacity` 전환은 CSS Animations, CSS Transitions, Web Animations API가 더 간단하고 브라우저 최적화를 활용하기도 좋습니다.

실무에서 함께 조심할 점도 있습니다.

- rAF는 해당 갱신의 본격적인 style/layout 단계보다 앞에서 실행됩니다. rAF 안의 DOM read가 항상 강제 layout을 피한다고 볼 수 없습니다.
- rAF를 두 번 중첩해도 paint 완료를 관찰하는 보편적인 방법은 아닙니다. 합성과 실제 presentation은 별도 과정입니다.
- 백그라운드 탭에서 돌아온 뒤 timestamp 차이가 커질 수 있습니다. 물리 시뮬레이션이라면 delta를 제한하거나 fixed timestep accumulator를 사용해야 합니다.
- 한 프레임의 전체 시간은 rAF 콜백만의 예산이 아닙니다. style, layout, paint 등 후속 작업이 들어갈 시간도 남겨야 합니다.

# Chrome에서는 rAF를 어떻게 처리할까

Chrome은 Blink라는 렌더링 엔진을 사용합니다. 앞에서 살펴본 내용이 HTML 명세에 정의된 추상적인 동작이라면, 여기부터는 Chromium/Blink의 실제 구현 흐름을 살펴보겠습니다. 두 층을 섞으면 “명세상 compositor queue에 rAF가 저장된다” 같은 잘못된 결론에 도달하기 쉽습니다.

[Chromium의 `How cc Works`](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/how_cc_works.md#BeginFrame-to-BeginMainFrame)에 따르면 compositor scheduler는 `BeginFrameArgs`를 main thread의 `BeginMainFrame`으로 보냅니다. 이 인자에는 animation에 사용할 시간이 들어 있습니다. Blink는 main thread에서 rAF 로직과 rendering lifecycle을 수행하고, 이후 cc가 layer를 갱신해 commit과 합성 과정으로 이어갑니다.

개념적으로 연결하면 다음과 같습니다.

```text
JavaScript requestAnimationFrame
  → Document 계열의 callback 상태에 등록
  → 프레임 갱신 스케줄과 결합
  → compositor/browser scheduler의 frame signal
  → main thread BeginMainFrame / Blink lifecycle
  → rAF callback batch 실행
  → style/layout/paint 상태 갱신
  → commit/composite/presentation
```

이 도식은 HTML 명세와 Chromium 문서를 함께 읽어 연결한 개념적 설명입니다. HTML Standard는 compositor thread, `BeginMainFrame`, commit을 규정하지 않습니다. 반대로 Chromium 문서는 HTML 명세의 ordered map을 그대로 물리적인 자료구조로 사용한다고 약속하지 않습니다.

[과거 standalone Blink 코드의 고정 revision](https://chromium.googlesource.com/chromium/src/+/9d8c99cfe73e17fccae5512ef7abf38381370a17/third_party/WebKit/Source/core/dom/FrameRequestCallbackCollection.cpp)에서는 조금 더 구체적인 구현 전략을 볼 수 있습니다. 등록한 콜백을 대기 vector에 append하고, 실행 시 `m_callbacksToInvoke.swap(m_callbacks)`로 현재 batch를 떼어냈습니다. 실행 중 새로 들어온 콜백은 대기 vector에 남으므로 다음 프레임으로 넘어갑니다. 실행 batch에서 취소된 콜백은 cancelled flag로 표시했습니다.

이 코드는 명세의 “현재 목록을 스냅샷하고, 실행 중 등록한 콜백은 다음 갱신으로 넘긴다”는 의미를 구현한 역사적 사례입니다. 고정된 과거 revision이므로 현재 Chromium HEAD의 클래스명이나 필드 구조를 설명하는 자료로 사용하면 안 됩니다. 현재 구현을 설명할 때 확실히 말할 수 있는 범위는 Chromium 문서에 나온 frame signal과 Blink lifecycle의 연결까지입니다.

# 결국 rAF는 렌더링에 참여하는 예약이다

`requestAnimationFrame`을 타이머의 변형으로 보면 계속 예외가 생깁니다. rAF 콜백은 task queue나 microtask queue가 아니라 Document의 animation frame callback map에 등록됩니다. 렌더링 기회가 생기고 `update the rendering` task가 선택된 뒤, 알고리즘이 animation frame callback 단계에 도달해야 실행됩니다.

이 차이 때문에 rAF는 주사율과 문서 가시성, 브라우저의 프레임 스케줄에 맞춰 시각 작업을 모을 수 있습니다. `setTimeout(fn, 16)`으로 DOM을 움직이는 일 자체는 가능하지만 이 렌더링 계약까지 재현할 수는 없습니다.

다음에 “rAF는 매크로태스크인가요?”라는 질문을 만난다면 queue의 이름부터 고르기보다 두 가지를 먼저 확인해보면 좋겠습니다. 콜백은 어디에 저장되는가, 그리고 어떤 조건이 실행을 시작하는가. 이 두 질문만으로도 이벤트 루프 그림 밖에 있던 rAF의 자리가 꽤 선명해집니다.

# 참고 자료

- [WHATWG HTML - Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)
- [WHATWG HTML - Animation frames](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames)
- [WHATWG Infra - Ordered maps](https://infra.spec.whatwg.org/#ordered-map)
- [Web IDL - Invoke a callback function](https://webidl.spec.whatwg.org/#invoke-a-callback-function)
- [High Resolution Time](https://w3c.github.io/hr-time/)
- [Chromium - How cc Works](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/how_cc_works.md)
- [Chromium Blink core/frame README](https://chromium.googlesource.com/chromium/src/+/HEAD/third_party/blink/renderer/core/frame/README.md)
- [과거 standalone Blink 고정 revision - FrameRequestCallbackCollection.cpp](https://chromium.googlesource.com/chromium/src/+/9d8c99cfe73e17fccae5512ef7abf38381370a17/third_party/WebKit/Source/core/dom/FrameRequestCallbackCollection.cpp)
- [MDN - Window.requestAnimationFrame()](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
