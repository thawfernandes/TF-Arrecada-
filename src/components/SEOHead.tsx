// ============================================================
// TF Arrecada+ | SEOHead Component
// Manipulação direta do DOM para carregar tags Open Graph e Twitter Cards dinamicamente
// ============================================================

import { useEffect } from 'react';
import { getCampaignUrl } from '../utils/format';

interface SEOHeadProps {
  title: string;
  description: string;
  imageUrl?: string;
  slug?: string;
}

export function SEOHead({ title, description, imageUrl, slug }: SEOHeadProps) {
  useEffect(() => {
    // 1. Atualizar Título
    const fullTitle = `${title} | TF Arrecada+`;
    document.title = fullTitle;

    // 2. Função auxiliar para definir ou atualizar meta tags
    const setMetaTag = (attributeName: string, attributeValue: string, content: string) => {
      if (!content) return;
      let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. Injetar Meta Tags Padrão
    setMetaTag('name', 'description', description);

    // 4. Open Graph (Facebook/WhatsApp/Telegram)
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', 'website');
    if (slug) {
      setMetaTag('property', 'og:url', getCampaignUrl(slug));
    }

    if (imageUrl) {
      setMetaTag('property', 'og:image', imageUrl);
    }

    // 5. Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);
    if (imageUrl) {
      setMetaTag('name', 'twitter:image', imageUrl);
    }

    // Opcional: Cleanup ao desmontar
    return () => {
      // Retorna para o título padrão
      document.title = 'TF Arrecada+';
    };
  }, [title, description, imageUrl, slug]);

  return null; // Componente invisível (side-effect apenas)
}
