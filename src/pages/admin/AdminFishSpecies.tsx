import { Fish } from 'lucide-react';
import { FishSpeciesManagement } from '@/components/admin/FishSpeciesManagement';

export default function AdminFishSpecies() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Fish Species</h1>
          <p className="text-slate-400 mt-1">Manage the list of fish species available on the platform</p>
        </div>
      </div>

      <div className="w-full">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Fish className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Species Database</h2>
          </div>
          
          <FishSpeciesManagement />
        </div>
      </div>
    </div>
  );
}
