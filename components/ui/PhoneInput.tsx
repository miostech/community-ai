'use client';

import React, { useState } from 'react';

interface PhoneInputProps {
  label?: string;
  value: string;
  countryCode: string;
  onValueChange: (value: string) => void;
  onCountryCodeChange: (code: string) => void;
}

const countryCodes = [
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brasil', placeholder: '(11) 99999-9999' },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'Estados Unidos', placeholder: '(555) 123-4567' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'Reino Unido', placeholder: '7400 123456' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Espanha', placeholder: '612 34 56 78' },
  { code: '+351', country: 'PT', flag: '🇵🇹', name: 'Portugal', placeholder: '912 345 678' },
  { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina', placeholder: '11 2345-6789' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'México', placeholder: '55 1234 5678' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'França', placeholder: '6 12 34 56 78' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Alemanha', placeholder: '151 23456789' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Itália', placeholder: '312 345 6789' },
];

export function PhoneInput({
  label,
  value,
  countryCode,
  onValueChange,
  onCountryCodeChange,
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedCountry = countryCodes.find((c) => c.code === countryCode) || countryCodes[0];
  const placeholder = selectedCountry.placeholder;

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        {/* Seletor de País */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="h-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 min-w-[100px]"
          >
            <span className="text-2xl">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-gray-700">{selectedCountry.code}</span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown */}
          {isOpen && (
            <>
              {/* Overlay para fechar ao clicar fora */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              
              {/* Lista de países */}
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
                {countryCodes.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      onCountryCodeChange(country.code);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      country.code === countryCode ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">{country.name}</div>
                      <div className="text-xs text-gray-500">{country.code}</div>
                    </div>
                    {country.code === countryCode && (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Input do Telefone */}
        <input
          type="tel"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          suppressHydrationWarning
        />
      </div>
    </div>
  );
}
