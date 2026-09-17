const PROFIT_FORM_CLASS='targetGrid';

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

document.addEventListener('submit',validateProfitTargets,true);
