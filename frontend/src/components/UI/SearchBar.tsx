import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Button from './Button'; // Certifique-se de que o caminho para o seu Button está correto

interface SearchBarProps {
  placeholder: string;
}

export default function SearchBar({ placeholder }: SearchBarProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchTerm) {
      setSearchParams({ search: searchTerm });
    } else {
      searchParams.delete('search');
      setSearchParams(searchParams);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center w-full max-w-md">
      <div className="relative flex-grow">
        <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="search"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full bg-white border border-gray-300 rounded-l-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      {/* O botão de pesquisa deve estar aqui, como parte do formulário do SearchBar */}
      <Button type="submit" className="rounded-l-none">
        Pesquisar
      </Button>
    </form>
  );
}
