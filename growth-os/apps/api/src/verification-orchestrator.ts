import { pool } from './db.js';
import { completeExecution, recordVerification } from './execution-workflow.js';
import { verifyByProvider } from './provider-verifiers.js';

type Snapshot={
  capturedAt:string;
  project:Record<string,unknown>|null;
  latestAudit:Record<string,unknown>|null;
  integrations:Array<Record<string,unknown>>;
  targets:Record<string,unknown>|null;
};

async function loadJob(jobId:string){
  const {rows}=await pool.query(`
    select ej.*,r.proposed_action,r.title recommendation_title,r.status recommendation_status
    from execution_jobs ej
    left join recommendations r on r.id=ej.recommendation_id
    where ej.id=$1
  `,[jobId]);
  if(!rows[0])throw new Error('Execution job bulunamadı.');
  return rows[0] as {
    id:string;
    project_id:string;
    recommendation_id:string|null;
    action_log_id:string|null;
    action_type:string;
    provider:string;
    status:string;
    proposed_action?:Record<string,unknown>|null;
  };
}

async function captureCurrentState(projectId:string):Promise<Snapshot>{
  const [project,audit,integrations,targets]=await Promise.all([
    pool.query('select id,name,domain from projects where id=$1',[projectId]),
    pool.query('select id,overall_score,seo_score,geo_score,aeo_score,aio_score,ads_readiness_score,payload,created_at from audits where project_id=$1 order by created_at desc limit 1',[projectId]),
    pool.query("select provider,account_label,external_account_id,status,mode,last_sync_at from integrations where project_id=$1 order by provider",[projectId]),
    pool.query('select * from business_targets where project_id=$1',[projectId])
  ]);

  return {
    capturedAt:new Date().toISOString(),
    project:project.rows[0]||null,
    latestAudit:audit.rows[0]||null,
    integrations:integrations.rows,
    targets:targets.rows[0]||null
  };
}

async function getBeforeState(job:{action_log_id:string|null}):Promise<Record<string,unknown>>{
  if(!job.action_log_id)return {};
  const {rows}=await pool.query('select before_state from action_log where id=$1',[job.action_log_id]);
  return (rows[0]?.before_state||{}) as Record<string,unknown>;
}

async function pendingVerificationForJob(job:{id:string;project_id:string;recommendation_id:string|null;status:string}){
  const pending=await pool.query(`
    select * from verification_results
    where execution_job_id=$1 and status='pending'
    order by created_at desc limit 1
  `,[job.id]);
  if(pending.rows[0])return pending.rows[0];
  if(job.status!=='verification_pending')return null;

  const previous=await pool.query(`
    select * from verification_results
    where execution_job_id=$1 and status='inconclusive'
    order by created_at desc limit 1
  `,[job.id]);
  const prior=previous.rows[0];
  if(!prior)return null;

  const retry=await pool.query(`
    insert into verification_results(project_id,execution_job_id,recommendation_id,status,verification_type,before_state,after_state,evidence)
    values($1,$2,$3,'pending',$4,$5,$6,$7)
    returning *
  `,[job.project_id,job.id,job.recommendation_id,prior.verification_type||'post_execution',prior.before_state||{},prior.after_state||{},
    {...(prior.evidence||{}),retryOfVerificationId:prior.id,retryCreatedAt:new Date().toISOString()}]);
  return retry.rows[0]||null;
}

export async function finalizeExecutionForVerification(jobId:string,resultState:Record<string,unknown>={}){
  const job=await loadJob(jobId);
  const beforeState=await getBeforeState(job);
  const completed=await completeExecution(jobId,resultState);
  if(!completed)return {queued:false,reason:'Job verification aşamasına geçirilemedi.'};

  const afterState=await captureCurrentState(job.project_id);
  const verification=await pool.query(`
    update verification_results
    set before_state=$2,after_state=$3,evidence=coalesce(evidence,'{}'::jsonb)||$4::jsonb
    where execution_job_id=$1 and status='pending'
    returning *
  `,[jobId,beforeState,afterState,JSON.stringify({afterStateCapturedAt:afterState.capturedAt})]);

  if(job.action_log_id){
    await pool.query('update action_log set after_state=$2,executed_at=coalesce(executed_at,now()) where id=$1',[job.action_log_id,afterState]);
  }

  return {queued:true,job:completed,verification:verification.rows[0]||null,beforeState,afterState};
}

function auditScore(snapshot:Record<string,unknown>|Snapshot){
  const latest=(snapshot as Snapshot).latestAudit as {overall_score?:number|string}|null|undefined;
  const value=Number(latest?.overall_score);
  return Number.isFinite(value)?value:null;
}

export async function verifyExecutionJob(jobId:string){
  const job=await loadJob(jobId);
  const verification=await pendingVerificationForJob(job);
  if(!verification)return {verified:false,reason:'Pending verification bulunamadı.'};

  const before=(verification.before_state||{}) as Record<string,unknown>;
  const after=await captureCurrentState(job.project_id);
  const scoreBefore=auditScore(before);
  const scoreAfter=auditScore(after);
  const requested=(job.proposed_action||{}) as Record<string,unknown>;

  const decision=verifyByProvider({
    provider:job.provider,
    actionType:job.action_type,
    requestedState:requested,
    beforeState:before,
    afterState:after as unknown as Record<string,unknown>,
    scoreBefore,
    scoreAfter
  });

  const evidence={
    provider:job.provider,
    actionType:job.action_type,
    verifier:decision.verifier,
    ...decision.evidence
  };

  const saved=await recordVerification({
    verificationId:verification.id,
    status:decision.status,
    beforeState:before,
    afterState:after as unknown as Record<string,unknown>,
    scoreBefore,
    scoreAfter,
    verdict:decision.verdict,
    evidence
  });

  return {
    verified:decision.status==='passed',
    status:decision.status,
    verifier:decision.verifier,
    verdict:decision.verdict,
    verification:saved,
    afterState:after
  };
}
