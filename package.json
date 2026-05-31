import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchAllChunks, searchChunks } from "../../../lib/notion";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 서버리스 환경에서 간단한 메모리 캐시
let cachedChunks = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5분

export async function POST(request) {
  try {
    const { messages } = await request.json();
    const userMessage = messages[messages.length - 1]?.content || "";

    // Notion 콘텐츠 캐시 처리
    if (!cachedChunks || Date.now() - cacheTime > CACHE_TTL) {
      cachedChunks = await fetchAllChunks();
      cacheTime = Date.now();
    }

    // 관련 청크 검색
    const relevant = searchChunks(cachedChunks, userMessage, 5);

    // 컨텍스트 구성
    let context = "";
    if (relevant.length > 0) {
      context = relevant
        .map((c) => `## ${c.title}\n${c.text}`)
        .join("\n\n---\n\n");
    } else {
      context = cachedChunks
        .slice(0, 3)
        .map((c) => `## ${c.title}\n${c.text.slice(0, 500)}...`)
        .join("\n\n---\n\n");
    }

    const systemPrompt = `당신은 아래 노션 문서를 기반으로 질문에 답하는 AI 어시스턴트입니다.
문서에 있는 내용만 바탕으로 답하고, 모르면 "해당 내용은 문서에서 찾을 수 없습니다"라고 솔직하게 말하세요.
항상 한국어로 친절하게 답변하세요.

===== 노션 문서 내용 =====
${context}
=========================`;

    // Gemini chat history 형식으로 변환 (마지막 메시지 제외)
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(userMessage);

    // 스트리밍 응답
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        // 소스 페이지 정보 먼저 전송
        if (relevant.length > 0) {
          const sources = relevant.map((c) => ({ title: c.title, url: c.url }));
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ sources })}\n\n`)
          );
        }

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
