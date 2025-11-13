# 🚀 기술 블로그 시작 가이드

축하합니다! 기술 블로그 프로젝트가 완성되었습니다. 이 가이드를 따라 블로그를 시작해보세요.

## 📋 빠른 시작

### 1. 개발 서버 실행

```bash
cd ~/tech-blog
npm run dev
```

브라우저에서 `http://localhost:3000`을 열어보세요.

### 2. 새 글 추가하기

`posts` 디렉토리에 새 마크다운 파일을 생성하세요:

```bash
# 예: posts/my-first-post.md
```

### 3. 마크다운 파일 작성

```markdown
---
title: '나의 첫 기술 글'
date: '2025-03-10T10:00:00.000Z'
summary: '이것은 나의 첫 번째 기술 글입니다.'
tags: ['JavaScript', 'React']
---

# 제목

본문 내용을 작성합니다.

## 소제목

자세한 내용을 적습니다.
```

## 🎯 주요 기능 확인

### ✅ 텍스트 검색
- 홈페이지의 검색바에서 제목, 요약, 내용으로 검색 가능

### ✅ 태그 필터링
- "태그로 필터링" 섹션에서 여러 태그 선택 가능
- "필터 초기화" 버튼으로 모든 필터 제거

### ✅ 동적 목차
- 각 글 오른쪽의 "목차" 섹션에서 제목으로 이동
- H1~H4 제목이 자동으로 목차에 추가됨

### ✅ 슬러그 기반 라우팅
- `/blog/closure` - 클로저 글
- `/blog/async-await` - Async/Await 글
- `/blog/tailwind-guide` - Tailwind 글

## 💬 댓글 기능 활성화 (Giscus)

### 단계 1: GitHub 저장소 준비

1. GitHub에서 공개 저장소 생성
2. Discussions 기능 활성화

### 단계 2: Giscus 설정

1. https://giscus.app 방문
2. 저장소 정보 입력
3. `repo`, `repoId`, `categoryId` 값 복사

### 단계 3: 코드 업데이트

`app/blog/[slug]/page.tsx`에서:

```tsx
<Giscus
  repo="your-username/your-repo"
  repoId="your-repo-id"
  categoryId="your-category-id"
  theme="light"
  lang="ko"
/>
```

## 📁 파일 구조 한눈에 보기

```
tech-blog/
├── app/
│   ├── api/posts/              # API 라우트
│   ├── blog/[slug]/            # 글 상세 페이지
│   ├── page.tsx                # 홈 페이지
│   ├── layout.tsx              # 레이아웃
│   └── globals.css             # 스타일
├── components/                 # 재사용 컴포넌트
│   ├── TableOfContents.tsx     # 목차
│   ├── PostCard.tsx            # 글 카드
│   ├── SearchBar.tsx           # 검색바
│   ├── TagFilter.tsx           # 태그 필터
│   └── Giscus.tsx              # 댓글
├── lib/                        # 유틸리티
│   ├── mdParser.ts             # 마크다운 파싱
│   └── search.ts               # 검색 로직
├── posts/                      # 마크다운 글
│   ├── closure.md
│   ├── async-await.md
│   └── tailwind-guide.md
└── package.json
```

## 🔧 커스터마이징

### 블로그 제목 변경

`app/layout.tsx`의 `metadata` 객체 수정:

```ts
export const metadata: Metadata = {
  title: '나의 기술 블로그',
  description: '개발 이야기들',
};
```

또한 네비게이션 로고 변경:

```tsx
<a href="/" className="text-2xl font-bold text-primary">
  🚀 나의 블로그  {/* 여기 수정 */}
</a>
```

### 테마 색상 변경

`tailwind.config.js`에서:

```js
theme: {
  extend: {
    colors: {
      primary: '#2563eb',      // 여기 수정
      secondary: '#64748b',
    },
  },
}
```

### 로고 이모지 변경

`app/layout.tsx`에서:

```tsx
💻 기술 블로그  {/* 원하는 이모지로 변경 */}
```

## 📖 마크다운 문법 예시

### 헤더

```markdown
# H1 제목
## H2 제목
### H3 제목
#### H4 제목
```

### 코드 블록

````markdown
```javascript
function hello() {
  console.log('안녕하세요!');
}
```
````

### 리스트

```markdown
- 항목 1
- 항목 2
- 항목 3

1. 첫 번째
2. 두 번째
3. 세 번째
```

### 링크와 이미지

```markdown
[링크 텍스트](https://example.com)
![이미지 설명](./image.png)
```

### 강조

```markdown
**굵은 텍스트**
*기울인 텍스트*
~~취소선~~
```

### 인용구

```markdown
> 이것은 인용구입니다
> 여러 줄도 가능합니다
```

## 🚀 배포 방법

### Vercel 배포 (추천)

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 배포
vercel
```

### GitHub Pages 배포

1. GitHub 저장소 생성
2. 저장소 설정에서 GitHub Actions 활성화
3. `.github/workflows/deploy.yml` 파일 생성

## 📝 샘플 글 추가 아이디어

새로운 글을 추가해보세요:

```markdown
---
title: '나의 개발 경험'
date: '2025-03-15T14:00:00.000Z'
summary: 'React로 프로젝트를 만들며 배운 것들'
tags: ['React', '경험']
---

# React로 배운 최고의 교훈

## 1. 상태 관리의 중요성

...
```

## 🐛 트러블슈팅

### Q: 포스트가 보이지 않습니다
**A:** 다음을 확인하세요:
1. 파일이 `posts/` 디렉토리에 있는지 확인
2. 파일 이름이 `.md`로 끝나는지 확인
3. 개발 서버를 재시작하세요

### Q: 마크다운이 렌더링되지 않습니다
**A:** 메타데이터 형식을 확인하세요:
```markdown
---
title: '제목'
date: '2025-03-01T00:00:00.000Z'
summary: '요약'
tags: ['Tag']
---
```

### Q: 검색이 작동하지 않습니다
**A:** 브라우저 콘솔에서 오류를 확인하고 API가 정상 작동하는지 확인하세요.

## 📚 유용한 링크

- [Next.js 문서](https://nextjs.org/docs)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [마크다운 가이드](https://www.markdownguide.org/)
- [Giscus 설명서](https://giscus.app)

## 💡 팁

1. **ISO 8601 날짜 형식**: `2025-03-10T14:30:00.000Z`
2. **여러 태그**: `['JavaScript', 'React', 'Next.js']`
3. **제목 구조**: H1~H4 태그만 목차에 표시됨
4. **이미지**: 공개 URL 또는 `/public` 폴더 사용

---

**Happy Blogging! 행운을 빕니다! 🎉**

