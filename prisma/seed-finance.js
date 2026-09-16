const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/** Calendar day N days ago, stored as UTC midnight so date-only serialization stays stable. */
function daysAgo(days) {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - days));
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function previousMonthKey(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return monthKey(d);
}

function pick(list, index) {
  return list[index % list.length];
}

function amount(base, variance, seed) {
  const jitter = ((seed * 37) % (variance * 2 + 1)) - variance;
  return Math.max(500, base + jitter);
}

async function clearFinanceData(client) {
  await client.cashTransaction.deleteMany();
  await client.salaryRecord.deleteMany();
  await client.khataEntry.deleteMany();
  await client.supplyExpense.deleteMany();
  await client.financeInventoryItem.deleteMany();
  await client.financeSponsor.deleteMany();
}

/**
 * Seeds ~30 days of finance activity for dashboard charts and KPI cards.
 * @param {import("@prisma/client").PrismaClient} [client]
 * @param {{ force?: boolean }} [options] - force=true clears existing finance rows first
 */
async function seedFinanceDemoData(client = prisma, options = {}) {
  const force = Boolean(options.force);
  const existing = await client.cashTransaction.count();

  if (existing > 0 && !force) {
    console.log("Finance demo data already present — skipping (pass force: true to replace)");
    return;
  }

  if (force && existing > 0) {
    console.log("Clearing existing finance data…");
    await clearFinanceData(client);
  }

  const thisMonth = monthKey();
  const lastMonth = previousMonthKey();
  const cashRows = [];
  const supplyRows = [];
  const khataRows = [];

  const incomeCategories = [
    { category: "Donation", base: 18000, variance: 7000, description: "Community donation" },
    { category: "Fees", base: 12000, variance: 4000, description: "Student fee collection" },
    { category: "Sponsorship", base: 25000, variance: 5000, description: "Monthly sponsor remittance" },
    { category: "Zakat", base: 15000, variance: 6000, description: "Zakat contribution" },
    { category: "Sadaqah", base: 5000, variance: 2000, description: "Sadaqah collection" }
  ];

  const expenseCategories = [
    { category: "Utilities", base: 8000, variance: 3000, description: "Electricity / gas bill" },
    { category: "Maintenance", base: 6000, variance: 2500, description: "Building maintenance" },
    { category: "Kitchen", base: 9500, variance: 3500, description: "Kitchen supplies & rations" },
    { category: "Transport", base: 4500, variance: 1500, description: "Transport / fuel" },
    { category: "Stationery", base: 2500, variance: 800, description: "Books and stationery" },
    { category: "Medical", base: 3500, variance: 1200, description: "Student medical aid" }
  ];

  // ~30 days of cash flow: most weekdays have 1–2 inflows and 1–2 outflows
  for (let day = 29; day >= 0; day -= 1) {
    const date = daysAgo(day);
    const weekday = date.getUTCDay(); // 0 Sun … 6 Sat
    const isWeekend = weekday === 0 || weekday === 5 || weekday === 6;

    if (!isWeekend || day % 3 === 0) {
      const inCat = pick(incomeCategories, day + 1);
      cashRows.push({
        type: "IN",
        amount: amount(inCat.base, inCat.variance, day * 3 + 1),
        date,
        category: inCat.category,
        description: `${inCat.description} (day -${day})`,
        reference: day % 4 === 0 ? `IN-${1000 + day}` : null
      });
    }

    if (!isWeekend || day % 2 === 0) {
      const outCat = pick(expenseCategories, day + 2);
      cashRows.push({
        type: "OUT",
        amount: amount(outCat.base, outCat.variance, day * 5 + 2),
        date,
        category: outCat.category,
        description: `${outCat.description} (day -${day})`,
        reference: day % 5 === 0 ? `OUT-${2000 + day}` : null
      });
    }

    // Extra mid-month donation spike for visible chart peaks
    if (day === 14 || day === 7 || day === 3) {
      cashRows.push({
        type: "IN",
        amount: amount(45000, 8000, day * 11),
        date,
        category: "Donation",
        description: "Special Friday / event collection",
        reference: `EVT-${3000 + day}`
      });
    }

    // Weekly vegetables + occasional wood / construction
    if (weekday === 1 || weekday === 4) {
      const vegAmount = amount(6500, 1500, day * 7);
      const vegPaid = day % 3 === 0 ? vegAmount : day % 3 === 1 ? Math.round(vegAmount * 0.5) : 0;
      supplyRows.push({
        category: "VEGETABLES",
        amount: vegAmount,
        date,
        description: "Weekly vegetables for kitchen",
        vendor: "Sabzi Mandi",
        payDate: vegPaid > 0 ? date : null,
        payerName: vegPaid > 0 ? "Kitchen Manager" : null,
        paidAmount: vegPaid,
        pendingAmount: Math.max(0, vegAmount - vegPaid),
        quantity: amount(40, 15, day * 5)
      });
    }
    if (day === 20 || day === 10 || day === 2) {
      const woodAmount = amount(14000, 3000, day * 13);
      const woodPaid = day === 2 ? woodAmount : Math.round(woodAmount * 0.6);
      supplyRows.push({
        category: "WOOD",
        amount: woodAmount,
        date,
        description: "Firewood delivery",
        vendor: "Timber Depot",
        payDate: date,
        payerName: "Admin Office",
        paidAmount: woodPaid,
        pendingAmount: Math.max(0, woodAmount - woodPaid),
        quantity: amount(8, 3, day * 11)
      });
    }
    if (day === 18 || day === 5) {
      const buildAmount = amount(22000, 5000, day * 17);
      supplyRows.push({
        category: "CONSTRUCTION",
        amount: buildAmount,
        date,
        description: "Minor construction / repair materials",
        vendor: "BuildMart",
        payDate: null,
        payerName: null,
        paidAmount: 0,
        pendingAmount: buildAmount,
        quantity: amount(12, 4, day * 19)
      });
    }
  }

  // Khata ledger over the month
  const parties = ["Al-Rahman Traders", "City Hardware", "Green Farm Dairy", "Noor Book House"];
  for (let i = 0; i < 12; i += 1) {
    const day = 28 - i * 2;
    const party = pick(parties, i);
    const creditAmount = amount(8000, 3000, i * 19);
    const creditSettled = i % 3 === 0 ? Math.round(creditAmount * 0.4) : i % 3 === 1 ? creditAmount : 0;
    khataRows.push({
      partyName: party,
      type: "CREDIT",
      amount: creditAmount,
      settledAmount: creditSettled,
      date: daysAgo(day),
      description: `Goods on credit from ${party}`
    });
    if (i % 2 === 0) {
      const debitAmount = amount(4000, 1500, i * 23);
      khataRows.push({
        partyName: party,
        type: "DEBIT",
        amount: debitAmount,
        settledAmount: i % 4 === 0 ? debitAmount : Math.round(debitAmount * 0.5),
        date: daysAgo(Math.max(0, day - 3)),
        description: `Partial settlement to ${party}`
      });
    }
  }

  await client.cashTransaction.createMany({ data: cashRows });

  await client.salaryRecord.createMany({
    data: [
      {
        employeeName: "Maulana Ahmad Siddiqui",
        month: thisMonth,
        amount: 45000,
        status: "PAID",
        paidDate: daysAgo(5),
        notes: "Paid via bank transfer"
      },
      {
        employeeName: "Hafiz Usman Farooqi",
        month: thisMonth,
        amount: 38000,
        status: "PAID",
        paidDate: daysAgo(4)
      },
      {
        employeeName: "Qari Bilal Ansari",
        month: thisMonth,
        amount: 32000,
        status: "PAID",
        paidDate: daysAgo(3)
      },
      {
        employeeName: "Ustad Imran Hashmi",
        month: thisMonth,
        amount: 30000,
        status: "PENDING",
        notes: "Awaiting board approval"
      },
      {
        employeeName: "Mufti Tariq Usmani",
        month: thisMonth,
        amount: 42000,
        status: "PENDING",
        notes: "Documents incomplete"
      },
      {
        employeeName: "Sheikh Naveed Qadri",
        month: thisMonth,
        amount: 28000,
        status: "PENDING"
      },
      {
        employeeName: "Maulana Ahmad Siddiqui",
        month: lastMonth,
        amount: 45000,
        status: "PAID",
        paidDate: daysAgo(32)
      },
      {
        employeeName: "Hafiz Usman Farooqi",
        month: lastMonth,
        amount: 38000,
        status: "PAID",
        paidDate: daysAgo(31)
      }
    ]
  });

  await client.khataEntry.createMany({ data: khataRows });
  await client.supplyExpense.createMany({ data: supplyRows });

  await client.financeInventoryItem.createMany({
    data: [
      { name: "Rice (bags)", quantity: 42, unit: "bags", notes: "Store room A" },
      { name: "Cooking oil", quantity: 28, unit: "litres", notes: "Kitchen pantry" },
      { name: "Prayer mats", quantity: 120, unit: "pcs" },
      { name: "Flour (bags)", quantity: 18, unit: "bags" },
      { name: "Sugar", quantity: 15, unit: "kg" },
      { name: "Cleaning supplies", quantity: 24, unit: "kits", notes: "Hostel block" },
      { name: "Blankets", quantity: 60, unit: "pcs" },
      { name: "Gas cylinders", quantity: 6, unit: "pcs" }
    ]
  });

  await client.financeSponsor.createMany({
    data: [
      {
        name: "Abdullah Khan",
        phone: "0300-1234567",
        monthlyAmount: 25000,
        studentCount: 2,
        isActive: true
      },
      {
        name: "Fatima Welfare Trust",
        monthlyAmount: 50000,
        studentCount: 5,
        isActive: true,
        notes: "Quarterly review"
      },
      {
        name: "Haji Saeed Brothers",
        phone: "0321-9876543",
        monthlyAmount: 35000,
        studentCount: 3,
        isActive: true
      },
      {
        name: "Al-Noor Foundation",
        monthlyAmount: 75000,
        studentCount: 8,
        isActive: true,
        notes: "Sponsors Hifz class A"
      },
      {
        name: "Anonymous Donor",
        monthlyAmount: 15000,
        studentCount: 1,
        isActive: true
      },
      {
        name: "Old Town Committee",
        monthlyAmount: 20000,
        studentCount: 2,
        isActive: false,
        notes: "Paused for Ramadan planning"
      }
    ]
  });

  console.log("Finance demo data seeded (≈30 days)");
  console.log(`  Cash transactions : ${cashRows.length}`);
  console.log(`  Supply expenses   : ${supplyRows.length}`);
  console.log(`  Khata entries     : ${khataRows.length}`);
  console.log(`  Salaries          : 8`);
  console.log(`  Inventory items   : 8`);
  console.log(`  Sponsors          : 6`);
}

module.exports = { seedFinanceDemoData, clearFinanceData };
