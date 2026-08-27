import { z } from "zod";

export const userStatusSchema = z.enum(["ACTIVE", "INVITED", "DISABLED"]);

export const taskStatusSchema = z.enum([
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
  "ARCHIVED",
]);

export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const loginSchema = z.object({
  email: z.string().email("Email invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir 8 caracteres."),
});

const requiredNameSchema = z.string().min(2, "Ce champ est obligatoire.");
const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir 8 caracteres.");

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

export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  name: z.string().min(2),
  password: z.string().min(8),
  status: userStatusSchema.optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().optional(),
  reporterId: z.string(),
});

export const updateTaskSchema = createTaskSchema.partial();

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
