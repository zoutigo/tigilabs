import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function TaskForm() {
  return (
    <form className="card form">
      <h3>Nouvelle tache</h3>
      <Input label="Titre" name="title" placeholder="Titre de la tache" />
      <label className="form">
        <span>Description</span>
        <textarea name="description" rows={4} placeholder="Contexte et resultat attendu" />
      </label>
      <label className="form">
        <span>Priorite</span>
        <select name="priority" defaultValue="MEDIUM">
          <option value="LOW">Basse</option>
          <option value="MEDIUM">Moyenne</option>
          <option value="HIGH">Haute</option>
          <option value="URGENT">Urgente</option>
        </select>
      </label>
      <Button type="submit">Creer</Button>
    </form>
  );
}
