import type { PoolClient } from 'pg';

type WorkspaceActivityInput={
  workspaceId:string;
  actorEmail:string;
  action:string;
  entityType:string;
  entityId?:string|null;
  entityName?:string|null;
  metadata?:Record<string,unknown>;
};

export async function writeWorkspaceActivity(db:PoolClient,input:WorkspaceActivityInput){
  await db.query(
    `insert into workspace_activity_log(
      workspace_id,actor_email,action,entity_type,entity_id,entity_name,metadata
    ) values($1,$2,$3,$4,$5,$6,$7::jsonb)`,
    [
      input.workspaceId,
      input.actorEmail,
      input.action,
      input.entityType,
      input.entityId??null,
      input.entityName??null,
      JSON.stringify(input.metadata||{})
    ]
  );
}
