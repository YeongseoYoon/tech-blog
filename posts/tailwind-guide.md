---
title: 'Tailwind CSS로 빠르게 UI 구축하기'
date: '2025-01-20T14:30:45.789Z'
summary: 'Utility-first CSS 프레임워크 완벽 가이드'
tags: ['CSS', 'Tailwind']
---

# Tailwind CSS 마스터 가이드

## Tailwind CSS란?

Tailwind CSS는 Utility-first CSS 프레임워크입니다. 미리 정의된 클래스를 조합하여 빠르게 UI를 구축할 수 있습니다.

## 설치 및 설정

### 기본 설치

```bash
npm install -D tailwindcss postcss autoprefixer
```

### 설정 파일

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
      },
    },
  },
  plugins: [],
};
```

## 주요 유틸리티 클래스

### 레이아웃

```html
<div class="flex gap-4 p-6">
  <div class="w-1/2">왼쪽</div>
  <div class="w-1/2">오른쪽</div>
</div>
```

### 반응형 디자인

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- 모바일: 1개 열, 태블릿: 2개 열, 데스크톱: 3개 열 -->
</div>
```

### 색상 및 스타일

```html
<button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
  버튼
</button>
```

## 고급 기능

### @apply 지시어

```css
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700;
  }
}
```

### 커스텀 테마

```javascript
theme: {
  extend: {
    spacing: {
      '128': '32rem',
    },
  },
}
```

## 성능 최적화

Tailwind는 프로덕션 빌드에서 사용하지 않는 클래스를 제거하여 최적화합니다.

## 결론

Tailwind CSS는 현대적이고 효율적인 UI 개발 방식입니다.

