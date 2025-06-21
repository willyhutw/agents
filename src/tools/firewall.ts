import { tool } from "@langchain/core/tools";

import { getFilterLogs } from "../funcs/firewall.js";
import * as T from "../types.js";
import * as M from "./mocks.js";

import dotenv from "dotenv";
dotenv.config();

export const FirewallTool = tool(
  async (args: T.getFilterLogsIn) => {
    console.log(
      `=== Fetching firewall logs from ${args.start} to ${args.end} ===`,
    );
    try {
      // ### uncomment the following line to fetch real data from Loki
      // const result = await getFilterLogs(args);
      // return JSON.stringify(result);

      // ### use mock data for testing purposes
      return JSON.stringify(M.mockFilterLogs);
    } catch (error) {
      return `Error fetching logs: ${error}`;
    }
  },
  {
    name: "firewall_logs",
    description: "Return the firewall blocked logs in a specific time range.",
    schema: T.getFilterLogsInSchema,
  },
);
