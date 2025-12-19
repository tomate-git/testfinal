import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SpaceCard } from '../components/SpaceCard';
import { SpaceCategory } from '../types';
import { Search } from 'lucide-react';

export const Catalog: React.FC = () => {
  const { spaces } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['Tous', ...Object.values(SpaceCategory)];

  // Deduplicate logic: Group by base name (e.g. "Kiosque Gourmand")
  const getDisplaySpaces = () => {
    const processedNames = new Set();
    return spaces.filter(space => {
      // Extract base name: "Kiosque Gourmand N°1" -> "Kiosque Gourmand"
      const baseName = space.name.includes('N°') ? space.name.split('N°')[0].trim() : space.name;

      // If this type is already processed, skip it
      if (processedNames.has(baseName)) return false;

      processedNames.add(baseName);
      return true;
    });
  };

  const displaySpaces = getDisplaySpaces().filter(space => {
    const matchesCategory = selectedCategory === 'Tous' || space.category === selectedCategory;
    const matchesSearch = space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      space.description.toLowerCase().includes(searchTerm.toLowerCase());
    const isVisible = space.showInCalendar !== false;
    return matchesCategory && matchesSearch && isVisible;
  });

  return (
    <div className="min-h-screen pt-32 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Nos Espaces</h1>

          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-sm">

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-ess-500 focus:ring-1 focus:ring-ess-500 bg-white/50"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displaySpaces.map(space => (
            <SpaceCard key={space.id} space={space} />
          ))}
        </div>

        {displaySpaces.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">Aucun espace ne correspond à votre recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
};