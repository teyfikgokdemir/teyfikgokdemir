import { pool } from './db.js';
import { buildExecutionPlan } from './execution-planner.js';
import { previewExecution, type ExecutorContext } from './executors.js';
import { failExecution, startExecution } from './execution-workflow.js';

type JobRow={
  id:string;
  project_id:string;
  recommendation_id:string|null;
  action_log_id:string|null;
  provider:string;
  action_type:string;
  status:string;
  requested_state:Record<string,unknown>|null;
};

type RecommendationRow={
  id:string;
  project_id:string;
  title:string;
  status:string;
  source:string;
  proposed_action:Record<string,unknown>|null;
};

async function loadExecutionContext(jobId:string){
  const jobResult=await pool.query<JobRow>(`
    select id,project_id,recommendation_id,action_log_id,provider,action_type,status,requested_state
    from execution_jobs
    where id=$1
  `,[jobId]);
  const job=jobResult.rows[0];
  if(!job)throw new Error('Execution job bulunamadı.');
  if(!job.recommendation_id)throw new Error('Execution job recommendation bağlantısı eksik.');

  const recommendationResult=await pool.query<RecommendationRow>(`
    select id,project_id,title,status,source,proposed_action
    from recommendations
    where id=$1 and project_id=$2
  `,[job.recommendation_id,job.project_id]);
  const recommendation=recommendationResult.rows[0];
  if(!recommendation)throw new Error('Recommendation bulunamadı.');

  const context:ExecutorContext={
    projectId:job.project_id,
    recommendationId:recommendation.id,
    executionJobId:job.id,
    provider:job.provider,
    actionType:job.action_type,
    requestedState:job.requested_state||recommendation.proposed_action||{}
  };

  return {job,recommendation,context};
}

export async function buildJobPlan(jobId:string){
  const {job,recommendation,context}=await loadExecutionContext(jobId);
  const plan=buildExecutionPlan(context);
  return {
    job:{id:job.id,status:job.status,provider:job.provider,actionType:job.action_type},
    recommendation:{id:recommendation.id,title:recommendation.title,status:recommendation.status,source:recommendation.source},
    plan
  };
}

export async function captureBeforeState(jobId:string){
  const {job,recommendation,context}=await loadExecutionContext(jobId);
  const [project,latestAudit,integrations,targets]=await Promise.all([
    pool.query('select id,name,domain from projects where id=$1',[job.project_id]),
    pool.query('select id,overall_score,seo_score,geo_score,aeo_score,aio_score,ads_readiness_score,created_at from audits where project_id=$1 order by created_at desc limit 1',[job.project_id]),
    pool.query("select provider,account_label,external_account_id,status,mode,last_sync_at from integrations where project_id=$1 order by provider",[job.project_id]),
    pool.query('select * from business_targets where project_id=$1',[job.project_id])
  ]);

  const snapshot={
    capturedAt:new Date().toISOString(),
    project:project.rows[0]||null,
    latestAudit:latestAudit.rows[0]||null,
    integrations:integrations.rows,
    targets:targets.rows[0]||null,
    recommendation:{id:recommendation.id,title:recommendation.title,status:recommendation.status},
    requestedState:context.requestedState
  };

  if(job.action_log_id){
    await pool.query('update action_log set before_state=$2 where id=$1',[job.action_log_id,snapshot]);
  }
  return snapshot;
}

export async function prepareExecution(jobId:string){
  const {job,recommendation,context}=await loadExecutionContext(jobId);
  if(job.status!=='queued'){
    return {ready:false,jobId,status:job.status,reason:'Job queued durumda değil.'};
  }
  if(recommendation.status!=='approved'){
    return {ready:false,jobId,status:job.status,reason:'Recommendation approved durumda değil.'};
  }

  const plan=buildExecutionPlan(context);
  const beforeState=await captureBeforeState(jobId);
  const preview=await previewExecution(context);
  const blockers=[...plan.blockers];
  if(preview.status==='blocked')blockers.push(preview.message);

  await pool.query(`
    update execution_jobs
    set result_state=$2
    where id=$1
  `,[jobId,{phase:'prepared',plan,preview,beforeStateCaptured:true}]);

  if(blockers.length>0){
    return {ready:false,jobId,status:'queued',plan,preview,blockers,beforeState};
  }

  return {ready:true,jobId,status:'queued',plan,preview,blockers:[],beforeState};
}

export async function runPreparedExecution(jobId:string){
  const prepared=await prepareExecution(jobId);
  if(!prepared.ready)return prepared;

  const started=await startExecution(jobId);
  if(!started)return {ready:false,jobId,status:'blocked',reason:'Job başlatılamadı.'};

  try{
    const {context}=await loadExecutionContext(jobId);
    const result=await previewExecution(context);
    if(result.status!=='executed'){
      await pool.query(`
        update execution_jobs
        set status='queued',result_state=$2,error_message=null
        where id=$1 and status='in_progress'
      `,[jobId,{phase:'awaiting_executor',result}]);
      return {ready:false,jobId,status:'queued',reason:result.message,result};
    }
    return {ready:true,jobId,status:'in_progress',result};
  }catch(error){
    const message=error instanceof Error?error.message:'Execution orchestration başarısız.';
    await failExecution(jobId,message);
    throw error;
  }
}
