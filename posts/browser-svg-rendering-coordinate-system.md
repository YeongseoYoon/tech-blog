---
title: "SVG 시리즈 ① - 브라우저는 SVG를 어떻게 이해하는가"
date: "2026-03-28T13:23:17.982Z"
summary: "모르게떠염"
tags: ["SVG"]
---

회사에서 에디터 위에 SVG를 직접 다루는 작업을 맡게 됐습니다.

> 단순히 아이콘을 `<img>`로 넣는 수준이 아니라, 캔버스 위에서 SVG 요소 하나하나를 동적으로 그리고, 이동시키고, 변형해야 하는 작업이었습니다. 문제는 `<rect>` 하나가 어떤 좌표계 위에서 어떤 과정을 거쳐 화면에 찍히는지를 전혀 모르는 상태에서 시작했다는 겁니다. viewBox가 뭘 하는 건지, transform이 요소를 움직이는 건지 좌표계를 움직이는 건지, 마우스 좌표를 SVG 내부 좌표로 어떻게 바꿔야 하는지— 하나를 해결하면 모르는 게 세 개가 튀어나왔습니다. 구조를 이해하지 못한 채 코드를 쓰니까 매번 감으로 찍고 되면 넘어가는 식이었고, 그게 한계에 부딪혔습니다.

그래서 공부해봤습니다.

## 🤔 그래서 SVG가 뭔데요

프론트엔드 개발을 하다 보면 SVG를 안 마주칠 수가 없습니다. 아이콘, 로고, 어디에나 SVG가 있습니다. 그런데 정작 SVG 파일을 열어보면 이런 모습입니다.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M3 12l9-9 9 9M5 10v10h14V10" />
</svg>
```

PNG나 JPEG는 열어봐야 깨진 문자열뿐인데, SVG는 사람이 읽을 수 있는 텍스트입니다. 이게 SVG의 첫 번째 특징입니다.

**SVG는 이미지가 아닙니다. 정확히 말하면, 이미지를 "설명하는 문서"입니다.**

PNG 파일은 "좌표 (0, 0)의 픽셀은 `#FF3A2D`, 좌표 (0, 1)의 픽셀은 `#FFFFFF`…" 이런 식으로 모든 픽셀의 색상값을 낱개로 기록합니다. 반면 SVG는 "여기서 저기까지 선을 긋고, 이 영역을 빨간색으로 채워라"라는 **지시 사항**을 담고 있습니다. 둘 다 색상 정보를 가지고 있지만, PNG는 **점 하나하나에** 색을 매핑하고, SVG는 **도형 단위로** 색을 지정합니다. 브라우저가 이 지시 사항을 읽고 화면에 그림을 그립니다.

이 차이가 왜 중요하냐면, SVG를 아무리 확대해도 깨지지 않는 이유가 바로 여기에 있기 때문입니다. "점 A에서 점 B까지 선을 그어라"라는 명령은 화면이 100px이든 10000px이든 똑같이 유효합니다. 반면 PNG의 100×100 픽셀 데이터를 1000×1000으로 늘리면 당연히 뭉개집니다.

그런데 여기서 한 가지 짚고 넘어갈 게 있습니다. 우리가 보는 모니터는 결국 픽셀로 이루어져 있습니다. 아무리 SVG가 수학적 명령이라고 해도, 최종적으로는 픽셀로 변환되어야 화면에 표시됩니다. 이 변환 과정을 **래스터화(rasterization)** 라고 합니다. PNG는 이미 래스터화가 끝난 결과물이고, SVG는 브라우저가 매번 래스터화를 수행하는 것입니다. 확대하면 더 큰 해상도로 다시 래스터화하면 되니까 깨지지 않는 겁니다.

## ✏️ 기본 도형을 그려보자

이론만으로는 와닿지 않으니, 직접 SVG를 그려보겠습니다. HTML 파일 하나 만들어서 아래 코드를 넣으면 바로 확인할 수 있습니다.

### SVG 좌표계의 기본

SVG 캔버스는 왼쪽 위가 `(0, 0)`이고, **x축은 오른쪽으로**, **y축은 아래쪽으로** 증가합니다. 수학 시간에 배운 좌표계와 y축 방향이 반대라는 점만 기억하면 됩니다.

![SVG 좌표계](/static/images/01-coordinate-system.svg)

```html svg-interactive
<svg width="200" height="200">
  <!--
    width, height: 이 SVG가 화면에서 차지하는 실제 크기(px)
    좌표 (0,0)은 왼쪽 위 모서리
  -->
  <rect x="30" y="40" width="80" height="60" fill="#6c5ce7" />
  <circle cx="150" cy="130" r="35" fill="#fd79a8" />
</svg>
```

`<rect>`는 `x`, `y`로 왼쪽 위 꼭짓점을, `width`와 `height`로 크기를 지정합니다. `<circle>`은 `cx`, `cy`로 중심을, `r`로 반지름을 지정합니다. `fill`은 CSS의 `background-color`에 대응하는 속성입니다.

### 말풍선 아이콘을 그려보자

말풍선 아이콘을 기본 도형만으로 그려보겠습니다.

```html svg-interactive
<svg width="200" height="200">
  <!-- 1. 말풍선 몸체: 둥근 사각형 -->
  <rect x="30" y="30" width="140" height="100" rx="16" fill="#6c5ce7" />

  <!-- 2. 말풍선 꼬리: 삼각형 -->
  <polygon points="50,130 80,130 55,160" fill="#6c5ce7" />

  <!-- 3. 텍스트 줄을 표현하는 가로선들 -->
  <line
    x1="55"
    y1="65"
    x2="145"
    y2="65"
    stroke="white"
    stroke-width="3"
    stroke-linecap="round"
  />
  <line
    x1="55"
    y1="85"
    x2="125"
    y2="85"
    stroke="white"
    stroke-width="3"
    stroke-linecap="round"
  />
  <line
    x1="55"
    y1="105"
    x2="105"
    y2="105"
    stroke="white"
    stroke-width="3"
    stroke-linecap="round"
  />
</svg>
```

`rx="16"`은 사각형 모서리를 둥글게 만드는 속성입니다. `<line>`은 `x1`, `y1`(시작점)과 `x2`, `y2`(끝점)으로 직선을 긋고, `stroke-linecap="round"`로 양 끝을 둥글게 처리했습니다. `<polygon>`은 세 점을 이으면 삼각형이 됩니다.

SVG의 모든 복잡한 이미지는 결국 이런 기본 도형의 조합입니다.

---

## 🏠 SVG는 HTML의 친척이다

SVG 파일을 자세히 보면 HTML과 상당히 닮아 있습니다. 태그가 있고, 속성이 있고, 중첩 구조가 있습니다. 실제로 SVG는 **XML 기반 마크업 언어**입니다.

하지만 이 둘은 생김새는 비슷해도 성격이 꽤 다릅니다.

가장 근본적인 차이는 **네임스페이스(namespace)** 입니다. HTML 요소는 `http://www.w3.org/1999/xhtml`이라는 네임스페이스에, SVG 요소는 `http://www.w3.org/2000/svg`라는 네임스페이스에 속합니다. 자바스크립트로 SVG 요소를 동적으로 만들 때 더더욱 체감됩니다.

```jsx
// HTML 요소 만들기 — 잘 됩니다
const div = document.createElement("div");

// SVG 요소 만들기 — 이렇게 하면 안 됩니다!
const rect = document.createElement("rect"); // HTMLUnknownElement이 만들어짐

// SVG 요소는 반드시 이렇게 만들어야 합니다
const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
```

`createElement`로 만든 `rect`는 브라우저 입장에서 신원불명의 HTML 요소일 뿐입니다.

### DOM에서의 차이

|              | HTML                           | SVG                               |
| ------------ | ------------------------------ | --------------------------------- |
| 요소 생성    | `createElement('div')`         | `createElementNS(svgNS, 'rect')`  |
| 크기 측정    | `offsetWidth`, `offsetHeight`  | `getBBox()`, `getTotalLength()`   |
| tagName 반환 | 항상 대문자 (`"DIV"`)          | 원본 대소문자 유지 (`"clipPath"`) |
| 네임스페이스 | `http://www.w3.org/1999/xhtml` | `http://www.w3.org/2000/svg`      |

HTML에서 당연하게 쓰던 `offsetWidth` 같은 속성이 SVG 요소에는 없습니다. 대신 `getBBox()`로 바운딩 박스를, `getTotalLength()`로 path의 전체 길이를 구합니다. 또한 `tagName`이 HTML은 항상 대문자인데 SVG는 원본 케이스를 유지해서, `document.querySelector('RECT')`로는 SVG 요소를 찾을 수 없습니다.

---

## ⚙️ 브라우저의 SVG 렌더링 파이프라인

브라우저가 SVG 코드를 받아서 실제로 화면에 그리기까지의 과정입니다.

**① 파싱** : HTML 파서가 `<svg>` 태그를 만나면 SVG 파싱 모드로 전환하고, SVG DOM 트리를 만듭니다. HTML DOM과 한 문서 안에 공존하게 됩니다.

**② 스타일 계산** : SVG에는 `fill`, `stroke` 같은 **프레젠테이션 속성** 이라는 독특한 개념이 있습니다. 태그에 직접 쓸 수도 있고(`<rect fill="red">`), CSS로 지정할 수도 있습니다. 중요한 점은, 태그에 직접 쓴 프레젠테이션 속성은 CSS 명시도에서 일반 스타일보다 **낮게** 취급된다는 것입니다.

```css
/* CSS에서 fill을 지정하면 태그의 fill 속성을 덮어씁니다 */
rect {
  fill: blue;
}
```

```html
<!-- 이 rect는 red가 아니라 blue로 칠해집니다 -->
<rect fill="red" width="100" height="100" />
```

**③ 렌더 트리 구성 → ④ 레이아웃 → ⑤~⑧ 페인팅과 합성** : SVG는 **페인터 모델(Painter's Model)** 을 따릅니다. 문서에 나오는 순서대로 위에 덧칠합니다. HTML의 `z-index` 없이, 소스 순서가 곧 쌓임 순서입니다.

**⑨ 래스터화** : 벡터 그래픽이 최종적으로 픽셀로 변환됩니다.

### 성능 이야기

SVG 애니메이션을 할 때, **무엇을 변경하느냐** 에 따라 성능 비용이 크게 달라집니다.

| 변경 대상                      | 비용        | 이유                                |
| ------------------------------ | ----------- | ----------------------------------- |
| `opacity`, CSS `transform`     | 가장 가벼움 | GPU가 합성만 다시 하면 됨           |
| `fill`, `stroke` 색상          | 중간        | 리페인트 필요                       |
| `<path>`의 `d` 속성, 도형 좌표 | 가장 비쌈   | 레이아웃부터 래스터화까지 전부 다시 |

에디터처럼 SVG 요소를 실시간으로 조작해야 하는 경우, 드래그 중에는 CSS `transform`으로 이동시키고 드롭 시에만 실제 좌표를 업데이트하는 패턴이 성능상 유리합니다.

---

## 📐 쇼박스...그리고...viewBox

SVG에서 가장 혼란스러우면서도 가장 강력한 개념, **좌표계** 입니다.

### 뷰포트는 또 뭐야

```html
<svg width="200" height="200">
  <rect x="20" y="20" width="60" height="60" fill="#6c5ce7" />
</svg>
```

`width="200"` `height="200"`은 이 SVG가 HTML 페이지에서 차지하는 실제 영역인 **뷰포트(viewport)** 입니다. viewBox를 지정하지 않으면 뷰포트 좌표계와 내부 좌표계가 1:1로 일치합니다. `width="60"`은 곧 60px입니다.

### viewBox가 등장하면 모든 게 달라진다

![viewBox 비교](/static/images/02-viewbox-comparison.svg)

위 이미지의 세 패널은 동일한 도형(`rect 60×60`, `circle r=30`)을 서로 다른 viewBox 설정으로 본 결과입니다.

**패널 1 — viewBox 없음** : 뷰포트와 좌표계가 1:1이므로 도형이 원래 크기 그대로 보입니다.

```html svg-interactive
<svg width="200" height="200">
  <rect x="20" y="20" width="60" height="60" fill="#6c5ce7" />
  <circle cx="140" cy="100" r="30" fill="#fd79a8" />
</svg>
```

**패널 2 — `viewBox="0 0 100 100"`** : 200px 뷰포트 안에 100×100 좌표 공간을 넣었으니, 모든 게 2배로 확대됩니다.

```html svg-interactive
<svg width="200" height="200" viewBox="0 0 100 100">
  <rect x="20" y="20" width="60" height="60" fill="#6c5ce7" />
  <circle cx="70" cy="50" r="30" fill="#fd79a8" />
</svg>
```

**패널 3 — `viewBox="50 50 100 100"`** : "좌표 (50, 50)부터 보기 시작해"라는 뜻입니다. 카메라를 오른쪽 아래로 팬(pan)한 것과 같아서, 왼쪽 위에 있던 사각형이 화면 밖으로 밀려나고 원의 일부만 보입니다.

```html svg-interactive
<svg width="200" height="200" viewBox="50 50 100 100">
  <rect x="20" y="20" width="60" height="60" fill="#6c5ce7" />
  <circle cx="140" cy="100" r="30" fill="#fd79a8" />
</svg>
```

viewBox의 네 숫자는 `min-x`, `min-y`, `width`, `height`입니다. 앞 두 개(min-x, min-y)가 **카메라 위치**, 뒤 두 개(width, height)가 **카메라가 담는 범위** 라고 생각하면 됩니다. 뷰포트(`width`/`height` 속성)는 그 카메라 화면의 물리적 크기입니다.

### viewBox로 원점을 중앙으로 옮겨보자

viewBox의 min-x, min-y를 음수로 설정하면 **원점이 캔버스 중앙** 으로 옮겨집니다. 이걸 활용해서 에디터에서 쓸 법한 타겟 마크를 그려보겠습니다.

```html svg-interactive
<svg width="200" height="200" viewBox="-100 -100 200 200">
  <!--
    viewBox="-100 -100 200 200"
    → 원점(0,0)이 캔버스 정중앙에 위치
    → 동심원과 십자선을 대칭 좌표로 깔끔하게 그릴 수 있음
  -->

  <!-- 동심원 3개: 중심이 전부 (0, 0) -->
  <circle cx="0" cy="0" r="80" fill="none" stroke="#2d3436" stroke-width="2" />
  <circle cx="0" cy="0" r="50" fill="none" stroke="#2d3436" stroke-width="2" />
  <circle
    cx="0"
    cy="0"
    r="20"
    fill="#fd79a8"
    fill-opacity="0.6"
    stroke="#fd79a8"
    stroke-width="2"
  />

  <!-- 십자선: -90 ~ +90으로 대칭 -->
  <line x1="-90" y1="0" x2="90" y2="0" stroke="#6c5ce7" stroke-width="1" />
  <line x1="0" y1="-90" x2="0" y2="90" stroke="#6c5ce7" stroke-width="1" />

  <!-- 중심점 -->
  <circle cx="0" cy="0" r="3" fill="#6c5ce7" />
</svg>
```

원점이 중앙이니까 동심원은 전부 `cx="0" cy="0"`, 십자선은 `-90`에서 `90`으로 대칭입니다. 만약 원점이 좌상단이었다면 모든 좌표에 100을 더해야 합니다.

### 반응형 SVG

`width`와 `height`를 제거하고 `viewBox`만 남기면, SVG는 부모 컨테이너의 너비에 맞춰 자동으로 스케일됩니다.

```html
<!-- ❌ 고정 크기: 항상 400×300, 컨테이너가 커져도 작아져도 변하지 않음 -->
<svg width="400" height="300">
  <circle cx="200" cy="150" r="100" fill="#6c5ce7" />
</svg>
```

```html
<!-- ✅ 반응형: width/height 없이 viewBox만 → 부모 컨테이너에 맞춰 늘어남 -->
<svg viewBox="0 0 400 300">
  <circle cx="200" cy="150" r="100" fill="#6c5ce7" />
</svg>
```

이것이 실무에서 `viewBox="0 0 24 24"`를 표준처럼 쓰는 이유입니다. 24×24라는 내부 좌표계에서 디자인하고, 실제 크기는 CSS로 자유롭게 조절합니다.

## 🖼 비율이 안 맞을 땐? preserveAspectRatio

viewBox의 종횡비와 뷰포트의 종횡비가 다르면? 예를 들어 viewBox는 정사각형인데 뷰포트는 직사각형이라면?

![preserveAspectRatio 비교](/static/images/04-preserveaspectratio.svg)

| 값      | CSS 대응              | 동작                                       | 스케일 수식     |
| ------- | --------------------- | ------------------------------------------ | --------------- |
| `meet`  | `object-fit: contain` | viewBox 전체가 뷰포트 안에 보임, 여백 가능 | `min(sx, sy)`   |
| `slice` | `object-fit: cover`   | 뷰포트를 빈틈 없이 채움, 넘치는 부분 잘림  | `max(sx, sy)`   |
| `none`  | `object-fit: fill`    | 종횡비 무시, 각 축 독립 스케일             | `sx`, `sy` 각각 |

### 직접 비교해보기

아래 코드를 복사해서 `meet`, `slice`, `none`을 바꿔가며 결과를 확인해보세요.

```html svg-playground
<div style="width: 400px; height: 200px; border: 2px dashed #666;">
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 200 200"
    preserveAspectRatio="xMidYMid meet"
  >
    <!-- ↑ meet을 slice나 none으로 바꿔보세요 -->
    <circle cx="100" cy="100" r="80" fill="#6c5ce7" />
    <rect x="60" y="60" width="80" height="80" fill="#fd79a8" rx="8" />
  </svg>
</div>
```

`xMidYMid`는 정렬 위치(가운데 정렬)이고, 두 번째 값이 스케일 전략입니다.

---

## 🧅 좌표계는 겹겹이 쌓인다

SVG의 좌표계를 이해할 때 가장 중요한 사고 모델은 "좌표계는 하나가 아니라 여러 개가 중첩된다"는 것입니다.

![transform이 좌표계를 변환하는 과정](/static/images/03-transform-coordinate.svg)

`transform`은 요소 자체를 이동시키는 게 아니라, **그 요소의 좌표계 전체를 변환** 하는 겁니다.

```xml
<svg width="200" height="200" viewBox="-100 -100 200 200">
  <g transform="translate(50, 30) rotate(45)">
    <!--
      이 안의 모든 요소는:
      1. 원점이 (50, 30)으로 이동된 좌표계에서
      2. 45도 회전된 좌표계 위에서
      그려집니다. 요소의 x, y 값은 변하지 않습니다.
    -->
    <rect x="0" y="0" width="30" height="30" fill="#6c5ce7" />
  </g>
</svg>
```

### HTML transform과의 차이

|                    | HTML CSS transform                      | SVG transform                     |
| ------------------ | --------------------------------------- | --------------------------------- |
| 기준점             | 요소 중심 (`transform-origin: 50% 50%`) | 부모 좌표계의 원점 (`0, 0`)       |
| `transform-origin` | 자유롭게 지정 가능                      | SVG 1.1 지정 불가, SVG 2부터 지원 |

그래서 SVG에서 요소를 자기 중심으로 회전시키려면 이런 패턴을 써야 합니다.

```xml
<!-- "원점을 요소 중심으로 이동 → 회전 → 다시 되돌리기" -->
<rect
  transform="translate(100, 75) rotate(45) translate(-100, -75)"
  x="80" y="55" width="40" height="40"
/>
```

### 로딩 스피너를 만들어보자

이 원리를 활용하면 도트 하나만 정의하고 `rotate`로 복제하여 로딩 스피너를 만들 수 있습니다.

```html svg-interactive
<svg width="200" height="200" viewBox="-50 -50 100 100">
  <!--
    viewBox="-50 -50 100 100" → 원점이 정중앙
    rotate()가 자동으로 중심 기준 회전이 됨
  -->

  <!-- 도트 하나를 45°씩 8개 배치 (360° / 8 = 45°) -->
  <circle cy="-35" r="5" fill="white" opacity="1.0" />

  <g transform="rotate(45)">
    <circle cy="-35" r="5" fill="white" opacity="0.875" />
  </g>
  <g transform="rotate(90)">
    <circle cy="-35" r="5" fill="white" opacity="0.75" />
  </g>
  <g transform="rotate(135)">
    <circle cy="-35" r="5" fill="white" opacity="0.625" />
  </g>
  <g transform="rotate(180)">
    <circle cy="-35" r="5" fill="white" opacity="0.5" />
  </g>
  <g transform="rotate(225)">
    <circle cy="-35" r="5" fill="white" opacity="0.375" />
  </g>
  <g transform="rotate(270)">
    <circle cy="-35" r="5" fill="white" opacity="0.25" />
  </g>
  <g transform="rotate(315)">
    <circle cy="-35" r="5" fill="white" opacity="0.125" />
  </g>
</svg>
```

viewBox를 `"-50 -50 100 100"`으로 설정해서 원점이 중앙에 있으니까, `rotate(45)`만 하면 중심을 기준으로 회전합니다. 각 도트의 `opacity`를 점점 줄여서 회전 방향감을 표현했습니다. 여기에 CSS 한 줄만 추가하면 실제로 돌아가는 스피너가 됩니다.

```html svg-playground
<style>
  .spinner {
    animation: spin 1s steps(8) infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
<svg class="spinner" width="200" height="200" viewBox="-50 -50 100 100">
  <circle cy="-35" r="5" fill="white" opacity="1.0" />
  <g transform="rotate(45)">
    <circle cy="-35" r="5" fill="white" opacity="0.875" />
  </g>
  <g transform="rotate(90)">
    <circle cy="-35" r="5" fill="white" opacity="0.75" />
  </g>
  <g transform="rotate(135)">
    <circle cy="-35" r="5" fill="white" opacity="0.625" />
  </g>
  <g transform="rotate(180)">
    <circle cy="-35" r="5" fill="white" opacity="0.5" />
  </g>
  <g transform="rotate(225)">
    <circle cy="-35" r="5" fill="white" opacity="0.375" />
  </g>
  <g transform="rotate(270)">
    <circle cy="-35" r="5" fill="white" opacity="0.25" />
  </g>
  <g transform="rotate(315)">
    <circle cy="-35" r="5" fill="white" opacity="0.125" />
  </g>
</svg>
```

---

## 🧮 CTM

브라우저가 내부적으로 좌표 변환을 어떻게 처리하는지 보겠습니다.

**CTM(Current Transform Matrix)** 은 어떤 SVG 요소에 적용된 모든 변환을 하나의 3×3 행렬로 압축한 것입니다.

```
| a  c  e |     새 x = a·x + c·y + e
| b  d  f |     새 y = b·x + d·y + f
| 0  0  1 |
```

`translate`는 e, f 자리만 바꾸고, `scale`은 a, d를 바꾸고, `rotate`는 a, b, c, d를 삼각함수로 채웁니다.

### 이걸 실무에서 어디에 쓰나요?

**마우스 이벤트 좌표를 SVG 좌표로 변환할 때**입니다. 마우스 클릭의 `clientX`, `clientY`는 브라우저 화면 기준이고, SVG 내부에 요소를 배치하려면 SVG 좌표가 필요합니다.

```jsx
function screenToSVG(svg, screenX, screenY) {
  const point = svg.createSVGPoint();
  point.x = screenX;
  point.y = screenY;
  // getScreenCTM(): SVG 좌표 → 스크린 좌표 행렬
  // .inverse(): 역행렬 = 스크린 좌표 → SVG 좌표
  return point.matrixTransform(svg.getScreenCTM().inverse());
}

// 사용 예: 클릭한 위치에 원 배치
svgElement.addEventListener("click", (e) => {
  const { x, y } = screenToSVG(svgElement, e.clientX, e.clientY);
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  circle.setAttribute("cx", x);
  circle.setAttribute("cy", y);
  circle.setAttribute("r", "10");
  circle.setAttribute("fill", "#fd79a8");
  svgElement.appendChild(circle);
});
```

에디터에서 드래그 앤 드롭, 줌/팬을 구현할 때 이 패턴이 핵심입니다.

---

## 🪆 SVG 안의 SVG

SVG 안에 또 다른 `<svg>` 요소를 넣을 수 있습니다. `<symbol>`, `<pattern>`, `<marker>` 같은 요소도 각각 독립적인 좌표계를 생성합니다.

```xml
<svg width="400" height="300" viewBox="0 0 400 300">
  <!-- 바깥 좌표계: 400×300 -->
  <svg x="50" y="50" width="200" height="150" viewBox="0 0 100 75">
    <!-- 안쪽 좌표계: 100×75 (독립적!) -->
    <rect x="10" y="10" width="80" height="55" fill="coral" />
  </svg>
</svg>
```

이 패턴은 `<symbol>` + `<use>`로 아이콘 시스템을 만들 때 중요합니다. `<symbol>`에 `viewBox`를 지정해두면, `<use>`로 참조할 때 크기만 바꿔도 아이콘이 적절히 스케일됩니다.

---

## 📌 정리하며

시리즈 1편에서 다룬 내용을 되짚어보겠습니다.

SVG는 픽셀을 직접 기록하는 래스터 이미지와 달리, **그리는 방법을 기술하는 문서** 입니다. 브라우저는 이 문서를 파싱해서 SVG DOM을 만들고, 레이아웃을 계산하고, 페인터 모델에 따라 그린 뒤, 최종적으로 래스터화합니다.

SVG의 좌표계는 겹겹이 쌓이는 구조입니다. 뷰포트 좌표계 위에 viewBox가 사용자 좌표계를 만들고, transform이 또 새로운 좌표계를 만듭니다. 이 모든 변환은 CTM이라는 하나의 행렬로 압축되고, `getScreenCTM().inverse()`로 스크린 좌표와 SVG 좌표를 상호 변환할 수 있습니다.

다음 편에서는 **`<path>` 요소**를 다루겠습니다. `d="M3 12l9-9 9 9"` 같은 문자열이 어떤 원리로 곡선을 만드는지 알아보겠습니다.

### ✏️ 출처

https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial <br/>
https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox <br/>
https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/preserveAspectRatio <br/>
https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform <br/>
https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM <br/>
https://www.w3.org/TR/SVG2/coords.html <br/>
https://www.w3.org/TR/SVG2/painting.html#PaintingOrder <br/>
https://svg-tutorial.com/svg/basic-shapes <br/>
https://svg-tutorial.com/svg/viewbox <br/>
https://svg-tutorial.com/svg/rotate-and-translate <br/>
https://css-tricks.com/svg-properties-and-css/ <br/>
https://www.sarasoueidan.com/blog/svg-coordinate-systems/
