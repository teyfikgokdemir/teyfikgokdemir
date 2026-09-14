export type ExecutorKind='github'|'ads'|'commerce'|'manual';

export type ExecutorContext={
  projectId:string;
  recommendationId:string;
  executionJobId:string;
  provider:string;
  actionType:string;
  requestedState:Record<string,unknown>;
};

export type ExecutorResult={
  status:'blocked'|'ready'|'executed';
  executor:ExecutorKind;
  externalExecution:boolean;
  message:string;
  resultState:Record<string,unknown>;
};

export interface GrowthExecutor{
  kind:ExecutorKind;
  canHandle(context:ExecutorContext):boolean;
  execute(context:ExecutorContext):Promise<ExecutorResult>;
}

function externalWritesEnabled(){
  return String(process.env.EXTERNAL_EXECUTION_ENABLED||'false').toLowerCase()==='true';
}

function adsWritesEnabled(){
  return externalWritesEnabled()&&String(process.env.ADS_WRITE_ENABLED||'false').toLowerCase()==='true';
}

const githubExecutor:GrowthExecutor={
  kind:'github',
  canHandle:context=>context.provider==='github'||context.actionType==='site_fix'||context.actionType==='code_change',
  async execute(context){
    return {
      status:'ready',
      executor:'github',
      externalExecution:false,
      message:'GitHub executor hazır. Repository hedefi ve değişiklik planı doğrulanmadan otomatik commit uygulanmaz.',
      resultState:{mode:'approval_required',provider:context.provider,actionType:context.actionType}
    };
  }
};

const adsExecutor:GrowthExecutor={
  kind:'ads',
  canHandle:context=>['google_ads','meta_ads','tiktok_ads','ads','growth_intelligence'].includes(context.provider)||context.actionType.includes('campaign')||context.actionType.includes('budget'),
  async execute(context){
    if(!adsWritesEnabled()){
      return {
        status:'blocked',
        executor:'ads',
        externalExecution:false,
        message:'Ads write gate kapalı. Job güvenli şekilde kuyrukta tutulur.',
        resultState:{blockedBy:'ADS_WRITE_GATES',required:{EXTERNAL_EXECUTION_ENABLED:true,ADS_WRITE_ENABLED:true}}
      };
    }
    return {
      status:'ready',
      executor:'ads',
      externalExecution:false,
      message:'Ads write gate açık ancak provider bazlı write adapter henüz devreye alınmadı.',
      resultState:{mode:'provider_adapter_required'}
    };
  }
};

const commerceExecutor:GrowthExecutor={
  kind:'commerce',
  canHandle:context=>['merchant','shopify','ikas','commerce'].includes(context.provider)||context.actionType.includes('merchant')||context.actionType.includes('feed'),
  async execute(){
    return {
      status:'blocked',
      executor:'commerce',
      externalExecution:false,
      message:'Commerce executor read-only modda. Feed veya katalog değişikliği otomatik uygulanmaz.',
      resultState:{mode:'read_only'}
    };
  }
};

const manualExecutor:GrowthExecutor={
  kind:'manual',
  canHandle:()=>true,
  async execute(context){
    return {
      status:'blocked',
      executor:'manual',
      externalExecution:false,
      message:'Bu aksiyon için otomatik executor tanımlı değil. Manuel işlem gerekir.',
      resultState:{provider:context.provider,actionType:context.actionType}
    };
  }
};

const registry:GrowthExecutor[]=[githubExecutor,adsExecutor,commerceExecutor,manualExecutor];

export function resolveExecutor(context:ExecutorContext){
  return registry.find(executor=>executor.canHandle(context))||manualExecutor;
}

export async function previewExecution(context:ExecutorContext){
  const executor=resolveExecutor(context);
  return executor.execute(context);
}

export function executorCapabilities(){
  return {
    github:{available:true,writeEnabled:false,requiresApproval:true},
    ads:{available:true,writeEnabled:adsWritesEnabled(),requiresApproval:true},
    commerce:{available:true,writeEnabled:false,requiresApproval:true},
    manual:{available:true,writeEnabled:false,requiresApproval:true}
  };
}
