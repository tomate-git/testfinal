
import React from 'react';
import { Space } from '../types';
import { Check, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

interface SpaceCardProps {
  space: Space;
}

export const SpaceCard: React.FC<SpaceCardProps> = ({ space }) => {
  const { user } = useApp();
  const navigate = useNavigate();

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Logic: If not logged in, always redirect to login first, 
    // whether it is for Booking or Quote ("Devis").
    if (!user) {
      navigate('/login');
      return;
    }

    if (space.pricing.isQuote) {
      // Redirect to contact form for quote
      navigate(`/contact?space=${space.id}`);
      return;
    }

    // Proceed to booking
    navigate(`/booking/${space.id}`);
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
      <div className="relative h-48 bg-slate-200">
        <img src={space.image} alt={space.name} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-ess-900 uppercase tracking-wider">
          {space.category}
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start mb-2">
          <h3 className="text-xl font-bold text-slate-900">{space.name.includes('N°') ? space.name.split('N°')[0].trim() : space.name}</h3>
        </div>
        <p className="text-slate-600 text-sm mb-4 flex-1">{space.description}</p>
        
        <div className="space-y-1 mb-6">
            {space.features.slice(0, 2).map((feat, idx) => (
                <div key={idx} className="flex items-center text-xs text-slate-500">
                    <Check size={12} className="text-green-500 mr-2" />
                    {feat}
                </div>
            ))}
        </div>

        <div className="border-t border-slate-100 pt-4 mt-auto">
          {!space.pricing.isQuote && (
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold">Tarif à partir de</p>
                <p className="text-lg font-bold text-ess-600">
                  {space.pricing.day || space.pricing.day === 0 ? (
                    space.pricing.day === 0 ? 'Gratuit' : `${space.pricing.day}${space.pricing.currency}/j`
                  ) : 'Gratuit'}
                </p>
              </div>
              {space.pricing.month && (
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase font-semibold">Mensuel</p>
                  <p className="text-sm font-medium text-slate-700">~{space.pricing.month}{space.pricing.currency}</p>
                </div>
              )}
            </div>
          )}
          <button 
            type="button"
            onClick={handleAction}
            className={`block w-full text-center py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              space.pricing.isQuote 
                ? 'bg-white border border-slate-900 text-slate-900 hover:bg-slate-50' 
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {space.pricing.isQuote ? (
              <><MessageSquare size={16}/> Demander un devis</>
            ) : (
              'Réserver'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
