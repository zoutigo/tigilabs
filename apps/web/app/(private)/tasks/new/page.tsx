import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TaskCreateForm } from "../../../../components/tasks/task-create-form";

export default function NewTaskPage({
  searchParams,
}: Readonly<{ searchParams?: { group?: string } }>) {
  return (
    <>
      <div className="toolbar">
        <div>
          <Link className="breadcrumbs" href="/tasks">
            <ArrowLeft size={15} />
            Retour a la synthese
          </Link>
          <h2>Nouvelle tache</h2>
          <p className="muted">
            Ajoutez une tache a un groupe existant et affectez-la a un
            responsable.
          </p>
        </div>
      </div>
      <section className="task-create-panel card">
        <TaskCreateForm defaultGroupId={searchParams?.group} />
      </section>
    </>
  );
}
