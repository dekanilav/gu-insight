import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Newspaper } from "@shared/schema";

interface EditionSelectorProps {
  newspapers: Newspaper[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export default function EditionSelector({ newspapers, selectedId, onSelect }: EditionSelectorProps) {
  const handleValueChange = (value: string) => {
    if (value === 'latest') {
      onSelect(null);
    } else {
      onSelect(parseInt(value));
    }
  };

  const getCurrentValue = () => {
    if (selectedId === null) return 'latest';
    return selectedId.toString();
  };

  if (newspapers.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="No editions available" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={getCurrentValue()} onValueChange={handleValueChange}>
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="latest">
          Latest Edition
        </SelectItem>
        {newspapers.map((newspaper) => (
          <SelectItem key={newspaper.id} value={newspaper.id.toString()}>
            {new Date(newspaper.date).toLocaleDateString()} - {newspaper.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
