import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  }
});

export type Workflow = {
  id: string;
  name: string;
  description: string;
  trigger: string;
  status: "active" | "draft" | "paused";
  runs_today: number;
  graph_json: string;
};
