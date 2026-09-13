import { pool } from './db.js';

export type ExecutionStatus='queued'|'in_progress'|'executed'|'failed'|'verification_pending'|'verified'|'rolled_back';
export type VerificationStatus='pending'|'passed'|'failed'|'inconclusive';

type QueueInput={
  projectId:string;
  recommendationId:string;
  actionLogId?:string|null;
  provider:string;
  actionType:string;
  requestedState?:Record<string,unknown>;
  executionMode?:'manual_approval'|'automatic';
};

export async function queueExecution(input:QueueInput){
  const {rows}=await pool.query(`
    insert into execution_jobs(project_id,recommendation_id,action_log_id,provider,action_type,status,execution_mode,requested_state)
    values($1,$2,$3,$4,$5,'queued',$6,$7)
    returning *
  `,[
    input.projectId,
    input.recommendationId,
    input.actionLogId||null,
    input.provider,
    input.actionType,
    input.executionMode||'manual_approval',
    input.requestedState||{}
  ]);
  return rows[0];
}

export async function getExecutionCenter(projectId:string){
  const [jobs,verification,counts]=await Promise.all([
    pool.query(`
      select ej.*,r.title recommendation_title,r.priority recommendation_priority,r.status recommendation_status
      from execution_jobs ej
      left join recommendations r on r.id=ej.recommendation_id
      where ej.project_id=$1
      order by ej.created_at desc
      limit 100
    `,[projectId]),
    pool.query(`
      select vr.*,r.title recommendation_title
      from verification_results vr
      left join recommendations r on r.id=vr.recommendation_id
      where vr.project_id=$1
      order by vr.created_at desc
      limit 100
    `,[projectId]),
    pool.query(`
      select
        count(*) filter(where status='queued')::int queued,
        count(*) filter(where status='in_progress')::int in_progress,
        count(*) filter(where status='executed')::int executed,
        count(*) filter(where status='verification_pending')::int verification_pending,
        count(*) filter(where status='verified')::int verified,
        count(*) filter(where status='failed')::int failed
      from execution_jobs where project_id=$1
    `,[projectId])
  ]);
  return {jobs:jobs.rows,verification:verification.rows,counts:counts.rows[0]};
}

export async function startExecution(jobId:string){
  const {rows}=await pool.query(`
    update execution_jobs
    set status='in_progress',started_at=coalesce(started_at,now()),error_message=null
    where id=$1 and status='queued'
    returning *
  `,[jobId]);
  return rows[0]||null;
}

export async function completeExecution(jobId:string,resultState:Record<string,unknown>={}){
  const client=await pool.connect();
  try{
    await client.query('begin');
    const job=await client.query(`
      update execution_jobs
      set status='verification_pending',result_state=$2,finished_at=now(),error_message=null
      where id=$1 and status='in_progress'
      returning *
    `,[jobId,resultState]);
    if(!job.rows[0]){
      await client.query('rollback');
      return null;
    }
    await client.query(`
      insert into verification_results(project_id,execution_job_id,recommendation_id,status,verification_type,before_state,after_state,evidence)
      values($1,$2,$3,'pending',$4,$5,$6,$7)
    `,[job.rows[0].project_id,job.rows[0].id,job.rows[0].recommendation_id,'post_execution',{},resultState,{generatedBy:'execution_workflow'}]);
    await client.query('commit');
    return job.rows[0];
  }catch(error){
    await client.query('rollback');
    throw error;
  }finally{client.release()}
}

export async function failExecution(jobId:string,errorMessage:string){
  const {rows}=await pool.query(`
    update execution_jobs
    set status='failed',error_message=$2,finished_at=now()
    where id=$1 and status in ('queued','in_progress')
    returning *
  `,[jobId,errorMessage]);
  return rows[0]||null;
}

export async function recordVerification(input:{
  verificationId:string;
  status:VerificationStatus;
  beforeState?:Record<string,unknown>;
  afterState?:Record<string,unknown>;
  scoreBefore?:number|null;
  scoreAfter?:number|null;
  verdict:string;
  evidence?:Record<string,unknown>;
}){
  const client=await pool.connect();
  try{
    await client.query('begin');
    const delta=input.scoreBefore!=null&&input.scoreAfter!=null?input.scoreAfter-input.scoreBefore:null;
    const verification=await client.query(`
      update verification_results
      set status=$2,before_state=$3,after_state=$4,score_before=$5,score_after=$6,score_delta=$7,verdict=$8,evidence=$9,verified_at=now()
      where id=$1 and status='pending'
      returning *
    `,[input.verificationId,input.status,input.beforeState||{},input.afterState||{},input.scoreBefore??null,input.scoreAfter??null,delta,input.verdict,input.evidence||{}]);
    if(!verification.rows[0]){
      await client.query('rollback');
      return null;
    }
    const jobStatus=input.status==='passed'?'verified':input.status==='failed'?'failed':'verification_pending';
    await client.query(`update execution_jobs set status=$2 where id=$1`,[verification.rows[0].execution_job_id,jobStatus]);
    if(input.status==='passed'&&verification.rows[0].recommendation_id){
      await client.query(`update recommendations set status='executed' where id=$1 and status='approved'`,[verification.rows[0].recommendation_id]);
    }
    await client.query('commit');
    return verification.rows[0];
  }catch(error){
    await client.query('rollback');
    throw error;
  }finally{client.release()}
}
