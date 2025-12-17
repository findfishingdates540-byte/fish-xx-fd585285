import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MatchFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function MatchFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
}: MatchFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search matches by name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-background border-border"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('all')}
          className={activeFilter === 'all' 
            ? 'bg-foreground text-background hover:bg-foreground/90' 
            : 'border-border hover:bg-accent'
          }
        >
          All Matches
        </Button>

        <Select defaultValue="recent">
          <SelectTrigger className="w-[140px] h-9 border-border">
            <SelectValue placeholder="Recently Active" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently Active</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="any">
          <SelectTrigger className="w-[120px] h-9 border-border">
            <SelectValue placeholder="Distance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Distance</SelectItem>
            <SelectItem value="5">Within 5 mi</SelectItem>
            <SelectItem value="10">Within 10 mi</SelectItem>
            <SelectItem value="25">Within 25 mi</SelectItem>
            <SelectItem value="50">Within 50 mi</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="any">
          <SelectTrigger className="w-[140px] h-9 border-border">
            <SelectValue placeholder="Fishing Style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Style</SelectItem>
            <SelectItem value="fly">Fly Fishing</SelectItem>
            <SelectItem value="bass">Bass Fishing</SelectItem>
            <SelectItem value="saltwater">Saltwater</SelectItem>
            <SelectItem value="ice">Ice Fishing</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
