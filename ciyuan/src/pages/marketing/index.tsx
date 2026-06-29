import { Route, Routes } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LocaleProvider } from './i18n/LocaleProvider';
import { MarketingLayout } from './components/MarketingLayout';
import { HomePage } from './HomePage';
import './marketing.css';

export default function MarketingPage() {
  return (
    <LocaleProvider>
      <Helmet>
        <title>Agent云Token工场 - 国内领先的大模型 API 聚合与极速推理云平台</title>
        <meta
          name="description"
          content="专为开发者打造的 AI 推理云，一站式提供 Qwen3.6、DeepSeek-V4、Kimi K2.5、豆包 Seed 等 20+ 顶尖大模型 API 服务。支持开箱即用、模型微调托管与企业级私有化部署。"
        />
        <link rel="canonical" href="https://www.agentsyun.com/marketing" />
      </Helmet>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route index element={<HomePage />} />
        </Route>
      </Routes>
    </LocaleProvider>
  );
}
