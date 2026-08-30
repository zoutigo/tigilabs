import { z } from "zod";

export const userStatusSchema = z.enum(["ACTIVE", "INVITED", "DISABLED"]);

export const taskStatusSchema = z.enum([
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE",
]);

export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const taskGroupStatusSchema = z.enum([
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
]);

export const loginSchema = z.object({
  email: z.string().email("Email invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir 8 caracteres."),
});

export const requiredNameSchema = z
  .string()
  .trim()
  .min(2, "Ce champ est obligatoire.");

/**
 * Password policy: 8+ chars, at least one lowercase, one uppercase and one
 * special character. Kept as a single source of truth reused by
 * register/reset/change-password forms and mirrored server-side by
 * IsStrongPassword on the matching DTOs.
 */
export const passwordSchema = z
  .string()
  .min(8, "8 caracteres minimum.")
  .regex(/[a-z]/, "Une minuscule minimum.")
  .regex(/[A-Z]/, "Une majuscule minimum.")
  .regex(/[^A-Za-z0-9]/, "Un caractere special minimum.");

export const registerSchema = z
  .object({
    firstName: requiredNameSchema,
    lastName: requiredNameSchema,
    email: z.string().email("Email invalide."),
    password: passwordSchema,
    passwordConfirm: passwordSchema,
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["passwordConfirm"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide."),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: passwordSchema,
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["passwordConfirm"],
  });

export const accountProfileSchema = z.object({
  firstName: requiredNameSchema,
  lastName: requiredNameSchema,
});

export const updateFirstNameSchema = accountProfileSchema.pick({
  firstName: true,
});

export const updateLastNameSchema = accountProfileSchema.pick({
  lastName: true,
});

export const changeEmailSchema = z.object({
  newEmail: z.string().email("Email invalide."),
  currentPassword: z.string().min(1, "Mot de passe requis."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis."),
    newPassword: passwordSchema,
    newPasswordConfirm: passwordSchema,
  })
  .refine((value) => value.newPassword === value.newPasswordConfirm, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["newPasswordConfirm"],
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    message: "Le nouveau mot de passe doit differer de l'ancien.",
    path: ["newPassword"],
  });

export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  name: z.string().min(2),
  password: z.string().min(8),
  status: userStatusSchema.optional(),
  roles: z.array(z.string()).optional(),
});

export const createTaskSchema = z.object({
  groupId: z.string().min(1),
  title: z.string().min(2),
  description: z.string().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  assignedToId: z.string().nullable().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const createTaskGroupSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export const updateTaskGroupSchema = createTaskGroupSchema
  .extend({ status: taskGroupStatusSchema.optional() })
  .partial();

export const createTaskProgressSchema = z.object({
  content: z.string().min(2),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateTaskGroupInput = z.infer<typeof createTaskGroupSchema>;
export type UpdateTaskGroupInput = z.infer<typeof updateTaskGroupSchema>;
export type CreateTaskProgressInput = z.infer<typeof createTaskProgressSchema>;
export type AccountProfileInput = z.infer<typeof accountProfileSchema>;
export type UpdateFirstNameInput = z.infer<typeof updateFirstNameSchema>;
export type UpdateLastNameInput = z.infer<typeof updateLastNameSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
