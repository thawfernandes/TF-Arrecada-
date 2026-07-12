// ============================================================
// TF Arrecada+ | CreateCampaignModal
// Modal interno para criação de campanhas do cliente
// ============================================================

import React, { useState } from 'react';
import { Plus, Trash, Calendar, DollarSign, ListOrdered } from 'lucide-react';
import { campaignService } from '../services/campaignService';
import { Modal } from './Modal';
import { ImageUpload } from './ImageUpload';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess: () => void;
}

export function CreateCampaignModal({ isOpen, onClose, clientId, onSuccess }: CreateCampaignModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [pricePerNumber, setPricePerNumber] = useState(10);
  const [totalNumbers, setTotalNumbers] = useState(100);
  const [pixKey, setPixKey] = useState('');
  const [drawType, setDrawType] = useState<'specific_date' | 'after_all_sold'>('after_all_sold');
  const [drawDate, setDrawDate] = useState('');
  const [rules, setRules] = useState('');
  const [timeoutMinutes, setTimeoutMinutes] = useState(30);

  // Organizadores
  const [organizers, setOrganizers] = useState<{
    name: string;
    phone: string;
    whatsapp: string;
    role: string;
    is_primary: boolean;
  }[]>([{ name: '', phone: '', whatsapp: '', role: 'Organizador', is_primary: true }]);

  const [isLoading, setIsLoading] = useState(false);

  const addOrganizer = () => {
    setOrganizers([...organizers, { name: '', phone: '', whatsapp: '', role: 'Organizador', is_primary: false }]);
  };

  const removeOrganizer = (index: number) => {
    if (organizers[index].is_primary) return; // não remove o principal
    setOrganizers(organizers.filter((_, i) => i !== index));
  };

  const updateOrganizer = (index: number, key: string, value: any) => {
    setOrganizers(
      organizers.map((org, i) => {
        if (i !== index) return org;
        const updated = { ...org, [key]: value };
        if (key === 'phone' && !org.whatsapp) {
          updated.whatsapp = value; // Sincroniza whatsapp com telefone se estiver vazio
        }
        return updated;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !pixKey) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    setIsLoading(true);

    try {
      const success = await campaignService.createCampaign(clientId, {
        name,
        description,
        image_url: imageUrl || undefined,
        price_per_number: Number(pricePerNumber),
        total_numbers: Number(totalNumbers),
        pix_key: pixKey,
        draw_type: drawType,
        draw_date: drawType === 'specific_date' ? drawDate : undefined,
        rules,
        reservation_timeout_minutes: Number(timeoutMinutes),
        organizers: organizers.filter((org) => org.name && org.phone),
      });

      if (success) {
        onSuccess();
        onClose();
        // Reset
        setName('');
        setDescription('');
        setImageUrl('');
        setPricePerNumber(10);
        setTotalNumbers(100);
        setPixKey('');
        setDrawType('after_all_sold');
        setDrawDate('');
        setRules('');
        setTimeoutMinutes(30);
        setOrganizers([{ name: '', phone: '', whatsapp: '', role: 'Organizador', is_primary: true }]);
      } else {
        alert('Falha ao criar campanha. Verifique os dados e tente novamente.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Nova Campanha" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
        {/* Etapa 1: Dados Básicos */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
            1. Dados da Campanha
          </h3>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Nome da Rifa / Campanha *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Rifa de Ação de Graças da Igreja"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Descrição Detalhada *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Explique o objetivo da arrecadação e quais serão os prêmios..."
              className="input-field resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-2">
              Imagem de Capa
            </label>
            <ImageUpload
              value={imageUrl}
              onChange={(base64) => setImageUrl(base64)}
              onClear={() => setImageUrl('')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Preço por Número (R$) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 text-neutral-400" size={16} />
                <input
                  type="number"
                  required
                  min="0.5"
                  step="0.01"
                  className="input-field pl-9"
                  value={pricePerNumber}
                  onChange={(e) => setPricePerNumber(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Quantidade de Números *
              </label>
              <div className="relative">
                <ListOrdered className="absolute left-3 top-2.5 text-neutral-400" size={16} />
                <input
                  type="number"
                  required
                  min="10"
                  max="100000"
                  step="1"
                  placeholder="Ex: 100, 200, 500..."
                  className="input-field pl-9"
                  value={totalNumbers}
                  onChange={(e) => setTotalNumbers(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Etapa 2: Pagamentos e Sorteio */}
        <div className="space-y-4 pt-4 border-t border-neutral-100">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
            2. Pagamentos e Sorteio
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Chave PIX de Recebimento *
              </label>
              <input
                type="text"
                required
                placeholder="Chave PIX ou Celular"
                className="input-field"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Tempo Limite de Reserva (minutos) *
              </label>
              <input
                type="number"
                required
                min="5"
                max="1440"
                className="input-field"
                value={timeoutMinutes}
                onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Tipo do Sorteio
              </label>
              <select
                className="input-field"
                value={drawType}
                onChange={(e) => setDrawType(e.target.value as any)}
              >
                <option value="after_all_sold">Após vender todos os números</option>
                <option value="specific_date">Data e hora específica</option>
              </select>
            </div>

            {drawType === 'specific_date' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Data Prevista do Sorteio
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-neutral-400" size={16} />
                  <input
                    type="date"
                    required
                    className="input-field pl-9"
                    value={drawDate}
                    onChange={(e) => setDrawDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Etapa 3: Organizadores */}
        <div className="space-y-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
              3. Organizadores
            </h3>
            <button
              type="button"
              onClick={addOrganizer}
              className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>

          {organizers.map((org, index) => (
            <div key={index} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500">
                  {index === 0 ? 'Organizador Principal' : `Organizador #${index + 1}`}
                </span>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeOrganizer(index)}
                    className="text-neutral-400 hover:text-red-500"
                  >
                    <Trash size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nome do Organizador"
                  className="input-field bg-white"
                  value={org.name}
                  onChange={(e) => updateOrganizer(index, 'name', e.target.value)}
                />
                <input
                  type="tel"
                  required
                  placeholder="Telefone (DDD + Número)"
                  className="input-field bg-white"
                  value={org.phone}
                  onChange={(e) => updateOrganizer(index, 'phone', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Etapa 4: Regulamento */}
        <div className="space-y-4 pt-4 border-t border-neutral-100">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
            4. Regulamento / Regras
          </h3>
          <div>
            <textarea
              rows={3}
              placeholder="Adicione termos, prazos de entrega de prêmios ou outras regras gerais da campanha..."
              className="input-field resize-none"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
            />
          </div>
        </div>

        {/* Botão de Envio */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
          <button type="button" onClick={onClose} className="btn-ghost" disabled={isLoading}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Criando Rifa...' : 'Criar Campanha como Rascunho'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
