import { Filter, Search } from "lucide-react";
import type { MaterialCategory } from "../../types";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";

type StatusFilterValue = "all" | "active" | "inactive";
type CategoryFilterValue = MaterialCategory | "";

type Option<T = string> = {
  value: T;
  label: string;
};

type StatusOption = Option<StatusFilterValue>;
type CategoryOption = Option<CategoryFilterValue>;

type RawMaterialsFiltersProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  categoryFilter: CategoryFilterValue;
  setCategoryFilter: (value: CategoryFilterValue) => void;
  statusFilter: StatusFilterValue;
  setStatusFilter: (value: StatusFilterValue) => void;
  categoryOptions: CategoryOption[];
  statusOptions: StatusOption[];
};

export const RawMaterialsFilters = ({ searchTerm, setSearchTerm, categoryFilter, setCategoryFilter, statusFilter, setStatusFilter, categoryOptions, statusOptions }: RawMaterialsFiltersProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input placeholder="Search materials..." value={searchTerm} onValueChange={setSearchTerm} leftIcon={<Search className="w-4 h-4" />} />

        <Select placeholder="Filter by category" options={[{ value: "", label: "All Categories" }, ...categoryOptions]} value={categoryFilter} onChange={value => setCategoryFilter(value as CategoryFilterValue)} />

        <Select placeholder="Filter by status" options={statusOptions} value={statusFilter} onChange={value => setStatusFilter(value as StatusFilterValue)} />

        <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />} onClick={() => {}}>
          Advanced Filters
        </Button>
      </div>
    </div>
  );
};
