export default function PerformanceSection() {
  return (
    <section className="performance-section" aria-labelledby="perf-heading">
      <h2 id="perf-heading">推理性能与技术指标</h2>
      <p className="perf-subtitle">Agent云 Token 工场基于自研推理加速引擎，在主流模型上实现显著性能提升</p>

      <div className="perf-grid">
        <div className="perf-card">
          <h3>首 Token 延迟</h3>
          <p className="perf-value">
            <span className="perf-number">&lt; 200ms</span>
          </p>
          <p className="perf-desc">同模型对比官方 API 降低 30-50%</p>
        </div>

        <div className="perf-card">
          <h3>并发吞吐</h3>
          <p className="perf-value">
            <span className="perf-number">万级 QPS</span>
          </p>
          <p className="perf-desc">自动弹性扩容，应对流量峰值</p>
        </div>

        <div className="perf-card">
          <h3>可用性 SLA</h3>
          <p className="perf-value">
            <span className="perf-number">99.95%</span>
          </p>
          <p className="perf-desc">多地域容灾，服务稳定可靠</p>
        </div>

        <div className="perf-card">
          <h3>模型切换</h3>
          <p className="perf-value">
            <span className="perf-number">零代码</span>
          </p>
          <p className="perf-desc">统一 API 格式，切换模型不改代码</p>
        </div>
      </div>

      <div className="perf-models">
        <h3>已优化模型列表</h3>
        <ul className="perf-model-list">
          <li>
            <strong>Qwen3.6-Plus</strong> — 阿里通义千问，多轮对话与逻辑推理首选
          </li>
          <li>
            <strong>DeepSeek-V4.0</strong> — 编程与数学推理专用，极致性价比
          </li>
          <li>
            <strong>Kimi K2.5</strong> — 月之暗面旗舰，长文本处理能力领先
          </li>
          <li>
            <strong>GLM-5.1</strong> — 智谱 AI，国产开源生态标杆
          </li>
          <li>
            <strong>MiniMax-M2.7</strong> — 多模态理解与生成
          </li>
          <li>
            <strong>豆包 Seed 2.0 系列</strong> — 字节跳动，pro / lite / mini 多档可选
          </li>
        </ul>
      </div>
    </section>
  );
}
