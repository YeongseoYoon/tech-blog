# 📖 기술 블로그

Next.js와 Tailwind CSS로 구축한 현대적인 기술 블로그입니다.

## ✨ 주요 기능

- ✅ **마크다운 지원**: `.md` 파일로 기술 글 작성
- ✅ **슬러그 기반 라우팅**: URL 친화적인 포스트 접근
- ✅ **동적 목차**: H1-H4 태그 기반 자동 생성
- ✅ **텍스트 검색**: 제목, 요약, 내용으로 검색
- ✅ **태그 필터링**: 해시태그로 글 분류 및 필터링
- ✅ **Giscus 댓글**: GitHub 기반 댓글 시스템
- ✅ **반응형 디자인**: 모든 기기에서 최적화
- ✅ **Syntax Highlighting**: 코드 블록 강조

## 🚀 시작하기

### 사전 요구사항

- Node.js 18.0 이상
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000`을 열어보세요.

### 빌드 및 실행

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 📝 마크다운 포스트 작성

`posts` 디렉토리에 `.md` 파일을 생성하세요.

### 파일 구조

```
posts/
├── closure.md
├── async-await.md
└── tailwind-guide.md
```

### 포스트 포맷

```markdown
---
title: '제목'
date: '2025-03-01T13:33:27.982Z'
summary: '짧은 요약'
tags: ['JavaScript', 'React']
---

# 본문 시작

마크다운 형식의 본문을 작성합니다.

## 섹션 제목

### 소제목

```code
코드 블록
```
```

### 메타데이터 설명

| 필드 | 설명 | 필수 |
|------|------|------|
| `title` | 포스트 제목 | ✅ |
| `date` | 작성 날짜 (ISO 8601 형식) | ✅ |
| `summary` | 포스트 요약 | ✅ |
| `tags` | 태그 배열 | ✅ |

## 📁 프로젝트 구조

```
tech-blog/
├── app/
│   ├── api/
│   │   └── posts/
│   │       ├── route.ts          # 모든 포스트 API
│   │       └── [slug]/
│   │           └── route.ts      # 단일 포스트 API
│   ├── blog/
│   │   └── [slug]/
│   │       └── page.tsx          # 포스트 상세 페이지
│   ├── page.tsx                  # 홈 페이지
│   ├── layout.tsx                # 레이아웃
│   └── globals.css               # 글로벌 스타일
├── components/
│   ├── TableOfContents.tsx       # 목차 컴포넌트
│   ├── PostCard.tsx              # 포스트 카드
│   ├── SearchBar.tsx             # 검색바
│   ├── TagFilter.tsx             # 태그 필터
│   └── Giscus.tsx                # 댓글 컴포넌트
├── lib/
│   ├── mdParser.ts               # 마크다운 파싱
│   └── search.ts                 # 검색 및 필터링
├── posts/                        # 마크다운 포스트
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## 🎨 커스터마이징

### Tailwind 테마 수정

`tailwind.config.js`에서 테마를 커스터마이징할 수 있습니다:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
    },
    fontFamily: {
      sans: ['YourFont', 'sans-serif'],
    },
  },
}
```

### 글로벌 스타일 수정

`app/globals.css`에서 스타일을 수정할 수 있습니다.

## 💬 댓글 설정 (Giscus)

### 1. GitHub 저장소 설정

1. GitHub 계정에 로그인
2. 공개 저장소 생성
3. [Giscus](https://giscus.app)에서 설정 수행

### 2. 컴포넌트 설정

`app/blog/[slug]/page.tsx`에서 Giscus 정보 업데이트:

```tsx
<Giscus
  repo="your-username/your-repo"
  repoId="your-repo-id"
  categoryId="your-category-id"
  theme="light"
  lang="ko"
/>
```

## 🔍 검색 및 필터링

### 텍스트 검색

검색바에 입력하여 제목, 요약, 내용을 검색합니다.

### 태그 필터링

태그 섹션에서 원하는 태그를 클릭하여 필터링합니다. 여러 태그를 선택할 수 있습니다.

## 📦 기술 스택

- **Framework**: Next.js 15
- **Styling**: Tailwind CSS 3
- **Language**: TypeScript
- **Markdown**: Remark, Gray Matter
- **Comments**: Giscus
- **Package Manager**: npm

## 📖 학습 자료

- [Next.js 문서](https://nextjs.org/docs)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [마크다운 문법](https://www.markdownguide.org/)
- [Giscus 설명서](https://giscus.app)

## 🐛 알려진 문제 및 개선사항

### 현재 제한사항

1. **정적 생성**: 새 포스트 추가 후 재배포 필요
2. **댓글**: Giscus 설정 필수
3. **이미지**: `/public` 디렉토리에 저장 후 상대 경로로 참조

### 향후 계획

- [ ] 다크 모드 지원
- [ ] 댓글 알림 기능
- [ ] 포스트 시리즈 기능
- [ ] 조회수 추적
- [ ] 소셜 미디어 공유
- [ ] RSS 피드

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 👨‍💻 기여

이 프로젝트에 기여하고 싶으신가요? Pull Request를 보내주세요!

## 📧 연락처

질문이나 제안사항이 있으면 이슈를 등록해주세요.

---

**Happy Blogging! 🚀**

