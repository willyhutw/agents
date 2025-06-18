import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";

import { FirewallTool } from "./tools/firewall.js";

import dotenv from "dotenv";
dotenv.config();

const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4.1-nano-2025-04-14",
  temperature: 0.1,
});

async function main() {
  const executor = await initializeAgentExecutorWithOptions(
    [FirewallTool],
    model,
    {
      agentType: "openai-functions",
    },
  );

  const result = await executor.call({
    input:
      "The current time is Wednesday, June 18, 2025 5:19:00 PM. Summarize firewall blocked logs in the last 10 minutes as markdown format to list some top N tables. (atleast 100 records if available)",
  });
  console.log(result.output);
}

main();
