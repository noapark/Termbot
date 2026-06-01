"use client";
import { useState, useRef, useEffect } from "react";

const WELCOME = "안녕하세요! 노션 문서에 대해 무엇이든 물어보세요. 문서 내용을 바탕으로 정확하게 답변드릴게요. ✨";

export default function ChatPage() {
const [messages, setMessages] = useState([
{ role: "assistant", content: WELCOME, sources: [] },
]);
const [input, setInput] = useState("");
const [loading, setLoading] = useState(false);
const [syncInfo, setSyncInfo] = useState(null);
const bottomRef = useRef(null);

useEffect(() => {
bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

async function handleSync() {
setSyncInfo("동기화 중...");
try {
const res = await fetch("/api/sync");
const data = await res.json();
if (data.ok) {
setSyncInfo(✅ ${data.pages}개 페이지 동기화 완료: ${data.titles.join(", ")});
} else {
setSyncInfo("❌ 오류: " + data.error);
}
} catch {
setSyncInfo("❌ 연결 실패");
}
setTimeout(() => setSyncInfo(null), 5000);
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
updated[updated.length - 1].sources = parsed.sources;
return updated;
});
}
if (parsed.text) {
setMessages((prev) => {
const updated = [...prev];
updated[updated.length - 1].content += parsed.text;
return updated;
});
}
} catch {}
}
}
} catch (err) {
setMessages((prev) => {
const updated = [...prev];
updated[updated.length - 1].content = "오류가 발생했습니다: " + err.message;
return updated;
});
} finally {
setLoading(false);
}
}

return (
<div style={styles.shell}>
{/* Header /}
<header style={styles.header}>
<div style={styles.headerLeft}>
<div style={styles.logo}>N</div>
<div>
<div style={styles.headerTitle}>Notion RAG 챗봇</div>
<div style={styles.headerSub}>노션 문서 기반 AI 어시스턴트</div>
</div>
</div>
<button style={styles.syncBtn} onClick={handleSync}>
🔄 동기화
</button>
</header>

{syncInfo && <div style={styles.syncBanner}>{syncInfo}</div>}

{/ Messages /}
<div style={styles.messages}>
{messages.map((msg, i) => (
<div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 16 }}>
{msg.role === "assistant" && (
<div style={styles.avatar}>AI</div>
)}
<div style={{ maxWidth: "72%" }}>
<div style={msg.role === "user" ? styles.userBubble : styles.aiBubble}>
{msg.content || (loading && i === messages.length - 1 ? <Cursor /> : "")}
</div>
{msg.sources?.length > 0 && (
<div style={styles.sources}>
<span style={styles.sourcesLabel}>📄 참고 문서</span>
{msg.sources.map((s, j) => (
<a key={j} href={s.url} target="_blank" rel="noreferrer" style={styles.sourceChip}>
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

{/ Input */}
<div style={styles.inputArea}>
<textarea
style={styles.textarea}
placeholder="노션 문서에 대해 질문하세요..."
value={input}
onChange={(e) => setInput(e.target.value)}
onKeyDown={(e) => {
if (e.key === "Enter" && !e.shiftKey) {
e.preventDefault();
handleSend();
}
}}
rows={1}
/>
<button
style={{ ...styles.sendBtn, opacity: loading || !input.trim() ? 0.5 : 1 }}
onClick={handleSend}
disabled={loading || !input.trim()}
>
↑
</button>
</div>
</div>
);
}

function Cursor() {
return <span style={{ display: "inline-block", width: 8, height: 16, background: "#c8a96e", borderRadius: 2, animation: "blink 1s step-end infinite" }}>
<style>{@keyframes blink { 50% { opacity: 0 } }}</style>
</span>;
}

const styles = {
shell: {
display: "flex",
flexDirection: "column",
height: "100vh",
maxWidth: 760,
margin: "0 auto",
background: "var(--surface)",
boxShadow: "0 0 0 1px var(--border)",
},
header: {
display: "flex",
alignItems: "center",
justifyContent: "space-between",
padding: "18px 24px",
borderBottom: "1px solid var(--border)",
background: "var(--surface)",
},
headerLeft: { display: "flex", alignItems: "center", gap: 12 },
logo: {
width: 40, height: 40,
background: "var(--ink)",
color: "var(--bg)",
borderRadius: 10,
display: "flex", alignItems: "center", justifyContent: "center",
fontFamily: "'Instrument Serif', serif",
fontSize: 22,
},
headerTitle: { fontWeight: 500, fontSize: 15, color: "var(--ink)" },
headerSub: { fontSize: 12, color: "var(--ink-muted)", marginTop: 1 },
syncBtn: {
padding: "8px 14px",
background: "var(--accent-soft)",
border: "1px solid var(--accent)",
borderRadius: 8,
color: "#7a5c2a",
fontSize: 13,
fontWeight: 500,
cursor: "pointer",
fontFamily: "inherit",
},
syncBanner: {
padding: "10px 24px",
background: "var(--accent-soft)",
borderBottom: "1px solid var(--border)",
fontSize: 13,
color: "#7a5c2a",
},
messages: {
flex: 1,
overflowY: "auto",
padding: "24px",
display: "flex",
flexDirection: "column",
},
avatar: {
width: 32, height: 32, minWidth: 32,
background: "var(--accent)",
color: "#fff",
borderRadius: 8,
display: "flex", alignItems: "center", justifyContent: "center",
fontSize: 11,
fontWeight: 600,
marginRight: 10,
marginTop: 2,
},
aiBubble: {
background: "var(--bg)",
border: "1px solid var(--border)",
borderRadius: "4px 16px 16px 16px",
padding: "12px 16px",
fontSize: 14,
lineHeight: 1.7,
color: "var(--ink)",
whiteSpace: "pre-wrap",
},
userBubble: {
background: "var(--user-bg)",
color: "var(--user-text)",
borderRadius: "16px 4px 16px 16px",
padding: "12px 16px",
fontSize: 14,
lineHeight: 1.7,
whiteSpace: "pre-wrap",
},
sources: {
marginTop: 8,
display: "flex",
flexWrap: "wrap",
gap: 6,
alignItems: "center",
},
sourcesLabel: { fontSize: 11, color: "var(--ink-muted)", marginRight: 2 },
sourceChip: {
fontSize: 11,
padding: "3px 8px",
background: "var(--accent-soft)",
border: "1px solid var(--accent)",
borderRadius: 20,
color: "#7a5c2a",
textDecoration: "none",
},
inputArea: {
display: "flex",
gap: 10,
padding: "16px 24px",
borderTop: "1px solid var(--border)",
background: "var(--surface)",
alignItems: "flex-end",
},
textarea: {
flex: 1,
resize: "none",
border: "1px solid var(--border)",
borderRadius: 12,
padding: "12px 16px",
fontSize: 14,
fontFamily: "inherit",
background: "var(--bg)",
color: "var(--ink)",
outline: "none",
lineHeight: 1.5,
maxHeight: 120,
overflowY: "auto",
},
sendBtn: {
width: 42, height: 42,
background: "var(--ink)",
color: "#fff",
border: "none",
borderRadius: 12,
fontSize: 18,
cursor: "pointer",
display: "flex", alignItems: "center", justifyContent: "center",
transition: "opacity 0.2s",
},
};
