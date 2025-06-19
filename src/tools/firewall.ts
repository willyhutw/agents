import { tool } from "@langchain/core/tools";

import * as T from "./types.js";

import dotenv from "dotenv";
dotenv.config();

const lokiApiUrl =
  process.env.LOKI_API_URL || "http://localhost:3100/loki/api/v1";

const getFilterLogs = async (
  input: T.getFilterLogsIn,
): Promise<T.getFilterLogsOut> => {
  const start = new Date(input.start).getTime() / 1000;
  const end = new Date(input.end).getTime() / 1000;

  const resp = await fetch(
    `${lokiApiUrl}/query_range?query=${encodeURIComponent('{log_type="filterlog", real_interface="pppoe0", action="block"}')}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&limit=${encodeURIComponent(input.limit || 5000)}`,
  );

  const rawData: T.lokiQueryOut = await resp.json();

  const records: T.blockedRecord[] = rawData.data.result.map((r) => {
    return {
      srcAddress: r.stream.source_address,
      srcCountry: r.stream.source_country,
      dstPort: parseInt(r.stream.destination_port, 10),
    };
  });

  const result: T.getFilterLogsOut = {
    timeRange: {
      start: input.start,
      end: input.end,
    },
    records,
    total: rawData.data.result.length,
  };

  return result;
};

export const FirewallTool = tool(
  async (args: T.getFilterLogsIn) => {
    console.log(
      `=== Fetching firewall logs from ${args.start} to ${args.end} ===`,
    );
    try {
      const result = await getFilterLogs(args);
      return JSON.stringify(result);
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
