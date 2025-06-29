import Dexie, { type EntityTable } from "dexie";
import type { RawMaterial, StockEntry, StockMovement, Section, SectionInventory, SectionConsumption } from "../types";

export interface InventoryDB {
  rawMaterials: EntityTable<RawMaterial, "id">;
  stockEntries: EntityTable<StockEntry, "id">;
  stockMovements: EntityTable<StockMovement, "id">;
  sections: EntityTable<Section, "id">;
  sectionInventory: EntityTable<SectionInventory, "id">;
  sectionConsumption: EntityTable<SectionConsumption, "id">;
  orderCounter: EntityTable<{ id: string; lastOrderNumber: number }, "id">;
}

export const db = new Dexie("InventoryDatabase") as Dexie & InventoryDB;

// Define schemas
db.version(1).stores({
  rawMaterials: "&id, name, category, unit, isActive, createdAt, updatedAt",
  stockEntries: "&id, rawMaterialId, receivedDate, createdAt, updatedAt, batchNumber, supplier",
  stockMovements: "&id, stockEntryId, type, fromSectionId, toSectionId, createdAt, performedBy",
  sections: "&id, name, type, managerId, isActive, createdAt, updatedAt",
  sectionInventory: "&id, sectionId, rawMaterialId, lastUpdated",
  sectionConsumption: "&id, sectionId, rawMaterialId, consumedDate, consumedBy",
  orderCounter: "&id, lastOrderNumber"
});

// Hooks for automatic timestamps
db.rawMaterials.hook("creating", function (_primKey, obj: RawMaterial) {
  obj.id = obj.id || crypto.randomUUID();
  obj.createdAt = new Date();
  obj.updatedAt = new Date();
});

db.rawMaterials.hook("updating", function (modifications: Partial<RawMaterial>) {
  modifications.updatedAt = new Date();
});

db.stockEntries.hook("creating", function (_primKey, obj: StockEntry) {
  obj.id = obj.id || crypto.randomUUID();
  obj.createdAt = new Date();
  obj.updatedAt = new Date();
  obj.totalCost = obj.quantity * obj.unitCost;
});

db.stockEntries.hook("updating", function (modifications: Partial<StockEntry>, _primKey, obj: StockEntry) {
  modifications.updatedAt = new Date();
  if (modifications.quantity || modifications.unitCost) {
    const quantity = modifications.quantity ?? obj.quantity;
    const unitCost = modifications.unitCost ?? obj.unitCost;
    modifications.totalCost = quantity * unitCost;
  }
});

db.stockMovements.hook("creating", function (_primKey, obj: StockMovement) {
  obj.id = obj.id || crypto.randomUUID();
  obj.createdAt = new Date();
  obj.updatedAt = new Date();
});

db.stockMovements.hook("updating", function (modifications: Partial<StockMovement>) {
  modifications.updatedAt = new Date();
});

db.sections.hook("creating", function (_primKey, obj: Section) {
  obj.id = obj.id || crypto.randomUUID();
  obj.createdAt = new Date();
  obj.updatedAt = new Date();
});

db.sections.hook("updating", function (modifications: Partial<Section>) {
  modifications.updatedAt = new Date();
});

db.sectionInventory.hook("creating", function (_primKey, obj: SectionInventory) {
  obj.id = obj.id || crypto.randomUUID();
  obj.createdAt = new Date();
  obj.updatedAt = new Date();
  obj.lastUpdated = new Date();
});

db.sectionInventory.hook("updating", function (modifications: Partial<SectionInventory>) {
  modifications.updatedAt = new Date();
  modifications.lastUpdated = new Date();
});

db.sectionConsumption.hook("creating", function (_primKey, obj: SectionConsumption) {
  obj.id = obj.id || crypto.randomUUID();
  obj.createdAt = new Date();
  obj.updatedAt = new Date();
});

db.sectionConsumption.hook("updating", function (modifications: Partial<SectionConsumption>) {
  modifications.updatedAt = new Date();
});

db.orderCounter.hook("creating", function (_primKey, obj: { id: string; lastOrderNumber: number }) {
  obj.id = obj.id || crypto.randomUUID();
});

export default db;
