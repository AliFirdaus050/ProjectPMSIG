// Konfigurasi checklist per kategori device. Kategori ditentukan dari
// assets.asset_name ("PC/Laptop", "Switch", "Printer") — BUKAN assets.category
// (yang cuma sub-klasifikasi, misal "Desktop Computer"/"Laptop" untuk PC/Laptop).

const CHECKLIST_CONFIG = {
  'PC/Laptop': {
    deviceSections: [
      {
        key: 'device_functions',
        title: 'Check Device Functions',
        items: [
          'Monitor / LCD',
          'RAM',
          'SSD',
          'Power Supply',
          'Keyboard',
          'Mouse',
          'Clean of the device',
          'Port and Connectivity',
        ],
      },
    ],
    standardSoftware: [
      'Operating System - Windows 11 Pro',
      'Acrobat Reader',
      'SAP GUI',
      'Office 365 (Excel, Word, Power Point, etc.)',
      'MS Office 2016 (Excel, Word, Power Point)',
      'MS Office 2013 (Excel, Word, Power Point)',
      'Ms. Teams',
      'One Drive',
      'Zoom',
      'Driver Printer MPS Client',
      'Browser - Chrome',
      'Browser - Firefox',
      'Winrar',
      'Agent Service Desk',
      'WPS',
      'Antivirus - Crowdstrike',
      'Antivirus - Tehtris',
      'Power BI',
    ],
    hasAdditionalSoftware: true,
    maxAdditionalSoftware: 6,
    hasDeviceData: false,
    hasInkStock: false,
    hasTechnicianNotes: false,
    signatureBlocks: ['IT Site Operations', 'User', 'Technician'],
    hasPic: true,
  },

  Switch: {
    deviceSections: [
      {
        key: 'device_functions',
        title: 'Check Device Functions',
        items: [
          'LED Indikator Power',
          'LED Indikator System',
          'LED Indikator Port',
          'Port SFP',
          'Cooling fan',
          'Clean Network Interfaces',
          'Fisik Port (LAN + SFP)',
        ],
      },
      {
        key: 'device_utilization',
        title: 'Device Utilization',
        // Diisi Normal/Error + angka aktual di kolom Information (sesuai konfirmasi)
        items: ['Processor (%)', 'Memory (%)', 'Temperature (°C)'],
      },
    ],
    standardSoftware: null,
    hasAdditionalSoftware: false,
    hasDeviceData: false,
    hasInkStock: false,
    hasTechnicianNotes: true,
    signatureBlocks: ['IT Site Operation', 'Technician'],
    hasPic: false,
  },

  Printer: {
    deviceSections: [
      {
        key: 'device_functions',
        title: 'Check Device Functions',
        items: [
          'Device button',
          'LED system',
          'Head/Cartridge/Toner',
          'Roller printer',
          'Scanner',
          'LAN/USB port',
          'Power supply',
          'Clean of the device',
        ],
      },
    ],
    standardSoftware: null,
    hasAdditionalSoftware: false,
    hasDeviceData: true, // firmware_series (teks) + consumable_type (dropdown)
    consumableTypeOptions: ['Ink type', 'Toner type', 'Ribbon type'],
    hasInkStock: true, // black, cyan, magenta, yellow — free text
    hasTechnicianNotes: true,
    signatureBlocks: ['Person In Charge, SIG', 'PIC', 'Officer Preventive Maintenance'],
    hasPic: true,
  },
};

function getChecklistConfig(assetName) {
  return CHECKLIST_CONFIG[assetName] || null;
}

// Semua device item lintas section (dipakai untuk validasi kelengkapan sebelum generate PDF, FR-4)
function getAllDeviceItems(assetName) {
  const config = getChecklistConfig(assetName);
  if (!config) return [];
  return config.deviceSections.flatMap((section) => section.items);
}

module.exports = { CHECKLIST_CONFIG, getChecklistConfig, getAllDeviceItems };