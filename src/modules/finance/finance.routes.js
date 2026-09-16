const router = require("express").Router();
const controller = require("./finance.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const authorize = require("../../middleware/role.middleware");
const audit = require("../../middleware/audit.middleware");
const {
  listCashSchema,
  createCashSchema,
  updateCashSchema,
  listSalarySchema,
  createSalarySchema,
  updateSalarySchema,
  listKhataSchema,
  createKhataSchema,
  updateKhataSchema,
  listSupplySchema,
  createSupplySchema,
  updateSupplySchema,
  listInventorySchema,
  createInventorySchema,
  updateInventorySchema,
  listInventoryUsageSchema,
  createInventoryUsageSchema,
  inventoryDailySummarySchema,
  listSponsorSchema,
  createSponsorSchema,
  updateSponsorSchema,
  financeIdSchema
} = require("./finance.validation");

router.use(authenticate);

const writeRoles = authorize("SUPER_ADMIN", "ADMIN", "DATA_ENTRY");
const deleteRoles = authorize("SUPER_ADMIN", "ADMIN");

router.get("/summary", controller.getSummary);
router.get("/store", controller.getStore);

router.get("/cash-transactions", validate(listCashSchema), controller.listCash);
router.post(
  "/cash-transactions",
  writeRoles,
  validate(createCashSchema),
  audit("CREATE", "CASH_TRANSACTION", (_, body) => body?.data?.id),
  controller.createCash
);
router.put(
  "/cash-transactions/:id",
  writeRoles,
  validate(updateCashSchema),
  audit("UPDATE", "CASH_TRANSACTION", (req) => req.params.id),
  controller.updateCash
);
router.delete(
  "/cash-transactions/:id",
  deleteRoles,
  validate(financeIdSchema),
  audit("DELETE", "CASH_TRANSACTION", (req) => req.params.id),
  controller.deleteCash
);

router.get("/salaries", validate(listSalarySchema), controller.listSalaries);
router.post(
  "/salaries",
  writeRoles,
  validate(createSalarySchema),
  audit("CREATE", "SALARY_RECORD", (_, body) => body?.data?.id),
  controller.createSalary
);
router.put(
  "/salaries/:id",
  writeRoles,
  validate(updateSalarySchema),
  audit("UPDATE", "SALARY_RECORD", (req) => req.params.id),
  controller.updateSalary
);
router.delete(
  "/salaries/:id",
  deleteRoles,
  validate(financeIdSchema),
  audit("DELETE", "SALARY_RECORD", (req) => req.params.id),
  controller.deleteSalary
);

router.get("/khata-entries", validate(listKhataSchema), controller.listKhata);
router.post(
  "/khata-entries",
  writeRoles,
  validate(createKhataSchema),
  audit("CREATE", "KHATA_ENTRY", (_, body) => body?.data?.id),
  controller.createKhata
);
router.put(
  "/khata-entries/:id",
  writeRoles,
  validate(updateKhataSchema),
  audit("UPDATE", "KHATA_ENTRY", (req) => req.params.id),
  controller.updateKhata
);
router.delete(
  "/khata-entries/:id",
  deleteRoles,
  validate(financeIdSchema),
  audit("DELETE", "KHATA_ENTRY", (req) => req.params.id),
  controller.deleteKhata
);

router.get("/supply-expenses", validate(listSupplySchema), controller.listSupplies);
router.post(
  "/supply-expenses",
  writeRoles,
  validate(createSupplySchema),
  audit("CREATE", "SUPPLY_EXPENSE", (_, body) => body?.data?.id),
  controller.createSupply
);
router.put(
  "/supply-expenses/:id",
  writeRoles,
  validate(updateSupplySchema),
  audit("UPDATE", "SUPPLY_EXPENSE", (req) => req.params.id),
  controller.updateSupply
);
router.delete(
  "/supply-expenses/:id",
  deleteRoles,
  validate(financeIdSchema),
  audit("DELETE", "SUPPLY_EXPENSE", (req) => req.params.id),
  controller.deleteSupply
);

router.get("/inventory-items", validate(listInventorySchema), controller.listInventory);
router.post(
  "/inventory-items",
  writeRoles,
  validate(createInventorySchema),
  audit("CREATE", "FINANCE_INVENTORY", (_, body) => body?.data?.id),
  controller.createInventory
);
router.put(
  "/inventory-items/:id",
  writeRoles,
  validate(updateInventorySchema),
  audit("UPDATE", "FINANCE_INVENTORY", (req) => req.params.id),
  controller.updateInventory
);
router.delete(
  "/inventory-items/:id",
  deleteRoles,
  validate(financeIdSchema),
  audit("DELETE", "FINANCE_INVENTORY", (req) => req.params.id),
  controller.deleteInventory
);

router.get(
  "/inventory-usages",
  validate(listInventoryUsageSchema),
  controller.listInventoryUsages
);
router.get(
  "/inventory-usages/daily-summary",
  validate(inventoryDailySummarySchema),
  controller.getInventoryDailySummary
);
router.post(
  "/inventory-usages",
  writeRoles,
  validate(createInventoryUsageSchema),
  audit("CREATE", "FINANCE_INVENTORY_USAGE", (_, body) => body?.data?.id),
  controller.createInventoryUsage
);

router.get("/sponsors", validate(listSponsorSchema), controller.listSponsors);
router.post(
  "/sponsors",
  writeRoles,
  validate(createSponsorSchema),
  audit("CREATE", "FINANCE_SPONSOR", (_, body) => body?.data?.id),
  controller.createSponsor
);
router.put(
  "/sponsors/:id",
  writeRoles,
  validate(updateSponsorSchema),
  audit("UPDATE", "FINANCE_SPONSOR", (req) => req.params.id),
  controller.updateSponsor
);
router.delete(
  "/sponsors/:id",
  deleteRoles,
  validate(financeIdSchema),
  audit("DELETE", "FINANCE_SPONSOR", (req) => req.params.id),
  controller.deleteSponsor
);

module.exports = router;
