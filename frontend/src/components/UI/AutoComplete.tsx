import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface AutocompleteOption {
  id: number | string;
  label: string;
}

interface AutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string, id?: number | string) => void;
  options: AutocompleteOption[];
  loading?: boolean;
  error?: string;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  label,
  placeholder = 'Digite para buscar...',
  value,
  onChange,
  options,
  loading = false,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<AutocompleteOption[]>(options);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    setIsOpen(true);

    if (!inputValue.trim()) {
      setFilteredOptions(options);
      return;
    }

    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredOptions(filtered);
  };

  const handleSelectOption = (option: AutocompleteOption) => {
    onChange(option.label, option.id);
    setIsOpen(false);
  };

  return (
    <div className="w-full" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            className={`w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
              error ? 'border-red-500' : ''
            }`}
            placeholder={placeholder}
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </div>
        </div>

        {isOpen && filteredOptions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-blue-50 transition cursor-pointer"
                onClick={() => handleSelectOption(option)}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {isOpen && filteredOptions.length === 0 && value.trim() && !loading && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
            Nenhum resultado encontrado
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
