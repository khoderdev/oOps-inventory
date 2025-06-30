import { Activity, Building2, Package, Plus, PlusIcon } from "lucide-react";
import { useContext, useState } from "react";
import { AppContext } from "../../contexts/AppContext";
import useFloatingButtonVisibility from "../../hooks/useFloatingButtonVisibility";
import { useSections } from "../../hooks/useSections";
import type { Section, User } from "../../types";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import SectionCard from "./SectionCard";
import SectionDetailsModal from "./SectionDetailsModal";
import SectionForm from "./SectionForm";

const SectionsPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const {
    state: { user }
  } = useContext(AppContext) as { state: { user: User } };
  const { data: sections = [], isLoading } = useSections({ isActive: true });

  const activeSections = sections.filter(section => section.isActive);
  const totalSections = activeSections.length;

  const floating = true;

  const { visible: isVisible } = useFloatingButtonVisibility({
    minScrollDistance: 200,
    showOnTop: true
  });
  return (
    <div className="space-y-6">
      {/* Header */}
      {(user?.role === "MANAGER" || user?.role === "ADMIN") && (!floating || isVisible) && (
        <Button floating={floating} animationType="scale" threshold={15} autoHideDelay={500} minScrollDistance={200} variant="primary" leftIcon={<PlusIcon />} onClick={() => setShowCreateModal(true)}>
          Add Section
        </Button>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-lg">
          <div className="flex items-center">
            <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Sections</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{totalSections}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-lg">
          <div className="flex items-center">
            <Building2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Kitchen Sections</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-300">{activeSections.filter(s => s.type === "kitchen").length}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-lg">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Bar Sections</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">{activeSections.filter(s => s.type === "bar").length}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-6 rounded-lg">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Storage Sections</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{activeSections.filter(s => s.type === "storage").length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      ) : activeSections.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-300 mb-2">No sections yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first section to start organizing your inventory</p>
          {user?.role === "MANAGER" || user?.role === "ADMIN" ? (
            <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Create First Section
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeSections.map(section => (
            <SectionCard key={section.id} section={section} onView={() => setSelectedSection(section)} onEdit={() => setEditingSection(section)} />
          ))}
        </div>
      )}

      {/* Create Section Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Section" size="lg">
        <SectionForm
          onSuccess={() => {
            setShowCreateModal(false);
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Section Modal */}
      <Modal isOpen={!!editingSection} onClose={() => setEditingSection(null)} title="Edit Section" size="lg">
        {editingSection && (
          <SectionForm
            initialData={editingSection}
            onSuccess={() => {
              setEditingSection(null);
            }}
            onCancel={() => setEditingSection(null)}
          />
        )}
      </Modal>

      {/* Section Details Modal */}
      <SectionDetailsModal section={selectedSection} isOpen={!!selectedSection} onClose={() => setSelectedSection(null)} />
    </div>
  );
};

export default SectionsPage;
