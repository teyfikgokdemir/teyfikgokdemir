'use client';

import { useEffect,useRef,useState } from 'react';

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
  const[selectedAccount,setSelectedAccount]=useState('');
  const loadGeneration=useRef(0);

  async function load(id:string,generation=loadGeneration.current){
    if(generation!==loadGeneration.current)return;
    setLoading(true);setError('');
    try{
      const r=await fetch(`${api}/projects/${id}/integrations/google/resources`,{cache:'no-store'});
      const body=await r.json() as Resources & {error?:string};
      if(generation!==loadGeneration.current)return;
      if(!r.ok)throw new Error(body.error||'Merchant Center verisi okunamadı.');
      if(body.errors?.merchantCommerce)throw new Error(body.errors.merchantCommerce);
      const commerce=body.merchantCommerce?{...body.merchantCommerce,selectedMerchantAccountName:body.selectedMerchantAccountName||body.merchantCommerce.selectedMerchantAccountName||null}:null;
      setData(commerce);
      setSelectedAccount(commerce?.selectedMerchantAccountName||commerce?.account?.name||'');
    }catch(e){
      if(generation!==loadGeneration.current)return;
      setData(null);setSelectedAccount('');setError(e instanceof Error?e.message:'Merchant Center verisi okunamadı.');
    }finally{
      if(generation===loadGeneration.current)setLoading(false);
    }
  }

  useEffect(()=>{
    const generation=++loadGeneration.current;
    setData(null);setSelectedAccount('');setSaving(false);setError('');
    if(!projectId){setLoading(false);return;}
    void load(projectId,generation);
  },[projectId]);

  async function selectAccount(){
    if(!projectId||!selectedAccount||saving)return;
    const generation=loadGeneration.current;
    setSaving(true);setError('');
    try{
      const r=await fetch(`${api}/projects/${projectId}/integrations/google/merchant/select`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({accountName:selectedAccount})});
      const body=await r.json() as {error?:string};
      if(generation!==loadGeneration.current)return;
      if(!r.ok)throw new Error(body.error||'Merchant Center hesabı seçilemedi.');
      await load(projectId,generation);
    }catch(e){
      if(generation===loadGeneration.current)setError(e instanceof Error?e.message:'Merchant Center hesabı seçilemedi.');
    }finally{
      if(generation===loadGeneration.current)setSaving(false);
    }
  }

  if(!projectId)return <div className="empty">Önce bir proje seç.</div>;
  const s=data?.summary;
  const accounts=(data?.accounts||[]).filter(a=>a.name);
  const currentAccount=data?.selectedMerchantAccountName||data?.account?.name||'';
  const canOverride=Boolean(data?.matched&&accounts.length>1);
  return <div className="moduleStack">
    <section className="moduleCard">
      <div className="reportHead compact"><div><p className="eyebrow">Commerce / Merchant</p><h2>Google Merchant Center</h2></div><span>{data?.matched?'CANLI VERİ':'HESAP EŞLEME'}</span></div>
      {loading&&<div className="moduleLoading"><span/> Merchant Center verileri okunuyor…</div>}
      {error&&<div className="error">{error}</div>}
      {data?.matched&&<><div className="moduleFoot">{data.account?.accountName||data.account?.name} · {data.account?.homepage||'homepage bilinmiyor'} · {data.account?.claimed===true?'domain doğrulandı':data.account?.claimed===false?'domain doğrulanmadı':'domain durumu bilinmiyor'}</div>{canOverride&&<div className="accountMappingGrid" style={{marginTop:16}}><label><span>Yanlış Merchant hesabı eşleştiyse değiştir</span><select value={selectedAccount} disabled={saving||loading} onChange={e=>setSelectedAccount(e.target.value)}><option value="">Hesap seç</option>{accounts.map(a=><option key={a.name} value={a.name}>{a.accountName||a.name}{a.homepage?` · ${a.homepage}`:''}</option>)}</select><small>{saving?'Kaydediliyor…':`${accounts.length} erişilebilir Merchant hesabı bulundu.`}</small></label><button className="primaryAction" onClick={selectAccount} disabled={!selectedAccount||saving||selectedAccount===currentAccount}>{saving?'Kaydediliyor…':'Hesabı Değiştir'}</button></div>}</>}
      {data&&!data.matched&&accounts.length===0&&<div className="empty"><b>Bu Google hesabında erişilebilir Merchant Center hesabı bulunamadı.</b><div style={{marginTop:8,opacity:.75}}>Önce Merchant Center hesabına bu Google kullanıcısını ekle veya erişimi olan başka bir Google hesabı bağla.</div></div>}
      {data&&!data.matched&&accounts.length>0&&<div className="empty"><b>Merchant hesabı otomatik eşleşmedi.</b> {data.message}<div className="accountMappingGrid" style={{marginTop:16}}><label><span>Bu proje hangi Merchant hesabını kullansın?</span><select value={selectedAccount} disabled={saving||loading} onChange={e=>setSelectedAccount(e.target.value)}><option value="">Hesap seç</option>{accounts.map(a=><option key={a.name} value={a.name}>{a.accountName||a.name}{a.homepage?` · ${a.homepage}`:''}</option>)}</select><small>{saving?'Kaydediliyor…':`${accounts.length} erişilebilir Merchant hesabı bulundu.`}</small></label><button className="primaryAction" onClick={selectAccount} disabled={!selectedAccount||saving}>{saving?'Kaydediliyor…':'Hesabı Eşle'}</button></div></div>}
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
