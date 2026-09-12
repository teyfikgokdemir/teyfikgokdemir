export type DecisionRisk='LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
export type DecisionBand='LOW'|'MEDIUM'|'HIGH';
export type DecisionLabel='HEMEN'|'YÜKSEK'|'ORTA'|'BEKLEYEBİLİR';

export type RecommendationDecision={
  risk:DecisionRisk;
  impact:DecisionBand;
  effort:DecisionBand;
  confidence:DecisionBand;
  score:number;
  label:DecisionLabel;
  modelVersion:'decision-v1';
};

type RecommendationLike={
  title:string;
  rationale:string;
  priority?:string|null;
  source:string;
  proposedAction?:Record<string,unknown>|null;
};

function textValue(value:unknown){return typeof value==='string'?value:''}

export function scoreRecommendation(input:RecommendationLike):RecommendationDecision{
  const action=input.proposedAction||{};
  const type=textValue(action.type).toLowerCase()||'manual_review';
  const issueKey=textValue(action.issueKey);
  const source=(input.source||'').toLowerCase();
  const priority=(input.priority||'').toLowerCase();
  const text=`${input.title} ${input.rationale} ${textValue(action.recommendation)}`.toLowerCase();

  let risk:DecisionRisk='LOW';
  if(type.includes('budget')||type.includes('campaign')||type.includes('publish')||['google_ads','meta_ads','tiktok_ads'].includes(source))risk='CRITICAL';
  else if(type.includes('merchant')||type.includes('feed')||source.includes('commerce'))risk='HIGH';
  else if(type==='site_fix'||type==='code_change'||source==='audit_engine'||source==='github')risk='MEDIUM';

  let impact:DecisionBand='MEDIUM';
  if(priority==='critical'||priority==='high'||text.includes('conversion')||text.includes('dönüşüm')||text.includes('revenue')||text.includes('ciro')||text.includes('tracking')||text.includes('ölçüm')||text.includes('index')||text.includes('merchant'))impact='HIGH';
  else if(priority==='low'||text.includes('cosmetic')||text.includes('minor'))impact='LOW';

  let effort:DecisionBand='MEDIUM';
  if(type==='site_fix'||type==='code_change'||type.includes('tracking')||type.includes('schema')||type.includes('measurement'))effort='LOW';
  if(type.includes('feed')||type.includes('merchant')||type.includes('campaign')||type.includes('budget'))effort='HIGH';

  let confidence:DecisionBand='MEDIUM';
  if(source==='audit_engine'||source==='growth_intelligence'||issueKey)confidence='HIGH';
  if(source==='manual'||type==='manual_review')confidence='LOW';

  const impactWeight:Record<DecisionBand,number>={LOW:1,MEDIUM:2,HIGH:3};
  const effortWeight:Record<DecisionBand,number>={LOW:3,MEDIUM:2,HIGH:1};
  const confidenceWeight:Record<DecisionBand,number>={LOW:1,MEDIUM:2,HIGH:3};
  const riskWeight:Record<DecisionRisk,number>={LOW:1,MEDIUM:2,HIGH:3,CRITICAL:4};
  const raw=impactWeight[impact]*35+effortWeight[effort]*20+confidenceWeight[confidence]*25+riskWeight[risk]*5;
  const score=Math.max(1,Math.min(100,Math.round(raw/2.8)));
  const label:DecisionLabel=score>=80?'HEMEN':score>=65?'YÜKSEK':score>=45?'ORTA':'BEKLEYEBİLİR';

  return {risk,impact,effort,confidence,score,label,modelVersion:'decision-v1'};
}

export function attachRecommendationDecision(input:RecommendationLike){
  return {...(input.proposedAction||{}),decision:scoreRecommendation(input)};
}
