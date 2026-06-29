/**
 * H5 支付页面接口调用
 * 不使用 @/utils/request.ts（会自动附加 JWT token），
 * 因为 H5 页面是手机扫码打开的独立页面，没有登录态。
 */

const API_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json: ApiResponse<T> = await res.json();
  if (json.code !== 200) {
    throw new Error(json.message || '请求失败');
  }
  return json.data;
}

export interface OrderDetail {
  orderId: string;
  amount: number;
  description: string;
  status: 'pending' | 'paid' | 'closed';
  orderType: string;
}

export interface JsapiPayParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  packageStr: string;
  signType: string;
  paySign: string;
}

export async function fetchOrder(orderId: string, payToken: string): Promise<OrderDetail> {
  return request<OrderDetail>(
    `/api/payment/order/${encodeURIComponent(orderId)}?payToken=${encodeURIComponent(payToken)}`,
  );
}

export async function fetchStoredOpenId(orderId: string, payToken: string): Promise<string | null> {
  try {
    const data = await request<{ openid: string } | null>(
      `/api/payment/wechat/stored-openid?orderId=${encodeURIComponent(orderId)}&payToken=${encodeURIComponent(payToken)}`,
    );
    return data?.openid ?? null;
  } catch {
    return null;
  }
}

export async function fetchWechatOAuthUrl(orderId: string, payToken: string): Promise<string> {
  const data = await request<{ url: string }>(
    `/api/payment/wechat/oauth-url?state=${encodeURIComponent(orderId)}&payToken=${encodeURIComponent(payToken)}`,
  );
  return data.url;
}

export async function wechatJsapiPrepay(
  orderId: string,
  openid: string,
  payToken: string,
): Promise<JsapiPayParams> {
  return request<JsapiPayParams>('/api/payment/wechat/jsapi-prepay', {
    method: 'POST',
    body: JSON.stringify({ orderId, openid, payToken }),
  });
}

export async function alipayWapPay(orderId: string, payToken: string): Promise<string> {
  const data = await request<{ payUrl: string }>('/api/payment/alipay/wap-pay', {
    method: 'POST',
    body: JSON.stringify({ orderId, payToken }),
  });
  return data.payUrl;
}
