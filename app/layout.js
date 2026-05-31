import "./globals.css";

export const metadata = {
  title: "Notion RAG 챗봇",
  description: "노션 문서 기반 AI 챗봇",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
