"use client";

import {
  AlignLeft,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  Plus,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { TaskPriority, TaskStatus } from "@tigilabs/types";
import { useTaskGroups } from "../../hooks/use-tasks";
import { useUsers } from "../../hooks/use-users";
import { createTask } from "../../lib/api/tasks";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "../ui/toast";

type TaskFormValues = {
  groupId: string;
  title: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedToId?: string;
};

export function TaskCreateForm({
  defaultGroupId,
}: Readonly<{ defaultGroupId?: string }>) {
  const router = useRouter();
  const { groups } = useTaskGroups();
  const { users } = useUsers();
  const { toast } = useToast();
  const activeUsers = users.filter((user) => user.status === "ACTIVE");

  const taskForm = useForm<TaskFormValues>({
    defaultValues: {
      assignedToId: "",
      description: "",
      dueDate: "",
      groupId: defaultGroupId ?? "",
      priority: "MEDIUM",
      startDate: toDateInput(new Date().toISOString()),
      status: "TODO",
      title: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (taskForm.getValues("groupId") || !groups.length) {
      return;
    }

    taskForm.setValue("groupId", defaultGroupId ?? groups[0].id);
  }, [defaultGroupId, groups, taskForm]);

  async function handleCreateTask(values: TaskFormValues) {
    const payload = {
      ...values,
      assignedToId: values.assignedToId || null,
      dueDate: values.dueDate
        ? new Date(values.dueDate).toISOString()
        : undefined,
      startDate: values.startDate
        ? new Date(values.startDate).toISOString()
        : undefined,
    };

    try {
      await createTask(payload);
      toast({ title: "Tache creee.", variant: "success" });
      router.push(`/tasks?group=${values.groupId}`);
      router.refresh();
    } catch {
      toast({
        description:
          "La tache n'a pas pu etre synchronisee, reessayez dans quelques instants.",
        title: "Impossible de creer la tache.",
        variant: "error",
      });
    }
  }

  return (
    <form
      className="form task-create-page-form"
      onSubmit={taskForm.handleSubmit(handleCreateTask)}
    >
      <div className="meta-card">
        <div className="meta-head">
          <span className="meta-icon">
            <FolderKanban size={16} />
          </span>
          <span className="meta-label">Groupe</span>
        </div>
        <select
          className="meta-field-control"
          {...taskForm.register("groupId", {
            required: "Le groupe est obligatoire.",
          })}
        >
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>
      <Input
        error={taskForm.formState.errors.title?.message}
        label="Intitule"
        placeholder="Deposer le dossier"
        {...taskForm.register("title", {
          required: "L'intitule est obligatoire.",
        })}
      />
      <section className="task-description-panel">
        <h3>
          <AlignLeft size={16} />
          Details
        </h3>
        <textarea
          className="description-control"
          placeholder="Contexte et resultat attendu"
          rows={4}
          {...taskForm.register("description")}
        />
      </section>
      <div className="task-detail-meta">
        <div className="meta-card">
          <div className="meta-head">
            <span className="meta-icon">
              <CalendarDays size={16} />
            </span>
            <span className="meta-label">Date de debut</span>
          </div>
          <input
            className="meta-field-control"
            type="date"
            {...taskForm.register("startDate")}
          />
        </div>
        <div className="meta-card">
          <div className="meta-head">
            <span className="meta-icon">
              <CalendarClock size={16} />
            </span>
            <span className="meta-label">Date de fin prevue</span>
          </div>
          <input
            className="meta-field-control"
            type="date"
            {...taskForm.register("dueDate")}
          />
        </div>
        <div className="meta-card">
          <div className="meta-head">
            <span className="meta-icon">
              <UserRound size={16} />
            </span>
            <span className="meta-label">Responsable</span>
          </div>
          <select
            className="meta-field-control"
            {...taskForm.register("assignedToId")}
          >
            <option value="">Sans responsable</option>
            {activeUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <div className="meta-card">
          <div className="meta-head">
            <span className="meta-icon meta-icon-priority">
              <Sparkles size={16} />
            </span>
            <span className="meta-label">Priorite</span>
          </div>
          <select
            className="meta-field-control"
            {...taskForm.register("priority")}
          >
            <option value="LOW">Basse</option>
            <option value="MEDIUM">Normale</option>
            <option value="HIGH">Haute</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>
      </div>
      <div className="meta-card">
        <div className="meta-head">
          <span className="meta-icon">
            <CheckCircle2 size={16} />
          </span>
          <span className="meta-label">Statut initial</span>
        </div>
        <select className="meta-field-control" {...taskForm.register("status")}>
          <option value="TODO">A faire</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="BLOCKED">Bloquee</option>
          <option value="DONE">Terminee</option>
        </select>
      </div>
      <div className="button-row">
        <Button disabled={!groups.length} type="submit">
          <Plus size={17} />
          Ajouter la tache
        </Button>
        <Button
          onClick={() => router.push("/tasks")}
          type="button"
          variant="ghost"
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}

function toDateInput(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}
