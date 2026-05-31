import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// ── Notion 블록에서 텍스트 추출 ──────────────────────────────
function extractRichText(richTextArr = []) {
  return richTextArr.map((t) => t.plain_text).join("");
}

function blockToText(block) {
  const type = block.type;
  const data = block[type];
  if (!data) return "";

  switch (type) {
    case "paragraph":
    case "heading_1":
    case "heading_2":
    case "heading_3":
    case "quote":
    case "callout":
    case "toggle":
      return extractRichText(data.rich_text);
    case "bulleted_list_item":
    case "numbered_list_item":
    case "to_do":
      return "• " + extractRichText(data.rich_text);
    case "code":
      return extractRichText(data.rich_text);
    case "child_page":
      return data.title || "";
    default:
      return "";
  }
}

// ── 페이지 한 개의 전체 텍스트 가져오기 ─────────────────────
async function fetchPageText(pageId) {
  let text = "";
  let cursor;
  do {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const block of res.results) {
      const line = blockToText(block);
      if (line.trim()) text += line + "\n";
    }
    cursor = res.next_cursor;
    if (!res.has_more) break;
  } while (cursor);
  return text.trim();
}

// ── 페이지 제목 가져오기 ────────────────────────────────────
function getPageTitle(page) {
  const titleProp = Object.values(page.properties || {}).find(
    (p) => p.type === "title"
  );
  if (titleProp?.title?.length) {
    return extractRichText(titleProp.title);
  }
  return "제목 없음";
}

// ── 데이터베이스의 모든 페이지 가져오기 ──────────────────────
async function fetchDatabasePages(databaseId) {
  const pages = [];
  let cursor;
  do {
    const res = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...res.results);
    cursor = res.next_cursor;
    if (!res.has_more) break;
  } while (cursor);
  return pages;
}

// ── 단일 페이지 ID인지 데이터베이스 ID인지 판별 ─────────────
async function fetchAllChunks() {
  const targets = (process.env.NOTION_TARGET_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const chunks = [];

  for (const id of targets) {
    // 데이터베이스 시도
    try {
      const pages = await fetchDatabasePages(id);
      for (const page of pages) {
        const title = getPageTitle(page);
        const text = await fetchPageText(page.id);
        if (text) {
          chunks.push({ title, text, url: page.url });
        }
      }
      continue;
    } catch {
      // 데이터베이스가 아니라면 단일 페이지로 처리
    }

    try {
      const page = await notion.pages.retrieve({ page_id: id });
      const title = getPageTitle(page);
      const text = await fetchPageText(id);
      if (text) {
        chunks.push({ title, text, url: page.url });
      }
    } catch (err) {
      console.error(`페이지 로드 실패 (${id}):`, err.message);
    }
  }

  return chunks;
}

// ── 키워드 기반 관련 청크 검색 ────────────────────────────────
function searchChunks(chunks, query, topK = 5) {
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);

  const scored = chunks.map((chunk) => {
    const content = (chunk.title + " " + chunk.text).toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      const matches = (content.match(new RegExp(kw, "g")) || []).length;
      score += matches;
    }
    return { ...chunk, score };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export { fetchAllChunks, searchChunks };
