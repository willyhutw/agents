import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import {
  BaseMessage,
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";

import { FirewallTool } from "./tools/firewall.js";

dotenv.config();

const tools = [FirewallTool];
const toolNode = new ToolNode(tools);

const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4o-mini-2024-07-18",
  temperature: 0.1,
}).bindTools(tools);

async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await llm.invoke(state.messages);
  return { messages: [response] };
}

function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1] as AIMessage;
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  return "__end__";
}

const agent = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent")
  .addNode("tools", toolNode)
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .compile();

const systemMsg = new SystemMessage(
  `Current system time is ${new Date().toISOString()}.
  You are a firewall log analysis expert.
  Your role is to assist users in querying blocked records.
  Make sure to use the available tools to gather all necessary data before responding to any questions.`,
);
let conversationHistory: BaseMessage[] = [systemMsg];
const saperator = "\n\n ------------ \n\n";

// first query
const query1 = `Please summarize the firewall block logs from the past 15 minutes.
Report your findings in markdown format, including both tables and a written description.
Show the top 10 source IP addresses and their countries, sorted by count.
Also, display the top 5 destination ports (below 1024), sorted by count.
You only allow call the tool once, so ensure you gather all necessary data in a single request.`;
conversationHistory.push(new HumanMessage(query1));
const firstState = await agent.invoke({ messages: conversationHistory });
conversationHistory = firstState.messages;
console.log(
  `${firstState.messages[firstState.messages.length - 1].content} ${saperator}`,
);

// second query
const query2 = "Pardon? Could you translate to trditional Chinese?";
conversationHistory.push(new HumanMessage(query2));
const secondState = await agent.invoke({ messages: conversationHistory });
conversationHistory = secondState.messages;
console.log(
  `${secondState.messages[secondState.messages.length - 1].content} ${saperator}`,
);

// third query
const query3 = "I need some suggestions based on the previous results.";
conversationHistory.push(new HumanMessage(query3));
const thirdState = await agent.invoke({ messages: conversationHistory });
conversationHistory = thirdState.messages;
console.log(
  `${thirdState.messages[thirdState.messages.length - 1].content} ${saperator}`,
);

