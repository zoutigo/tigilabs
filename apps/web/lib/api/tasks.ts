import type { Task } from "@tigilabs/types";
import { apiClient } from "./client";

export const mockTasks: Task[] = [
  {
    id: "task-product-roadmap",
    title: "Structurer la roadmap produit",
    description: "Prioriser les modules internes apres le socle utilisateurs et taches.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    assignee: { id: "user-admin", name: "Admin Tigilabs", email: "admin@tigilabs.com", role: "Admin", status: "ACTIVE" },
    dueDate: new Date().toISOString()
  },
  {
    id: "task-permissions",
    title: "Definir les permissions",
    description: "Cartographier les droits requis pour les prochains modules internes.",
    status: "TODO",
    priority: "MEDIUM"
  },
  {
    id: "task-accounting",
    title: "Preparer le module comptabilite",
    description: "Lister les objets metier et contraintes de reporting financier.",
    status: "REVIEW",
    priority: "URGENT"
  }
];

export function getTasks() {
  return apiClient<Task[]>("/tasks");
}
