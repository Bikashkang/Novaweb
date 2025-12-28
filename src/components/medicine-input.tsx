"use client";
import { useState, useRef, useEffect } from "react";
import type { Medicine } from "@/lib/prescriptions/prescriptions";
import { getMedicineSuggestions, getMedicineByName } from "@/lib/prescriptions/medicines";

type MedicineInputProps = {
  value: Medicine;
  onChange: (medicine: Medicine) => void;
  onRemove: () => void;
};

export function MedicineInput({ value, onChange, onRemove }: MedicineInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNameChange = (name: string) => {
    onChange({ ...value, name });
    
    if (name.length > 0) {
      const medicineSuggestions = getMedicineSuggestions(name);
      setSuggestions(medicineSuggestions.map((m) => m.name));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (medicineName: string) => {
    const medicine = getMedicineByName(medicineName);
    if (medicine) {
      onChange({
        name: medicineName,
        dosage: medicine.commonDosages[0] || "",
        frequency: medicine.commonFrequencies[0] || "",
        duration: value.duration,
        instructions: value.instructions,
      });
    } else {
      onChange({ ...value, name: medicineName });
    }
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  return (
    <div className="border border-slate-300 rounded-lg p-4 space-y-3 bg-white">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-3">
          {/* Medicine name with autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Medicine Name *
            </label>
            <input
              ref={inputRef}
              type="text"
              value={value.name}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder="Type medicine name..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dosage, Frequency, Duration in a row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Dosage *
              </label>
              <input
                type="text"
                value={value.dosage}
                onChange={(e) => onChange({ ...value, dosage: e.target.value })}
                placeholder="e.g., 500mg"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Frequency *
              </label>
              <input
                type="text"
                value={value.frequency}
                onChange={(e) => onChange({ ...value, frequency: e.target.value })}
                placeholder="e.g., Twice daily"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Duration *
              </label>
              <input
                type="text"
                value={value.duration}
                onChange={(e) => onChange({ ...value, duration: e.target.value })}
                placeholder="e.g., 7 days"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Instructions
            </label>
            <textarea
              value={value.instructions}
              onChange={(e) => onChange({ ...value, instructions: e.target.value })}
              placeholder="Additional instructions (e.g., Take with food, Avoid alcohol)"
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={onRemove}
          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg"
          title="Remove medicine"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

