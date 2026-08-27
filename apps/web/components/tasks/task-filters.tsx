import { Search } from "lucide-react";
import { Input } from "../ui/input";

export function TaskFilters() {
  return (
    <div className="card toolbar">
      <label className="button-row" style={{ marginTop: 0 }}>
        <Search size={18} />
        <Input name="search" placeholder="Rechercher une tache" />
      </label>
      <select defaultValue="ALL" name="status">
        <option value="ALL">Tous les statuts</option>
        <option value="TODO">A faire</option>
        <option value="IN_PROGRESS">En cours</option>
        <option value="BLOCKED">Bloquees</option>
        <option value="DONE">Terminees</option>
      </select>
    </div>
  );
}
