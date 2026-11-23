#!/usr/bin/env node

// 서버에서 실행(HTTP): 한국 서울 지역 클라우드(Cloud Run 등)에 올려 원격 MCP 로 쓰는 방식.
// 주소: POST /mcp (MCP Streamable HTTP), 상태 확인: GET /health, 네이버 접속 확인: GET /check
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";
import { searchNaverFlights } from "./tools/NaverFlightSearch.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "naver-flight-mcp" });
});

// 서버가 있는 곳에서 네이버 항공권 API 가 응답하는지 한 번 시험한다(인천→도쿄, 30일 뒤 3박).
app.get("/check", async (_req, res) => {
  const d = new Date(Date.now() + 30 * 864e5);
  const r = new Date(d.getTime() + 3 * 864e5);
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  const t0 = Date.now();
  const out = await searchNaverFlights("ICN", "NRT", iso(d), iso(r));
  res.json({ ms: Date.now() - t0, text: out.content?.[0]?.text?.slice(0, 600) });
});

// 요청마다 서버를 새로 만들어 연결한다(상태 없이 동작 — Cloud Run 처럼 여러 대로 늘어나도 문제없음).
app.post("/mcp", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP 요청 처리 실패:", error);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
    }
  }
});

// 상태 없는 방식이라 GET/DELETE 는 지원하지 않는다.
app.get("/mcp", (_req, res) => res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }));
app.delete("/mcp", (_req, res) => res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }));

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`네이버 항공권 MCP HTTP 서버 시작: 포트 ${port}`);
});
