'use client';

import React, { useState } from 'react';

interface PhoneInputProps {
  label?: string;
  value: string;
  countryCode: string;
  onValueChange: (value: string) => void;
  onCountryCodeChange: (code: string) => void;
  error?: boolean;
}

const countryCodes = [
  // América (ordem alfabética)
  { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina', placeholder: '11 2345-6789' },
  { code: '+1268', country: 'AG', flag: '🇦🇬', name: 'Antígua e Barbuda', placeholder: '268 123 4567' },
  { code: '+1242', country: 'BS', flag: '🇧🇸', name: 'Bahamas', placeholder: '242 123 4567' },
  { code: '+1246', country: 'BB', flag: '🇧🇧', name: 'Barbados', placeholder: '246 123 4567' },
  { code: '+501', country: 'BZ', flag: '🇧🇿', name: 'Belize', placeholder: '612 3456' },
  { code: '+591', country: 'BO', flag: '🇧🇴', name: 'Bolívia', placeholder: '7 123 4567' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brasil', placeholder: '(11) 99999-9999' },
  { code: '+1', country: 'CA', flag: '🇨🇦', name: 'Canadá', placeholder: '(555) 123-4567' },
  { code: '+56', country: 'CL', flag: '🇨🇱', name: 'Chile', placeholder: '9 1234 5678' },
  { code: '+57', country: 'CO', flag: '🇨🇴', name: 'Colômbia', placeholder: '301 123 4567' },
  { code: '+506', country: 'CR', flag: '🇨🇷', name: 'Costa Rica', placeholder: '8123 4567' },
  { code: '+53', country: 'CU', flag: '🇨🇺', name: 'Cuba', placeholder: '5 123 4567' },
  { code: '+1767', country: 'DM', flag: '🇩🇲', name: 'Dominica', placeholder: '767 123 4567' },
  { code: '+1809', country: 'DO', flag: '🇩🇴', name: 'República Dominicana', placeholder: '809 123 4567' },
  { code: '+593', country: 'EC', flag: '🇪🇨', name: 'Equador', placeholder: '99 123 4567' },
  { code: '+503', country: 'SV', flag: '🇸🇻', name: 'El Salvador', placeholder: '7123 4567' },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'Estados Unidos', placeholder: '(555) 123-4567' },
  { code: '+502', country: 'GT', flag: '🇬🇹', name: 'Guatemala', placeholder: '5123 4567' },
  { code: '+592', country: 'GY', flag: '🇬🇾', name: 'Guiana', placeholder: '609 1234' },
  { code: '+509', country: 'HT', flag: '🇭🇹', name: 'Haiti', placeholder: '34 12 3456' },
  { code: '+504', country: 'HN', flag: '🇭🇳', name: 'Honduras', placeholder: '9123 4567' },
  { code: '+1876', country: 'JM', flag: '🇯🇲', name: 'Jamaica', placeholder: '876 123 4567' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'México', placeholder: '55 1234 5678' },
  { code: '+505', country: 'NI', flag: '🇳🇮', name: 'Nicarágua', placeholder: '8123 4567' },
  { code: '+507', country: 'PA', flag: '🇵🇦', name: 'Panamá', placeholder: '6123 4567' },
  { code: '+595', country: 'PY', flag: '🇵🇾', name: 'Paraguai', placeholder: '961 123 456' },
  { code: '+51', country: 'PE', flag: '🇵🇪', name: 'Peru', placeholder: '987 654 321' },
  { code: '+1787', country: 'PR', flag: '🇵🇷', name: 'Porto Rico', placeholder: '787 123 4567' },
  { code: '+1869', country: 'KN', flag: '🇰🇳', name: 'São Cristóvão e Neves', placeholder: '869 123 4567' },
  { code: '+1758', country: 'LC', flag: '🇱🇨', name: 'Santa Lúcia', placeholder: '758 123 4567' },
  { code: '+1784', country: 'VC', flag: '🇻🇨', name: 'São Vicente e Granadinas', placeholder: '784 123 4567' },
  { code: '+1473', country: 'GD', flag: '🇬🇩', name: 'Granada', placeholder: '473 123 4567' },
  { code: '+597', country: 'SR', flag: '🇸🇷', name: 'Suriname', placeholder: '612 3456' },
  { code: '+1868', country: 'TT', flag: '🇹🇹', name: 'Trinidad e Tobago', placeholder: '868 123 4567' },
  { code: '+598', country: 'UY', flag: '🇺🇾', name: 'Uruguai', placeholder: '92 123 456' },
  { code: '+58', country: 'VE', flag: '🇻🇪', name: 'Venezuela', placeholder: '412 123 4567' },
  // Europa (ordem alfabética)
  { code: '+355', country: 'AL', flag: '🇦🇱', name: 'Albânia', placeholder: '67 123 4567' },
  { code: '+376', country: 'AD', flag: '🇦🇩', name: 'Andorra', placeholder: '312 345' },
  { code: '+43', country: 'AT', flag: '🇦🇹', name: 'Áustria', placeholder: '660 123456' },
  { code: '+32', country: 'BE', flag: '🇧🇪', name: 'Bélgica', placeholder: '470 12 34 56' },
  { code: '+375', country: 'BY', flag: '🇧🇾', name: 'Bielorrússia', placeholder: '29 123 45 67' },
  { code: '+387', country: 'BA', flag: '🇧🇦', name: 'Bósnia e Herzegovina', placeholder: '61 234 567' },
  { code: '+359', country: 'BG', flag: '🇧🇬', name: 'Bulgária', placeholder: '87 123 4567' },
  { code: '+357', country: 'CY', flag: '🇨🇾', name: 'Chipre', placeholder: '96 123456' },
  { code: '+385', country: 'HR', flag: '🇭🇷', name: 'Croácia', placeholder: '92 123 4567' },
  { code: '+45', country: 'DK', flag: '🇩🇰', name: 'Dinamarca', placeholder: '20 12 34 56' },
  { code: '+421', country: 'SK', flag: '🇸🇰', name: 'Eslováquia', placeholder: '912 123 456' },
  { code: '+386', country: 'SI', flag: '🇸🇮', name: 'Eslovênia', placeholder: '31 234 567' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Espanha', placeholder: '612 34 56 78' },
  { code: '+372', country: 'EE', flag: '🇪🇪', name: 'Estônia', placeholder: '5123 4567' },
  { code: '+358', country: 'FI', flag: '🇫🇮', name: 'Finlândia', placeholder: '40 123 4567' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'França', placeholder: '6 12 34 56 78' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Alemanha', placeholder: '151 23456789' },
  { code: '+30', country: 'GR', flag: '🇬🇷', name: 'Grécia', placeholder: '691 234 5678' },
  { code: '+36', country: 'HU', flag: '🇭🇺', name: 'Hungria', placeholder: '20 123 4567' },
  { code: '+354', country: 'IS', flag: '🇮🇸', name: 'Islândia', placeholder: '611 1234' },
  { code: '+353', country: 'IE', flag: '🇮🇪', name: 'Irlanda', placeholder: '87 123 4567' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Itália', placeholder: '312 345 6789' },
  { code: '+383', country: 'XK', flag: '🇽🇰', name: 'Kosovo', placeholder: '43 123 456' },
  { code: '+371', country: 'LV', flag: '🇱🇻', name: 'Letônia', placeholder: '21 234 567' },
  { code: '+423', country: 'LI', flag: '🇱🇮', name: 'Liechtenstein', placeholder: '661 234 567' },
  { code: '+370', country: 'LT', flag: '🇱🇹', name: 'Lituânia', placeholder: '612 34567' },
  { code: '+352', country: 'LU', flag: '🇱🇺', name: 'Luxemburgo', placeholder: '628 123 456' },
  { code: '+389', country: 'MK', flag: '🇲🇰', name: 'Macedônia do Norte', placeholder: '72 123 456' },
  { code: '+356', country: 'MT', flag: '🇲🇹', name: 'Malta', placeholder: '7912 3456' },
  { code: '+373', country: 'MD', flag: '🇲🇩', name: 'Moldávia', placeholder: '69 123 456' },
  { code: '+377', country: 'MC', flag: '🇲🇨', name: 'Mônaco', placeholder: '6 12 34 56 78' },
  { code: '+382', country: 'ME', flag: '🇲🇪', name: 'Montenegro', placeholder: '67 123 456' },
  { code: '+31', country: 'NL', flag: '🇳🇱', name: 'Países Baixos', placeholder: '6 12 34 56 78' },
  { code: '+47', country: 'NO', flag: '🇳🇴', name: 'Noruega', placeholder: '406 12 345' },
  { code: '+48', country: 'PL', flag: '🇵🇱', name: 'Polônia', placeholder: '512 345 678' },
  { code: '+351', country: 'PT', flag: '🇵🇹', name: 'Portugal', placeholder: '912 345 678' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'Reino Unido', placeholder: '7400 123456' },
  { code: '+420', country: 'CZ', flag: '🇨🇿', name: 'República Tcheca', placeholder: '732 123 456' },
  { code: '+40', country: 'RO', flag: '🇷🇴', name: 'Romênia', placeholder: '712 345 678' },
  { code: '+7', country: 'RU', flag: '🇷🇺', name: 'Rússia', placeholder: '912 345-67-89' },
  { code: '+378', country: 'SM', flag: '🇸🇲', name: 'San Marino', placeholder: '66 66 12 12' },
  { code: '+381', country: 'RS', flag: '🇷🇸', name: 'Sérvia', placeholder: '62 123 4567' },
  { code: '+46', country: 'SE', flag: '🇸🇪', name: 'Suécia', placeholder: '70 123 45 67' },
  { code: '+41', country: 'CH', flag: '🇨🇭', name: 'Suíça', placeholder: '78 123 45 67' },
  { code: '+90', country: 'TR', flag: '🇹🇷', name: 'Turquia', placeholder: '532 123 45 67' },
  { code: '+380', country: 'UA', flag: '🇺🇦', name: 'Ucrânia', placeholder: '67 123 4567' },
  { code: '+379', country: 'VA', flag: '🇻🇦', name: 'Vaticano', placeholder: '312 3456789' },
];

export function PhoneInput({
  label,
  value,
  countryCode,
  onValueChange,
  onCountryCodeChange,
  error,
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedCountry = countryCodes.find((c) => c.code === countryCode) || countryCodes[0];
  const placeholder = selectedCountry.placeholder;

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`h-full px-3 py-3 bg-gray-50 dark:bg-neutral-800 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2 min-w-[100px] border ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-neutral-600'}`}
          >
            <span className="text-2xl">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-gray-700 dark:text-neutral-200">{selectedCountry.code}</span>
            <svg
              className={`w-4 h-4 text-gray-500 dark:text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
              <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-600 rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
                {countryCodes.map((country) => (
                  <button
                    key={country.country}
                    type="button"
                    onClick={() => {
                      onCountryCodeChange(country.code);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left transition-colors flex items-center gap-3 ${
                      country.code === countryCode
                        ? 'bg-blue-50 dark:bg-blue-950/50'
                        : 'hover:bg-gray-50 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{country.name}</div>
                      <div className="text-xs text-gray-500 dark:text-neutral-400">{country.code}</div>
                    </div>
                    {country.code === countryCode && (
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <input
          type="tel"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 px-4 py-3 rounded-lg border bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${error ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-neutral-600 focus:ring-blue-500 dark:focus:ring-blue-400'}`}
          suppressHydrationWarning
        />
      </div>
    </div>
  );
}
