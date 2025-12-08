// Mock medicine database for autocomplete
// In production, this could be replaced with an external API or a proper database

export type MedicineSuggestion = {
  name: string;
  commonDosages: string[];
  commonFrequencies: string[];
};

const MEDICINE_DATABASE: MedicineSuggestion[] = [
  {
    name: "Paracetamol",
    commonDosages: ["500mg", "650mg"],
    commonFrequencies: ["Once daily", "Twice daily", "Three times daily", "Four times daily", "As needed"],
  },
  {
    name: "Ibuprofen",
    commonDosages: ["200mg", "400mg", "600mg"],
    commonFrequencies: ["Once daily", "Twice daily", "Three times daily", "As needed"],
  },
  {
    name: "Amoxicillin",
    commonDosages: ["250mg", "500mg"],
    commonFrequencies: ["Twice daily", "Three times daily"],
  },
  {
    name: "Azithromycin",
    commonDosages: ["250mg", "500mg"],
    commonFrequencies: ["Once daily"],
  },
  {
    name: "Ciprofloxacin",
    commonDosages: ["250mg", "500mg", "750mg"],
    commonFrequencies: ["Twice daily"],
  },
  {
    name: "Doxycycline",
    commonDosages: ["100mg"],
    commonFrequencies: ["Once daily", "Twice daily"],
  },
  {
    name: "Metformin",
    commonDosages: ["500mg", "850mg", "1000mg"],
    commonFrequencies: ["Once daily", "Twice daily", "Three times daily"],
  },
  {
    name: "Omeprazole",
    commonDosages: ["20mg", "40mg"],
    commonFrequencies: ["Once daily", "Twice daily"],
  },
  {
    name: "Pantoprazole",
    commonDosages: ["20mg", "40mg"],
    commonFrequencies: ["Once daily"],
  },
  {
    name: "Lisinopril",
    commonDosages: ["5mg", "10mg", "20mg", "40mg"],
    commonFrequencies: ["Once daily"],
  },
  {
    name: "Amlodipine",
    commonDosages: ["5mg", "10mg"],
    commonFrequencies: ["Once daily"],
  },
  {
    name: "Atorvastatin",
    commonDosages: ["10mg", "20mg", "40mg", "80mg"],
    commonFrequencies: ["Once daily"],
  },
  {
    name: "Levothyroxine",
    commonDosages: ["25mcg", "50mcg", "75mcg", "100mcg", "125mcg", "150mcg"],
    commonFrequencies: ["Once daily"],
  },
  {
    name: "Albuterol",
    commonDosages: ["100mcg", "200mcg"],
    commonFrequencies: ["As needed", "Twice daily", "Four times daily"],
  },
  {
    name: "Salbutamol",
    commonDosages: ["100mcg", "200mcg"],
    commonFrequencies: ["As needed", "Twice daily", "Four times daily"],
  },
  {
    name: "Cetirizine",
    commonDosages: ["10mg"],
    commonFrequencies: ["Once daily"],
  },
  {
    name: "Loratadine",
    commonDosages: ["10mg"],
    commonFrequencies: ["Once daily"],
  },
  {
    name: "Diphenhydramine",
    commonDosages: ["25mg", "50mg"],
    commonFrequencies: ["Once daily", "As needed"],
  },
  {
    name: "Ranitidine",
    commonDosages: ["150mg", "300mg"],
    commonFrequencies: ["Twice daily"],
  },
  {
    name: "Famotidine",
    commonDosages: ["20mg", "40mg"],
    commonFrequencies: ["Once daily", "Twice daily"],
  },
  {
    name: "Cephalexin",
    commonDosages: ["250mg", "500mg"],
    commonFrequencies: ["Twice daily", "Four times daily"],
  },
  {
    name: "Clindamycin",
    commonDosages: ["150mg", "300mg", "450mg"],
    commonFrequencies: ["Three times daily", "Four times daily"],
  },
  {
    name: "Metronidazole",
    commonDosages: ["250mg", "500mg"],
    commonFrequencies: ["Twice daily", "Three times daily"],
  },
  {
    name: "Prednisone",
    commonDosages: ["5mg", "10mg", "20mg"],
    commonFrequencies: ["Once daily", "Twice daily"],
  },
  {
    name: "Hydrochlorothiazide",
    commonDosages: ["12.5mg", "25mg"],
    commonFrequencies: ["Once daily"],
  },
  {
    name: "Furosemide",
    commonDosages: ["20mg", "40mg", "80mg"],
    commonFrequencies: ["Once daily", "Twice daily"],
  },
  {
    name: "Warfarin",
    commonDosages: ["1mg", "2mg", "2.5mg", "3mg", "4mg", "5mg"],
    commonFrequencies: ["Once daily"],
  },
  {
    name: "Aspirin",
    commonDosages: ["75mg", "81mg", "100mg", "325mg"],
    commonFrequencies: ["Once daily"],
  },
  {
    name: "Clopidogrel",
    commonDosages: ["75mg"],
    commonFrequencies: ["Once daily"],
  },
];

/**
 * Search medicines by name (case-insensitive partial match)
 */
export function searchMedicines(query: string): MedicineSuggestion[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const lowerQuery = query.toLowerCase().trim();
  return MEDICINE_DATABASE.filter((medicine) =>
    medicine.name.toLowerCase().includes(lowerQuery)
  ).slice(0, 10); // Limit to 10 results
}

/**
 * Get medicine suggestions for autocomplete
 */
export function getMedicineSuggestions(query: string): MedicineSuggestion[] {
  return searchMedicines(query);
}

/**
 * Get a medicine by exact name match
 */
export function getMedicineByName(name: string): MedicineSuggestion | null {
  const medicine = MEDICINE_DATABASE.find(
    (m) => m.name.toLowerCase() === name.toLowerCase()
  );
  return medicine || null;
}

