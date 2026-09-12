import { Router } from 'express';
import { z } from 'zod';
import { pool } from './db.js';
import { resolveWorkspaceActor, workspaceErrorMessage, workspaceErrorStatus } from './workspace-access.js';

export const workspaceActivityRouter=Router({mergeParams:true});

const querySchema=z.object({
  limit:z.string().regex(/^\d+$/).default('50').transform(Number).pipe(z.number().int().min(1).max(100)),
  action:z.string().min(1).max(200).optional(),
  entityType:z.string().min(1).max(200).optional(),
  cursor:z.string().min(1).max(1024).optional()
});
const cursorSchema=z.object({
  v:z.literal(1),
  workspaceId:z.string().uuid(),
  createdAt:z.string().datetime({precision:6}),
  id:z.string().uuid()
}).strict();

function decodeCursor(value:string,workspaceId:string){
  try{
    if(!/^[A-Za-z0-9_-]+$/.test(value))throw new Error();
    const decoded=Buffer.from(value,'base64url');
    if(decoded.toString('base64url')!==value)throw new Error();
    const cursor=cursorSchema.parse(JSON.parse(decoded.toString('utf8')));
    if(cursor.workspaceId!==workspaceId)throw new Error();
    return cursor;
  }catch{throw new Error('Geçersiz aktivite cursor değeri.')}
}

workspaceActivityRouter.get('/',async(req,res)=>{
  try{
    const workspaceId=String((req.params as Record<string,string|undefined>).workspaceId||'');
    const actor=await resolveWorkspaceActor(req,workspaceId);
    const parsed=querySchema.safeParse(req.query);
    if(!parsed.success)return res.status(400).json({error:'Geçersiz aktivite sorgusu; limit 1 ile 100 arasında olmalı.'});
    const {limit,action,entityType,cursor:encodedCursor}=parsed.data;
    const cursor=encodedCursor?decodeCursor(encodedCursor,actor.workspaceId):null;
    // Preserve PostgreSQL microseconds: converting through JS Date would skip rows on later pages.
    const {rows}=await pool.query(`
      select id,actor_email as "actorEmail",action,entity_type as "entityType",
        entity_id as "entityId",entity_name as "entityName",metadata,
        to_char(created_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as "createdAt"
      from workspace_activity_log
      where workspace_id=$1
        and ($2::text is null or action=$2)
        and ($3::text is null or entity_type=$3)
        and ($4::timestamptz is null or (created_at,id)<($4::timestamptz,$5::uuid))
      order by created_at desc,id desc
      limit $6`,[actor.workspaceId,action??null,entityType??null,cursor?.createdAt??null,cursor?.id??null,limit+1]);
    const items=rows.slice(0,limit);
    const last=items[items.length-1];
    const nextCursor=rows.length>limit
      ?Buffer.from(JSON.stringify({v:1,workspaceId:actor.workspaceId,createdAt:last.createdAt,id:last.id})).toString('base64url')
      :null;
    res.json({items,nextCursor});
  }catch(error){res.status(workspaceErrorStatus(error)).json({error:workspaceErrorMessage(error)})}
});
