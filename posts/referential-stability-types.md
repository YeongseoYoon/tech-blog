---
title: "[번역] 참조 안정성을 타입으로 만들기"
date: "2026-09-22T00:00:00.000Z"
tags: ["TypeScript", "React", "translate"]
---

> 이 글은 Jovi De Croock의 [**“Making Referential Stability a Type”**](https://www.jovidecroock.com/blog/referential-stability-types/)을 원저자의 허락을 받아 번역한 글입니다.

어느 정도 규모가 있는 리액트나 Preact 코드베이스에서 작업해 봤다면, 참조 안정성에 관한 이야기를 지겨울 만큼 나눠 봤을 겁니다. 누군가는 `useMemo`를 추가하고, 다른 누군가는 `useCallback`을 추가합니다. exhaustive-deps 경고는 더는 표시되지 않도록 하고, 전달받는 컴포넌트에서도 prop의 참조가 안정적이기를 바랍니다. 코드는 대체로 올바르지만, 이렇게 암묵적으로 기대하는 안정성을 충분히 보장하지는 못합니다.

메모이제이션된 자식 컴포넌트에 새 배열 리터럴을 넘겨 발생한 리렌더링이나 이펙트 실행을 추적하느라, 인정하기 민망할 만큼 많은 시간을 썼습니다. 타입 선언은 `Item[]`였습니다. prop의 타입이 `Item[]`이라는 사실은 데이터의 구조와 그 *안에* 들어가는 값은 알려 줍니다. 하지만 다음 렌더링에서도 같은 배열 참조를 받는지는 알려 주지 않습니다.

그래서 작은 아이디어를 하나 실험하고 있습니다. 참조를 안정적으로 유지하려는 의도를 타입의 일부로 만들면 어떨까요?

## 타입

이 아이디어 전체는 외부에 드러나지 않는 가상의 브랜드 하나에 달려 있습니다.

```ts
declare const stableBrand: unique symbol

type Stable<T> = T extends object ? T & { readonly [stableBrand]: true } : T
```

객체와 배열, 함수에는 브랜드가 붙습니다. 원시값은 그대로 통과합니다. 리액트와 Preact가 이미 원시값을 값으로 비교하기 때문에, `string`은 언제나 "충분히 안정적"입니다.

<aside>

여기서 "안정적"이라는 말은 값이 불변이거나, 컴포넌트가 존재하는 동안 참조가 항상 같다는 뜻이 아닙니다. 관련 없는 렌더링에서는 참조가 유지되고, 상태 업데이트나 메모이제이션 의존성 변경으로 기존 참조가 더는 유효하지 않을 때만 바뀌기를 기대한다는 뜻입니다. 한 번의 렌더링 안에서만 참조가 안정적인 것은 별 의미가 없습니다. 모든 지역 참조가 이미 그 조건을 만족하기 때문입니다. 이는 최적화를 위한 계약이지, 애플리케이션이 올바르게 동작하기 위해 의존해야 하는 보장은 아닙니다. 리액트는 필요에 따라 메모이제이션된 값과 콜백을 버릴 수 있습니다.

</aside>

여기서는 `unique symbol`이 핵심 역할을 합니다. `_stable: true` 같은 문자열 키를 썼다면 우연히 같은 형태를 지닌 객체도 브랜드 조건을 충족하고, 결국 누군가는 `{ _stable: true }`를 *반드시* 작성했을 겁니다. 패키지 밖으로 노출되지 않는 `unique symbol`은 애플리케이션 코드에서 구조적 할당으로 재현할 수 없습니다. `Stable<T>`라는 타입은 참조할 수 있지만, 브랜드가 붙은 값을 직접 위조할 수는 없습니다.

이제 prop은 데이터보다 더 많은 정보를 표현할 수 있습니다.

```ts
type ItemListProps = {
  items: Stable<Item[]>
  onSelect: Stable<(id: string) => void>
  title: string
}
```

배열과 콜백은 참조를 안정적으로 유지하려고 만든 값이므로 브랜드가 붙습니다. 이제 인라인으로 만든 배열은 요구하는 타입에 맞지 않습니다.

```tsx
<ItemList
  items={items.filter(isVisible)}
  onSelect={(id) => select(id)}
  title="Visible items"
/>
```

이렇게 컴포넌트 경계에서 안정성을 요구하면, 호출하는 쪽이 그 조건을 지켜야 합니다. 바로 그쪽에서 책임져야 할 일입니다.

이것은 우리가 `memo()`와 `PureComponent`를 사용할 때 잊곤 하는 나머지 절반이기도 합니다. 컴포넌트를 `memo`로 감싸면 값이 바뀌지 않는 한 리렌더링되지 않을 거라고 생각합니다. 하지만 복합 타입의 값은 참조 안정성이 보장되지 않아, 이 최적화가 무효가 될 수 있습니다.

## 훅은 유지하고 import만 바꾸기

처음에는 모듈 보강으로 안정성을 증명하려고 했습니다. 부수 효과만 실행하도록 패키지를 import하면 리액트의 훅 타입이 보강되고, 모든 의존성이 안정적일 때 `useMemo`의 반환값에 브랜드가 붙는 방식입니다.

절반은 작동합니다. 작동하지 않는 나머지 절반은 짚고 넘어갈 만합니다. 저도 *왜* 그런지 파고들기 전까지는 이상하게 느꼈던 부분이기 때문입니다.

모듈 보강을 사용하면 선언에 오버로드를 *추가*할 수 있습니다. 하지만 `@types/react`가 제공하는 오버로드를 제거하거나 교체할 수는 없습니다. 보강을 마치면 `useMemo`에는 엄격한 `(factory, deps: StableDeps) => Stable<T>` 오버로드와 리액트의 기존 `(factory, deps: DependencyList) => T` 오버로드가 나란히 존재합니다. 타입스크립트는 엄격한 오버로드부터 시도합니다. 모든 의존성의 안정성이 증명되면 `Stable<T>`를 얻습니다. 하지만 하나라도 증명되지 않으면 엄격한 오버로드의 조건을 만족하지 못합니다. 그러면 타입스크립트는 아무 경고 없이 기존 리액트 오버로드를 선택합니다. 이 오버로드는 어떤 `DependencyList`든 받아들입니다.

```ts
const unstable = {}
const value = useMemo(() => ({ answer: 42 }), [unstable])
// 오류 없음. value는 브랜드가 붙지 않은 { answer: number }일 뿐입니다.
```

정작 오류가 나길 바랐던 의존성 목록에서는 아무 오류도 발생하지 않습니다. 그저 안정성 증명이 만들어지지 않을 뿐입니다. 그래서 이 방식과 씨름하는 일을 그만뒀습니다. 엄격한 타입 검사를 적용하는 훅은 별도의 진입점으로 제공합니다.

```ts
import { useCallback, useEffect, useMemo } from 'stableref/react'
```

런타임에 실행되는 것은 실제 리액트 훅이고, 타입 선언만 더 엄격합니다. 의존성 튜플을 추론한 다음, 기대 타입에서 안정성이 증명되지 않은 각 요소를 해결 방법이 담긴 문자열 리터럴로 바꿉니다. 이 진입점에는 리액트의 느슨한 오버로드가 없으므로, 조건을 만족하지 못했을 때 대신 선택할 오버로드도 없습니다. 안정성이 증명되지 않은 참조를 넘기면 해당 의존성을 작성한 위치에서 오류가 발생합니다.

```ts
const stableFilter = useCallback(filter, [query])

useMemo(() => source.filter(stableFilter), [source, stableFilter])
// Stable<Item[]>

useMemo(() => source.filter(rawFilter), [source, rawFilter])
//                                                 ^ type error

useEffect(syncSelection, [selection, page])
//                                   ^ type error when page is an unproven object
```

이 패키지는 모듈 보강 방식을 제공하지 않습니다. 오류 없이 안정성 증명만 사라지면, 안정성을 실제로 강제하고 있다고 착각하기 쉽기 때문입니다. `stableref/react`에서 가져오면 잘못된 의존성 목록을 뒤이어 사용하는 곳이 아니라, 그 목록을 작성한 자리에서 오류가 발생합니다.

## 리액트가 이미 보장하는 안정성을 타입에 담기

안정적인 참조가 모두 `useMemo`에서 나오는 것은 아닙니다. 리액트가 이미 안정성을 보장하는 값도 몇 가지 있습니다. 타입에는 그 사실을 명시하면 됩니다.

```ts
const [state, setState] = useState(initialState)
// state:    Stable<State>
// setState: Stable<Dispatch<SetStateAction<State>>>

const element = useRef<HTMLElement | null>(null)
// element: Stable<RefObject<HTMLElement | null>>
```

`Stable<State>`에는 짧은 설명이 필요합니다. 처음 보면 거짓말처럼 보이기 때문입니다. 상태가 절대 바뀌지 *않는다*는 뜻이 아닙니다. 상태가 바뀌지 않았다면 리액트가 새로운 참조를 만들어 내지 않는다는 뜻입니다. 실제로 상태가 바뀌면 메모이제이션 결과는 무효화되고 이펙트는 다시 실행되어야 합니다. 그것이 상태의 존재 이유입니다. 브랜드가 나타내는 것은 값의 불변성이 아니라 참조의 동일성입니다.

초기화에 사용하는 클로저(closure)도 안정성을 증명할 필요는 없습니다. 의존성 목록에 들어가는 값이 아니기 때문입니다.

```ts
const [state] = useState(() => buildInitialState(props))
const [reduced] = useReducer(reducer, props, createInitialState)
```

리액트는 초기값을 만들 때만 이 클로저들을 호출합니다. 이 계약에 따라 브랜드가 붙는 것은 결과로 나온 상태와 디스패처입니다. 초기화 클로저 자체의 참조가 안정적인지는 중요하지 않으므로, 그 안정성을 증명하도록 요구하지 않습니다.

생성 방식상 참조 안정성이 보장되는 모듈 스코프 값에는 아주 작은 항등 헬퍼를 사용할 수 있습니다.

```ts
export const EMPTY_ITEMS = stable([] as Item[])
```

런타임에서 `stable()`은 값을 바꾸지 않고 그대로 반환합니다. `x => x`인 셈입니다. 유용한 것은 함수가 아니라 안정성 증명입니다. 실제로 참조가 안정적으로 유지되는 모듈 스코프에서 사용하세요.

## 컨텍스트에서는 효과가 빠르게 드러납니다

인라인 컨텍스트 값은 하위 트리 전체에 불필요한 작업을 조용히 일으키는 가장 쉬운 방법 가운데 하나입니다.

```tsx
<ThemeContext.Provider value={{ theme, setTheme }}>
  {children}
</ThemeContext.Provider>
```

`createStableContext`는 프로바이더가 이 안정성 조건을 지키도록 합니다. 프레임워크에 특화된 기능이므로 패키지 루트가 아니라 리액트 진입점에서 가져옵니다.

```ts
import { createStableContext } from 'stableref/react'

const ThemeContext = createStableContext<ThemeValue | null>(null)
```

이제 프로바이더는 `Stable<ThemeValue>`만 받습니다. 값을 관리하는 쪽이 메모이제이션도 책임집니다. 트리 깊숙이 있는 컨슈머는 그 값이 어떻게 만들어졌는지 알 필요가 없습니다. 계약만 전달받으면 됩니다. 제가 타입으로 만들고 싶은 경계가 바로 이것입니다. 구현에 관한 지식은 그 구현을 책임지는 쪽에 남습니다.

## Preact

같은 아이디어를 별도의 진입점으로 제공합니다. 당연히 Preact를 빼놓을 생각은 없었습니다.

```ts
import { useEffect, useMemo, type Stable } from 'stableref/preact'
```

이 훅들은 기존 `preact/hooks`의 훅 참조를 그대로 유지하면서, 같은 엄격한 의존성 시그니처를 적용합니다. 안정성 증명은 값에 관한 계약입니다. 어떤 렌더링 라이브러리를 골랐는지는 애초에 중요하지 않았습니다.

## 이 방식으로 해결할 수 없는 것

우회할 작정인 개발자라면 언제든 다음처럼 작성할 수 있습니다.

```ts
value as Stable<typeof value>
```

어떤 브랜드도 타입 단언을 막을 수는 없습니다. 타입스크립트로 표현하는 거의 모든 보장이 마찬가지입니다. 이를 위한 ESLint 플러그인은 제공하지 않습니다. 타입 단언은 명시적인 탈출구로 남아 있으므로, 리뷰와 컨벤션으로 주의 깊게 관리해야 합니다. `stable()`도 같은 종류의 약속이므로, 컴파일러 오류를 없애려고 여기저기 사용하지 마세요.

사람들이 함께 꺼내는 또 다른 이야기는 리액트 컴파일러입니다. 수동 메모이제이션이 필요 없어지는 것 아니냐는 질문입니다. 많은 경우에는 그렇습니다. 하지만 둘은 서로 다른 질문에 답하므로 이 아이디어가 무의미해진다고 생각하지는 않습니다. 컴파일러는 "이 참조의 동일성을 자동으로 유지할 수 있는가?"라고 묻습니다. `Stable<T>`는 "다른 컴포넌트가 이 참조의 동일성을 최적화 계약으로 사용할 수 있다"라고 말합니다. 하나는 빌드 단계의 구현 세부 사항이고, 다른 하나는 호출자가 확인할 수 있는 타입 그래프의 계약입니다.

## 에이전트를 위한 가드레일로서의 타입 오류

이제는 코딩 에이전트가 리액트 코드를 많이 작성합니다. 메모이제이션된 자식 컴포넌트에 인라인 배열을 넘기는 일은 에이전트가 늘 하는 실수입니다. 코드는 읽기에도 괜찮고 실행도 잘되지만, 필요 이상의 작업을 조용히 수행합니다. 눈으로 찾아내기 가장 까다로운 종류의 버그에 가깝습니다. 에이전트가 직접 렌더링해 보지 않은 코드의 리렌더링을 알아차릴 수는 없습니다. 하지만 타입 오류에는 분명히 대응할 수 있습니다. 이미 그런 피드백을 받아 수정하는 방식으로 동작하기 때문입니다.

그래서 오류 메시지 자체에 공을 들일 가치가 있습니다. 의존성의 안정성이 증명되지 않으면, 엄격한 훅은 단순히 `never` 타입과 맞지 않는다는 오류를 내지 않습니다. 대신 해당 의존성의 기대 타입을 해결 방법이 담긴 문자열 타입으로 바꿉니다.

```ts
useMemo(() => source.filter(rawFilter), [source, rawFilter])
// Type '(item: Item) => boolean' is not assignable to type
// 'This dependency is not Stable<T>: memoize it with useMemo/useCallback,
//  source it from useState, depend on a useRef container rather than its mutable
//  current value, or wrap a module-scope constant with stable().'
```

진단 메시지에는 해결 방법이 함께 표시되고, 오류 위치를 나타내는 캐럿은 문제가 있는 의존성을 정확히 가리킵니다. 사람은 에디터에서 이 메시지를 읽고, 에이전트는 `tsc` 출력에서 읽습니다. 어느 쪽도 "not assignable to never"만 바라보며 타입 시스템이 무엇을 원하는지 추측할 필요가 없습니다. "리뷰에서 누군가 발견하기를 바라는" 대신, "prop이 안정적일 때까지 빌드가 실패하도록" 검사하는 것입니다. 사람이 읽는 속도보다 빠르게 코드가 생성될 때도 버티는 유일한 가드레일입니다.

## 더 넓은 아이디어

제가 실제로 관심을 두는 지점은 메모이제이션을 넘어섭니다.

우리는 타입 시스템이 *담을 수 있는* 특성을 정작 타입에는 넣지 않고, 주석과 린트 규칙, 팀 내부의 암묵지로 계속 관리합니다. 참조 안정성도 그중 하나지만, 이것만 있는 것은 아닙니다. 값에 안정성 증명을 담으면 컴포넌트는 그 증명을 요구하고, 훅은 증명된 값을 반환하며, 컨텍스트는 하위 트리 전체로 그 증명을 그대로 전달할 수 있습니다.

런타임에서 필요한 작업은 이미 하고 있었습니다. 이미 `useMemo`를 호출하고 있었습니다. 빠져 있던 것은 값을 만드는 지점에서 얻은 안정성의 보장을, 그 값을 사용하는 곳까지 이어 주는 일이었습니다.

이를 [`stableref`](https://github.com/JoviDeCroock/stableref)라는 이름으로 패키징하고 있습니다. 지금은 라이브러리라기보다 실험에 가깝습니다. 어디에서 문제가 생기는지 알려 주시면 좋겠습니다.

---

**원저자 소개**

Jovi De Croock은 소프트웨어 엔지니어입니다. 원문과 다른 글은 [Jovi De Croock의 블로그](https://www.jovidecroock.com/)에서 확인할 수 있습니다.
