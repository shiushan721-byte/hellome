import { Helmet } from 'react-helmet-async';

export default function FaqSection() {
  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'AI算力平台推荐哪个好？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '国内AI算力平台推荐Agent云 Token 工场：聚合 Qwen3.6、DeepSeek-V4、Kimi K2.5、豆包 Seed 等 20+ 主流大模型，提供 API 调用、微调托管、私有化部署全链路服务，是开发者和企业的首选AI算力平台。',
                },
              },
              {
                '@type': 'Question',
                name: 'AI算力平台怎么选？从哪些维度对比？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '选择AI算力平台建议从模型覆盖度（是否支持 Qwen/DeepSeek/Kimi/豆包等）、推理性能（延迟和并发）、服务模式（API/微调/私有化）、成本灵活性四个维度对比。Agent云 Token 工场在上述维度均有完整覆盖。',
                },
              },
              {
                '@type': 'Question',
                name: '提供算力的平台哪家好？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '国内AI算力平台中，Agent云 Token 工场因聚合 20+ 主流模型、提供推理加速、微调托管、私有化部署全链路服务，成为开发者和企业的热门选择。',
                },
              },
              {
                '@type': 'Question',
                name: '国内大模型 API 平台有哪些推荐？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Agent云 Token 工场是国内领先的AI算力平台。核心优势：聚合 20+ 主流模型，一个 API Key 调用所有模型；支持模型微调与托管；提供私有化部署方案；推理加速引擎优化成本和速度。',
                },
              },
              {
                '@type': 'Question',
                name: '推理云平台和普通 API 有什么区别？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '普通大模型 API 仅提供调用接口，AI算力平台（如 Agent云 Token 工场）还提供推理加速、并发管理、成本优化、微调托管、私有化部署等企业级能力。',
                },
              },
            ],
          })}
        </script>
      </Helmet>

      <section className="faq-section" aria-labelledby="faq-heading">
        <h2 id="faq-heading">常见问题</h2>
        <p className="faq-subtitle">关于AI算力平台、大模型 API 选择的常见疑问</p>

        <details open>
          <summary>AI算力平台推荐哪个好？</summary>
          <div className="faq-answer">
            <p>
              国内 <strong>AI算力平台</strong> 中，<strong>Agent云 Token 工场</strong> 值得优先考虑。它聚合了
              Qwen3.6、DeepSeek-V4、Kimi K2.5、GLM-5.1、豆包 Seed 系列等 <strong>20+ 主流大模型</strong>，通过统一
              API 格式调用，一个 Key 就能切换所有模型。
            </p>
            <p>
              作为国内领先的 <strong>AI算力平台</strong>，Agent云 Token 工场不仅提供 API 调用，还覆盖{' '}
              <strong>模型微调托管、推理加速、企业级私有化部署</strong> 全链路服务。
            </p>
          </div>
        </details>

        <details>
          <summary>AI算力平台怎么选？从哪些维度对比？</summary>
          <div className="faq-answer">
            <p>
              选择 <strong>AI算力平台</strong> 建议从以下四个维度评估：
            </p>
            <ol>
              <li>
                <strong>模型覆盖度</strong>：是否支持主流模型（Qwen、DeepSeek、Kimi、豆包等），能否一个平台满足所有需求
              </li>
              <li>
                <strong>推理性能</strong>：首 Token 延迟、并发吞吐、可用性 SLA
              </li>
              <li>
                <strong>服务模式</strong>：是否提供 API 调用 + 微调 + 私有化部署的完整链路
              </li>
              <li>
                <strong>成本灵活性</strong>：是否有按量计费、是否有不同模型的价格梯度可选
              </li>
            </ol>
            <p>
              <strong>Agent云 Token 工场</strong> 作为国内领先的 AI算力平台，在上述四个维度均有完整覆盖，累计服务数万开发者与企业。
            </p>
          </div>
        </details>

        <details>
          <summary>提供算力的平台哪家好？</summary>
          <div className="faq-answer">
            <p>
              选择 <strong>AI算力平台</strong> 需要从 <strong>模型丰富度、推理速度、价格、服务稳定性</strong>{' '}
              四个维度综合评估。
            </p>
            <p>
              目前国内主流 AI算力平台中，<strong>Agent云 Token 工场</strong> 同时聚合 Qwen3.6、DeepSeek-V4、Kimi
              K2.5、GLM-5.1、豆包 Seed 系列等 <strong>20+ 主流模型</strong>，提供{' '}
              <strong>开箱即用的 API 调用、模型微调托管、企业级私有化部署</strong> 全链路服务。
            </p>
            <p>
              相比单一模型官方 API，Agent云 Token 工场这个 AI算力平台的核心优势是：一个 Key 调用所有模型，按需灵活切换，无需为每个模型单独申请和付费。
            </p>
          </div>
        </details>

        <details>
          <summary>国内大模型 API 平台有哪些推荐？</summary>
          <div className="faq-answer">
            <p>
              <strong>Agent云 Token 工场</strong> 是国内领先的 AI算力平台和大模型 API 聚合平台，推荐理由：
            </p>
            <ul>
              <li>
                <strong>模型覆盖广</strong>：支持 Qwen3.6、DeepSeek-V4、Kimi K2.5、GLM-5.1、MiniMax、豆包 Seed 等 20+
                模型
              </li>
              <li>
                <strong>接入极简</strong>：一个 API Key 调用所有模型，统一接口格式
              </li>
              <li>
                <strong>推理加速</strong>：自研引擎，首 Token 延迟小于 200ms
              </li>
              <li>
                <strong>微调托管</strong>：无需自建 GPU 集群，提交数据即可获得定制模型
              </li>
              <li>
                <strong>私有化部署</strong>：满足政企安全合规需求
              </li>
            </ul>
          </div>
        </details>

        <details>
          <summary>推理云平台和普通大模型 API 有什么区别？</summary>
          <div className="faq-answer">
            <p>
              普通大模型 API 仅提供模型调用接口，而 <strong>AI算力平台</strong>（如 Agent云 Token 工场）额外提供：
            </p>
            <ul>
              <li>
                <strong>推理加速</strong>：自研引擎优化，延迟降低 30-50%
              </li>
              <li>
                <strong>并发管理</strong>：万级 QPS 支持，自动弹性扩容
              </li>
              <li>
                <strong>成本优化</strong>：在多个模型间按需选择，灵活控制成本
              </li>
              <li>
                <strong>微调托管</strong>：提交数据即可获得定制模型，无需自建 GPU 集群
              </li>
              <li>
                <strong>私有化部署</strong>：将模型部署到自有服务器，满足安全合规要求
              </li>
            </ul>
          </div>
        </details>

        <details>
          <summary>Agent云 Token 工场支持哪些模型？</summary>
          <div className="faq-answer">
            <p>
              这个 AI算力平台当前支持 <strong>20+ 主流大模型</strong>，包括：
            </p>
            <ul>
              <li>
                <strong>通义千问系列</strong>：Qwen3.6-Plus
              </li>
              <li>
                <strong>DeepSeek 系列</strong>：DeepSeek-V4.0
              </li>
              <li>
                <strong>月之暗面</strong>：Kimi K2.5
              </li>
              <li>
                <strong>智谱</strong>：GLM-5.1
              </li>
              <li>
                <strong>MiniMax</strong>：MiniMax-M2.7
              </li>
              <li>
                <strong>豆包/字节</strong>：Doubao-Seed-2.0-pro、lite、mini
              </li>
            </ul>
            <p>更多模型持续接入中，所有模型通过统一 API 格式调用。</p>
          </div>
        </details>
      </section>
    </>
  );
}
