export interface VercelContext {
  baseUrl: string;
  token: string;
  access: "public" | "private";
}
