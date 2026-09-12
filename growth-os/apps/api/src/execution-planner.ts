import { executorCapabilities, resolveExecutor, type ExecutorContext } from './executors.js';

export type ExecutionRisk='low'|'medium'|'high'|'critical';

export type ExecutionPlan={
  executor:string;
  risk:ExecutionRisk;
  requiresApproval:boolean;
  externalWrite:boolean;
  verificationRequired:boolean;
  blockers:string[];
  steps:string[];
};

function classifyRisk(context:ExecutorContext):ExecutionRisk{
  const type=context.actionType.toLowerCase();
  const provider=context.provider.toLowerCase();
  if(type.includes('budget')||type.includes('publish')||type.includes('campaign')||['google_ads','meta_ads','tiktok_ads'].includes(provider))return 'critical';
  if(type.includes('merchant')||type.includes('feed')||provider==='commerce')return 'high';
  if(type.includes('site_fix')||type.includes('code_change')||provider==='github')return 'medium';
  return 'low';
}

export function buildExecutionPlan(context:ExecutorContext):ExecutionPlan{
  const executor=resolveExecutor(context);
  const risk=classifyRisk(context);
  const capabilities=executorCapabilities();
  const cap=capabilities[executor.kind];
  const blockers:string[]=[];

  if(!cap.writeEnabled)blockers.push(`${executor.kind} write gate kapalı`);
  if(risk==='critical')blockers.push('kritik aksiyon için açık kullanıcı onayı gerekir');
  if(!context.recommendationId)blockers.push('recommendation id eksik');

  return {
    executor:executor.kind,
    risk,
    requiresApproval:true,
    externalWrite:cap.writeEnabled,
    verificationRequired:true,
    blockers,
    steps:[
      'recommendation doğrula',
      'proje ve provider hedefini doğrula',
      'before-state snapshot al',
      'approval gate kontrol et',
      'executor çalıştır',
      'after-state snapshot al',
      'verification çalıştır',
      'sonucu action history içine yaz'
    ]
  };
}
