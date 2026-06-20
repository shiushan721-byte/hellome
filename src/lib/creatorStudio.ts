import type { SkillDebugInput } from '../types/skills';

export const CUSTOMER_TYPE_OPTIONS = [
  '消费品商家',
  '本地门店',
  '服务型公司',
  '制造业企业',
  '渠道/代理商',
  '内容团队',
] as const;

export const SCENARIO_OPTIONS = [
  '产品种草',
  '门店宣传',
  '设备演示',
  '活动预热',
  '客户提案',
  '品牌介绍',
] as const;

export const OPTIMIZATION_OPTIONS = ['业务表达', '用户输入', '结果展示', '交付说明', '成交路径'] as const;

export type CustomerType = (typeof CUSTOMER_TYPE_OPTIONS)[number];
export type BusinessScenario = (typeof SCENARIO_OPTIONS)[number];
export type OptimizationDirection = (typeof OPTIMIZATION_OPTIONS)[number];

export function buildCreateHeroTitle(customerType: CustomerType, scenario: BusinessScenario): string {
  return `即将为你生成：${customerType}的${scenario}视频智能体`;
}

export function buildEditBusinessSentence(customerType: CustomerType, scenario: BusinessScenario): string {
  return `当前这个视频智能体服务于${customerType}，主要用于${scenario}`;
}

export function buildEngineSteps(scenario: BusinessScenario): string[] {
  const sceneLabel =
    scenario === '设备演示'
      ? '匹配演示模板'
      : scenario === '门店宣传'
        ? '匹配门店宣传模板'
        : scenario === '客户提案'
          ? '匹配提案表达模板'
          : '匹配场景模板';

  return ['解析业务需求', sceneLabel, '生成脚本与分镜', '调用视频模型', '整理交付包'];
}

export function buildDebugInputFromBusiness(params: {
  customerType: CustomerType;
  scenario: BusinessScenario;
  instruction?: string;
}): SkillDebugInput {
  const { customerType, scenario, instruction } = params;
  return {
    sellingPoint: `面向${customerType}的${scenario}视频表达`,
    platform: scenario === '门店宣传' ? '视频号' : '抖音',
    effectGoal: scenario === '设备演示' ? '更像测评讲解' : '更像带货转化',
    referenceDirection: instruction?.trim() || `${customerType} · ${scenario} · 业务导向结果表达`,
  };
}
