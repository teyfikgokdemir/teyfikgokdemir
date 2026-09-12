export type ImpactConfidence='LOW'|'MEDIUM'|'HIGH';

export type RevenueImpactEstimate={
  monthlyLow:number;
  monthlyHigh:number;
  currency:'TRY';
  confidence:ImpactConfidence;
  basis:string;
  modelVersion:'impact-v1';
};

type RecommendationLike={
  title:string;
  rationale:string;
  priority?:string|null;
  source:string;
  proposedAction?:Record<string,unknown>|null;
};

type ImpactContext={
  spend30d?:number;
  revenue30d?:number;
  sessions28d?:number;
  keyEvents28d?:number;
  searchImpressions28d?:number;
  searchCtr?:number;
  merchantDisapproved?:number;
  merchantTotalProducts?:number;
  targetRoas?:number;
  targetCpa?:number;
};

function n(value:unknown){const parsed=Number(value??0);return Number.isFinite(parsed)?parsed:0}
function roundMoney(value:number){return Math.max(0,Math.round(value/10)*10)}

export function estimateRevenueImpact(input:RecommendationLike,context:ImpactContext):RevenueImpactEstimate{
  const action=input.proposedAction||{};
  const type=typeof action.type==='string'?action.type.toLowerCase():'manual_review';
  const text=`${input.title} ${input.rationale}`.toLowerCase();
  const spend=n(context.spend30d), revenue=n(context.revenue30d), sessions=n(context.sessions28d);
  const impressions=n(context.searchImpressions28d), ctr=n(context.searchCtr);
  const disapproved=n(context.merchantDisapproved), totalProducts=n(context.merchantTotalProducts);
  const targetRoas=n(context.targetRoas);

  let low=0;
  let high=0;
  let confidence:ImpactConfidence='LOW';
  let basis='Yeterli ticari sinyal olmadığı için konservatif fırsat aralığı kullanıldı.';

  if((type.includes('measurement')||text.includes('ga4')||text.includes('ölçüm'))&&sessions>0){
    const observableBase=Math.max(revenue,spend);
    low=observableBase*0.03;
    high=observableBase*0.12;
    confidence=observableBase>0?'MEDIUM':'LOW';
    basis='Ölçüm kaybının karar ve optimizasyon kalitesinde yaratabileceği tahmini aylık fırsat; mevcut trafik ve gözlemlenen ticari hacim baz alındı.';
  }

  if((type.includes('roas')||text.includes('roas'))&&spend>0){
    const currentRoas=spend>0?revenue/spend:0;
    const gap=targetRoas>0?Math.max(0,targetRoas-currentRoas):0;
    const theoreticalGap=gap*spend;
    low=theoreticalGap*0.15;
    high=theoreticalGap*0.4;
    confidence=targetRoas>0?'HIGH':'MEDIUM';
    basis='Mevcut 30 günlük reklam harcaması ile hedef ROAS arasındaki farkın yalnızca ulaşılabilir bir bölümü fırsat olarak kabul edildi.';
  }

  if((type.includes('seo')||text.includes('ctr'))&&impressions>=100){
    const ctrGap=Math.max(0,0.03-ctr);
    const extraClicks=impressions*ctrGap;
    const revenuePerSession=sessions>0?revenue/sessions:0;
    low=extraClicks*revenuePerSession*0.35;
    high=extraClicks*revenuePerSession*0.8;
    confidence=revenuePerSession>0?'MEDIUM':'LOW';
    basis='Search Console gösterimleri, %3 referans CTR farkı ve gözlemlenen oturum başı gelir üzerinden konservatif organik fırsat tahmini.';
  }

  if((type.includes('merchant')||text.includes('merchant'))&&disapproved>0&&totalProducts>0){
    const blockedShare=Math.min(1,disapproved/totalProducts);
    const commerceBase=Math.max(revenue,spend*2);
    low=commerceBase*blockedShare*0.1;
    high=commerceBase*blockedShare*0.35;
    confidence=revenue>0?'MEDIUM':'LOW';
    basis='Reddedilen ürün oranı ile mevcut ticari hacim birlikte kullanılarak erişilemeyen envanterin olası aylık etkisi tahmin edildi.';
  }

  if(low===0&&high===0){
    const base=Math.max(revenue,spend);
    if(base>0){
      low=base*0.01;
      high=base*0.04;
      confidence='LOW';
      basis='Doğrudan nedensel veri bulunmadığı için mevcut ticari hacmin küçük bir yüzdesi muhafazakâr fırsat bandı olarak kullanıldı.';
    }
  }

  return {
    monthlyLow:roundMoney(low),
    monthlyHigh:roundMoney(Math.max(low,high)),
    currency:'TRY',
    confidence,
    basis,
    modelVersion:'impact-v1'
  };
}

export function attachRevenueImpact(input:RecommendationLike,context:ImpactContext){
  return {...(input.proposedAction||{}),businessImpact:estimateRevenueImpact(input,context)};
}
