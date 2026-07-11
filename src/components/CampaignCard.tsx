// ============================================================
// TF Arrecada+ | CampaignCard Component
// Card de campanha para listagem na home ou dashboard
// ============================================================

import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, Hash } from 'lucide-react';
import { clsx } from 'clsx';
import type { Campaign } from '../types';
import { campaignService } from '../services/campaignService';
import { formatCurrency, formatDate } from '../utils/format';

interface CampaignCardProps {
  campaign: Campaign;
  className?: string;
}

export function CampaignCard({ campaign, className }: CampaignCardProps) {
  const navigate = useNavigate();
  const stats = campaignService.getCampaignStats(campaign);

  const handleNavigate = () => {
    navigate(`/campanha/${campaign.share_code}`);
  };

  return (
    <article
      className={clsx('card-hover p-5 cursor-pointer text-left', className)}
      onClick={handleNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
      aria-label={`Ver campanha: ${campaign.name}`}
    >
      {/* Imagem */}
      {campaign.image_url ? (
        <img
          src={campaign.image_url}
          alt={campaign.name}
          className="w-full h-36 object-cover rounded-2xl mb-4 bg-neutral-100"
        />
      ) : (
        <div className="w-full h-36 rounded-2xl mb-4 bg-gradient-to-br
                        from-brand-100 to-brand-200 flex items-center
                        justify-center">
          <Hash size={36} className="text-brand-400" />
        </div>
      )}

      {/* Conteúdo */}
      <h3 className="font-display font-bold text-neutral-800 text-base mb-1 line-clamp-1">
        {campaign.name}
      </h3>
      <p className="text-sm text-neutral-500 line-clamp-2 mb-4 leading-relaxed">
        {campaign.description}
      </p>

      {/* Barra de progresso */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-1.5">
          <span>{stats.paid + stats.reserved} de {stats.total} números</span>
          <span className="font-medium text-brand-600">{stats.progressPercent}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Métricas */}
      <div className="flex items-center justify-between text-xs text-neutral-500 pt-3 border-t border-neutral-100">
        <span className="flex items-center gap-1">
          <DollarSign size={12} />
          {formatCurrency(campaign.price_per_number)} / número
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {campaign.draw_type === 'specific_date' && campaign.draw_date
            ? formatDate(campaign.draw_date)
            : 'Ao vender tudo'}
        </span>
      </div>
    </article>
  );
}
