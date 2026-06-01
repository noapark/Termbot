"use client";
import { useState, useRef, useEffect } from "react";

const WELCOME = "안녕하세요! 노션 문서에 대해 무엇이든 물어보세요. 문서 내용을 바탕으로 정확하게 답변드릴게요. ✨";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: WELCOME, sources: [] },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncInfo, setSyncInfo] = useState(null);
  const [syncedCount, setSyncedCount] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSync() {
    setIsSyncing(true);
    setSyncInfo("동기화 중...");
    try {
      const res = await fetch("/api/sync", { method: "POST" }); // fix: 'syn' → 'sync'
      const data = await res.json();
      if (data.ok) {
        setSyncedCount(data.pages || 0);
        setSyncInfo(`✅ ${data.pages}개 페이지 동기화 완료`);
      } else {
        setSyncInfo("❌ 오류: " + (data.error || "알 수 없는 오류"));
      }
    } catch {
      setSyncInfo("❌ 연결 실패");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncInfo(null), 5000);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // 어시스턴트 응답 자리 추가
    setMessages((prev) => [...prev, { role: "assistant", content: "", sources: [] }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      // fix: res.json() 대신 스트리밍 읽기
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.sources) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  sources: parsed.sources,
                };
                return updated;
              });
            }
            if (parsed.text) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + parsed.text,
                };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: "오류가 발생했습니다: " + err.message,
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-[#FBFBFA] text-[#37352F] dark:bg-[#191919] dark:text-[#E3E3E3]">

      {/* 사이드바 */}
      <aside className="w-72 border-r border-gray-200 dark:border-[#2A2A2A] p-6 flex flex-col justify-between bg-[#F7F7F5] dark:bg-[#202020]">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-black dark:bg-[#E3E3E3] text-white dark:text-black rounded-lg flex items-center justify-center font-bold text-base">N</div>
            <div>
              <h1 className="text-sm font-semibold">Notion RAG</h1>
              <p className="text-xs text-gray-400">Knowledge Base Assistant</p>
            </div>
          </div>

          <div className="mt-6 bg-white dark:bg-[#2F2F2F] p-4 rounded-xl border border-gray-100 dark:border-transparent">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">문서 동기화</span>
              <span className={`inline-block w-2 h-2 rounded-full ${isSyncing ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`}></span>
            </div>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full py-2 px-4 bg-black hover:bg-gray-800 text-white dark:bg-[#E3E3E3] dark:text-black dark:hover:bg-gray-200 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSyncing ? "동기화 중..." : "🔄 실시간 동기화"}
            </button>
            {syncInfo && (
              <div className="mt-2 text-xs text-amber-700 dark:text-amber-300">{syncInfo}</div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#3F3F3F] text-xs text-gray-400 flex justify-between">
              <span>학습된 페이지</span>
              <span className="font-semibold text-black dark:text-white">{syncedCount}개</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-300 dark:text-gray-600">
          Powered by Next.js & Notion API
        </div>
      </aside>

      {/* 메인 채팅창 */}
      <main className="flex-1 flex flex-col h-full bg-white dark:bg-[#191919]">
        <header className="h-14 border-b border-gray-100 dark:border-[#2A2A2A] flex items-center px-8">
          <span className="text-sm font-semibold">💬 AI 어시스턴트</span>
        </header>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-3xl mx-auto w-full">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 min-w-[28px] bg-amber-500 text-white rounded-lg flex items-center justify-center text-[10px] font-bold mr-2 mt-1">AI</div>
              )}
              <div className="max-w-[78%]">
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[#0B93F6] text-white rounded-tr-sm"
                    : "bg-[#F1F1EF] dark:bg-[#2F2F2F] text-gray-800 dark:text-gray-200 rounded-tl-sm"
                }`}>
                  {msg.content || (loading && i === messages.length - 1 ? (
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </span>
                  ) : "")}
                </div>
                {msg.sources?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[11px] text-gray-400">📄 참고 문서</span>
                    {msg.sources.map((s, j) => (
                      <a key={j} href={s.url} target="_blank" rel="noreferrer"
                        className="text-[11px] px-2 py-0.5 bg-amber-50 dark:bg-[#2F2A20] border border-amber-200 dark:border-amber-800 rounded-full text-amber-700 dark:text-amber-400 no-underline hover:bg-amber-100 transition-colors">
                        {s.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* 입력창 */}
        <footer className="p-6 max-w-3xl mx-auto w-full">
          <div className="relative flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="노션 문서에 대해 질문해보세요..."
              rows={1}
              className="flex-1 resize-none bg-[#F4F4F2] dark:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700 rounded-xl pl-4 pr-4 py-3 text-sm text-[#37352F] dark:text-[#E3E3E3] leading-relaxed max-h-32 overflow-y-auto"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-black dark:bg-[#E3E3E3] text-white dark:text-black rounded-xl flex items-center justify-center text-lg hover:opacity-80 transition-all disabled:opacity-30 flex-shrink-0"
            >
              ↑
            </button>
          </div>
          <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-2 text-center">Enter로 전송 · Shift+Enter로 줄바꿈</p>
        </footer>
      </main>
    </div>
  );
}
