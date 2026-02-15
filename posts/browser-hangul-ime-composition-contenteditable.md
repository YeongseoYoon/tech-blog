---
title: "줄바꿈 하나가 한글 조합을 박살내는 과정"
date: "2026-02-14T07:29:32.468Z"
summary: "그날 개발자들은 떠올렸다"
tags: ["Browser", "IME"]
---

> 그날 개발자들은 떠올렸다. contentEditable 안에서 한글이 조합되지 않던 그 공포를... `<br>`이라는 벽 안에서는 평화로웠지만, `\n`이라는 벽 너머에는 IME 조합이 즉시 확정되는 거인이 기다리고 있었다.

<img src="/static/images/ime-titan.png" alt="ime 거인" width={400} />

텍스트와 관련된 작업을 하다보면, 그리고 `조합 문자`를 사용하는 언어를 지원하는 텍스트 인풋이라면 쉽게 IME와 관련된 이슈를 접하게 됩니다. 이번에도 그랬습니다. `contentEditable`을 사용한 셀에서, 사용자가 빈 셀을 클릭하고 한글을 입력하는 순간 문제가 터졌습니다.

하지만 이 문제를 이해하려면, 먼저 `조합 문자`가 무엇인지부터 알아야 합니다.

## 💬 조합 문자(Composition Character)란

문자 체계는 두 부류로 나눌 수 있습니다.

### 1. 직접 입력 문자

키 하나를 누르면 글자 하나가 완성되는 문자들입니다. 영어, 숫자, 특수문자 등이 여기에 해당합니다. 키를 누르는 순간 문자가 확정되고 다음 키 입력은 무조건 다음 문자입니다.

### 2. 조합 문자

여러 키를 순서대로 눌러야 하나의 글자가 완성됩니다. 한글, 중국어, 일본어 등 CJK 언어가 대표적입니다. 키를 누를 때마다 글자가 변형되며, 언제 완성되는지가 모호합니다.

예를 들어, 사용자가 `고양이`를 입력한다고 생각해 보겠습니다. 사용자의 의도는 당연히 명확합니다. 하지만 컴퓨터 입장에서는 매 키 입력마다 고민을 해야 합니다.

| 키 입력 | 화면   | 컴퓨터의 고민                                                       |
| ------- | ------ | ------------------------------------------------------------------- |
| ㄱ      | ㄱ     | "ㄱ"으로 끝? 아니면 뒤에 모음이 올까?                               |
| ㅗ      | 고     | "고"로 끝? 아니면 받침이 올까?                                      |
| ㅇ      | 공     | "공"으로 끝? 아니면 뒤에 모음이 와서 ㅇ이 다음 글자로 넘어갈까?     |
| ㅑ      | 고야   | ㅇ이 다음 음절 초성으로 이동! "공" → "고" + "야"                    |
| ㅇ      | 고양   | 또 ㅇ이 왔다. "고양"으로 끝? 아니면 또 넘어갈까?                    |
| ㅣ      | 고양이 | ㅇ이 또 넘어간다! "고양" → "고야" + "이"... 가 아니라 "고양" + "이" |

영어의 cat은 c → ca → cat, 매 순간 이전 글자가 바뀌지 않습니다. 하지만 한글의 `고양이`는 이미 화면에 표시된 글자가 소급적으로 변경됩니다. 이것이 조합 문자의 핵심적인 어려움입니다.

이 `아직 확정되지 않은, 변형 중인 상태`를 `조합(Composition)`이라고 부릅니다. 그리고 이 조합을 관리하는 OS 수준의 프로그램이 `IME(Input Method Editor)`입니다.

### 한글은 특히나 더 까다롭습니다

같은 조합 문자라도 한글은 더 까다롭습니다. 확정 단계만으로 살펴봐도 까다롭습니다.

- 중국어: 병음을 입력하고 후보 목록에서 명시적으로 한자를 선택합니다. 확정 시점이 명확합니다. (예를 들어 zhi를 입력하고, zhi의 병음을 가진 한자 중 선택하는 시스템)
- 일본어: 히라가나를 입력하고 필요하면 한자로 명시적 변환합니다. 역시나 확정 단계가 있습니다.
- 한글: 명시적 확정 단계가 없습니다. 암묵적이고 연속적으로 조합과 확정이 반복됩니다.

게다가 음절 경계도 모호합니다. `서울`을 입력할 때를 살펴보면 다음과 같습니다.

| 키 입력 | 화면 표시 | 설명                                             |
| ------- | --------- | ------------------------------------------------ |
| ㅅ      | ㅅ        | 초성                                             |
| ㅓ      | 서        | 초성+중성                                        |
| ㅇ      | 성        | 종성 추가 → "성"                                 |
| ㅜ      | 서우      | **ㅇ이 다음 음절의 초성으로 이동** → "서" + "우" |
| ㄹ      | 서울      | 종성 추가 → "서울"                               |

자음 이동은 매 음절 경계마다 발생하므로 한글 IME는 다른 언어보다 훨씬 많은 조합 이벤트를 발생시킵니다.

## 👿 문제 상황: 빈 셀에서 한글을 치는데 첫 글자가 씹힌다

위에서 조합 문자의 특성을 이해했으니 이제 마주쳤던 문제를 보겠습니다.

빈 칸에 '가'를 입력하려고 했던 상황에서, 계속 'ㄱ'+'ㅏ'로 분리되어 조합이 되지 않았습니다. 더 이상한 것은, 줄바꿈 방식에 따라 증상이 달랐다는 것입니다.

- 빈 문자가 `<br/>` 태그로 줄바꿈 되어있었던 경우에는 정상적으로 조합
- `\n` 텍스트 노드로 줄바꿈한 경우에는 첫 글자 조합이 파괴

같은 빈 칸으로 보이는 경우에도 어떤 줄바꿈 방식이냐에 따라 다른 결과를 만들어 내고 있었습니다. 왜 이런 일이 벌어지는지를 확인하려면 IME가 OS에서 출발해 브라우저를 거쳐 DOM 이벤트가 되는 과정을 살펴봐야 합니다.

### OS → 브라우저 → DOM

핵심은 IME가 '운영체제 수준'의 프로그램이라는 점입니다. 브라우저가 키 입력을 처리하기 전에 OS IME가 먼저 가로챕니다.

IME 조합 중 keydown 이벤트를 찍어보면 `keyCode: 229`가 나옵니다. W3C UI Events 스펙은 ["IME가 키 입력을 처리 중이면 keydown의 keyCode를 229로 반환하라"](https://w3c.github.io/uievents/#determine-keydown-keyup-keyCode)고 명시하고 있습니다. 이 229라는 숫자는 Windows의 Virtual-Key Code VK_PROCESSKEY와 동일한 값인데, Windows에서 IME가 키 입력을 가로채면 애플리케이션에 실제 키 대신 이 코드가 전달되는 것이 원래 관례였습니다. 웹 표준이 이 값을 그대로 사용하게 된 배경입니다.

참고로 keyCode 자체는 [deprecated](https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event)입니다. 모던한 대체제는 `key` 프로퍼티인데, IME 조합 중에는 `key: "Process"`가 됩니다. MDN에서는 IME 조합 중인 keydown을 무시하는 예시로 `event.isComposing || event.keyCode === 229` 패턴을 제시하고 있습니다.

조합 시작 및 종료의 경우 모두 이벤트는 조합의 일부임에도 `isComposing`이 `false`이지만, `keyCode`는 여전히 229입니다. MDN은 deprecated임에도 불구하고 `keyCode`를 함께 체크하는 것이 바람직하다고 안내하고 있습니다.

OS IME의 조합이 DOM에 도달하면, 브라우저는 `CompositionEvent`를 통해 웹 개발자에게 조합 상태를 알려줍니다. W3C UI Events 사양은 세 가지 이벤트를 정의합니다.

| 이벤트              | 발생 시점             | `data` 프로퍼티              |
| ------------------- | --------------------- | ---------------------------- |
| `compositionstart`  | 조합 세션 시작        | 빈 문자열 또는 선택된 텍스트 |
| `compositionupdate` | 조합 문자열 변경      | 현재 조합 중인 문자열        |
| `compositionend`    | 조합 종료 (확정/취소) | 확정된 최종 문자열           |

### 브라우저별 이벤트 순서 차이

그런데, 골치아픈 부분은 **실제 브라우저 구현이 서로 다르다는 점입니다.**

| 브라우저    | 조합 종료 시 이벤트 순서   | 최종 `input`의 `isComposing` |
| ----------- | -------------------------- | ---------------------------- |
| **Chrome**  | `input` → `compositionend` | `true`                       |
| **Safari**  | `input` → `compositionend` | `true`                       |
| **Firefox** | `compositionend` → `input` | `false`                      |

- **Firefox**: `input` 이벤트의 `isComposing`만 체크하면 조합 완료를 감지할 수 있습니다 (완료 시 `false`)
- **Chrome/Safari**: `input`의 `isComposing`이 항상 `true`이므로, `compositionend`를 **별도로** 리스닝해야 합니다

### 조합 중 DOM을 건드리면 조합이 죽는다

IME는 자신이 조합 중인 텍스트의 위치와 내용을 추적하고 있습니다. **조합 중에 DOM이 변경되면 IME 조합이 조기 취소될 수 있습니다.** Chrome의 EditContext API 소개에서도 ["활성 IME 컴포지션이 있는 동안 수정 중인 DOM 영역을 변경하면 컴포지션이 조기 취소될 수 있기 때문입니다."](https://developer.chrome.com/blog/introducing-editcontext-api?hl=ko)라는 문장으로 이 점을 명시합니다.

실제로 Gecko에서는 `IMEContentObserver`가 에디터의 Selection 변경과 텍스트 변경을 감시하여, 변경이 감지되면 `NOTIFY_IME_OF_SELECTION_CHANGE` 등의 알림을 IME에 전달하는 구조입니다. 이것이 에디터 개발에서 **"조합 중에는 DOM을 건드리지 말 것"**이라는 룰이 존재하는 이유입니다.

이 내용이 다음에 나올 `\n` 문제의 핵심 원인과 직결됩니다.

## 🔍 원인 분석: `<br>` 뒤에서는 되고 `\n` 뒤에서는 안 되는 이유

이제 처음에 마주친 문제의 근본 원인을 파헤쳐보겠습니다.

### DOM 구조부터 다르다

같은 "줄바꿈"이지만, DOM 구조는 완전히 다릅니다.

**`<br>` 사용 시:**

```text
├── #text "hello"
├── ← Element 노드 (독립적인 자식)
└── #text "" ← 빈 텍스트 노드 (캐럿은 여기)
```

**`\n` 사용 시:**

```html
└── #text "hello\n" ← 하나의 텍스트 노드 (캐럿은 이 노드의 끝)
```

- `<br>`는 **Element 노드**입니다. 부모의 독립적인 자식이며, 그 뒤에 깨끗한 경계가 존재합니다.
- `\n`은 텍스트 노드 **내부의 문자**일 뿐입니다. 노드 경계가 아니라 기존 텍스트 노드 안의 한 위치입니다.

### Selection의 차이: 요소 레벨 vs 문자 레벨

이 DOM 구조의 차이는 **캐럿 위치의 표현 방식**을 바꿉니다.

**`<br>` 뒤의 캐럿:**

```javascript
{
  anchorNode: div,        // 부모 Element
  anchorOffset: 2         // 자식 노드 인덱스 (br 뒤)
}
```

→ **요소 레벨 오프셋**. "div의 두 번째 자식 뒤"라는 구조적으로 명확한 위치입니다.

**`\n` 뒤의 캐럿:**

```javascript
{
  anchorNode: textNode,   // 텍스트 노드 자체
  anchorOffset: 6         // "hello\n"은 6글자, 캐럿은 그 끝
}
```

→ **문자 레벨 오프셋**. "텍스트 노드 안에서 6번째 문자 뒤"라는 위치입니다.

### 왜 `<br>` 뒤에서는 되고 `\n` 뒤에서는 안 될까?

앞 섹션에서 "조합 중에 DOM이 변경되면 조합이 깨질 수 있다"는 것을 확인했습니다. 이제 `<br>`와 `\n`에서 실제로 무슨 일이 벌어지는지 따라가 보겠습니다.

**`<br>` 뒤에서 `ㅎ`을 입력하면**

`<br>` 뒤에는 빈 텍스트 노드(`#text ""`)가 이미 존재하거나, 브라우저가 새로 만듭니다. IME는 이 빈 텍스트 노드를 조합 대상으로 잡고 `ㅎ`을 써넣습니다. 기존 콘텐츠(`"hello"`)가 들어있는 텍스트 노드와는 **완전히 별개의 노드**이므로, 기존 DOM 구조를 건드릴 필요가 없습니다. Selection도 이 빈 노드 안에서만 움직입니다. 즉, 위에서 이야기한 것처럼 안정적으로 조합됩니다.

**`\n` 뒤에서 `ㅎ`을 입력하면:**

캐럿은 `"hello\n"` 텍스트 노드의 **끝**에 있습니다. 브라우저가 여기에 조합 문자를 삽입하려면, `"hello\n"` 뒤에 이어 붙이거나 텍스트 노드를 **분리**해서 새 노드를 만들어야 합니다. 이때 문제가 생깁니다.

- 텍스트 노드가 분리되면, 캐럿이 가리키던 노드 자체가 바뀝니다 (기존 노드 → 새 노드)
- 이는 **Selection 변경**에 해당합니다
- 앞에서 봤듯이, Selection이 변경되면 IME에 알림이 가고 조합이 깨질 수 있습니다

또한 `\n`은 시각적으로는 "새 줄의 시작점"이지만 DOM에서는 "기존 텍스트 노드의 마지막 문자"입니다. 이 **시각적 위치와 DOM 위치의 불일치**가 브라우저의 조합 범위 설정을 혼란스럽게 만듭니다. 이때 조합이 파괴됩니다.

### 정리

| 측면               | `<br>` 뒤              | `\n` 뒤                    |
| ------------------ | ---------------------- | -------------------------- |
| DOM 구조           | 독립 Element 노드      | 텍스트 노드 내부 문자      |
| 캐럿 위치          | 요소 레벨 오프셋       | 문자 레벨 오프셋           |
| 조합용 텍스트 노드 | 새로 생성/빈 노드 사용 | 기존 노드 공유 (분리 필요) |
| 노드 분리 필요     | 불필요                 | 필요 → 조합 파괴 위험      |
| **한글 조합**      | **정상** ✅            | **첫 글자 즉시 확정** ❌   |

결과적으로 **첫 한글 자모(예: ㅎ)가 입력되면 조합 상태를 유지하지 못하고 즉시 확정**되어, 다음 키 입력(ㅏ)이 "하"로 결합되지 않고 별도의 새 문자로 시작됩니다.

## 📖 에디터 라이브러리들은 이 문제를 어떻게 풀고 있을까?

유명 에디터 라이브러리들도 모두 한글 IME를 다룰때 같은 문제를 겪고 있습니다.

### ProseMirror: "조합 중에는 건드리지 마"

ProseMirror는 2019년에 IME 처리를 [대폭 개편](https://discuss.prosemirror.net/t/composition-overhaul/1923)했습니다.

이전에는 조합 중 DOM이나 Selection을 건드리면 조합이 깨질 수 있어, 조합이 끝날 때까지 DOM 업데이트를 거의 하지 않았습니다(freezing). 그래서 조합 중 입력은 트랜잭션이 생기지 않았고, API로 문서를 바꿔도 조합이 끝날 때까지 화면에 반영되지 않았습니다. 플러그인이 조합 중에는 안 먹는 것처럼 보이는 문제가 있었습니다.

새 방식은 이 freezing을 제거했습니다. 조합 중에도 변경이 즉시 트랜잭션으로 생성되고 화면에 반영됩니다. 대신 커서가 위치한 텍스트 노드에 데코레이션이 개입하지 못하게 하여 조합이 불필요하게 깨지는 것을 방지합니다. 만약 외부 변경이 포커스된 텍스트 노드를 통째로 교체하면, 그때는 조합을 강제 종료시킵니다. `view.composing` 불리언으로 조합 상태를 노출하므로, 외부 코드가 이를 확인하고 DOM 변경을 미룰 수도 있습니다. 자세한 코드는 [여기](https://github.com/ProseMirror/prosemirror-view/blob/master/src/input.ts#L457-L490)를 통해 확인할 수 있습니다.

### Slate.js: React와 IME의 근본적 충돌

Slate는 React의 제어형 렌더링 모델과 IME 조합이 근본적으로 충돌합니다. 글자 유실, 커서 위치 오류, 조합 중 입력 취소 같은 문제가 지속적으로 보고되어 왔고, 한글과 일본어 IME의 동작 차이(예: 일본어는 Enter로 후보 선택, 한글은 Enter가 일반 입력처럼 동작)까지 겹쳐 공통 로직으로 다루기가 매우 어렵습니다.

근본 원인은 [#4127](https://github.com/ianstormtaylor/slate/issues/4127)에서 명확히 진단되었습니다. IME는 조합 중 특정 텍스트 노드에 대한 참조를 유지하는데, React가 에디터를 리렌더링하면 그 노드가 사라집니다. 그 결과 IME가 다음 틱에 엉뚱한 위치에 커서를 놓거나, 존재하지 않는 문자를 삭제하려 하면서 DOMException이 발생합니다.

위 이슈에서 해결 방향으로 Google Docs 스타일의 오프스크린 [floating contenteditable](https://github.com/ianstormtaylor/slate/issues/4127)이 제안되었습니다. 흥미로운 아키텍처인데, React가 관리하는 "보이는 텍스트"와 IME가 실제로 입력을 받는 contenteditable을 완전히 분리하는 것이 핵심입니다. 화면 밖에 숨겨진 작은 contenteditable 요소가 IME 입력을 받아 조합을 처리하고, 조합이 끝나면 그 결과를 React 쪽 뷰에 반영합니다. IME 입장에서는 자기가 참조하는 DOM 노드가 React 리렌더링에 영향을 받지 않으니 조합이 깨질 일이 없습니다.

물론 단점도 있습니다. 에디터가 브라우저/OS가 인식하는 "진짜 텍스트 필드"가 아니게 되어버려서, OS 레벨의 스펠체크, 자동완성, 접근성 기능 등을 그대로 쓸 수 없게 됩니다. 그래도 IME와의 근본적인 충돌을 구조적으로 회피하는 접근이라는 점에서 흥미로운 방향입니다.

## 📌 해결 패턴

### 1. 줄바꿈/빈 줄은 `<br/>` 기준으로 관리

`\n` 문자만 믿고 텍스트 노드 중심으로 다루면, 브라우저마다 줄바꿈 처리/캐럿 위치가 달라져 조합 안정성이 떨어질 수 있습니다.  
표면 DOM은 `<br>` 기준으로 관리하고, 내부 모델에서는 `\n`으로 매핑하는 방식이 실무에서 가장 다루기 쉽습니다.

```ts
// ❌ \n은 텍스트 노드 내부의 문자 → 캐럿이 노드 끝에 위치하게 되어
//    IME 조합 시 노드 분리가 필요 → Selection 변경 → 조합 파괴
element.textContent = "hello\nworld";

// ✅ <br>은 독립된 Element 노드 → 캐럿이 요소 경계에 위치하므로
//    새 텍스트 노드에 바로 쓸 수 있어 조합이 안정적
element.innerHTML = "hello<br>world";
```

### 2. isComposing 가드

조합 중 키 입력을 무시하지 않으면, 한글 자모가 확정되기 전에 키 핸들러가 실행되어 의도치 않은 동작이 발생합니다.

```ts
let isComposing = false;
let compositionEndTimer: ReturnType<typeof setTimeout> | null = null;
element.addEventListener("compositionstart", () => {
  isComposing = true;
  if (compositionEndTimer) clearTimeout(compositionEndTimer);
});
element.addEventListener("compositionend", () => {
  // Safari/일부 환경에서 경계 keydown이 같은 틱에 들어올 수 있어
  // 짧은 지연 후 composing 해제
  compositionEndTimer = setTimeout(() => {
    isComposing = false;
  }, 50);
});
element.addEventListener("keydown", (e) => {
  const legacyKeyCode =
    (e as KeyboardEvent & { keyCode?: number }).keyCode ?? 0;
  if (e.isComposing || legacyKeyCode === 229 || isComposing) return;
  // 여기서부터 안전한 단축키/엔터 처리
});
```

### 3. 조합 중 DOM/Selection 불간섭 원칙

앞서 살펴본 것처럼, 조합 중 DOM이나 Selection이 변경되면 브라우저가 IME에 변경을 통지하고 조합이 파괴됩니다. 조합 중에는 화면 갱신도 “즉시 적용” 대신 큐잉하는 게 안전합니다.

```ts
const pendingUpdates: Array<() => void> = [];
function queueOrApply(update: () => void) {
  if (isComposing) {
    pendingUpdates.push(update);
    return;
  }
  update();
}
function flushPendingUpdates() {
  while (pendingUpdates.length) {
    pendingUpdates.shift()?.();
  }
}
```

### 4. 브라우저 이벤트 순서 대응

Chrome/Safari는 compositionend → input 순서로, Firefox는 input → compositionend 순서로 이벤트를 발생시킵니다. 한쪽에만 맞추면 다른 브라우저에서 입력이 누락되거나 중복 처리됩니다. 둘 다 처리하되, 마지막 커밋 텍스트로 dedupe 하는 것이 좋습니다.

```ts
let lastCommitted = "";
function getCommittedText() {
  // 프로젝트 정책에 맞는 DOM->text 변환 사용
  return element.innerText.replace(/\r\n?/g, "\n");
}
function handleCommittedInput() {
  const next = getCommittedText();
  if (next === lastCommitted) return; // dedupe
  lastCommitted = next;
  onChange(next);
}
element.addEventListener("input", (event) => {
  if ((event as InputEvent).isComposing) return;
  handleCommittedInput();
});
element.addEventListener("compositionend", () => {
  handleCommittedInput();
});
```

### 5. EditContext API

[EditContext API](https://w3c.github.io/edit-context/)는 텍스트 입력을 DOM에서 완전히 분리하는 새로운 웹 표준입니다. IME가 DOM 노드를 참조하는데 그 노드가 변경될 수 있는 `contentEditable`의 근본적인 문제를 구조적으로 해소합니다. `EditContext` 객체가 IME 이벤트를 직접 수신하고, 개발자가 뷰 렌더링을 완전히 제어합니다. 커스텀 렌더러(Canvas/WebGL 등) 기반 에디터에서 특히 유용합니다.

```javascript
const editContext = new EditContext();
const host = document.querySelector("canvas")!;
(host as HTMLElement & { editContext: EditContext }).editContext = editContext;

editContext.addEventListener("textupdate", (e: any) => {
  renderText(e.text, e.selectionStart, e.selectionEnd);
});

```

위에서 언급한 Google Docs의 "오프스크린 contenteditable" 패턴을 표준화한 것으로, 장기적으로 CJK IME 문제의 근본 해결책이 될 수 있습니다. 현재 Chrome/Edge 121+에서 사용 가능하며, Firefox와 Safari는 아직 미지원하고 있습니다.

## 마치며

contentEditable에서 `<br>` 대 `\n`의 한글 조합 차이는 단순한 버그가 아니라 **브라우저가 캐럿을 요소 경계와 텍스트 노드 내부에서 다르게 처리하는 특성**에서 비롯됩니다.

`\n` 뒤에 캐럿이 위치하면 IME의 조합 범위 설정이 불안정해지고, 텍스트 노드 분리가 Selection 변경을 일으켜 조합을 파괴합니다. 한글처럼 자모를 실시간 조합하는 언어에서 이는 **첫 글자 조합 파괴**로 직결됩니다.

현실적 전략은 줄바꿈에 `<br>`를 사용하거나, `isComposing` 플래그를 철저하게 관리하거나, 조합 중 DOM을 조작하지 않도록 하는 것입니다. 장기적으로는 **EditContext API**가 contentEditable의 구조적 한계를 해소할 표준으로 생각됩니다.

혹시 지금 contenteditable에서 한글 입력이 깨지는 버그를 디버깅 중이시라면, 줄바꿈이 `\n`인지 `<br>`인지 가장 먼저 확인해보세요! 답은 거기에 있을 수 있습니다.

### ✏️ 출처

https://en.wikipedia.org/wiki/Input_method <br/>
https://w3c.github.io/uievents/#determine-keydown-keyup-keyCode <br/>
https://github.com/w3c/uievents/issues/202 <br/>
https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent<br/>
https://w3c.github.io/uievents/#events-compositionevents<br/>
https://developer.chrome.com/blog/introducing-editcontext-api?hl=ko<br/>
https://discuss.prosemirror.net/t/composition-overhaul/1923<br/>
https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable<br/>
https://w3c.github.io/edit-context/<br/>
