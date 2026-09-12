import type { Request } from 'express';
import { pool } from './db.js';

export type WorkspaceRole='owner'|'admin'|'analyst'|'viewer';
export type WorkspaceActor={
  email:string;
  workspaceId:string;
  role:WorkspaceRole;
  permissions:Record<string,unknown>;
};

const roleWeight:Record<WorkspaceRole,number>={viewer:1,analyst:2,admin:3,owner:4};
const uuidPattern=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
let projectLifecycleSchemaAvailable:boolean|null=null;

function normalizeEmail(value:string){return value.trim().toLowerCase()}
function isUuid(value:string){return uuidPattern.test(value)}

async function hasProjectStatusColumn(){
  if(projectLifecycleSchemaAvailable!==null)return projectLifecycleSchemaAvailable;
  const {rows}=await pool.query(`
    select exists(
      select 1 from information_schema.columns
      where table_schema=current_schema() and table_name='projects' and column_name='status'
    ) as available`);
  projectLifecycleSchemaAvailable=Boolean(rows[0]?.available);
  return projectLifecycleSchemaAvailable;
}

export function actorEmailFromRequest(req:Request){
  const accessEmail=req.header('cf-access-authenticated-user-email')||'';
  if(accessEmail)return normalizeEmail(accessEmail);

  if(process.env.NODE_ENV==='production')return '';

  const developmentEmail=req.header('x-growth-user-email')||process.env.DEFAULT_WORKSPACE_USER_EMAIL||'teyfikgokdemir@outlook.com';
  return normalizeEmail(developmentEmail);
}

export async function resolveWorkspaceActor(req:Request,workspaceId?:string):Promise<WorkspaceActor>{
  const email=actorEmailFromRequest(req);
  if(!email)throw new Error('WORKSPACE_ACCESS_DENIED');
  if(workspaceId&&!isUuid(workspaceId))throw new Error('WORKSPACE_ID_INVALID');

  const values:unknown[]=[email];
  let where="lower(wm.email)=lower($1) and wm.status='active' and aw.status='active'";
  if(workspaceId){values.push(workspaceId);where+=' and aw.id=$2'}
  const {rows}=await pool.query(`
    select aw.id workspace_id,wm.email,wm.role,wm.permissions
    from workspace_members wm
    join agency_workspaces aw on aw.id=wm.workspace_id
    where ${where}
    order by case wm.role when 'owner' then 4 when 'admin' then 3 when 'analyst' then 2 else 1 end desc,wm.created_at asc
    limit 1`,values);
  if(!rows[0])throw new Error('WORKSPACE_ACCESS_DENIED');
  const role=(rows[0].role||'viewer') as WorkspaceRole;
  return {email:rows[0].email,workspaceId:rows[0].workspace_id,role,permissions:rows[0].permissions||{}};
}

export function requireRole(actor:WorkspaceActor,minRole:WorkspaceRole){
  if((roleWeight[actor.role]||0)<roleWeight[minRole])throw new Error('WORKSPACE_ROLE_DENIED');
}

export async function assertProjectAccess(actor:WorkspaceActor,projectId:string){
  if(!isUuid(projectId))throw new Error('PROJECT_ID_INVALID');
  const lifecycleReady=await hasProjectStatusColumn();
  const fields=lifecycleReady
    ? 'id,workspace_id,client_id,name,domain,status,archived_at,archived_by'
    : "id,workspace_id,client_id,name,domain,'active'::text as status,null::timestamptz as archived_at,null::text as archived_by";
  const {rows}=await pool.query(`select ${fields} from projects where id=$1 and workspace_id=$2`,[projectId,actor.workspaceId]);
  if(!rows[0])throw new Error('PROJECT_ACCESS_DENIED');
  return rows[0];
}

export async function assertActiveProjectAccess(actor:WorkspaceActor,projectId:string){
  const project=await assertProjectAccess(actor,projectId);
  if(project.status==='archived')throw new Error('PROJECT_ARCHIVED');
  return project;
}

export async function listWorkspaceProjects(actor:WorkspaceActor){
  const lifecycleReady=await hasProjectStatusColumn();
  const lifecycleFields=lifecycleReady
    ? 'p.status,p.archived_at,p.archived_by,'
    : "'active'::text as status,null::timestamptz as archived_at,null::text as archived_by,";
  const activeFilter=lifecycleReady?"and p.status='active'":'';
  const {rows}=await pool.query(`
    select p.id,p.name,p.domain,p.created_at,p.client_id,
      ${lifecycleFields}
      c.name client_name,c.status client_status
    from projects p
    left join agency_clients c on c.id=p.client_id and c.workspace_id=p.workspace_id
    where p.workspace_id=$1 ${activeFilter}
    order by p.created_at desc`,[actor.workspaceId]);
  return rows;
}

export function workspaceErrorStatus(error:unknown){
  const message=error instanceof Error?error.message:'';
  if(message==='PROJECT_ID_INVALID'||message==='WORKSPACE_ID_INVALID')return 400;
  if(message==='WORKSPACE_ACCESS_DENIED'||message==='PROJECT_ACCESS_DENIED')return 403;
  if(message==='WORKSPACE_ROLE_DENIED')return 403;
  if(message==='PROJECT_ARCHIVED')return 409;
  return 400;
}

export function workspaceErrorMessage(error:unknown){
  const message=error instanceof Error?error.message:'';
  if(message==='PROJECT_ID_INVALID')return 'Geçerli bir proje kimliği gerekli.';
  if(message==='WORKSPACE_ID_INVALID')return 'Geçerli bir workspace kimliği gerekli.';
  if(message==='WORKSPACE_ACCESS_DENIED')return 'Bu workspace için aktif üyelik bulunamadı.';
  if(message==='PROJECT_ACCESS_DENIED')return 'Bu projeye erişim yetkiniz yok.';
  if(message==='WORKSPACE_ROLE_DENIED')return 'Bu işlem için rolünüz yeterli değil.';
  if(message==='PROJECT_ARCHIVED')return 'Bu proje arşivde. Yeni operasyon başlatmadan önce projeyi geri alın.';
  return message||'Workspace işlemi tamamlanamadı.';
}