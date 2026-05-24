---
title: "SVG 시리즈 ③ - 최적화와 아이콘 시스템"
date: "2026-05-24T09:54:35.000Z"
summary: "드디어 실무 편"
tags: ["SVG"]
---

시리즈 1편에서 좌표계를 보고, 2편에서 `<path>`를 뜯어봤습니다.
이제 남은 건 진짜 실무 얘기입니다.

디자이너가 넘겨준 SVG를 그대로 붙이면 잘 보이긴 합니다.
문제는 보통 그다음부터 시작됩니다.

- 파일이 필요 이상으로 무겁고
- 색을 바꾸기 어렵고
- 아이콘을 20개, 50개 늘리기 시작하면 관리가 금방 꼬입니다

이번 글은 그걸 정리하려고 썼습니다.
주제는 두 가지입니다.

1. SVG를 어디까지 깎아야 하는지
2. 아이콘을 어떻게 컴포넌트로 묶어서 오래 버티게 만들지

---

## 피그마에서 뽑은 SVG가 길어지는 이유

처음 export한 SVG를 열어보면 대충 이런 느낌입니다.

```xml
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g clip-path="url(#clip0_120_99)">
    <path d="M3.99998 5.00012C3.99998 4.44784 4.4477 4.00012 4.99998 4.00012H19C19.5523 4.00012 20 4.44784 20 5.00012V18.9999C20 19.5522 19.5523 19.9999 19 19.9999H4.99998C4.4477 19.9999 3.99998 19.5522 3.99998 18.9999V5.00012Z" fill="#1E1E1E"/>
    <path d="M7.49998 8.50012H16.5" stroke="#FFFFFF" stroke-width="1.50003" stroke-linecap="round"/>
  </g>
  <defs>
    <clipPath id="clip0_120_99">
      <rect width="24" height="24" fill="white"/>
    </clipPath>
  </defs>
</svg>
```

보이는 건 사각형 + 선 하나인데, 실제 텍스트는 길죠.
디자인 툴이 안전하게 내보내는 방식이라 그렇습니다.
실무에서는 그대로 쓰기보다, 필요한 것만 남기는 편이 낫습니다.

---

## 1) `viewBox` 중심으로 정리하기

아이콘 시스템에서는 보통 `width`, `height`를 고정값으로 박아두지 않습니다.
`viewBox`만 남겨두고, 실제 크기는 CSS나 컴포넌트 props로 받는 쪽이 유연합니다.

```xml
<!-- before -->
<svg width="24" height="24" viewBox="0 0 24 24">
  ...
</svg>

<!-- after -->
<svg viewBox="0 0 24 24">
  ...
</svg>
```

이렇게 해두면 같은 아이콘을 16, 20, 24, 32 어디든 재사용할 수 있습니다.

```html svg-interactive
<div style="display: flex; gap: 16px; align-items: center;">
  <svg viewBox="0 0 24 24" width="16" height="16">
    <path d="M4 6h16v12H4z" fill="#6c5ce7" />
  </svg>

  <svg viewBox="0 0 24 24" width="24" height="24">
    <path d="M4 6h16v12H4z" fill="#6c5ce7" />
  </svg>

  <svg viewBox="0 0 24 24" width="32" height="32">
    <path d="M4 6h16v12H4z" fill="#6c5ce7" />
  </svg>
</div>
```
숫자만 바꿔가며 감 잡기 좋게 playground도 하나 남겨둡니다.

```html svg-playground
<div style="display: flex; gap: 16px; align-items: center;">
  <!-- width/height 숫자를 바꿔보세요 -->
  <svg viewBox="0 0 24 24" width="16" height="16">
    <path d="M4 6h16v12H4z" fill="#6c5ce7" />
  </svg>

  <svg viewBox="0 0 24 24" width="24" height="24">
    <path d="M4 6h16v12H4z" fill="#6c5ce7" />
  </svg>

  <svg viewBox="0 0 24 24" width="32" height="32">
    <path d="M4 6h16v12H4z" fill="#6c5ce7" />
  </svg>
</div>
```

---

## 2) `fill="#000"` 대신 `currentColor`

아이콘을 버튼, 배지, 텍스트 옆에 붙이다 보면 색 요구사항이 계속 바뀝니다.
그때 SVG 내부 색이 고정돼 있으면 매번 파일을 열어 고쳐야 합니다.

그래서 아이콘용 SVG는 보통 `currentColor`로 맞춥니다.

```xml
<svg viewBox="0 0 24 24">
  <path d="M4 6h16v12H4z" fill="currentColor" />
</svg>
```

부모의 `color`만 바꾸면 같이 바뀝니다.

```html svg-interactive
<div style="display: flex; gap: 12px; font-size: 20px;">
  <span style="color: #6c5ce7;">
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path d="M4 6h16v12H4z" fill="currentColor" />
    </svg>
  </span>

  <span style="color: #00b894;">
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path d="M4 6h16v12H4z" fill="currentColor" />
    </svg>
  </span>

  <span style="color: #e17055;">
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path d="M4 6h16v12H4z" fill="currentColor" />
    </svg>
  </span>
</div>
```
아래 playground에서 `color` 값만 바꿔보면 바로 감이 옵니다.
```html svg-playground
<div style="display: flex; gap: 16px; align-items: center;">
  <!-- color 값을 바꿔보면 아이콘 색도 같이 바뀝니다 -->
  <span style="color: #2d3436;">
    <svg viewBox="0 0 24 24" width="28" height="28">
      <path d="M4 6h16v12H4z" fill="currentColor" />
    </svg>
  </span>

  <span style="color: #6c5ce7;">
    <svg viewBox="0 0 24 24" width="28" height="28">
      <path d="M4 6h16v12H4z" fill="currentColor" />
    </svg>
  </span>

  <span style="color: #e17055;">
    <svg viewBox="0 0 24 24" width="28" height="28">
      <path d="M4 6h16v12H4z" fill="currentColor" />
    </svg>
  </span>
</div>
```

---

## 3) 선 아이콘은 `vector-effect`를 한 번 봐두자

선(stroke) 중심 아이콘을 키우거나 줄일 때 두께가 함께 스케일돼서 어색해질 때가 있습니다.
이럴 때 `vector-effect="non-scaling-stroke"`를 주면 선 두께를 고정할 수 있습니다.

```html svg-interactive
<svg width="320" height="120" viewBox="0 0 320 120">
  <!-- 기본: 크기 키우면 stroke도 같이 두꺼워짐 -->
  <g transform="translate(20, 20) scale(3)">
    <circle cx="10" cy="10" r="8" fill="none" stroke="#6c5ce7" stroke-width="2" />
  </g>
  <text x="20" y="105" font-size="12" fill="#636e72">기본 stroke</text>

  <!-- non-scaling-stroke: 확대해도 stroke 폭 유지 -->
  <g transform="translate(180, 20) scale(3)">
    <circle
      cx="10"
      cy="10"
      r="8"
      fill="none"
      stroke="#00b894"
      stroke-width="2"
      vector-effect="non-scaling-stroke"
    />
  </g>
  <text x="170" y="105" font-size="12" fill="#636e72">non-scaling-stroke</text>
</svg>
```
`scale()` 숫자를 바꿔보면서 두 원의 stroke 차이를 비교해보세요.
```html svg-playground
<svg width="360" height="140" viewBox="0 0 360 140">
  <!-- scale 값을 1, 2, 3, 4로 바꿔보세요 -->
  <g transform="translate(30, 20) scale(3)">
    <circle cx="12" cy="12" r="10" fill="none" stroke="#6c5ce7" stroke-width="2" />
  </g>
  <text x="20" y="128" font-size="12" fill="#636e72">기본 stroke</text>

  <g transform="translate(210, 20) scale(3)">
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="none"
      stroke="#00b894"
      stroke-width="2"
      vector-effect="non-scaling-stroke"
    />
  </g>
  <text x="190" y="128" font-size="12" fill="#636e72">non-scaling-stroke</text>
</svg>
```

로고처럼 비율 유지가 중요하면 기본 동작을 쓰고,
UI 아이콘처럼 두께 일관성이 중요하면 `non-scaling-stroke`가 더 깔끔합니다.

---

## 4) 숫자 정밀도 줄이기: 용량 깎을 때 가장 체감되는 구간

디자인 툴 export 결과를 보면 좌표 소수점이 길게 붙는 경우가 많습니다.

```xml
<path d="M3.99998 5.00012C3.99998 4.44784 4.4477 4.00012 4.99998 4.00012..." />
```

아이콘 크기(보통 16~32px)에서는 소수점 2~3자리만 남겨도 시각 차이가 거의 없습니다.

```xml
<path d="M4 5C4 4.45 4.45 4 5 4..." />
```

이 작업은 수동으로 하기보다는 SVGO 같은 도구로 처리하는 게 안전합니다.

```json
{
  "multipass": true,
  "plugins": [
    { "name": "removeDimensions" },
    { "name": "cleanupNumericValues", "params": { "floatPrecision": 2 } },
    { "name": "convertPathData", "params": { "floatPrecision": 2 } },
    { "name": "removeAttrs", "params": { "attrs": "(data-name|id)" } }
  ]
}
```

단, 정밀한 일러스트나 복잡한 곡선은 `floatPrecision`을 너무 낮추면 모양이 깨질 수 있습니다.
아이콘이면 2~3, 일러스트면 3~4부터 시작해서 눈으로 비교하는 게 제일 안전합니다.

---

## 5) 파일 1개씩 import하지 말고, `symbol` 스프라이트로 묶기

아이콘이 늘어나면 파일도 같이 늘어납니다.
개발 중엔 괜찮아도, 페이지가 커질수록 관리 포인트가 많아집니다.

한 번에 묶는 방법이 `<symbol>` + `<use>` 방식입니다.

```html svg-interactive
<svg style="display: none;">
  <symbol id="icon-mail" viewBox="0 0 24 24">
    <path d="M3 6h18v12H3z" fill="none" stroke="currentColor" stroke-width="2" />
    <path d="M3 7l9 7 9-7" fill="none" stroke="currentColor" stroke-width="2" />
  </symbol>

  <symbol id="icon-check" viewBox="0 0 24 24">
    <path
      d="M5 13l4 4L19 7"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </symbol>
</svg>

<div style="display: flex; gap: 16px; color: #2d3436;">
  <svg width="24" height="24"><use href="#icon-mail" /></svg>
  <svg width="24" height="24" style="color: #00b894;"><use href="#icon-check" /></svg>
  <svg width="32" height="32" style="color: #6c5ce7;"><use href="#icon-check" /></svg>
</div>
```
`href`만 바꿔서 같은 심볼 세트를 재사용하는 느낌을 확인해보면 됩니다.
```html svg-playground
<svg style="display: none;">
  <symbol id="icon-mail" viewBox="0 0 24 24">
    <path d="M3 6h18v12H3z" fill="none" stroke="currentColor" stroke-width="2" />
    <path d="M3 7l9 7 9-7" fill="none" stroke="currentColor" stroke-width="2" />
  </symbol>
  <symbol id="icon-check" viewBox="0 0 24 24">
    <path
      d="M5 13l4 4L19 7"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </symbol>
</svg>

<div style="display: flex; gap: 16px; color: #2d3436; align-items: center;">
  <!-- href를 #icon-mail / #icon-check로 바꿔보세요 -->
  <svg width="24" height="24"><use href="#icon-mail" /></svg>

  <!-- size를 키우거나 color를 바꿔보세요 -->
  <svg width="32" height="32" style="color: #00b894;"><use href="#icon-check" /></svg>
  <svg width="40" height="40" style="color: #6c5ce7;"><use href="#icon-check" /></svg>
</div>
```

원본 경로는 `<symbol>`에 한 번만 두고, 화면에서는 `<use>`로 찍어내는 방식입니다.
반복 사용 아이콘이 많을수록 체감이 있습니다.

---

## 6) React에서 쓰는 최소 아이콘 컴포넌트 패턴

저는 보통 아이콘 컴포넌트를 이렇게 둡니다.

```tsx
type IconName = "mail" | "check";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
  title?: string;
}

const paths: Record<IconName, React.ReactNode> = {
  mail: (
    <>
      <path d="M3 6h18v12H3z" fill="none" stroke="currentColor" strokeWidth={2} />
      <path d="M3 7l9 7 9-7" fill="none" stroke="currentColor" strokeWidth={2} />
    </>
  ),
  check: (
    <path
      d="M5 13l4 4L19 7"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

export function Icon({ name, size = 24, title, ...rest }: IconProps) {
  const isDecorative = !title;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden={isDecorative}
      role={isDecorative ? undefined : "img"}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {paths[name]}
    </svg>
  );
}
```

포인트는 세 가지입니다.

- 색은 `currentColor`로 통일
- 크기는 `size` prop 하나로 통일
- 접근성은 `title` 유무 기준으로 분기

아이콘 팀 규칙을 이 컴포넌트 하나로 잡아두면, 뒤에서 스타일 싸움이 많이 줄어듭니다.

---

## 7) 아이콘 접근성에서 자주 빠지는 두 가지

1. 장식용 아이콘이면 `aria-hidden="true"`  
   텍스트가 이미 의미를 전달하고 있으면, 스크린 리더가 아이콘까지 읽을 필요가 없습니다.

2. 의미가 있는 아이콘이면 대체 텍스트 제공  
   `title` 또는 `aria-label`로 의미를 줘야 합니다.

예를 들어 삭제 버튼에서 휴지통 아이콘만 단독으로 보인다면, 이건 장식이 아니라 정보입니다.
그때는 레이블을 반드시 넣어야 합니다.

---

## 정리

SVG 아이콘은 결국 이 순서로 정리됩니다.

1. export된 SVG에서 불필요한 속성 정리
2. 색은 `currentColor`, 크기는 `viewBox + size`
3. 필요하면 SVGO로 숫자 정밀도/메타데이터 최적화
4. 프로젝트 규모가 커지면 스프라이트나 아이콘 컴포넌트로 시스템화

좌표계와 path를 이해하고 나면, 이제부터는 반복 작업을 줄이는 단계입니다.
같은 아이콘을 여러 화면에 올려도 유지보수 피로가 확 줄어듭니다.

다음 편에서는 `clipPath`, `mask`, `filter` 같이 자주 겁먹는 기능을 실제 UI 예제로 다뤄보겠습니다.

### ✏️ 출처

https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/SVG_and_CSS <br/>
https://developer.mozilla.org/en-US/docs/Web/SVG/Element/symbol <br/>
https://developer.mozilla.org/en-US/docs/Web/SVG/Element/use <br/>
https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/vector-effect <br/>
https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox <br/>
https://github.com/svg/svgo <br/>
