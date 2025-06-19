import { z } from "zod";

export type lokiQueryOut = {
  status: string;
  data: {
    resultType: string;
    result: Array<{
      stream: Record<string, string>;
      values: Array<[string, string]>;
    }>;
  };
};

export const getFilterLogsInSchema = z.object({
  start: z.string().describe("Start time in ISO format"),
  end: z.string().describe("End time in ISO format"),
  limit: z.number().optional().describe("Maximum number of logs to retrieve"),
});
export type getFilterLogsIn = z.infer<typeof getFilterLogsInSchema>;

export const blockedRecordSchema = z.object({
  srcAddress: z.string().describe("Source IP address"),
  srcCountry: z.string().describe("Source country code"),
  destinationPort: z.number().describe("Destination port number"),
});
export type blockedRecord = z.infer<typeof blockedRecordSchema>;

export const getFilterLogsOutSchema = z.object({
  timeRange: z.record(z.string()).describe("Time range of the logs"),
  blockedRecords: z
    .array(blockedRecordSchema)
    .describe("List of blocked records"),
  totalBlocked: z.number().describe("Total number of blocked records"),
});
export type getFilterLogsOut = z.infer<typeof getFilterLogsOutSchema>;
