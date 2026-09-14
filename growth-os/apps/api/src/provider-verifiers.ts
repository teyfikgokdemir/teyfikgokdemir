export type VerificationStatus='passed'|'failed'|'inconclusive';

export type VerificationContext={
  provider:string;
  actionType:string;
  requestedState:Record<string,unknown>;
  beforeState:Record<string,unknown>;
  afterState:Record<string,unknown>;
  scoreBefore:number|null;
  scoreAfter:number|null;
};

export type VerificationDecision={
  status:VerificationStatus;
  verdict:string;
  evidence:Record<string,unknown>;
  verifier:string;
};

function getNested(obj:Record<string,unknown>,path:string[]):unknown{
  let current:unknown=obj;
  for(const key of path){
    if(!current||typeof current!=='object'||Array.isArray(current))return undefined;
    current=(current as Record<string,unknown>)[key];
  }
  return current;
}

function auditIssueStatus(snapshot:Record<string,unknown>,issueKey:string){
  const issues=getNested(snapshot,['latestAudit','payload','issues']);
  if(!Array.isArray(issues))return null;
  const issue=issues.find(item=>item&&typeof item==='object'&&(item as Record<string,unknown>).key===issueKey) as Record<string,unknown>|undefined;
  return typeof issue?.status==='string'?issue.status:null;
}

function integrationProvider(provider:string){
  return provider==='google_ads'?'google_oauth':provider;
}

function integrationState(snapshot:Record<string,unknown>,provider:string){
  const integrations=snapshot.integrations;
  if(!Array.isArray(integrations))return null;
  const storedProvider=integrationProvider(provider);
  return integrations.find(item=>item&&typeof item==='object'&&String((item as Record<string,unknown>).provider||'')===storedProvider) as Record<string,unknown>|undefined||null;
}

export function verifyByProvider(context:VerificationContext):VerificationDecision{
  const provider=context.provider.toLowerCase();
  const type=context.actionType.toLowerCase();
  const issueKey=typeof context.requestedState.issueKey==='string'?context.requestedState.issueKey:null;

  if(issueKey){
    const state=auditIssueStatus(context.afterState,issueKey);
    if(state==='pass')return {status:'passed',verdict:`Audit issue ${issueKey} başarıyla geçti.`,verifier:'audit_issue',evidence:{issueKey,auditIssueStatus:state}};
    if(state==='fail')return {status:'failed',verdict:`Audit issue ${issueKey} hâlâ fail durumda.`,verifier:'audit_issue',evidence:{issueKey,auditIssueStatus:state}};
    if(state==='warning')return {status:'inconclusive',verdict:`Audit issue ${issueKey} warning durumda; bu durum başarısız doğrulama sayılmıyor.`,verifier:'audit_issue',evidence:{issueKey,auditIssueStatus:state}};
    if(state)return {status:'inconclusive',verdict:`Audit issue ${issueKey} beklenmeyen ${state} durumunda.`,verifier:'audit_issue',evidence:{issueKey,auditIssueStatus:state}};
    return {status:'inconclusive',verdict:`Audit issue ${issueKey} son audit içinde bulunamadı.`,verifier:'audit_issue',evidence:{issueKey,auditIssueStatus:null}};
  }

  if(['google_ads','meta_ads','tiktok_ads','ads'].includes(provider)||type.includes('campaign')||type.includes('budget')){
    const afterIntegration=integrationState(context.afterState,provider);
    return {status:'inconclusive',verdict:'Ads aksiyonu için kampanya düzeyi provider doğrulaması gerekli.',verifier:'ads',evidence:{provider,integrationStatus:afterIntegration?.status||null,externalWriteVerified:false}};
  }

  if(['merchant','commerce','shopify','ikas'].includes(provider)||type.includes('merchant')||type.includes('feed')){
    return {status:'inconclusive',verdict:'Commerce aksiyonu için feed/katalog sonucu provider API üzerinden doğrulanmalı.',verifier:'commerce',evidence:{provider,feedVerificationRequired:true}};
  }

  if(provider==='github'||type==='site_fix'||type==='code_change'){
    if(context.scoreBefore!==null&&context.scoreAfter!==null&&context.scoreAfter>context.scoreBefore){
      return {status:'passed',verdict:`Site değişikliği sonrası audit skoru ${context.scoreBefore} → ${context.scoreAfter} yükseldi.`,verifier:'github_audit',evidence:{scoreImproved:true,scoreBefore:context.scoreBefore,scoreAfter:context.scoreAfter}};
    }
    return {status:'inconclusive',verdict:'Kod değişikliği uygulandı ancak audit iyileşmesi henüz doğrulanmadı.',verifier:'github_audit',evidence:{scoreBefore:context.scoreBefore,scoreAfter:context.scoreAfter}};
  }

  if(provider==='ga4'||type.includes('measurement')){
    return {status:'inconclusive',verdict:'Ölçüm aksiyonu için yeni GA4 event/key event verisi bekleniyor.',verifier:'analytics',evidence:{measurementWindowRequired:true}};
  }

  if(provider==='search_console'||type.includes('seo')){
    return {status:'inconclusive',verdict:'SEO aksiyonu için Search Console performans penceresi dolmadan kesin sonuç verilemez.',verifier:'search_console',evidence:{performanceWindowRequired:true}};
  }

  if(context.scoreBefore!==null&&context.scoreAfter!==null&&context.scoreAfter>context.scoreBefore){
    return {status:'passed',verdict:`Genel audit skoru ${context.scoreBefore} → ${context.scoreAfter} yükseldi.`,verifier:'generic_audit',evidence:{scoreImproved:true}};
  }

  return {status:'inconclusive',verdict:'Provider-specific doğrulama için yeterli kanıt henüz yok.',verifier:'generic',evidence:{provider,actionType:context.actionType}};
}
