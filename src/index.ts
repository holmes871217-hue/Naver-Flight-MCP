#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

// PC에서 실행(stdio): Claude 데스크톱 앱 등이 직접 띄우는 방식
async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("네이버 항공권 MCP 서버가 시작되었습니다.");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
