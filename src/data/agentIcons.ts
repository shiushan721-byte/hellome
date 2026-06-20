const iconPalette: Record<string, string> = {
  geo: '#E9F4FF',
  media: '#FFF3EA',
  sales: '#F7F1FF',
  'schema-optimizer': '#EEF8F3',
  'competitor-scan': '#FFF8E7',
  'hermes-report': '#EEF5FF',
  'faq-generator': '#F5F3FF',
  'ppt-outline': '#FFF1F1',
  'outreach-mail': '#EEF8FF',
  'copy-audit': '#F7F7F8',
  'sov-tracker': '#EEF8F3',
  'prompt-lab': '#FFF8E7',
};

function buildPlaceholderIcon(label: string, bg: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="28" fill="${bg}"/>
      <circle cx="48" cy="34" r="14" fill="#111111" opacity="0.08"/>
      <rect x="22" y="52" width="52" height="8" rx="4" fill="#111111" opacity="0.12"/>
      <text x="48" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#111111">
        ${label}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const AGENT_ICONS: Record<string, string> = {
  geo: buildPlaceholderIcon('G', iconPalette.geo),
  media: buildPlaceholderIcon('U', iconPalette.media),
  sales: buildPlaceholderIcon('S', iconPalette.sales),
  'schema-optimizer': buildPlaceholderIcon('SC', iconPalette['schema-optimizer']),
  'competitor-scan': buildPlaceholderIcon('CP', iconPalette['competitor-scan']),
  'hermes-report': buildPlaceholderIcon('HR', iconPalette['hermes-report']),
  'faq-generator': buildPlaceholderIcon('FQ', iconPalette['faq-generator']),
  'ppt-outline': buildPlaceholderIcon('PT', iconPalette['ppt-outline']),
  'outreach-mail': buildPlaceholderIcon('OM', iconPalette['outreach-mail']),
  'copy-audit': buildPlaceholderIcon('CA', iconPalette['copy-audit']),
  'sov-tracker': buildPlaceholderIcon('SV', iconPalette['sov-tracker']),
  'prompt-lab': buildPlaceholderIcon('PL', iconPalette['prompt-lab']),
};

export function getAgentIconSrc(id: string): string | undefined {
  return AGENT_ICONS[id];
}
