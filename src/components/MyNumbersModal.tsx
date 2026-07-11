// ============================================================
// TF Arrecada+ | MyNumbersModal — Consulta pública de números
// ============================================================

import { useState } from 'react';
import { Search, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Modal } from './Modal';
import { campaignService } from '../services/campaignService';
import { maskPhone, formatDate, getCampaignUrl } from '../utils/format';
import type { MyNumberResult } from '../types';

interface MyNumbersModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
}

export function MyNumbersModal({ isOpen, onClose, initialPhone = '' }: MyNumbersModalProps) {
  const [phone, setPhone] = useState(initialPhone);
  const [results, setResults] = useState<MyNumberResult[]>([]);


  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 8) return;
    
    setIsLoading(true);
    try {
      const data = await campaignService.findNumbersByPhone(clean);
      setResults(data);
      setSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    setPhone('');
    setResults([]);
    setSearched(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Consulte seus números" size="lg">
      <div className="space-y-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="tel"
              className="input pl-10"
              placeholder="Digite seu WhatsApp/Telefone"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary shrink-0 px-5" disabled={isLoading}>
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
 
        {searched && (
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {results.length === 0 ? (
              <div className="text-center py-8 bg-neutral-50 rounded-2xl border border-neutral-100">
                <span className="text-3xl block mb-2">🔍</span>
                <p className="text-sm font-semibold text-neutral-700">
                  Nenhum número encontrado
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Verifique o número informado ou fale com os organizadores.
                </p>
              </div>
            ) : (
              results.map((res, i) => (
                <div key={i} className="border border-neutral-200 rounded-2xl p-4 bg-neutral-50/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2 text-left">
                    <h4 className="font-display font-bold text-neutral-800 text-sm truncate max-w-[200px]">
                      {res.campaignName}
                    </h4>
                    <a
                      href={getCampaignUrl(res.shareCode)}
                      className="text-xs text-brand-600 font-semibold flex items-center gap-1 hover:underline"
                    >
                      Acessar página <ArrowRight size={10} />
                    </a>
                  </div>

                  
                  <div className="grid gap-2">
                    {res.numbers.map((n) => (
                      <div key={n.number} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-neutral-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center border border-neutral-100">
                            <span className="font-bold text-neutral-700 text-xs">#{n.number}</span>
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] text-neutral-400 font-semibold">RESERVADO EM</p>
                            <p className="text-[10px] text-neutral-500 font-medium">
                              {n.reservedAt ? formatDate(n.reservedAt.split('T')[0]) : '—'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {n.status === 'paid' ? (
                            <span className="badge-paid text-[10px] py-1 px-2.5 flex items-center gap-1">
                              <CheckCircle size={10} className="text-green-600" />
                              Pago
                            </span>
                          ) : (
                            <span className="badge-reserved text-[10px] py-1 px-2.5 flex items-center gap-1">
                              <Clock size={10} className="text-amber-600" />
                              Reservado
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {searched && (
          <button
            onClick={handleClear}
            className="btn-ghost text-xs text-neutral-400 w-full flex items-center justify-center gap-1"
          >
            Limpar busca
          </button>
        )}
      </div>
    </Modal>
  );
}
