# acvi.net

**acvi** (Acoustic · Vibration) — 김태연의 소리·진동 작업실 사이트. 공모전 하나를 프로젝트 하나로 기록.

https://acvi.net

## 원칙

- **필요한 것만.** 로고, 한 줄 소개, 프로젝트, 소개, 메일 주소. 그 외 장식 · 자리표시 상자 없음.
- **글꼴 하나.** Pretendard. 굵기와 크기로만 위계.
- **색은 흑백 + 주황 한 점.** 주황(`--accent`)은 로고 · 첫 화면 파형에만.
- **프로젝트는 모두 같은 모양.** 크기 · 색 · 구성 동일, 최신순. 대표작 · 수상 등급에 따른 구분 없음.
- **문장 금지.** 제목 · 설명 · 값 모두 명사구. `~다`, `~입니다`, `~해요`, `~음` 끝맺음과 슬로건 없음.
- 이미지는 실제 파일이 생길 때만 넣음.

## 구성

| 파일 | 역할 |
|---|---|
| `index.html` | 홈. 로고 → 한 줄 소개 → 파형 → 프로젝트 타일 → 소개(수치 3개 · 소개 · 함께 할 일) → 메일 |
| `projects/<슬러그>.html` | 프로젝트 상세. 이름 → 핵심 수치 3개 → 현장과 문제 · 잰 것 · 만든 것 · 정보(공개 저장소는 `코드` 줄) · 상장 · 보도 → 메일 |
| `projects/_template.html` | 새 프로젝트 페이지용 틀 (사이트에는 링크 없음) |
| `assets/site.css` | 공용 스타일. 색 · 글꼴은 맨 위 `:root` |
| `assets/site.js` | 움직임 전용. 없어도 내용 표시 |
| `assets/img/<슬러그>/` | 프로젝트 이미지 |
| `favicon.svg` | 탭 아이콘 (감쇠 파형) |
| `assets/img/og.png` | 주소 공유 때 보이는 미리보기 그림 (1200×630) |
| `404.html` | 없는 주소 안내 |
| `robots.txt`, `sitemap.xml` | 검색 엔진용. **쪽을 추가하면 `sitemap.xml`에도 한 줄 추가.** |
| `CNAME` | `acvi.net` 도메인 연결. **지우면 도메인 연결 해제.** |

내용은 HTML과 CSS만. 자바스크립트는 `assets/site.js` 하나, 움직임에만 사용(첫 화면 파형, 화면에 들어올 때 나타나기, 수치 올라가기). 꺼져 있거나 "동작 줄이기" 설정이면 움직임 없이 내용 전부 표시. (홈의 `application/ld+json`은 검색 엔진용 자료이며 실행되는 코드가 아님)

홈 `소개`의 수치 3개(수상 건수 · 신호 종류 · 보도 건수)는 프로젝트를 추가할 때 함께 고침.

## 프로젝트 추가

1. `projects/_template.html` → `projects/<슬러그>.html` 복사. 슬러그는 영문 소문자(예: `aitkoo`, `go-no-go`).
2. `[대괄호]` 채우기, 없는 줄은 삭제.
3. `index.html` 해당 타일의 `<article class="tile">…</article>`를 `<a class="tile" href="projects/<슬러그>.html">…</a>`로 변경. 버튼 · 표시 추가 없음.
4. 이미지가 있으면 `assets/img/<슬러그>/`에 넣고
   - 타일: 설명 아래 `<img class="shot" src="assets/img/<슬러그>/tile.jpg" alt="…">` (모든 타일에 같은 방식)
   - 상세: `.phero` 안 `<img class="shot" src="../assets/img/<슬러그>/cover.jpg" alt="…">`
   - 상장: `assets/img/<슬러그>/award.jpg` (가로 1000px JPEG, 약 100KB). 상세 페이지 `정보` 다음 `상장` 칸에 표시, 누르면 원본 크기

새 공모전은 홈 타일 맨 앞에 `tile` 하나 추가. 수상 줄은 `대회명 연도 상` 형식.

## 배포

`main`에 병합되면 GitHub Pages가 자동 배포, 보통 1~2분.
작업은 `feat/…`, `fix/…`, `content/…`, `design/…` 브랜치 → Pull Request → `main`.
