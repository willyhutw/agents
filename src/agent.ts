import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import dotenv from "dotenv";

import { FirewallTool } from "./tools/firewall.js";

dotenv.config();

const tools = [FirewallTool];

const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4o-mini-2024-07-18",
  temperature: 0.1,
});

const messageModifier = (messages: BaseMessage[]) => {
  return [
    new SystemMessage(
      `Current system time is ${new Date().toISOString()}. You are a firewall log analysis expert. Your role is to assist users in querying blocked records. Make sure to use the available tools to gather all necessary data before responding to any questions.`,
    ),
    ...messages,
  ];
};

const checkpointSaver = new MemorySaver();

const reactAgent = createReactAgent({
  llm,
  tools,
  messageModifier,
  checkpointSaver,
});

const langGraphConfig = {
  configurable: {
    thread_id: "test-thread",
  },
};

// first query
const query1 = `Please summarize the firewall block logs from the past 15 minutes.
Report your findings in markdown format, including both tables and a written description.
Show the top 10 source IP addresses and their countries, sorted by count.
Also, display the top 5 destination ports (below 1024), sorted by count.
You only allow call the tool once, so ensure you gather all necessary data in a single request.`;

// invoke react agent with the first query
let reactAgentOutput = await reactAgent.invoke(
  {
    messages: [
      {
        role: "user",
        content: query1,
      },
    ],
  },
  langGraphConfig,
);

// second query
const query2 = "Pardon? Could you translate to trditional Chinese?";
reactAgentOutput = await reactAgent.invoke(
  {
    messages: [
      {
        role: "user",
        content: query2,
      },
    ],
  },
  langGraphConfig,
);

// Print all output messages
for (const msg of reactAgentOutput.messages) {
  if (msg.text === "" || msg.lc_id[2] === "ToolMessage") {
    continue;
  }
  console.log(`${msg.lc_id[2]}: ${msg.text}\n --- \n`);
}
