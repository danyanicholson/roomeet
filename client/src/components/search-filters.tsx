import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";

interface SearchFiltersProps {
  onFilterChange: (filters: any) => void;
}

export default function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  return (
    <div className="p-4 space-y-4 bg-card rounded-lg">
      <div>
        <Label>Location</Label>
        <Input
          placeholder="Search by location..."
          onChange={(e) => onFilterChange({ location: e.target.value })}
        />
      </div>

      <div>
        <Label>Room Type</Label>
        <Select onValueChange={(value) => onFilterChange({ roomType: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select room type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">Private Room</SelectItem>
            <SelectItem value="shared">Shared Room</SelectItem>
            <SelectItem value="entire">Entire Place</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Price Range</Label>
        <Slider
          defaultValue={[0]}
          max={5000}
          step={100}
          onValueChange={(value) => onFilterChange({ price: value[0] })}
        />
      </div>
    </div>
  );
}
