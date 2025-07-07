import type { Section, SectionInventory } from "./sections.types";

export interface ConsumptionModalProps {
  section: Section;
  inventoryItem: SectionInventory | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}