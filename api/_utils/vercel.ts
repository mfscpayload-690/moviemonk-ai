import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'http';

export type QueryValue = string | string[] | undefined;

export type VercelRequest = IncomingMessage & {
  method?: string;
  url?: string;
  headers: IncomingHttpHeaders;
  query: Record<string, QueryValue>;
  body?: any;
};

export type VercelResponse = ServerResponse<IncomingMessage> & {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => VercelResponse;
  send: (body?: unknown) => VercelResponse;
};
