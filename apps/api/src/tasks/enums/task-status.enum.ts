export const TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  REVIEW: "REVIEW",
  DONE: "DONE",
  ARCHIVED: "ARCHIVED",
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
