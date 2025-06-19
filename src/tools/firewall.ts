import { tool } from "@langchain/core/tools";
import { z } from "zod";

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

  const blockedRecords: T.blockedRecord[] = rawData.data.result.map((r) => {
    return {
      protocol: r.stream.protocol_text,
      ipVersion: r.stream.ip_version,
      srcAddress: r.stream.source_address,
      srcCountry: r.stream.source_country,
      destinationPort: r.stream.destination_port,
      tcpFlags: r.stream.tcp_flags || "",
    };
  });

  const result: T.getFilterLogsOut = {
    timeRange: {
      start: input.start,
      end: input.end,
    },
    blockedRecords,
    totalBlocked: rawData.data.result.length,
  };

  return result;
};

const argsSchema = z.object({
  start: z.string().describe("Start time in ISO format"),
  end: z.string().describe("End time in ISO format"),
});

export const FirewallTool = tool(
  async (args: z.infer<typeof argsSchema>) => {
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
    schema: argsSchema,
  },
);
