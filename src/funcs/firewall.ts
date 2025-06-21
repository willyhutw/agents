import dotenv from "dotenv";

import * as T from "../types.js";

dotenv.config();

const lokiApiUrl =
  process.env.LOKI_API_URL || "http://localhost:3100/loki/api/v1";

export const getFilterLogs = async (
  input: T.getFilterLogsIn,
): Promise<T.getFilterLogsOut> => {
  const start = new Date(input.start).getTime() / 1000;
  const end = new Date(input.end).getTime() / 1000;

  const resp = await fetch(
    `${lokiApiUrl}/query_range?query=${encodeURIComponent('{log_type="filterlog", real_interface="pppoe0", action="block"}')}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&limit=${encodeURIComponent(input.limit || 1000)}`,
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
