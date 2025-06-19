import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createToolCallingAgent } from "langchain/agents";
import { AgentExecutor } from "langchain/agents";

import { FirewallTool } from "./tools/firewall.js";

import dotenv from "dotenv";
dotenv.config();

const tools = [FirewallTool];

const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4.1-nano-2025-04-14",
  temperature: 0.1,
});

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a firewall log analysis expert. Your role is to assist users in querying blocked records. Make sure to use the available tools to gather all necessary data before responding to any questions.",
  ],
  ["placeholder", "{chat_history}"],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"],
]);

const agent = createToolCallingAgent({
  llm,
  prompt,
  tools,
});

const agentExecutor = new AgentExecutor({
  agent,
  tools,
});

const query = `The current time is ${new Date().toISOString()}.
Please summarize the firewall block logs from the past 15 minutes.
Report your findings in markdown format, including both tables and a written description.
Show the top 10 source IP addresses and their countries, sorted by count.
Also, display the top 5 destination ports (below 1024), sorted by count.
You may only call the tool once, so ensure you gather all necessary data in a single request.`;
console.log(`${query}\n`);

const result = await agentExecutor.invoke({ input: query });
console.log(result.output);
