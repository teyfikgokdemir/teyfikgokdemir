import { pool } from './db.js';

export type AdsProvider='google_ads'|'meta_ads'|'tiktok_ads';

export type ExecutionPolicy={
  projectId:string;
  globalWriteEnabled:boolean;
  projectWriteEnabled:boolean;
  requireManualApproval:boolean;
  allowedProviders:AdsProvider[];
  maxDailyBudgetChangePct:number|null;
  canExecute:boolean;
};

function envWriteEnabled(){
  return String(process.env.EXTERNAL_EXECUTION_ENABLED||'false').toLowerCase()==='true'&&String(process.env.ADS_WRITE_ENABLED||'false').toLowerCase()==='true';
}

export async function getExecutionPolicy(projectId:string):Promise<ExecutionPolicy>{
  const {rows}=await pool.query(`select pep.ads_write_enabled,pep.require_manual_approval,pep.max_daily_budget_change_pct,pep.allowed_providers
    from project_execution_policy pep
    join projects p on p.id=pep.project_id and p.status='active'
    where pep.project_id=$1`,[projectId]);
  const row=rows[0] as {ads_write_enabled?:boolean;require_manual_approval?:boolean;max_daily_budget_change_pct?:string|number|null;allowed_providers?:string[]}|undefined;
  const allowed=(row?.allowed_providers||[]).filter((p):p is AdsProvider=>['google_ads','meta_ads','tiktok_ads'].includes(p));
  const globalWriteEnabled=envWriteEnabled();
  const projectWriteEnabled=Boolean(row?.ads_write_enabled);
  const requireManualApproval=row?.require_manual_approval!==false;
  return {
    projectId,
    globalWriteEnabled,
    projectWriteEnabled,
    requireManualApproval,
    allowedProviders:allowed,
    maxDailyBudgetChangePct:row?.max_daily_budget_change_pct==null?null:Number(row.max_daily_budget_change_pct),
    canExecute:globalWriteEnabled&&projectWriteEnabled
  };
}

export async function assertExecutionAllowed(projectId:string,provider:AdsProvider,approved:boolean){
  const policy=await getExecutionPolicy(projectId);
  if(!policy.globalWriteEnabled)throw new Error('Ads write gate kapalı. EXTERNAL_EXECUTION_ENABLED ve ADS_WRITE_ENABLED birlikte açık olmalı.');
  if(!policy.projectWriteEnabled)throw new Error('Bu proje için reklam yazma izni kapalı.');
  if(!policy.allowedProviders.includes(provider))throw new Error(`${provider} bu proje için execution listesinde değil.`);
  if(policy.requireManualApproval&&!approved)throw new Error('Bu işlem manuel onay gerektiriyor.');
  return policy;
}
