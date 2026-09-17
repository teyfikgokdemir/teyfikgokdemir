const PROFIT_FORM_CLASS='targetGrid';
const RUNTIME_ALERT_ID='growth-os-runtime-alert';
const PROJECT_MODULE_PATH=/^\/api\/growth\/projects\/[^/]+\/(?:overview|audits|alerts|recommendations|final-check|metrics|leads|integrations|actions)$/;

function profitTargetInput(value:string){
  const normalized=value.trim();
  if(!normalized)return {valid:true};
  const numeric=Number(normalized);
  if(!Number.isFinite(numeric))return {valid:false,message:'Geçerli bir sayısal değer girin. Ondalık değerlerde nokta kullanın.'};
  if(numeric<0)return {valid:false,message:'Hedef değerleri negatif olamaz.'};
  return {valid:true};
}

function validateProfitTargets(event:SubmitEvent){
  const form=event.target instanceof HTMLFormElement?event.target:null;
  if(!form?.classList.contains(PROFIT_FORM_CLASS))return;
  const inputs=[...form.querySelectorAll('input')];
  for(const input of inputs){
    const result=profitTargetInput(input.value);
    if(result.valid){
      input.setCustomValidity('');
      continue;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    input.setCustomValidity(result.message||'Geçersiz değer.');
    input.reportValidity();
    input.addEventListener('input',()=>input.setCustomValidity(''),{once:true});
    return;
  }
}

function requestPath(input:RequestInfo|URL){
  try{
    const raw=input instanceof Request?input.url:String(input);
    return new URL(raw,window.location.origin).pathname;
  }catch{return ''}
}

function requestMethod(input:RequestInfo|URL,init?:RequestInit){
  return String(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
}

function monitoredProjectModule(input:RequestInfo|URL,init?:RequestInit){
  return requestMethod(input,init)==='GET'&&PROJECT_MODULE_PATH.test(requestPath(input));
}

function showRuntimeAlert(message:string){
  const render=()=>{
    if(!document.body)return;
    let alert=document.getElementById(RUNTIME_ALERT_ID);
    if(!alert){
      alert=document.createElement('div');
      alert.id=RUNTIME_ALERT_ID;
      alert.setAttribute('role','alert');
      Object.assign(alert.style,{
        position:'fixed',
        right:'20px',
        bottom:'20px',
        zIndex:'9999',
        maxWidth:'420px',
        padding:'14px 16px',
        border:'1px solid rgba(255,255,255,.18)',
        borderRadius:'14px',
        background:'rgba(24,16,32,.96)',
        color:'#fff',
        boxShadow:'0 18px 50px rgba(0,0,0,.35)',
        font:'500 13px/1.45 system-ui,sans-serif'
      });
      const text=document.createElement('span');
      text.dataset.runtimeAlertMessage='true';
      alert.appendChild(text);
      const actions=document.createElement('div');
      actions.style.marginTop='10px';
      actions.style.display='flex';
      actions.style.gap='8px';
      const reload=document.createElement('button');
      reload.type='button';
      reload.textContent='Yeniden yükle';
      reload.onclick=()=>window.location.reload();
      const dismiss=document.createElement('button');
      dismiss.type='button';
      dismiss.textContent='Kapat';
      dismiss.onclick=()=>alert?.remove();
      for(const button of [reload,dismiss]){
        Object.assign(button.style,{padding:'7px 10px',borderRadius:'9px',border:'1px solid rgba(255,255,255,.2)',background:'transparent',color:'inherit',cursor:'pointer'});
        actions.appendChild(button);
      }
      alert.appendChild(actions);
      document.body.appendChild(alert);
    }
    const text=alert.querySelector<HTMLElement>('[data-runtime-alert-message="true"]');
    if(text)text.textContent=message;
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});
  else render();
}

const nativeFetch=window.fetch.bind(window);
window.fetch=async(input:RequestInfo|URL,init?:RequestInit)=>{
  const monitored=monitoredProjectModule(input,init);
  try{
    const response=await nativeFetch(input,init);
    if(monitored){
      const path=requestPath(input);
      const expectedEmptyFinalCheck=path.endsWith('/final-check')&&response.status===404;
      if(!response.ok&&!expectedEmptyFinalCheck){
        showRuntimeAlert(`Bir proje modülü yüklenemedi (HTTP ${response.status}). Boş görünen veri güncel olmayabilir.`);
      }else if(response.ok){
        void response.clone().json().catch(()=>showRuntimeAlert('Bir proje modülünün yanıtı okunamadı. Boş görünen veri güncel olmayabilir.'));
      }
    }
    return response;
  }catch(error){
    if(monitored)showRuntimeAlert('Bir proje modülüne ulaşılamadı. Boş görünen veri güncel olmayabilir.');
    throw error;
  }
};

document.addEventListener('submit',validateProfitTargets,true);
