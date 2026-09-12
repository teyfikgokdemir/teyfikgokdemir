'use client';

import { useEffect,useState } from 'react';

type ProductIssue={code?:string;severity?:string;attribute?:string;description?:string;detail?:string;documentation?:string};
type ProductRow={offerId:string;title:string;availability?:string|null;link?:string|null;status:string;issueCount:number;issues?:ProductIssue[]};
type AccountIssue={title?:string;severity?:string;detail?:string;documentationUri?:string};
type MerchantAccount={name?:string;accountName?:string;homepage?:string|null;claimed?:boolean|null};
type Commerce={
  matched:boolean;domain?:string;message?:string;selectedMerchantAccountName?:string|null;
  account?:{name?:string;accountName?:string;homepage?:string|null;claimed?:boolean|null;timeZone?:string|null;languageCode?:string|null};
  accounts?:MerchantAccount[];
  summary?:{totalProducts:number;approved:number;pending:number;disapproved:number;withIssues:number;accountIssues:number;criticalIssues:number;errorIssues:number;suggestionIssues:number;partialProducts?:boolean};
  accountIssues?:AccountIssue[];
  products?:ProductRow[];
};
type Resources={merchantCommerce?:Commerce;selectedMerchantAccountName?:string|null;errors?:Record<string,string>};
const api='/api/growth';

export default function MerchantPanel({projectId}:{projectId:string|null}){
  const[data,setData]=useState<Commerce|null>(null);
  const[loading,setLoading]=useState(false);
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState('');

  async function load(id:string){
    setLoading(true);setError('');
    try{
      const r=await fetch(`${api}/projects/${id}/integrations/google/resources`,{cache:'no-store'});
      const body=await r.json() as Resources & {error?:string};
      if(!r.ok)throw new Error(body.error||'Merchant Center verisi okunamadı.');
      if(body.errors?.merchantCommerce)throw new Error(body.errors.merchantCommerce);
      setData(body.merchantCommerce?{...body.merchantCommerce,selectedMerchantAccountName:body.selectedMerchantAccountName||body.merchantCommerce.selectedMerchantAccountName||null}:null);
    }catch(e){setData(null);setError(e instanceof Error?e.message:'Merchant Center verisi okunamadı.');}
    finally{setLoading(false)}
  }

  useEffect(()=>{
    if(!projectId){setData(null);return;}
    void load(projectId);
  },[projectId]);

  async function selectAccount(accountName:string){
    if(!projectId||!accountName)return;
    setSaving(true);setError('');
    try{
      const r=await fetch(`${api}/projects/${projectId}/integrations/google/merchant/select`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({accountName})});
      const body=await r.json() as {error?:string};
      if(!r.ok)throw new Error(body.error||'Merchant Center hesabı seçilemedi.');
      await load(projectId);
    }catch(e){setError(e instanceof Error?e.message:'Merchant Center hesabı seçilemedi.');}
    finally{setSaving(false)}
  }

  if(!projectId)return <div className="empty">Önce bir proje seç.</div>;
  const s=data?.summary;
  const accounts=data?.accounts||[];
  const selected=data?.selectedMerchantAccountName||data?.account?.name||'';
  return <div className="moduleStack">
    <section className="moduleCard">
      <div className="reportHead compact"><div><p className="eyebrow">Commerce / Merchant</p><h2>Google Merchant Center</h2></div><span>{data?.matched?'CANLI VERİ':'HESAP EŞLEME'}</span></div>
      {loading&&<div className="moduleLoading"><span/> Merchant Center verileri okunuyor…</div>}
      {error&&<div className="error">{error}</div>}
      {accounts.length>0&&<div className="accountMappingGrid" style={{marginTop:16}}><label><span>Bu proje hangi Merchant hesabını kullansın?</span><select value={selected} disabled={saving||loading} onChange={e=>void selectAccount(e.target.value)}><option value="">Hesap seç</option>{accounts.map(a=><option key={a.name} value={a.name}>{a.accountName||a.name}{a.homepage?` · ${a.homepage}`:''}</option>)}</select><small>{saving?'Kaydediliyor…':`${accounts.length} erişilebilir Merchant hesabı bulundu.`}</small></label></div>}
      {data?.matched&&<div className="moduleFoot">{data.account?.accountName||data.account?.name} · {data.account?.homepage||'homepage bilinmiyor'} · {data.account?.claimed===true?'domain doğrulandı':'domain durumu bilinmiyor'}</div>}
      {data&&!data.matched&&<div className="empty"><b>Merchant hesabı otomatik eşleşmedi.</b> {data.message}<br/><small>Yukarıdaki listeden bu projeye ait Merchant hesabını seçebilirsin.</small></div>}
    </section>

    {data?.matched&&s&&<>
      <section className="metricTiles">
        <div className="kpi"><span>Toplam Ürün</span><strong>{s.totalProducts}</strong><small>{s.partialProducts?'İlk 250 ürün':'işlenen ürünler'}</small></div>
        <div className="kpi"><span>Onaylı</span><strong>{s.approved}</strong></div>
        <div className="kpi"><span>Bekleyen</span><strong>{s.pending}</strong></div>
        <div className="kpi"><span>Reddedilen</span><strong>{s.disapproved}</strong></div>
        <div className="kpi"><span>Sorunlu Ürün</span><strong>{s.withIssues}</strong></div>
        <div className="kpi"><span>Hesap Sorunu</span><strong>{s.accountIssues}</strong><small>{s.criticalIssues} kritik · {s.errorIssues} hata</small></div>
      </section>

      <section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Account Health</p><h2>Merchant hesap sorunları</h2></div><span>{data.accountIssues?.length||0} kayıt</span></div>{(data.accountIssues?.length||0)===0?<div className="empty">Hesap seviyesinde açık Merchant sorunu görünmüyor.</div>:<div className="alertList">{(data.accountIssues||[]).map((i,index)=><article key={`${i.title}-${index}`} className={String(i.severity||'').toLowerCase()}><div className="alertSeverity">{String(i.severity||'?').slice(0,1)}</div><div><strong>{i.title||'Merchant sorunu'}</strong><p>{i.detail||'Detay sağlanmadı.'}</p><span>{i.severity||'UNKNOWN'}</span></div></article>)}</div>}</section>

      <section className="moduleCard"><div className="reportHead compact"><div><p className="eyebrow">Product Feed</p><h2>Ürün sağlığı</h2></div><span>{data.products?.length||0} ürün</span></div>{(data.products?.length||0)===0?<div className="empty">İşlenmiş ürün bulunamadı.</div>:<div className="dataTable"><div className="dataHead"><span>Ürün</span><span>Durum</span><span>Stok</span><span>Sorun</span><span>Offer ID</span></div>{(data.products||[]).slice(0,100).map((p,i)=><div className="dataRow" key={`${p.offerId}-${i}`}><span><b>{p.title}</b></span><span>{p.status==='approved'?'ONAYLI':p.status==='pending'?'BEKLİYOR':p.status==='disapproved'?'REDDEDİLDİ':'BİLİNMİYOR'}</span><span>{p.availability||'—'}</span><span>{p.issueCount}</span><span>{p.offerId||'—'}</span></div>)}</div>}</section>
    </>}
  </div>;
}
