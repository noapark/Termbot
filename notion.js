import { fetchAllChunks } from "../../../lib/notion";

export async function GET() {
  try {
    const chunks = await fetchAllChunks();
    return Response.json({
      ok: true,
      pages: chunks.length,
      titles: chunks.map((c) => c.title),
    });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
