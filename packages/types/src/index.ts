export type UserStatus = "ACTIVE" | "INVITED" | "DISABLED";

export type User = {
  id: string;
  email: string;
  name: string;
  role?: string;
  roles?: string[];
  status: UserStatus;
};

export type TaskStatus =
  "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "ARCHIVED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  assignee?: User | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: User;
};
