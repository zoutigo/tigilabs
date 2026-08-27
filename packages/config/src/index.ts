export const appConfig = {
  companyName: "Tigilabs",
  defaultLocale: "fr-CM",
  apiPath: "/api",
} as const;

export const taskStatuses = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
  "ARCHIVED",
] as const;

export const taskPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
