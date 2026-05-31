# 📚 Notion RAG 챗봇 — 배포

노션 문서를 기반으로 질문에 답하는 AI 챗봇입니다. 

---

## 🧱 사용 스택

| 역할 | 서비스 | 비용 |
|------|--------|------|
| 지식 베이스 | Notion API | 무료 |
| AI 답변 | Google Gemini 1.5 Flash | **완전 무료** |
| 호스팅 | Vercel | 무료 |

> 💡 Gemini 1.5 Flash 무료 티어: 분당 15회, 하루 1,500회 요청 가능. 개인 사용에 충분해요!

---

## 🚀 배포 순서 (총 15분 소요)

### 1단계 — GitHub에 코드 올리기

1. [github.com](https://github.com) 접속 → 로그인 (없으면 가입)
2. 오른쪽 상단 **+** 버튼 → **New repository**
3. Repository name: `notion-rag-chatbot` 입력
4. **Create repository** 클릭
5. **Add file → Upload files** 클릭 → 이 프로젝트의 파일 전체 드래그 앤 드롭
6. **Commit changes** 클릭

---

### 2단계 — Notion 연동 설정

#### A. Notion Integration 만들기

1. [notion.so/my-integrations](https://www.notion.so/my-integrations) 접속
2. **+ New integration** 클릭
3. 이름 입력 (예: `my-chatbot`) → **Submit**
4. 생성된 **Internal Integration Secret** 복사 (`secret_xxxxx...` 형태)

#### B. 노션 페이지에 Integration 연결하기

1. 챗봇에 연결할 노션 페이지(또는 데이터베이스) 열기
2. 오른쪽 상단 **···** → **Connect to** → 방금 만든 Integration 선택
3. 페이지 URL에서 ID 복사
   - URL 예: `https://notion.so/내이름/페이지제목-**32자리ID**`
   - 맨 끝 32자리 영숫자가 ID예요

---

### 3단계 — Gemini API 키 발급 (무료)

1. [aistudio.google.com/apikey](https://aistudio.google.com/apikey) 접속
2. Google 계정으로 로그인
3. **Create API key** 클릭
4. `AIzaSy...` 형태의 키 복사

> ✅ 신용카드 불필요! 구글 계정만 있으면 완전 무료로 사용 가능

---

### 4단계 — Vercel에 배포

1. [vercel.com](https://vercel.com) 접속 → **GitHub으로 로그인**
2. **Add New Project** → GitHub에서 `notion-rag-chatbot` 레포 선택 → **Import**
3. **Environment Variables** 섹션에서 아래 3개 추가:

   | 이름 | 값 |
   |------|----|
   | `NOTION_TOKEN` | `secret_xxxxx` (2단계 A에서 복사) |
   | `NOTION_TARGET_IDS` | `32자리ID` (2단계 B에서 복사, 여러 개면 쉼표로 구분) |
   | `GEMINI_API_KEY` | `AIzaSy...` (3단계에서 복사) |

4. **Deploy** 클릭
5. 🎉 1~2분 후 배포 완료!

---

## 💬 사용 방법

- **질문하기**: 채팅창에 질문 입력 후 Enter
- **🔄 동기화 버튼**: 노션 문서 수정 후 눌러서 최신 내용 반영
- **참고 문서 칩**: AI 답변 아래에 어떤 노션 페이지를 참고했는지 표시

---

## 🗂️ 여러 페이지/데이터베이스 연결

`NOTION_TARGET_IDS`에 쉼표로 여러 ID를 입력하면 됩니다:
```
NOTION_TARGET_IDS=데이터베이스ID,페이지ID,또다른페이지ID
```

---

## ❓ 자주 묻는 질문

**Q. 노션 내용이 반영 안 돼요**
→ 챗봇 화면의 **🔄 동기화** 버튼을 눌러주세요.

**Q. "해당 내용은 문서에서 찾을 수 없습니다"라고 해요**
→ 해당 페이지가 Integration에 연결되어 있는지 확인하세요 (2단계 B 참고).

**Q. 하루 1,500번 이상 사용하고 싶어요**
→ Google AI Studio에서 유료 플랜으로 업그레이드하거나, `.env.example`의 `GEMINI_API_KEY`를 유료 키로 교체하면 됩니다.
