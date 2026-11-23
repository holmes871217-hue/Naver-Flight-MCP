import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { searchNaverFlights } from "./tools/NaverFlightSearch.js";

/** MCP 서버(도구 등록 포함)를 만든다. PC 실행(stdio)과 서버 실행(HTTP)이 함께 쓴다. */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "naver-flight-mcp",
    version: "1.0.0",
  });

  server.tool(
    "search_naver_flights",
    "네이버 항공권 검색 API를 사용하여 최저가 항공권 정보를 조회합니다",
    {
      departure: z.string().describe("출발지 공항 코드 (예: PUS, ICN, GMP)"),
      arrival: z.string().describe("도착지 공항 코드 (예: TYO, NRT, HND)"),
      departureDate: z.string().describe("출발일 (YYYY-MM-DD 형식)"),
      returnDate: z.string().describe("복귀일 (YYYY-MM-DD 형식)"),
      airlines: z
        .array(z.string())
        .optional()
        .describe(
          "항공사 코드 배열 (예: ['7C', 'KE', 'OZ'] - 제주항공, 대한항공, 아시아나항공)"
        ),
    },
    async ({ departure, arrival, departureDate, returnDate, airlines }): Promise<CallToolResult> =>
      searchNaverFlights(departure, arrival, departureDate, returnDate, airlines)
  );

  return server;
}
