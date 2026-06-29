export default function CompareSection() {
  return (
    <section className="compare-section" aria-labelledby="compare-heading">
      <h2 id="compare-heading">AI算力平台对比：Agent云 Token 工场 vs 单一模型官方 API</h2>
      <p className="compare-subtitle">为什么越来越多的开发者和企业选择 AI算力平台 而非单一模型官方 API？</p>

      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th>能力维度</th>
              <th>Agent云 Token 工场</th>
              <th>单一模型官方 API</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>支持模型数</td>
              <td>
                <strong>20+ 主流模型</strong>一站式调用
              </td>
              <td>单个模型</td>
            </tr>
            <tr>
              <td>API 接入</td>
              <td>
                <strong>一个 Key 调用所有模型</strong>
              </td>
              <td>每个模型独立申请 Key</td>
            </tr>
            <tr>
              <td>接口格式</td>
              <td>
                <strong>统一格式</strong>，切换模型不改代码
              </td>
              <td>各模型格式不同，切换成本高</td>
            </tr>
            <tr>
              <td>推理加速</td>
              <td>
                <strong>自研加速引擎</strong>，延迟降低 30-50%
              </td>
              <td>官方默认速度</td>
            </tr>
            <tr>
              <td>模型微调</td>
              <td>
                <strong>托管微调服务</strong>，提交数据即用
              </td>
              <td>部分支持 / 需自行部署 GPU</td>
            </tr>
            <tr>
              <td>私有化部署</td>
              <td>
                <strong>企业级私有化方案</strong>
              </td>
              <td>不支持或需高额商务谈判</td>
            </tr>
            <tr>
              <td>成本控制</td>
              <td>
                <strong>按需选模型</strong>，灵活控制成本
              </td>
              <td>单一模型无选择空间</td>
            </tr>
            <tr>
              <td>适用场景</td>
              <td>
                开发 → 测试 → 生产 <strong>全链路</strong>
              </td>
              <td>单一场景调用</td>
            </tr>
            <tr>
              <td>服务稳定性</td>
              <td>
                <strong>99.95% SLA</strong>，多地域容灾
              </td>
              <td>依赖官方服务等级</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="compare-note">
        Agent云 Token 工场已累计服务 <strong>数万开发者与企业用户</strong>，累计推理规模超{' '}
        <strong>0T Tokens</strong>，是国内领先的 AI 推理云平台之一。
      </p>
    </section>
  );
}
