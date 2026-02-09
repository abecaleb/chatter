export type Message = {
  id: string;
  content: string;
  sender_name: string;
  sender_type: "user" | "ai" | "system";
  created_at: string;
};
