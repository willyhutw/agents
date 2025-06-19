export type getFilterLogsIn = {
  start: string;
  end: string;
  limit?: number;
};

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

export type blockedRecord = {
  protocol: string;
  ipVersion: number;
  srcAddress: string;
  srcCountry: string;
  destinationPort: number;
  tcpFlags?: string;
};

export type getFilterLogsOut = {
  timeRange: Record<string, string>;
  blockedRecords: blockedRecord[];
  totalBlocked: number;
};
