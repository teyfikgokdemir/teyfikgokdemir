'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const links=[
  {href:'/agency',label:'Merkez'},
  {href:'/agency/clients',label:'Müşteriler'},
  {href:'/agency/team',label:'Ekip'},
  {href:'/agency/reports',label:'Raporlar'},
  {href:'/agency/settings',label:'White-label'},
  {href:'/agency/plan',label:'Plan'}
];

export default function AgencyLayout({children}:{children:ReactNode}){
  const pathname=usePathname();
  return <div className="agencyArea">
    <div className="agencyTopbar">
      <a className="agencyIdentity" href="/agency"><span>G</span><div><strong>Growth OS</strong><small>Agency Workspace</small></div></a>
      <nav aria-label="Agency workspace navigation">
        {links.map(link=>{
          const active=link.href==='/agency'?pathname===link.href:pathname.startsWith(link.href);
          return <a key={link.href} href={link.href} className={active?'active':''}>{link.label}</a>;
        })}
      </nav>
      <a className="agencyBack" href="/">Ana Sisteme Dön</a>
    </div>
    {children}
    <style jsx global>{`
      .agencyArea{--agency-coral:#ff705f;--agency-coral-2:#ff8b79;--agency-lilac:#c4b5fd;--agency-purple:#7c3aed;--agency-deep:#120b18;min-height:100vh;background:radial-gradient(circle at 18% -8%,rgba(255,112,95,.34),transparent 34%),radial-gradient(circle at 78% 2%,rgba(196,181,253,.16),transparent 28%),radial-gradient(circle at 100% 30%,rgba(124,58,237,.12),transparent 24%),#0b0710;color:#f8f2f6}
      .agencyArea>main{background:linear-gradient(180deg,rgba(11,7,16,.62),rgba(16,8,17,.86))!important}
      .agencyTopbar{position:sticky;top:0;z-index:80;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:18px;padding:10px 18px;border-bottom:1px solid rgba(255,139,121,.22);background:linear-gradient(90deg,rgba(35,13,20,.96),rgba(18,10,24,.96) 58%,rgba(24,12,34,.96));backdrop-filter:blur(18px);box-shadow:0 10px 34px rgba(0,0,0,.22)}
      .agencyIdentity{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;min-width:max-content}.agencyIdentity>span{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;font-weight:900;background:linear-gradient(145deg,var(--agency-coral),var(--agency-coral-2));box-shadow:0 8px 24px rgba(255,112,95,.28)}.agencyIdentity div{display:grid;gap:1px}.agencyIdentity strong{font-size:12px}.agencyIdentity small{font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:#bda9c6}
      .agencyTopbar nav{display:flex;gap:6px;align-items:center;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}.agencyTopbar nav::-webkit-scrollbar{display:none}.agencyTopbar nav a{flex:0 0 auto;color:#bfaebe;text-decoration:none;font-size:11px;font-weight:700;padding:9px 11px;border-radius:10px;border:1px solid transparent;transition:.18s ease}.agencyTopbar nav a:hover{color:#fff;background:rgba(255,112,95,.08);border-color:rgba(255,112,95,.16)}.agencyTopbar nav a.active{color:#fff;background:linear-gradient(135deg,rgba(255,112,95,.22),rgba(124,58,237,.16));border-color:rgba(255,139,121,.42);box-shadow:inset 0 1px rgba(255,255,255,.04)}
      .agencyBack{color:#f8d8d2;text-decoration:none;border:1px solid rgba(255,112,95,.34);background:rgba(255,112,95,.08);border-radius:11px;padding:9px 11px;font-size:10px;font-weight:800;white-space:nowrap}
      .agencyArea .agencyScreen,.agencyArea .teamScreen,.agencyArea .settingsScreen,.agencyArea .planScreen,.agencyArea .reportsScreen{background:radial-gradient(circle at 82% 0%,rgba(255,112,95,.22) 0,transparent 30%),radial-gradient(circle at 20% 18%,rgba(196,181,253,.10) 0,transparent 24%),linear-gradient(180deg,#0c0710,#120a13 58%,#09060d)!important}
      .agencyArea .cards a:hover,.agencyArea .summary article:hover{border-color:rgba(255,112,95,.46)!important}.agencyArea .cards span,.agencyArea .agencyHeader small,.agencyArea .panelHead small,.agencyArea .settingsHeader small,.agencyArea .teamHeader small{color:var(--agency-coral-2)!important}
      .agencyArea .saveButton,.agencyArea .form button{border-color:rgba(255,139,121,.62)!important;background:linear-gradient(135deg,var(--agency-coral),#e64f65 58%,var(--agency-purple))!important;box-shadow:0 10px 28px rgba(255,112,95,.18)}
      @media(max-width:960px){.agencyTopbar{grid-template-columns:1fr auto}.agencyTopbar nav{grid-column:1/-1;grid-row:2}.agencyBack{grid-column:2;grid-row:1}}
      @media(max-width:560px){.agencyTopbar{padding:9px 10px;gap:8px}.agencyIdentity small{display:none}.agencyBack{font-size:9px;padding:8px}.agencyTopbar nav a{padding:8px 9px;font-size:10px}}
    `}</style>
  </div>;
}
