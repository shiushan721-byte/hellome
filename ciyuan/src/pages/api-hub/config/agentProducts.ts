export type DownloadOption = {
  label: string;
  productId?: number;
  comingSoon?: boolean;
};

export type AgentProduct = {
  id: string;
  name: string;
  detailUrl?: string;
  groupQrSrc: string;
  groupTitle: string;
  hideGroup?: boolean;
  downloads?: DownloadOption[];
};

const PACKAGE_API_BASE =
  'https://hermes.agentsyun.com/api/bosshermes/api/v1/package/latest';

export const AGENT_PRODUCTS: AgentProduct[] = [
  {
    id: 'hermes',
    name: '爱马仕助手',
    detailUrl: 'https://hermes.agentsyun.com/',
    groupQrSrc: '/爱马仕.png',
    groupTitle: '加入爱马仕助手交流群',
    downloads: [
      { label: 'Win', productId: 1 },
      { label: 'Mac', comingSoon: true },
    ],
  },
  {
    id: 'geo',
    name: 'GEO投放助手',
    detailUrl: 'https://geo.agentsyun.com/',
    groupQrSrc: '/GEO.png',
    groupTitle: '加入GEO投放助手交流群',
  },
];

export const TOKEN_GROUP_QR_SRC = '/ciyuan.png';

type PackageApiResponse = {
  code?: number;
  message?: string;
  data?: { packageUrl?: string };
  packageUrl?: string;
};

export function parsePackageDownloadUrl(json: PackageApiResponse): string | null {
  const url = json.data?.packageUrl ?? json.packageUrl;
  return typeof url === 'string' && url ? url : null;
}

export function triggerPackageDownload(url: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function fetchPackageDownloadUrl(productId: number): Promise<string | null> {
  try {
    const res = await fetch(`${PACKAGE_API_BASE}?productId=${productId}`);
    if (!res.ok) return null;
    const json = (await res.json()) as PackageApiResponse;
    if (json.code != null && json.code !== 200) return null;
    return parsePackageDownloadUrl(json);
  } catch {
    return null;
  }
}
