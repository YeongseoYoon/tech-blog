---
title: "SVG 시리즈 ② - path 명령어 해부학"
date: "2026-04-26T00:00:00.000Z"
summary: "갈 길이 멀dㅏ"
tags: ["SVG"]
---

> 이제 SVG 파일을 열면 좀 읽히겠거니 했는데— 열어보니 내용의 90%가 `<path d="M3.5 2C1.57 2 0 3.57 0 5.5L0 18.5C0 ...">`이었습니다. `M`이 뭔지, `C` 뒤에 숫자 6개가 왜 붙는지, 전혀 읽히지 않았습니다.

그래서 이번엔 `<path>`를 파헤쳐봤습니다.

## 🤔 path가 뭐가 그렇게 특별할까

SVG에는 `<rect>`, `<circle>`, `<line>`, `<polygon>` 같은 기본 도형이 이미 있습니다. 그런데 `<path>` 하나면 이것들을 전부 그릴 수 있습니다.

```html svg-interactive
<svg width="200" height="200" viewBox="0 0 200 200">
  <!-- rect를 path로 -->
  <path d="M 20 20 H 90 V 80 H 20 Z" fill="#6c5ce7" />

  <!-- circle을 path로 (두 개의 호를 이어붙임) -->
  <path d="M 150 60 A 30 30 0 1 1 150 59.99 Z" fill="#fd79a8" />

  <!-- triangle(polygon)을 path로 -->
  <path d="M 20 180 L 90 120 L 90 180 Z" fill="#00b894" />
</svg>
```

사각형, 원, 삼각형 전부 `<path>`의 `d` 속성 하나로 그릴 수 있습니다.

---

## ✏️ d 속성은 "펜에게 보내는 명령서"다

그러면 `d` 속성 안에 들어있는 저 문자열은 대체 뭘까요?

```
M 10 10  L 90 10  L 50 80  Z
│  │  │  │  │  │  │  │  │  └ 명령어: 닫기
│  │  │  │  │  │  │  └──┘ 좌표: (50, 80)
│  │  │  │  │  │  └ 명령어: 직선
│  │  │  │  └──┘ 좌표: (90, 10)
│  │  │  └ 명령어: 직선
│  └──┘ 좌표: (10, 10)
└ 명령어: 이동
```

종이 위에 펜을 들고 있다고 상상하면 됩니다. `M 10 10`은 "펜을 (10, 10)으로 들어서 옮겨", `L 90 10`은 "거기서 (90, 10)까지 선을 그어", `Z`는 "시작점으로 돌아가서 닫아". 알파벳 한 글자가 명령어이고, 뒤 숫자가 파라미터입니다.

---

## 📏 우선 직선부터 — M, L, H, V, Z

| 명령어 | 이름              | 파라미터 | 하는 일                          |
| ------ | ----------------- | -------- | -------------------------------- |
| **M**  | moveto            | x, y     | 펜을 들어서 이동 (선 안 그음)    |
| **L**  | lineto            | x, y     | 현재 위치에서 지정 좌표까지 직선 |
| **H**  | horizontal lineto | x        | 수평선 (y 불변)                  |
| **V**  | vertical lineto   | y        | 수직선 (x 불변)                  |
| **Z**  | closepath         | 없음     | 최근 M 위치까지 직선 + 도형 닫기 |

### 삼각형을 한 획씩 그려보자

**1단계 — `M 10 80`**

```html svg-interactive
<svg width="200" height="120" viewBox="0 0 100 100">
  <!-- 시작점 표시 -->
  <circle cx="10" cy="80" r="3" fill="#e17055" />
  <text x="14" y="76" font-size="8" fill="#636e72">M 10 80</text>
</svg>
```

아직 아무 선도 없습니다. 펜을 (10, 80)에 올려놓기만 한 상태.

**2단계 — `L 90 80`**

```html svg-interactive
<svg width="200" height="120" viewBox="0 0 100 100">
  <path d="M 10 80 L 90 80" fill="none" stroke="#6c5ce7" stroke-width="2" />
  <circle cx="10" cy="80" r="3" fill="#e17055" />
  <circle cx="90" cy="80" r="3" fill="#e17055" />
  <text x="40" y="95" font-size="8" fill="#636e72">L 90 80</text>
</svg>
```

밑변이 생겼습니다.

**3단계 — `L 50 10`**

```html svg-interactive
<svg width="200" height="120" viewBox="0 0 100 100">
  <path
    d="M 10 80 L 90 80 L 50 10"
    fill="none"
    stroke="#6c5ce7"
    stroke-width="2"
  />
  <circle cx="10" cy="80" r="3" fill="#e17055" />
  <circle cx="90" cy="80" r="3" fill="#e17055" />
  <circle cx="50" cy="10" r="3" fill="#e17055" />
  <text x="54" y="18" font-size="8" fill="#636e72">L 50 10</text>
</svg>
```

두 변이 그려졌는데, 아직 열려 있습니다.

**4단계 — `Z`**

```html svg-interactive
<svg width="200" height="120" viewBox="0 0 100 100">
  <path
    d="M 10 80 L 90 80 L 50 10 Z"
    fill="#6c5ce7"
    fill-opacity="0.2"
    stroke="#6c5ce7"
    stroke-width="2"
    stroke-linejoin="round"
  />
  <circle cx="10" cy="80" r="3" fill="#e17055" />
  <circle cx="90" cy="80" r="3" fill="#e17055" />
  <circle cx="50" cy="10" r="3" fill="#e17055" />
</svg>
```

`Z`가 시작점까지 자동으로 직선을 긋고 도형을 닫았습니다. `Z` 대신 `L 10 80`으로 시작점까지 그어도 모양은 같아 보이는데, 차이가 있습니다. `Z`는 line join 처리(꼭짓점이 깔끔하게 맞물림)를 하고, `L`은 그냥 두 선 끝이 겹치기만 합니다. `stroke`가 있으면 차이가 눈에 보일 것입니다.

### 절대좌표와 상대좌표

모든 명령어에 대문자/소문자 버전이 있습니다. 대문자 `L 90 10`은 "좌표계의 (90, 10)으로 가"이고, 소문자 `l 50 0`은 "지금 위치에서 오른쪽으로 50만큼 이동"입니다.

```
M 20 80  L 70 80  L 45 20  Z    ← 대문자: 좌표가 원점(0,0) 기준
M 20 80  l 50 0   l -25 -60  z  ← 소문자: 좌표가 현재 펜 위치 기준
```

**절대좌표 `L`** — 시작점이 바뀌면 형태가 깨집니다.

```html svg-interactive
<svg width="200" height="120" viewBox="0 0 200 100">
  <!-- 시작점 (20, 80) -->
  <path
    d="M 20 80 L 70 80 L 45 20 Z"
    fill="#6c5ce7"
    fill-opacity="0.3"
    stroke="#6c5ce7"
    stroke-width="2"
  />
  <text x="30" y="95" font-size="7" fill="#636e72">M 20 80</text>

  <!-- 시작점을 (120, 80)으로 옮기면? L의 좌표는 그대로 → 형태 깨짐 -->
  <path
    d="M 120 80 L 70 80 L 45 20 Z"
    fill="#e17055"
    fill-opacity="0.3"
    stroke="#e17055"
    stroke-width="2"
  />
  <text x="110" y="95" font-size="7" fill="#636e72">
    M 120 80 (시작점만 변경)
  </text>
</svg>
```

시작점만 바꿨는데 삼각형이 완전히 찌그러졌습니다. L이 가리키는 좌표가 고정이니까요.

**상대좌표 `l`** — 시작점을 옮겨도 형태가 유지됩니다.

```html svg-interactive
<svg width="200" height="120" viewBox="0 0 200 100">
  <!-- 시작점 (20, 80) -->
  <path
    d="M 20 80 l 50 0 l -25 -60 z"
    fill="#6c5ce7"
    fill-opacity="0.3"
    stroke="#6c5ce7"
    stroke-width="2"
  />
  <text x="20" y="95" font-size="7" fill="#636e72">M 20 80</text>

  <!-- 시작점을 (120, 80)으로 옮겨도 동일한 형태 유지 -->
  <path
    d="M 120 80 l 50 0 l -25 -60 z"
    fill="#00b894"
    fill-opacity="0.3"
    stroke="#00b894"
    stroke-width="2"
  />
  <text x="120" y="95" font-size="7" fill="#636e72">M 120 80</text>
</svg>
```

"현재 위치에서 오른쪽 50, 위로 60"처럼 이동량을 지정하니까, 시작점이 어디든 동일한 형태가 됩니다. 아이콘처럼 재사용할 도형을 만들 때 상대좌표가 유리한 이유입니다.

### H, V — 수평·수직 전용 약식

```
L 90 80  →  H 90    (y 불변, x만 지정)
L 10 30  →  V 30    (x 불변, y만 지정)
```

사각형처럼 직각 도형을 그릴 때 `L`보다 간결합니다.

```html svg-playground
<svg width="200" height="120" viewBox="0 0 200 100">
  <!-- L로 사각형 -->
  <path
    d="M 10 10 L 90 10 L 90 90 L 10 90 Z"
    fill="none"
    stroke="#6c5ce7"
    stroke-width="2"
    transform="translate(0, 0)"
  />
  <text x="30" y="60" font-size="8" fill="#636e72">L 사용</text>

  <!-- H, V로 같은 사각형 — 더 간결 -->
  <path
    d="M 110 10 H 190 V 90 H 110 Z"
    fill="none"
    stroke="#00b894"
    stroke-width="2"
  />
  <text x="130" y="60" font-size="8" fill="#636e72">H, V 사용</text>
</svg>
```

---

## 🎨 드디어 곡선이다 — C, S

직선만으로는 둥글기가 있는 아이콘은 만들기가 어렵습니다. 여기서 베지어 곡선이 등장합니다.

### C 명령어

`C`는 3차 베지어 곡선(Cubic Bezier)을 그립니다.

```
C x1 y1, x2 y2, x y
  ──┬──  ──┬──  ─┬─
    │      │     └ 끝점(P3)
    │      └ 제어점 2(P2): 끝점의 도착 방향
    └ 제어점 1(P1): 시작점의 출발 방향
```

시작점(P0)은 현재 펜 위치라 별도로 안 씁니다. 결국 4개의 점이 곡선을 결정합니다.

P1은 시작점에서 "어느 쪽으로 출발할지", P2는 끝점에 "어느 쪽에서 도착할지"를 정합니다. 제어점이 해당 끝점에서 멀수록 그 방향으로 곡선이 더 크게 휩니다.

```html svg-interactive
<svg width="300" height="200" viewBox="0 0 300 200">
  <!-- 곡선 -->
  <path
    d="M 30 150 C 30 50, 270 50, 270 150"
    fill="none"
    stroke="#6c5ce7"
    stroke-width="3"
  />

  <!-- 제어선 (점선) -->
  <line
    x1="30"
    y1="150"
    x2="30"
    y2="50"
    stroke="#fd79a8"
    stroke-width="1"
    stroke-dasharray="4"
  />
  <line
    x1="270"
    y1="150"
    x2="270"
    y2="50"
    stroke="#fd79a8"
    stroke-width="1"
    stroke-dasharray="4"
  />

  <!-- 점: P0(시작), P1(제어1), P2(제어2), P3(끝) -->
  <circle cx="30" cy="150" r="5" fill="#2d3436" />
  <circle cx="30" cy="50" r="5" fill="#fd79a8" />
  <circle cx="270" cy="50" r="5" fill="#fd79a8" />
  <circle cx="270" cy="150" r="5" fill="#2d3436" />

  <!-- 라벨 -->
  <text x="10" y="170" font-size="11" fill="#2d3436">P0</text>
  <text x="10" y="45" font-size="11" fill="#fd79a8">P1</text>
  <text x="275" y="45" font-size="11" fill="#fd79a8">P2</text>
  <text x="275" y="170" font-size="11" fill="#2d3436">P3</text>
</svg>
```

P1, P2가 같은 쪽(둘 다 위)에 있으면 C자 곡선, 반대쪽에 있으면 S자 곡선이 됩니다. 아래 playground에서 첫 번째 `<path>`를 주석처리하고 두 번째 `<path>`의 주석을 해제하면 S자 곡선을 확인할 수 있습니다.

```html svg-playground
<svg width="300" height="200" viewBox="0 0 300 200">
  <!-- C자 곡선: P1, P2 모두 위쪽 -->
  <path
    d="M 30 150 C 30 50, 270 50, 270 150"
    fill="none"
    stroke="#6c5ce7"
    stroke-width="3"
  />

  <!-- S자 곡선: P1 위, P2 아래 — 아래 주석을 해제하고 위를 주석처리해보세요
  <path d="M 30 100 C 30 20, 270 180, 270 100"
    fill="none" stroke="#00b894" stroke-width="3" />
  -->

  <!-- 제어선 -->
  <line
    x1="30"
    y1="150"
    x2="30"
    y2="50"
    stroke="#fd79a8"
    stroke-width="1"
    stroke-dasharray="4"
  />
  <line
    x1="270"
    y1="150"
    x2="270"
    y2="50"
    stroke="#fd79a8"
    stroke-width="1"
    stroke-dasharray="4"
  />

  <!-- 점 -->
  <circle cx="30" cy="150" r="4" fill="#2d3436" />
  <circle cx="30" cy="50" r="4" fill="#fd79a8" />
  <circle cx="270" cy="50" r="4" fill="#fd79a8" />
  <circle cx="270" cy="150" r="4" fill="#2d3436" />
</svg>
```

### S 명령어 — 곡선을 이어 붙일 때

곡선 여러 개를 이어 붙이면 이음새에서 꺾이기 쉽습니다. 접선이 연속이어야 자연스러운데, 매번 제어점을 손으로 계산하기는 귀찮습니다.

`S`가 이걸 자동으로 해줍니다. 이전 `C`의 P2를 끝점 기준으로 반사시켜서 새 P1을 만듭니다.

```
이전 C의 P2 = (200, 50)
이전 C의 끝점 = (250, 150)

S의 자동 P1 = (2×250 − 200, 2×150 − 50) = (300, 250)
```

이러면 이음새에서 접선이 연속(C1 연속성)이 보장되니까, 꺾이지 않고 매끄럽게 이어집니다.

```html svg-interactive
<svg width="300" height="200" viewBox="0 0 300 200">
  <!-- C + S로 매끄러운 이음 곡선 -->
  <path
    d="M 10 100 C 10 30, 90 30, 150 100 S 290 170, 290 100"
    fill="none"
    stroke="#6c5ce7"
    stroke-width="3"
  />

  <!-- C 구간의 제어점 -->
  <line
    x1="10"
    y1="100"
    x2="10"
    y2="30"
    stroke="#fd79a8"
    stroke-width="1"
    stroke-dasharray="4"
  />
  <line
    x1="150"
    y1="100"
    x2="90"
    y2="30"
    stroke="#fd79a8"
    stroke-width="1"
    stroke-dasharray="4"
  />

  <!-- S 구간: 자동 생성된 P1 = (210, 170) — 90,30을 150,100 기준으로 반사 -->
  <line
    x1="150"
    y1="100"
    x2="210"
    y2="170"
    stroke="#00b894"
    stroke-width="1"
    stroke-dasharray="4"
  />
  <line
    x1="290"
    y1="100"
    x2="290"
    y2="170"
    stroke="#00b894"
    stroke-width="1"
    stroke-dasharray="4"
  />

  <!-- 점 표시 -->
  <circle cx="10" cy="100" r="4" fill="#2d3436" />
  <circle cx="10" cy="30" r="4" fill="#fd79a8" />
  <circle cx="90" cy="30" r="4" fill="#fd79a8" />
  <circle cx="150" cy="100" r="4" fill="#2d3436" />
  <circle cx="210" cy="170" r="4" fill="#00b894" />
  <circle cx="290" cy="170" r="4" fill="#00b894" />
  <circle cx="290" cy="100" r="4" fill="#2d3436" />

  <!-- 라벨 -->
  <text x="155" y="95" font-size="9" fill="#636e72">이음점</text>
  <text x="195" y="185" font-size="9" fill="#00b894">자동 P1</text>
</svg>
```

이음점에서 곡선이 꺾이지 않고 부드럽게 이어지는 게 보입니다.

---

## 🔄 제어점이 하나뿐인 곡선 — Q, T

3차(C)가 제어점 2개라면, 2차 베지어(`Q`)는 1개입니다.

```
Q x1 y1, x y
  ──┬──  ─┬─
    │     └ 끝점
    └ 제어점 (1개)
```

제어점이 하나니까 출발 방향과 도착 방향을 따로 제어할 수가 없습니다. 그래서 2차 베지어는 항상 한쪽으로 볼록한 포물선이 되고, S자 곡선은 못 만듭니다.

```html svg-interactive
<svg width="300" height="180" viewBox="0 0 300 180">
  <!-- 2차 베지어 곡선 -->
  <path
    d="M 30 150 Q 150 10, 270 150"
    fill="none"
    stroke="#6c5ce7"
    stroke-width="3"
  />

  <!-- 제어선 -->
  <line
    x1="30"
    y1="150"
    x2="150"
    y2="10"
    stroke="#fd79a8"
    stroke-width="1"
    stroke-dasharray="4"
  />
  <line
    x1="270"
    y1="150"
    x2="150"
    y2="10"
    stroke="#fd79a8"
    stroke-width="1"
    stroke-dasharray="4"
  />

  <!-- 점 -->
  <circle cx="30" cy="150" r="5" fill="#2d3436" />
  <circle cx="150" cy="10" r="5" fill="#fd79a8" />
  <circle cx="270" cy="150" r="5" fill="#2d3436" />

  <text x="10" y="168" font-size="11" fill="#2d3436">P0</text>
  <text x="155" y="20" font-size="11" fill="#fd79a8">P1</text>
  <text x="275" y="168" font-size="11" fill="#2d3436">P2</text>
</svg>
```

파라미터가 4개라 단순한 곡선을 그릴 때는 C보다 간결합니다. 다만 제어점이 하나뿐이니 표현할 수 있는 곡선의 종류가 C보다 제한적입니다.

### T — Q 버전의 S

`S`가 C를 매끄럽게 이어주는 약식이었듯이, `T`는 Q를 매끄럽게 이어주는 약식입니다. 제어점을 자동으로 만들어주기 때문에 끝점 좌표만 쓰면 됩니다.

```html svg-interactive
<svg width="300" height="180" viewBox="0 0 300 180">
  <!-- Q + T로 물결 곡선 -->
  <path
    d="M 10 90 Q 80 10, 150 90 T 290 90"
    fill="none"
    stroke="#6c5ce7"
    stroke-width="3"
  />

  <!-- Q 구간의 제어점 -->
  <line
    x1="10"
    y1="90"
    x2="80"
    y2="10"
    stroke="#fd79a8"
    stroke-width="1"
    stroke-dasharray="4"
  />
  <line
    x1="150"
    y1="90"
    x2="80"
    y2="10"
    stroke="#fd79a8"
    stroke-width="1"
    stroke-dasharray="4"
  />

  <!-- T 구간: 자동 생성된 제어점 = (220, 170) — 80,10을 150,90 기준으로 반사 -->
  <line
    x1="150"
    y1="90"
    x2="220"
    y2="170"
    stroke="#00b894"
    stroke-width="1"
    stroke-dasharray="4"
  />
  <line
    x1="290"
    y1="90"
    x2="220"
    y2="170"
    stroke="#00b894"
    stroke-width="1"
    stroke-dasharray="4"
  />

  <!-- 점 표시 -->
  <circle cx="10" cy="90" r="4" fill="#2d3436" />
  <circle cx="80" cy="10" r="4" fill="#fd79a8" />
  <circle cx="150" cy="90" r="4" fill="#2d3436" />
  <circle cx="220" cy="170" r="4" fill="#00b894" />
  <circle cx="290" cy="90" r="4" fill="#2d3436" />

  <!-- 라벨 -->
  <text x="65" y="8" font-size="9" fill="#fd79a8">Q 제어점</text>
  <text x="155" y="85" font-size="9" fill="#636e72">이음점</text>
  <text x="205" y="168" font-size="9" fill="#00b894">자동 제어점</text>
</svg>
```

Q의 제어점(80, 10)을 이음점(150, 90) 기준으로 반사하면 (220, 170). 접선이 연속되니까 물결처럼 자연스럽게 이어집니다.

---

## 🌀 파라미터가 7개...? — Arc

`A`는 타원의 일부(호)를 그리는 명령어인데, 파라미터가 7개나 됩니다.

```
A rx ry  x-rotation  large-arc-flag  sweep-flag  x y
  ─┬─   ────┬─────  ──────┬───────  ────┬─────  ─┬─
   │        │             │             │        └ 끝점
   │        │             │             └ 0=반시계, 1=시계 방향
   │        │             └ 0=작은 호, 1=큰 호
   │        └ 타원 장축 기울기 (도)
   └ 타원 반지름 (x축, y축)
```

하나씩 보면, `rx`와 `ry`는 타원의 가로·세로 반지름이고, `x-rotation`은 타원을 기울이는 각도입니다. 원(rx = ry)이면 기울여도 모양이 같으니 이 값은 무시해도 됩니다.

핵심은 `large-arc-flag`와 `sweep-flag`입니다. 시작점과 끝점이 같아도 호를 그리는 방법은 여러 가지가 있는데, 이 두 값이 "큰 호냐 작은 호냐", "시계 방향이냐 반시계 방향이냐"를 결정합니다. 조합하면 총 4가지 경우가 나옵니다.

### 말로는 모르겠으니까

```html svg-interactive
<svg width="300" height="300" viewBox="0 0 300 300">
  <!-- 공통 시작점(80, 80)과 끝점(220, 220) -->

  <!-- [0, 0] 작은 호, 반시계 -->
  <path
    d="M 80 80 A 100 100 0 0 0 220 220"
    fill="none"
    stroke="#6c5ce7"
    stroke-width="3"
  />
  <text x="20" y="170" font-size="10" fill="#6c5ce7">[0,0] 작은호 반시계</text>

  <!-- [0, 1] 작은 호, 시계 -->
  <path
    d="M 80 80 A 100 100 0 0 1 220 220"
    fill="none"
    stroke="#00b894"
    stroke-width="3"
  />
  <text x="160" y="130" font-size="10" fill="#00b894">[0,1] 작은호 시계</text>

  <!-- [1, 0] 큰 호, 반시계 -->
  <path
    d="M 80 80 A 100 100 0 1 0 220 220"
    fill="none"
    stroke="#e17055"
    stroke-width="3"
    stroke-dasharray="6"
  />
  <text x="160" y="270" font-size="10" fill="#e17055">[1,0] 큰호 반시계</text>

  <!-- [1, 1] 큰 호, 시계 -->
  <path
    d="M 80 80 A 100 100 0 1 1 220 220"
    fill="none"
    stroke="#fd79a8"
    stroke-width="3"
    stroke-dasharray="6"
  />
  <text x="20" y="40" font-size="10" fill="#fd79a8">[1,1] 큰호 시계</text>

  <!-- 시작점과 끝점 -->
  <circle cx="80" cy="80" r="5" fill="#2d3436" />
  <circle cx="220" cy="220" r="5" fill="#2d3436" />
  <text x="60" y="75" font-size="10" fill="#2d3436">시작</text>
  <text x="225" y="235" font-size="10" fill="#2d3436">끝</text>
</svg>
```

같은 시작점, 같은 끝점, 같은 반지름인데 두 비트만 바꾸면 완전히 다른 호가 나옵니다. 한 번 보면 바로 이해됩니다.

직접 값을 바꿔보세요.

```html svg-playground
<svg width="300" height="300" viewBox="0 0 300 300">
  <!--
    rx, ry: 반지름을 바꿔보세요 (예: 80 120)
    x-rotation: 타원을 기울여보세요 (예: 30)
      → rx≠ry일 때만 효과가 보입니다 (현재 90, 60)
    large-arc-flag: 0(작은호) 또는 1(큰호)
    sweep-flag: 0(반시계) 또는 1(시계)
  -->
  <path
    d="M 80 150 A 90 60 0 1 1 220 150"
    fill="none"
    stroke="#6c5ce7"
    stroke-width="3"
  />

  <!-- 시작점과 끝점 표시 -->
  <circle cx="80" cy="150" r="4" fill="#e17055" />
  <circle cx="220" cy="150" r="4" fill="#e17055" />
</svg>
```

`rx`나 `ry`가 0이면 호 대신 직선이 됩니다. 두 점 사이 거리가 반지름보다 멀면? 에러가 아니라 브라우저가 반지름을 알아서 늘려줍니다. 스펙에 정의된 동작입니다.

---

## 🧬 브라우저는 곡선을 어떻게 그릴까

베지어 곡선은 t라는 값이 0에서 1로 변할 때 그려지는 궤적입니다. t=0이면 시작점, t=1이면 끝점, t=0.5면 대략 중간쯤입니다.

그러면 t=0.35일 때 곡선 위의 점은 어디일까요? 브라우저는 **드 카스텔조(De Casteljau) 알고리즘**이라는 방법을 씁니다. 원리는 단순합니다.

1. 4개의 제어점(P0~P3)이 있습니다
2. 인접한 점 쌍 사이를 35% 지점에서 찍습니다 → 점이 3개로 줄어듭니다 (Q)
3. 그 3개의 점에서 또 35% 지점을 찍습니다 → 2개로 줄어듭니다 (R)
4. 마지막 2개에서 또 35% 지점을 찍으면 → 1개의 점(S)이 남습니다

이 S가 바로 곡선 위의 점입니다.

```html svg-interactive
<svg width="350" height="250" viewBox="0 0 350 250">
  <!-- 제어 다각형 (P0-P1-P2-P3) -->
  <polyline
    points="30,200 100,30 250,30 320,200"
    fill="none"
    stroke="#b2bec3"
    stroke-width="1"
    stroke-dasharray="4"
  />

  <!-- 전체 곡선 -->
  <path
    d="M 30 200 C 100 30, 250 30, 320 200"
    fill="none"
    stroke="#dfe6e9"
    stroke-width="2"
  />

  <!-- 1단계: Q점 3개 (분홍) -->
  <line
    x1="54.5"
    y1="140.5"
    x2="152.5"
    y2="30"
    stroke="#fd79a8"
    stroke-width="1.5"
  />
  <line
    x1="152.5"
    y1="30"
    x2="274.5"
    y2="89.5"
    stroke="#fd79a8"
    stroke-width="1.5"
  />

  <!-- 2단계: R점 2개 (노랑) -->
  <line
    x1="88.8"
    y1="101.8"
    x2="195.2"
    y2="50.8"
    stroke="#fdcb6e"
    stroke-width="1.5"
  />

  <!-- t=0.35까지 그려진 곡선 구간 -->
  <path
    d="M 30 200 C 54.5 140.5, 88.8 101.8, 126 83.9"
    fill="none"
    stroke="#6c5ce7"
    stroke-width="3"
  />

  <!-- P점 (검정) -->
  <circle cx="30" cy="200" r="5" fill="#2d3436" />
  <circle cx="100" cy="30" r="5" fill="#2d3436" />
  <circle cx="250" cy="30" r="5" fill="#2d3436" />
  <circle cx="320" cy="200" r="5" fill="#2d3436" />

  <!-- Q점 (분홍) -->
  <circle cx="54.5" cy="140.5" r="4" fill="#fd79a8" />
  <circle cx="152.5" cy="30" r="4" fill="#fd79a8" />
  <circle cx="274.5" cy="89.5" r="4" fill="#fd79a8" />

  <!-- R점 (노랑) -->
  <circle cx="88.8" cy="101.8" r="4" fill="#fdcb6e" />
  <circle cx="195.2" cy="50.8" r="4" fill="#fdcb6e" />

  <!-- S점 (빨강) -->
  <circle cx="126" cy="83.9" r="7" fill="#d63031" />

  <!-- 라벨 -->
  <text x="15" y="218" font-size="10" fill="#2d3436" font-weight="bold">
    P0
  </text>
  <text x="85" y="25" font-size="10" fill="#2d3436" font-weight="bold">P1</text>
  <text x="252" y="25" font-size="10" fill="#2d3436" font-weight="bold">
    P2
  </text>
  <text x="310" y="218" font-size="10" fill="#2d3436" font-weight="bold">
    P3
  </text>

  <text x="35" y="137" font-size="9" fill="#fd79a8">Q0</text>
  <text x="155" y="25" font-size="9" fill="#fd79a8">Q1</text>
  <text x="278" y="87" font-size="9" fill="#fd79a8">Q2</text>

  <text x="73" y="99" font-size="9" fill="#b07e1e">R0</text>
  <text x="198" y="48" font-size="9" fill="#b07e1e">R1</text>

  <text x="130" y="80" font-size="10" fill="#d63031" font-weight="bold">
    S (t=0.35)
  </text>
</svg>
```

이 과정을 t=0, 0.01, 0.02, ... 1까지 반복하면 곡선 전체가 그려집니다. Figma에서 베지어 곡선 위 한 점을 클릭해서 분할하는 기능도 이 알고리즘으로 동작합니다.

---

## 📝 이 빽빽한 문자열은 어떻게 읽나

실제 SVG 파일을 열면 공백이 거의 없는 path를 자주 보게 됩니다. SVGO 같은 최적화 도구가 바이트를 줄이려고 압축한 결과입니다. 이걸 읽으려면 몇 가지 규칙을 알아야 합니다.

**쉼표 = 공백.** `M 10,20`이랑 `M 10 20`은 같습니다.

**명령어 앞뒤 공백 생략 가능.** `M10 20L30 40` — 알파벳과 숫자를 그냥 붙여도 됩니다.

**음수 부호가 구분자.** `L10-20`은 `L 10 -20`입니다. 마이너스가 새 숫자의 시작을 알려주니까요.

**소수점도 구분자.** `L.5.3`은 `L 0.5 0.3`입니다. 숫자 하나에 소수점은 하나만 올 수 있으므로, 두 번째 `.`을 만나면 파서가 새 숫자로 인식합니다.

이걸 알면 아래 같은 것도 읽을 수 있습니다.

```
M10.5-3.2L-4.5.8C2.1-1.3 5.6.4 8-2Z
```

풀어쓰면:

```
M 10.5 -3.2
L -4.5 0.8
C 2.1 -1.3, 5.6 0.4, 8 -2
Z
```

기계한테는 좋은데 사람이 읽기엔... 풀어쓰는 게 낫습니다.

---

## 📌 정리하며

`<path>`의 `d` 속성은 펜에게 보내는 명령서입니다. M, L, H, V, Z로 직선을, C, S로 자유로운 곡선을, Q, T로 단순한 곡선을, A로 호를 그립니다.

곡선이 화면에 그려지는 원리는 드 카스텔조 알고리즘이었습니다. "인접한 점들을 t 비율로 내분하기를 반복"— Figma의 곡선 편집도, 브라우저의 렌더링도 이 원리 위에서 돌아갑니다.

이제 SVG 파일을 열었을 때 `d="M3.5 2C1.57..."` 같은 게 보여도, "3차 베지어로 곡선을 그리고 있구나" 정도는 읽힐 겁니다. 다음 편에서는 이걸 바탕으로 SVG 최적화와 아이콘 시스템을 다뤄보겠습니다.

### ✏️ 출처

https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths <br/>
https://www.w3.org/TR/SVG2/paths.html <br/>
https://en.wikipedia.org/wiki/De_Casteljau%27s_algorithm <br/>
https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d <br/>
https://css-tricks.com/svg-path-syntax-illustrated-guide/ <br/>
https://www.nan.fyi/svg-paths
