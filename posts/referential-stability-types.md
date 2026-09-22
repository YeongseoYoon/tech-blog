---
title: "[번역] 참조 안정성을 타입으로 만들기"
date: "2026-09-22T00:00:00.000Z"
tags: ["TypeScript", "React", "translate"]
---

> 이 글은 Jovi De Croock의 [**“Making Referential Stability a Type”**](https://www.jovidecroock.com/blog/referential-stability-types/)을 원저자의 허락을 받아 번역한 글입니다.

어느 정도 규모가 있는 리액트나 Preact 코드베이스에서 작업해 봤다면, 참조 안정성에 관한 이야기를 지겨울 만큼 나눠 봤을 겁니다. 누군가는 `useMemo`를 추가하고, 다른 누군가는 `useCallback`을 추가합니다. exhaustive-deps 경고를 끈 다음, 다음 컴포넌트에 전달한 prop이 안정적이기를 모두가 바랍니다. 코드는 대체로 올바르지만, 이처럼 암묵적인 안정성에는 충분한 보장이 없습니다.

메모이제이션된 자식 컴포넌트에 새 배열 리터럴을 넘긴 탓에 일어난 리렌더링이나 이펙트 실행을 추적하느라, 인정하고 싶은 것보다 훨씬 많은 시간을 썼습니다. `Item[]`라는 타입 선언이나 `Item[]`로 지정한 prop 타입은 배열의 형태와 배열 *안에* 어떤 값이 들어 있는지는 알려 주지만, 다음 렌더링에서도 같은 배열 참조를 받는지는 알려 주지 않습니다.

그래서 작은 아이디어 하나를 실험해 보고 있습니다. 참조를 안정적으로 유지하려는 의도를 타입의 일부로 만들면 어떨까요?

## 타입

이 아이디어 전체는 비공개 팬텀 브랜드 하나에 달려 있습니다.

```ts
declare const stableBrand: unique symbol

type Stable<T> = T extends object ? T & { readonly [stableBrand]: true } : T
```

객체와 배열, 함수에는 브랜드가 붙습니다. 프리미티브는 그대로 통과합니다. 리액트와 Preact가 이미 프리미티브를 값으로 비교하기 때문에, `string`은 언제나 "충분히 안정적"입니다.

<aside>

여기서 "안정적"이라는 말은 불변이거나 컴포넌트의 생애 내내 동일하다는 뜻이 아닙니다. 관련 없는 렌더링을 거쳐도 참조가 유지되어야 하고, 상태 업데이트나 메모이제이션 의존성 변경처럼 참조의 원천이 무효화될 때만 바뀌어야 한다는 뜻입니다. 한 번의 렌더링 안에서만 안정적인 것은 별 의미가 없습니다. 모든 지역 참조가 이미 그런 특성을 지니기 때문입니다. 이는 최적화를 위한 계약이지, 애플리케이션의 정확성이 의존해야 할 대상은 아닙니다. 리액트는 이유가 있다면 메모이제이션된 값과 콜백을 버릴 수 있습니다.

</aside>

여기서는 `unique symbol`이 핵심 역할을 합니다. `_stable: true` 같은 문자열 키를 썼다면 우연히 같은 형태를 지닌 객체도 브랜드 조건을 충족하고, 결국 누군가는 `{ _stable: true }`를 *반드시* 작성했을 겁니다. 패키지 밖으로 노출되지 않는 `unique symbol`은 애플리케이션 코드에서 구조적 할당으로 재현할 수 없습니다. `Stable<T>`이라는 타입은 참조할 수 있지만, 브랜드가 붙은 값을 직접 위조할 수는 없습니다.

이제 prop은 데이터보다 더 많은 정보를 표현할 수 있습니다.

```ts
type ItemListProps = {
  items: Stable<Item[]>
  onSelect: Stable<(id: string) => void>
  title: string
}
```

배열과 콜백은 안정적으로 유지하려는 의도를 가지고 만든 참조이므로 브랜드를 지닙니다. 이제 인라인으로 만든 배열은 잘못된 타입이 됩니다.

```tsx
<ItemList
  items={items.filter(isVisible)}
  onSelect={(id) => select(id)}
  title="Visible items"
/>
```

컴포넌트 경계가 이 요구 사항을 호출자에게 되돌려 보냅니다. 요구 사항이 있어야 할 곳이 바로 여기입니다.

이는 우리가 잊곤 하는 `memo()`와 `PureComponent`의 다른 반쪽이기도 합니다. 컴포넌트를 `memo`로 감싼 뒤 값이 바뀌지 않으면 리렌더링되지 않을 거라고 생각합니다. 하지만 복합 타입의 안정성은 보장되지 않으며, 이 때문에 최적화가 무효가 될 수 있습니다.

## 훅은 유지하고 import만 바꾸기

처음에는 모듈 보강으로 이런 증명을 만들려고 했습니다. 부수 효과를 위해 패키지를 import하면 패키지가 리액트의 훅 타입을 보강하고, 모든 의존성이 안정적일 때 `useMemo`가 반환 결과에 브랜드를 붙이는 방식입니다.

절반은 작동합니다. 작동하지 않는 나머지 절반은 이해해 볼 만합니다. 저도 *왜* 그런지 파고들기 전까지는 이상하게 느꼈던 부분이기 때문입니다.

모듈 보강을 사용하면 선언에 오버로드를 *추가*할 수 있습니다. 하지만 `@types/react`가 제공하는 오버로드를 제거하거나 교체할 수는 없습니다. 보강을 마치면 `useMemo`에는 엄격한 `(factory, deps: StableDeps) => Stable<T>` 오버로드와 리액트의 기존 `(factory, deps: DependencyList) => T` 오버로드가 나란히 존재합니다. 타입스크립트는 엄격한 오버로드부터 시도합니다. 모든 의존성에 증명이 있다면 좋습니다. `Stable<T>`을 얻습니다. 하지만 의존성 하나라도 증명이 없으면 엄격한 오버로드가 더는 일치하지 않고, 오버로드 해석은 어떤 `DependencyList`든 기꺼이 받는 리액트의 기존 오버로드로 조용히 넘어갑니다.

```ts
const unstable = {}
const value = useMemo(() => ({ answer: 42 }), [unstable])
// no error. value is just { answer: number }, unbranded
```

정작 오류가 나길 바랐던 의존성 목록에서는 아무 오류도 발생하지 않습니다. 그저 증명이 만들어지지 않을 뿐입니다. 그래서 이 방식과 씨름하는 일을 그만뒀습니다. 엄격한 경로는 별도의 진입점으로 제공됩니다.

```ts
import { useCallback, useEffect, useMemo } from 'stableref/react'
```

런타임에서는 실제 리액트 훅이지만, 더 엄격한 타입 선언으로 노출됩니다. 의존성 튜플을 추론한 다음, 증명되지 않은 각 요소를 예상 타입 안에서 해결 방법을 알려 주는 문자열 리터럴로 바꿉니다. 이 진입점에는 리액트의 느슨한 오버로드가 없으므로 대체할 대상도 없습니다. 증명되지 않은 참조는 작성한 의존성 위치에서 오류를 일으킵니다.

```ts
const stableFilter = useCallback(filter, [query])

useMemo(() => source.filter(stableFilter), [source, stableFilter])
// Stable<Item[]>

useMemo(() => source.filter(rawFilter), [source, rawFilter])
//                                                 ^ type error

useEffect(syncSelection, [selection, page])
//                                   ^ type error when page is an unproven object
```

이 패키지는 보강 방식을 제공하지 않습니다. 증명을 조용히 잃어버리면 실제로 강제되고 있다고 착각하기가 너무 쉽습니다. `stableref/react`에서 가져오면 잘못된 의존성 목록이 더 아래쪽 어딘가가 아니라, 작성한 자리에서 실패합니다.

## 리액트가 이미 보장하는 값은 인정하기

안정적인 참조가 모두 `useMemo`에서 나오는 것은 아닙니다. 리액트가 기본으로 제공하는 몇 가지 값에는 타입으로 그 사실을 명시하면 됩니다.

```ts
const [state, setState] = useState(initialState)
// state:    Stable<State>
// setState: Stable<Dispatch<SetStateAction<State>>>

const element = useRef<HTMLElement | null>(null)
// element: Stable<RefObject<HTMLElement | null>>
```

`Stable<State>`에는 짧은 설명이 필요합니다. 처음 보면 거짓말처럼 보이기 때문입니다. 상태가 절대 바뀌지 *않는다*는 뜻이 아닙니다. 상태가 바뀌지 않았다면 리액트가 새로운 참조를 만들어 내지 않는다는 뜻입니다. 실제로 상태가 전이되면 메모이제이션 결과는 무효화되고 이펙트는 다시 실행되어야 합니다. 그것이 상태의 존재 이유입니다. 브랜드는 불변성이 아니라 동일성에 관한 것입니다.

초기화 함수도 증명이 필요하지 않습니다. 의존성 목록이 아니기 때문입니다.

```ts
const [state] = useState(() => buildInitialState(props))
const [reduced] = useReducer(reducer, props, createInitialState)
```

리액트는 초기값을 만들 때만 이 함수들을 호출합니다. 계약은 결과로 나온 상태와 디스패처에 브랜드를 붙일 뿐, 초기화 함수 자체가 안정적인지는 신경 쓰지 않습니다. 따라서 안정성 증명을 요구하지 않습니다.

구성할 때부터 안정적인 모듈 스코프 값에는 아주 작은 항등 헬퍼를 사용할 수 있습니다.

```ts
export const EMPTY_ITEMS = stable([] as Item[])
```

런타임에서 `stable()`은 값을 건드리지 않고 그대로 반환합니다. 즉, `x => x`입니다. 유용한 것은 함수가 아니라 증명입니다. 이 주장이 실제로 참인 모듈 스코프에서 사용하세요.

## 컨텍스트에서는 효과가 빠르게 드러납니다

인라인 컨텍스트 값은 하위 트리 전체에 불필요한 작업을 조용히 일으키는 가장 쉬운 방법 가운데 하나입니다.

```tsx
<ThemeContext.Provider value={{ theme, setTheme }}>
  {children}
</ThemeContext.Provider>
```

`createStableContext`는 이 요구 사항을 프로바이더로 옮깁니다. 프레임워크에 특화된 기능이므로 패키지 루트가 아니라 리액트 진입점에서 가져옵니다.

```ts
import { createStableContext } from 'stableref/react'

const ThemeContext = createStableContext<ThemeValue | null>(null)
```

이제 프로바이더는 `Stable<ThemeValue>`만 받습니다. 값을 소유한 곳이 그 값을 메모이제이션할 책임도 집니다. 트리 깊숙이 있는 컨슈머는 그 값이 어떻게 조립됐는지 알 필요가 없습니다. 계약만 전달받으면 됩니다. 제가 타입에서 원하는 경계가 바로 이것입니다. 책임이 있는 곳에 지식도 남습니다.

## Preact

같은 아이디어를 별도의 진입점으로 제공합니다. 당연히 Preact를 빼놓을 생각은 없었습니다.

```ts
import { useEffect, useMemo, type Stable } from 'stableref/preact'
```

이 훅들은 기존 `preact/hooks` 참조를 유지하면서 똑같이 엄격한 의존성 시그니처를 적용합니다. 증명은 값의 계약에 속합니다. 어떤 렌더링 라이브러리를 골랐는지는 애초에 중요하지 않았습니다.

## 이 방식으로 해결할 수 없는 것

마음먹은 개발자라면 언제든 다음 코드를 작성할 수 있습니다.

```ts
value as Stable<typeof value>
```

타입 단언을 견뎌 내는 브랜드는 없습니다. 타입스크립트로 모델링하는 거의 모든 보장이 마찬가지입니다. 이를 막는 ESLint 플러그인을 제공할 생각은 없습니다. 타입 단언은 명시적인 탈출구로 남겨 두되, 리뷰와 컨벤션으로 주의 깊게 관리해야 합니다. `stable()`도 같은 종류의 약속이므로 컴파일러를 조용히 만들겠다고 여기저기 뿌리지 마세요.

사람들이 함께 꺼내는 또 다른 이야기는 리액트 컴파일러입니다. 수동 메모이제이션을 쓸모없게 만들지 않느냐는 질문입니다. 많은 경우에는 그렇습니다. 하지만 둘은 서로 다른 질문에 답하므로 이 아이디어가 무의미해진다고 생각하지는 않습니다. 컴파일러는 "이 동일성을 자동으로 보존할 수 있는가?"라고 묻습니다. `Stable<T>`은 "다른 컴포넌트가 이 동일성을 최적화 계약으로 사용할 수 있다"라고 말합니다. 하나는 빌드 단계에만 머무는 구현 세부 사항이고, 다른 하나는 호출자가 확인할 수 있는 타입 그래프의 계약입니다.

## 에이전트를 위한 가드레일로서의 타입 오류

이제는 코딩 에이전트가 리액트 코드를 많이 작성합니다. 메모이제이션된 자식 컴포넌트에 인라인 배열을 넘기는 일은 에이전트가 늘 하는 실수입니다. 코드는 읽기에도 괜찮고 실행도 잘되지만, 필요 이상의 작업을 조용히 수행합니다. 눈으로 찾아내기 가장 까다로운 종류의 버그에 가깝습니다. 에이전트는 직접 화면을 렌더링해 보지 않으므로 리렌더링을 볼 수 없지만, 타입 오류에는 분명히 대응할 수 있습니다. 이미 타입 오류를 피드백 루프로 사용하고 있기 때문입니다.

그래서 오류 메시지 자체에 공을 들일 가치가 있습니다. 의존성에 증명이 없을 때 엄격한 훅은 단순히 `never` 타입과 맞지 않는다는 오류를 내는 대신, 해결 방법을 설명하는 문자열 타입으로 바꿉니다.

```ts
useMemo(() => source.filter(rawFilter), [source, rawFilter])
// Type '(item: Item) => boolean' is not assignable to type
// 'This dependency is not Stable<T>: memoize it with useMemo/useCallback,
//  source it from useState, depend on a useRef container rather than its mutable
//  current value, or wrap a module-scope constant with stable().'
```

지침은 진단 메시지에 함께 실리고 캐럿은 문제가 있는 의존성을 정확히 가리킵니다. 사람은 에디터에서 이 메시지를 읽고, 에이전트는 `tsc` 출력에서 읽습니다. 어느 쪽도 "not assignable to never"만 바라보며 타입 시스템이 무엇을 원하는지 추측할 필요가 없습니다. 검사는 "리뷰에서 누군가 발견하기를 바란다"에서 "prop이 안정적일 때까지 빌드가 실패한다"로 바뀝니다. 누구도 읽을 수 없을 만큼 빠르게 코드가 생성될 때도 버티는 유일한 가드레일입니다.

## 더 넓은 아이디어

제가 실제로 관심을 두는 지점은 메모이제이션을 넘어섭니다.

우리는 타입 시스템이 *담을 수 있는* 특성을 정작 타입에는 넣지 않은 채, 주석과 린트 규칙, 팀 내부의 암묵지로 계속 짊어지고 다닙니다. 참조 안정성도 그중 하나지만, 이것만 있는 것은 아닙니다. 증명을 지니게 만들면 컴포넌트가 안정성을 요구하고, 훅이 넘겨주며, 컨텍스트가 하위 트리 전체에서 그대로 유지할 수 있습니다.

런타임 작업은 이미 하고 있었습니다. 이미 `useMemo`를 호출하고 있었습니다. 빠져 있던 것은 그렇게 만들어진 보장이 해당 코드 줄 이후에도 계속 유지되게 하는 일이었습니다.

이를 [`stableref`](https://github.com/JoviDeCroock/stableref)라는 이름으로 패키징하고 있습니다. 지금은 라이브러리라기보다 실험에 가깝습니다. 어디에서 문제가 생기는지 알려 주시면 좋겠습니다.

---

**원저자 소개**

Jovi De Croock은 소프트웨어 엔지니어입니다. 원문과 다른 글은 [Jovi De Croock의 블로그](https://www.jovidecroock.com/)에서 확인할 수 있습니다.
