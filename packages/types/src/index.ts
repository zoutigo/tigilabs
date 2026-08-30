export type UserStatus = "ACTIVE" | "INVITED" | "DISABLED";

export type User = {
  id: string;
  email: string;
  pendingEmail?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  status: UserStatus;
};

export type Permission = {
  id: string;
  action: string;
  subject: string;
  description?: string | null;
};

export type Role = {
  id: string;
  name: string;
  description?: string | null;
  permissions?: Array<{ permission: Permission }>;
};

export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskGroupStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";

export type TaskProgress = {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author?: User;
};

export type TaskHistory = {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  user?: User;
};

export type TaskGroup = {
  id: string;
  name: string;
  description?: string | null;
  status: TaskGroupStatus;
  createdById: string;
  createdBy?: User;
  createdAt: string;
  updatedAt?: string;
  archivedAt?: string | null;
  tasks: Task[];
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  progress: number;
};

export type Task = {
  id: string;
  groupId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  dueDate?: string | null;
  completedAt?: string | null;
  assignedToId?: string | null;
  assignedTo?: User | null;
  assignee?: User | null;
  createdById?: string;
  createdBy?: User;
  group?: TaskGroup;
  progress?: TaskProgress[];
  history?: TaskHistory[];
  isOverdue?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
  passwordConfirm: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type UpdateProfilePayload = Partial<{
  firstName: string;
  lastName: string;
}>;

export type ChangeEmailPayload = {
  newEmail: string;
  currentPassword: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};
