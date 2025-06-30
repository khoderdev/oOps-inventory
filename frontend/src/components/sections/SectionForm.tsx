import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../../hooks/useApp";
import { useCreateSection, useDeleteSection, useUpdateSection } from "../../hooks/useSections";
import { useActiveUsers } from "../../hooks/useUsers";
import { SectionType, type Section } from "../../types";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";

interface SectionFormProps {
  initialData?: Section;
  onSuccess: () => void;
  onCancel: () => void;
}

const SectionForm = ({ initialData, onSuccess, onCancel }: SectionFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: SectionType.OTHER,
    managerId: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { state } = useApp();
  const createMutation = useCreateSection();
  const updateMutation = useUpdateSection();
  const removeMutation = useDeleteSection();
  const { data: users = [], isLoading: usersLoading } = useActiveUsers();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || "",
        type: initialData.type,
        managerId: initialData.managerId
      });
    } else {
      // Set current user as default manager if available
      if (state.user?.id) {
        setFormData(prev => ({
          ...prev,
          managerId: state.user?.id || ""
        }));
      }
    }
  }, [initialData, state.user]);

  const sectionTypeOptions = Object.values(SectionType).map(type => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1)
  }));

  // Transform users data for the Select component
  const userOptions = users.map(user => ({
    value: user.id,
    label: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || user.email || `User ${user.id}`
  }));

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Section name is required";
    }

    if (!formData.managerId || String(formData.managerId).trim() === "") {
      newErrors.managerId = "Manager is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (initialData) {
        const result = await updateMutation.mutateAsync({
          id: initialData.id,
          ...formData
        });
        if (!result.success) {
          throw new Error(result.message || "Failed to update section");
        }
      } else {
        const result = await createMutation.mutateAsync(formData);
        if (!result.success) {
          throw new Error(result.message || "Failed to create section");
        }
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving section:", error);
      // You might want to show a toast notification here
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleDeleteClick = async () => {
    if (!initialData) return;

    if (window.confirm(`Are you sure you want to delete "${initialData.name}"? This action cannot be undone.`)) {
      try {
        await removeMutation.mutateAsync(initialData.id);
        onSuccess();
      } catch (error) {
        console.error("Error deleting section:", error);
      }
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Section Name" value={formData.name} onChange={e => handleInputChange("name", e.target.value)} error={errors.name} required placeholder="e.g., Main Kitchen, Bar Station" />

        <Select label="Section Type" options={sectionTypeOptions} value={formData.type} onChange={e => handleInputChange("type", e.target.value)} required />

        <Select label="Manager" options={userOptions} value={formData.managerId} onChange={e => handleInputChange("managerId", e.target.value)} error={errors.managerId} required placeholder={usersLoading ? "Loading users..." : "Select a manager"} disabled={usersLoading} />

        <div></div>
      </div>

      <Input label="Description" value={formData.description} onChange={e => handleInputChange("description", e.target.value)} placeholder="Optional description of this section" />

      <div className="flex justify-between items-center space-x-3 mt-10">
        {initialData && (
          <Button size="sm" variant="danger" leftIcon={<Trash2 className="w-3 h-3" />} onClick={handleDeleteClick} title="Delete section" loading={removeMutation.isPending}>
            Delete
          </Button>
        )}
        {!initialData && <div></div>}
        <div className="flex space-x-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading || removeMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading} disabled={removeMutation.isPending}>
            {initialData ? "Update" : "Create"} Section
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SectionForm;
