const prisma = require("../../config/prisma");

const DEFAULTS = {
  nameUr: "دارالعلوم پسوال اینڈ ایجوکیشن سینٹر لالہ موسیٰ",
  nameEn: "Darul Uloom Paswal & education centre Lalamusa",
  addressUr: "دولانوالہ روڈ چنوں بھوجہ تحصیل کھاریاں ضلع گجرات",
  addressEn: "Dullanwala Road Chanu Bhoja Tehsil Kharian District Gujrat",
  affiliationUr: "ملحقہ وفاق المدارس العربیہ پاکستان",
  affiliationEn: "Affiliated with Wafaq-ul-Madaris Al-Arabia Pakistan",
  affiliationNumberUr: "الحاق نمبر 11449",
  affiliationNumberEn: "Affiliation No. 11449"
};

function serialize(row) {
  return {
    nameUr: row.nameUr ?? "",
    nameEn: row.nameEn ?? "",
    addressUr: row.addressUr ?? "",
    addressEn: row.addressEn ?? "",
    affiliationUr: row.affiliationUr ?? "",
    affiliationEn: row.affiliationEn ?? "",
    affiliationNumberUr: row.affiliationNumberUr ?? "",
    affiliationNumberEn: row.affiliationNumberEn ?? ""
  };
}

async function getInstitution() {
  const row = await prisma.institutionSettings.findUnique({ where: { id: "default" } });
  if (!row) return { ...DEFAULTS };
  return serialize(row);
}

async function putInstitution(data) {
  const row = await prisma.institutionSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      nameUr: data.nameUr ?? DEFAULTS.nameUr,
      nameEn: data.nameEn ?? DEFAULTS.nameEn,
      addressUr: data.addressUr ?? DEFAULTS.addressUr,
      addressEn: data.addressEn ?? DEFAULTS.addressEn,
      affiliationUr: data.affiliationUr ?? DEFAULTS.affiliationUr,
      affiliationEn: data.affiliationEn ?? DEFAULTS.affiliationEn,
      affiliationNumberUr: data.affiliationNumberUr ?? DEFAULTS.affiliationNumberUr,
      affiliationNumberEn: data.affiliationNumberEn ?? DEFAULTS.affiliationNumberEn
    },
    update: {
      nameUr: data.nameUr ?? "",
      nameEn: data.nameEn ?? "",
      addressUr: data.addressUr ?? "",
      addressEn: data.addressEn ?? "",
      affiliationUr: data.affiliationUr ?? "",
      affiliationEn: data.affiliationEn ?? "",
      affiliationNumberUr: data.affiliationNumberUr ?? "",
      affiliationNumberEn: data.affiliationNumberEn ?? ""
    }
  });
  return serialize(row);
}

module.exports = { getInstitution, putInstitution };
