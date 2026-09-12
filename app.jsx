const {useState,useMemo,useCallback}=React;
const R=(n,d=2)=>isNaN(n)||!isFinite(n)?0:Math.round(n*Math.pow(10,d))/Math.pow(10,d);
const F=(n,d=1)=>(isNaN(n)||!isFinite(n))?'—':n.toFixed(d);

const IB='#1e40af',IL_='#dbeafe',IT='#1e3a5f';
const EB='#b91c1c',EL='#fee2e2',ET='#7f1d1d';

// 발전기 카탈로그·계산 공식은 lib/calc.js 로 분리했다 — 이 화면과 api/compute.js(Vercel 서버리스)가
// 같은 소스를 공유해서, 카탈로그를 고치면 화면·API 양쪽에 동시에 반영된다.
// index.html이 이 파일보다 먼저 lib/calc.js를 로드해 window.GeneratorCalc를 만들어둔다.
const {MANUFACTURERS, DEF, ABS, findModel, findMfg, compute}=window.GeneratorCalc;

// ── COMPACT NUM INPUT ────────────────────────────────────────────
function NI({v,k,min,max,step=1,w=48,col='#374151',sz=12,onChange}){
  return(
    <input type="number" value={v} min={min} max={max} step={step}
      onChange={e=>onChange(k,parseFloat(e.target.value)||0)}
      style={{width:w,textAlign:'center',border:'1.5px solid #d1d5db',borderRadius:5,
        padding:'2px 3px',fontSize:sz,fontWeight:700,color:col,background:'#fff'}}/>
  );
}

// ── GLOBAL SETTINGS BAR ──────────────────────────────────────────
function GlobalBar({d,C,set}){
  const Chip=({label,children,col='#374151'})=>(
    <div style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',
      background:'#fff',border:'1px solid #e5e7eb',borderRadius:7}}>
      <span style={{fontSize:10,color:'#9ca3af',whiteSpace:'nowrap'}}>{label}</span>
      {children}
    </div>
  );
  return(
    <div style={{background:'#f8f7f4',border:'1px solid #e2dfda',borderRadius:9,
      padding:'10px 14px',marginBottom:14}}>

      {/* ═══ 1행: 제조사 + kW 선택 (강조) ═══ */}
      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',
        paddingBottom:10,borderBottom:'1px dashed #d1d5db',marginBottom:10}}>
        <span style={{fontSize:11,fontWeight:800,color:'#1e40af',
          background:'#dbeafe',padding:'4px 10px',borderRadius:6,letterSpacing:.3}}>
          ① 발전기 모델
        </span>

        {/* 제조사 선택 버튼 */}
        <div style={{display:'flex',alignItems:'center',gap:0,background:'#fff',
          border:'2px solid #1e40af',borderRadius:7,overflow:'hidden',
          boxShadow:'0 1px 3px rgba(30,64,175,.15)'}}>
          {MANUFACTURERS.map((m,idx)=>(
            <button key={m.id} onClick={()=>{
              set('model',m.id);
              if(m.id==='custom'){return;}
              const target=m.models.find(x=>x.kw===d.kw)||m.models.find(x=>x.isDefault)||m.models[0];
              if(target){
                set('kw',target.kw);
                set('qcomb',target.qcomb);
                set('qcool',target.qcool);
                set('vref_i',m.vref_i);
                set('vref_e',m.vref_e);
                if(target.cat_oa!=null) set('oa',target.cat_oa);
                if(target.cat_ea!=null) set('ea',target.cat_ea);
              }
            }} style={{padding:'7px 14px',fontSize:12,fontWeight:700,cursor:'pointer',
              border:'none',borderRight:idx<MANUFACTURERS.length-1?'1px solid #e5e7eb':'none',
              background:d.model===m.id?'#1e40af':'#fff',
              color:d.model===m.id?'#fff':'#374151',
              whiteSpace:'nowrap',transition:'all .15s'}}>
              {m.name}
            </button>
          ))}
        </div>

        {/* ▼▼ kW 선택 드롭다운 — 크게, 강조 ▼▼ */}
        {(()=>{const mfg=findMfg(d.model);return mfg&&mfg.models.length>0&&(
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'5px 12px',
            background:'#fef3c7',border:'2px solid #f59e0b',borderRadius:7,
            boxShadow:'0 1px 3px rgba(245,158,11,.2)'}}>
            <span style={{fontSize:11,color:'#92400e',fontWeight:800,whiteSpace:'nowrap',letterSpacing:.3}}>
              Stand-by Power
            </span>
            <select value={d.kw} onChange={e=>{
              const newKw=parseInt(e.target.value);
              const target=mfg.models.find(x=>x.kw===newKw);
              if(target){
                set('kw',newKw);
                set('qcomb',target.qcomb);
                set('qcool',target.qcool);
                if(target.cat_oa!=null) set('oa',target.cat_oa);
                if(target.cat_ea!=null) set('ea',target.cat_ea);
              }
            }} style={{border:'1.5px solid #f59e0b',background:'#fff',fontSize:15,fontWeight:900,
              color:'#92400e',cursor:'pointer',padding:'4px 8px',outline:'none',borderRadius:5,
              fontFamily:'inherit',minWidth:120}}>
              {mfg.models.map(x=>(
                <option key={x.kw} value={x.kw}>
                  {x.kw.toLocaleString()} kW {x.isDefault?'★':''}
                </option>
              ))}
            </select>
            <span style={{fontSize:10,color:'#92400e',opacity:.7}}>
              {mfg.models.length}개 모델
            </span>
          </div>
        );})()}

        {/* 선택된 모델명 표시 */}
        {(()=>{const sel=findModel(d.model,d.kw);return sel&&(
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',
            background:'#1e293b',color:'#fff',borderRadius:6,fontSize:11}}>
            <span style={{opacity:.6}}>모델</span>
            <span style={{fontWeight:800,letterSpacing:.2}}>{sel.model}</span>
            <span style={{opacity:.5,fontSize:10}}>
              · 냉각Q {sel.qcool} · 연소Q {sel.qcomb} m³/min
            </span>
          </div>
        );})()}
      </div>

      {/* ═══ 1.5행: 카탈로그 vs 계산 OA/EA 비교 (강조) ═══ */}
      {(()=>{const sel=findModel(d.model,d.kw);const mfg=findMfg(d.model);
        return sel&&mfg&&(
        <div style={{display:'flex',alignItems:'stretch',gap:8,marginBottom:10,
          padding:'8px 10px',background:'linear-gradient(90deg,#eff6ff 0%,#fef3c7 50%,#fef2f2 100%)',
          borderRadius:7,border:'1px solid #fcd34d'}}>
          <div style={{fontSize:10,fontWeight:800,color:'#78350f',background:'#fef3c7',
            border:'1px solid #f59e0b',borderRadius:5,padding:'4px 8px',
            display:'flex',alignItems:'center',whiteSpace:'nowrap'}}>
            📋 카탈로그<br/>p.{mfg.id==='cummins'?'13':mfg.id==='cat'?'14':mfg.id==='mtu'?'18':'—'} 값
          </div>
          <div style={{flex:1,display:'flex',gap:6,flexWrap:'wrap'}}>
            {/* 카탈로그 O.A */}
            <div style={{flex:'1 1 140px',background:'#fff',border:'2px solid #1e40af',borderRadius:6,
              padding:'5px 10px',textAlign:'center'}}>
              <div style={{fontSize:9,color:'#1e40af',fontWeight:700}}>카탈로그 O.A (급기)</div>
              <div style={{fontSize:18,fontWeight:900,color:'#1e40af',fontFamily:'monospace',lineHeight:1.2}}>
                {sel.cat_oa!=null?sel.cat_oa.toFixed(2):'—'} <span style={{fontSize:11}}>m²/대</span>
              </div>
            </div>
            {/* 계산 OA */}
            <div style={{flex:'1 1 140px',background:'#fff',border:'2px solid #3b82f6',borderRadius:6,
              padding:'5px 10px',textAlign:'center'}}>
              <div style={{fontSize:9,color:'#3b82f6',fontWeight:700}}>계산 OA (=Q÷V÷60)</div>
              <div style={{fontSize:18,fontWeight:900,color:'#3b82f6',fontFamily:'monospace',lineHeight:1.2}}>
                {F(C.oa_q,2)} <span style={{fontSize:11}}>m²/대</span>
                {sel.cat_oa!=null&&<span style={{fontSize:11,marginLeft:4,
                  color:Math.abs(C.oa_q-sel.cat_oa)<0.2?'#059669':'#dc2626'}}>
                  {Math.abs(C.oa_q-sel.cat_oa)<0.2?'✓':'⚠'}
                </span>}
              </div>
            </div>
            {/* 카탈로그 E.A */}
            <div style={{flex:'1 1 140px',background:'#fff',border:'2px solid #b91c1c',borderRadius:6,
              padding:'5px 10px',textAlign:'center'}}>
              <div style={{fontSize:9,color:'#b91c1c',fontWeight:700}}>카탈로그 E.A (배기)</div>
              <div style={{fontSize:18,fontWeight:900,color:'#b91c1c',fontFamily:'monospace',lineHeight:1.2}}>
                {sel.cat_ea!=null?sel.cat_ea.toFixed(2):'—'} <span style={{fontSize:11}}>m²/대</span>
              </div>
            </div>
            {/* 계산 EA */}
            <div style={{flex:'1 1 140px',background:'#fff',border:'2px solid #ef4444',borderRadius:6,
              padding:'5px 10px',textAlign:'center'}}>
              <div style={{fontSize:9,color:'#ef4444',fontWeight:700}}>계산 EA (=Q÷V÷60)</div>
              <div style={{fontSize:18,fontWeight:900,color:'#ef4444',fontFamily:'monospace',lineHeight:1.2}}>
                {F(C.ea_q,2)} <span style={{fontSize:11}}>m²/대</span>
                {sel.cat_ea!=null&&<span style={{fontSize:11,marginLeft:4,
                  color:Math.abs(C.ea_q-sel.cat_ea)<0.2?'#059669':'#dc2626'}}>
                  {Math.abs(C.ea_q-sel.cat_ea)<0.2?'✓':'⚠'}
                </span>}
              </div>
            </div>
          </div>
        </div>
      );})()}

      {/* ═══ 2행: 운전 조건 (대수, 여유율, OA/EA 등) ═══ */}
      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
        <span style={{fontSize:11,fontWeight:800,color:'#374151',
          background:'#e5e7eb',padding:'4px 10px',borderRadius:6,letterSpacing:.3}}>
          ② 운전 조건
        </span>

        <Chip label="OA / 대">
          <NI v={d.oa} k="oa" min={1} max={30} step={0.1} w={52} col={IB} onChange={set}/>
          <span style={{fontSize:10,color:'#9ca3af'}}>m²</span>
        </Chip>
        <Chip label="EA / 대">
          <NI v={d.ea} k="ea" min={1} max={20} step={0.1} w={52} col={EB} onChange={set}/>
          <span style={{fontSize:10,color:'#9ca3af'}}>m²</span>
        </Chip>
        <Chip label="연소Q">
          <NI v={d.qcomb} k="qcomb" min={50} max={500} step={1} w={52} col='#059669' onChange={set}/>
          <span style={{fontSize:10,color:'#9ca3af'}}>m³/min</span>
        </Chip>
        <Chip label="냉각Q">
          <NI v={d.qcool} k="qcool" min={500} max={6000} step={10} w={62} col='#059669' onChange={set}/>
          <span style={{fontSize:10,color:'#9ca3af'}}>m³/min</span>
        </Chip>
        <Chip label="급기V">
          <NI v={d.vref_i} k="vref_i" min={3} max={12} step={0.5} w={42} col={IB} onChange={set}/>
          <span style={{fontSize:10,color:'#9ca3af'}}>m/s</span>
        </Chip>
        <Chip label="배기V">
          <NI v={d.vref_e} k="vref_e" min={3} max={12} step={0.5} w={42} col={EB} onChange={set}/>
          <span style={{fontSize:10,color:'#9ca3af'}}>m/s</span>
        </Chip>
        <Chip label="급기">
          <NI v={d.n_i} k="n_i" min={1} max={20} step={1} w={38} col={IB} onChange={set}/>
          <span style={{fontSize:10,color:'#9ca3af'}}>대</span>
        </Chip>
        <Chip label="배기">
          <NI v={d.n_e} k="n_e" min={1} max={20} step={1} w={38} col={EB} onChange={set}/>
          <span style={{fontSize:10,color:'#9ca3af'}}>대</span>
        </Chip>
        <Chip label="여유율">
          <span style={{fontSize:10,color:'#9ca3af'}}>×</span>
          <NI v={d.sf} k="sf" min={1.0} max={2.0} step={0.05} w={44} onChange={set}/>
        </Chip>

        <button onClick={()=>set('_reset',true)}
          style={{padding:'5px 10px',borderRadius:7,background:'#f3f4f6',
            border:'1px solid #d1d5db',color:'#374151',fontSize:10,fontWeight:600,cursor:'pointer'}}>
          초기화
        </button>
      </div>
      <div style={{display:'flex',gap:12,marginTop:8,fontSize:10,flexWrap:'wrap'}}>
        <span style={{color:IB,fontWeight:700}}>급기량 {d.qcomb+d.qcool} m³/min → Q역산 OA={F(C.oa_q,2)} m²/대</span>
        <span style={{color:EB,fontWeight:700}}>배기량 {d.qcool} m³/min → Q역산 EA={F(C.ea_q,2)} m²/대</span>
        <span style={{color:'#6b7280'}}>카탈로그 참조: OA={F(C.OA,1)} m² / EA={F(C.EA,1)} m²</span>
      </div>
    </div>
  );
}

// ── DIAGRAM CARD (fully inline editable) ────────────────────────
// Card — 풍속(V)·개구율(η) 양방향 연동으로 gross 자동 계산
function Card({label,sub,etaK,eta,vK,vlim,absLim,gross_u,gross_t,net_u,ref_net,border,bg,tc,warn,onChange}){
  const netOk = net_u >= (ref_net||0)*0.98;
  return(
    <div style={{background:bg,border:`2px solid ${warn?'#ef4444':border}`,borderRadius:9,
      padding:'12px 14px',width:172,textAlign:'center',position:'relative',flexShrink:0}}>
      {warn&&<div style={{position:'absolute',top:-8,right:-6,background:'#ef4444',
        color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:9,fontWeight:700}}>⚠ V초과</div>}
      <div style={{fontSize:12,fontWeight:800,color:tc,lineHeight:1.3,marginBottom:2}}>{label}</div>
      {sub&&<div style={{fontSize:10,color:tc,opacity:.6,marginBottom:6}}>{sub}</div>}

      {/* 개구율 → 연동 */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        background:'rgba(255,255,255,.65)',borderRadius:5,padding:'4px 7px',marginBottom:4}}>
        <span style={{fontSize:10,color:tc,opacity:.8}}>개구율 η</span>
        <div style={{display:'flex',alignItems:'center',gap:3}}>
          <NI v={eta} k={etaK} min={10} max={100} step={1} w={46} col={tc} sz={13} onChange={onChange}/>
          <span style={{fontSize:10,color:tc}}>%</span>
        </div>
      </div>

      {/* 설계 풍속 → 연동 */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        background:'rgba(255,255,255,.65)',borderRadius:5,padding:'4px 7px',marginBottom:6}}>
        <span style={{fontSize:10,color:warn?'#dc2626':tc,opacity:.9,fontWeight:warn?700:1}}>설계V</span>
        <div style={{display:'flex',alignItems:'center',gap:3}}>
          <NI v={vlim} k={vK} min={0.5} max={12} step={0.5} w={46}
            col={warn?'#dc2626':tc} sz={13} onChange={onChange}/>
          <span style={{fontSize:10,color:warn?'#dc2626':tc}}>m/s</span>
        </div>
      </div>
      {absLim&&<div style={{fontSize:8,color:'#9ca3af',marginBottom:5,textAlign:'right'}}>
        한계 ≤ {absLim} m/s</div>}

      {/* 결과 */}
      <div style={{borderTop:`1px dashed ${border}`,paddingTop:6}}>
        <div style={{fontSize:9,color:tc,opacity:.55}}>1대 gross</div>
        <div style={{fontSize:22,fontWeight:900,color:tc,lineHeight:1.15}}>{F(gross_u,2)}</div>
        <div style={{fontSize:10,color:tc,opacity:.55,marginBottom:4}}>m²</div>
        {/* net 면적 vs 카탈로그 비교 */}
        <div style={{background:'rgba(255,255,255,.5)',borderRadius:4,padding:'2px 5px',marginBottom:4,
          border:`1px solid ${netOk?'#86efac':'#fca5a5'}`}}>
          <span style={{fontSize:9,color:'#6b7280'}}>net {F(net_u,2)} m²</span>
          {ref_net&&<span style={{fontSize:9,color:netOk?'#166534':'#dc2626',fontWeight:700,marginLeft:4}}>
            {netOk?'✓':'↑'} OA={F(ref_net,2)}</span>}
        </div>
        <div style={{background:'rgba(255,255,255,.55)',borderRadius:5,padding:'3px 7px'}}>
          <span style={{fontSize:14,fontWeight:800,color:tc}}>{F(gross_t,1)}</span>
          <span style={{fontSize:10,color:tc,opacity:.65}}> m² 전체</span>
        </div>
      </div>
    </div>
  );
}

// ── SPACING BADGE (editable, 0 = 직렬) ─────────────────────────
function SpacingBadge({gap,gapK,accentCol,onChange}){
  const isSeries=gap===0;
  const toggle=()=>onChange(gapK, isSeries?3000:0);
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',gap:4,padding:'0 8px',flexShrink:0,minWidth:60}}>
      {/* 직렬/이격 라벨 */}
      <div onClick={toggle} title={isSeries?'클릭 → 이격 분리':'클릭 → 직렬 연결'}
        style={{background:isSeries?'#fee2e2':'#f1f5f9',
          border:`1.5px solid ${isSeries?'#fca5a5':'#cbd5e1'}`,
          borderRadius:5,padding:'3px 9px',fontSize:10,fontWeight:700,
          color:isSeries?'#b91c1c':'#475569',cursor:'pointer',
          whiteSpace:'nowrap',letterSpacing:.3,userSelect:'none'}}>
        {isSeries?'직렬':'이격'}
      </div>
      {/* 화살표 */}
      <div onClick={toggle} style={{display:'flex',alignItems:'center',cursor:'pointer'}}>
        <div style={{height:2,width:isSeries?12:20,background:accentCol,transition:'width .15s'}}/>
        <div style={{width:0,height:0,
          borderTop:'7px solid transparent',borderBottom:'7px solid transparent',
          borderLeft:`10px solid ${accentCol}`}}/>
      </div>
    </div>
  );
}

function Arr({label,col,w=26}){
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',gap:2,padding:'0 5px',flexShrink:0}}>
      {label&&<span style={{fontSize:10,color:col,fontWeight:600,whiteSpace:'nowrap'}}>{label}</span>}
      <div style={{display:'flex',alignItems:'center'}}>
        <div style={{height:2,width:w,background:col}}/>
        <div style={{width:0,height:0,borderTop:'6px solid transparent',
          borderBottom:'6px solid transparent',borderLeft:`8px solid ${col}`}}/>
      </div>
    </div>
  );
}

// ── GEN BLOCK ────────────────────────────────────────────────────
function Gen({ni,ne,modelLabel}){
  return(
    <div style={{background:'#fffbeb',border:'2px solid #f59e0b',borderRadius:10,
      padding:'12px 18px',textAlign:'center',flexShrink:0,alignSelf:'stretch',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,minWidth:110}}>
      <div style={{fontSize:10,fontWeight:700,color:'#92400e',letterSpacing:.5}}>발전기실</div>
      {ni!=null&&<div style={{fontSize:14,color:IB,fontWeight:800}}>급기 ×{ni}대</div>}
      {ne!=null&&<div style={{fontSize:14,color:EB,fontWeight:800}}>배기 ×{ne}대</div>}
      <div style={{fontSize:9,color:'#92400e',background:'rgba(245,158,11,.12)',
        borderRadius:3,padding:'2px 6px',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
        {modelLabel||'—'}
      </div>
    </div>
  );
}

// ── SERIES GROUP WRAPPER ─────────────────────────────────────────
function SeriesGroup({children,color,label}){
  return(
    <div style={{position:'relative',border:`2px solid ${color}50`,borderRadius:9,
      padding:'14px 8px 8px 8px',display:'inline-flex',alignItems:'center',gap:4,
      background:`${color}08`,flexShrink:0,marginTop:8}}>
      <div style={{position:'absolute',top:-11,left:10,background:color,color:'#fff',
        borderRadius:5,padding:'2px 10px',fontSize:11,fontWeight:700,
        letterSpacing:.5,boxShadow:'0 1px 4px rgba(0,0,0,.2)'}}>
        {label||'직렬'}
      </div>
      {children}
    </div>
  );
}

// ── FLOW ROW BUILDER ─────────────────────────────────────────────
// Builds the inline flow: renders groups with SpacingBadge between
function FlowRow({items, spacings, accentCol, seriesLabel, set}){
  // items: [{key,component}, ...]
  // spacings: [mm, ...] length = items.length-1
  // Build groups
  const groups=[];
  let cur=[items[0]];
  spacings.forEach((gap,i)=>{
    if(gap===0) cur.push(items[i+1]);
    else{groups.push({items:cur,gapAfter:gap,gapK:Object.keys(spacings)[i]});cur=[items[i+1]];}
  });
  groups.push({items:cur,gapAfter:null,gapK:null});

  const rendered=[];
  groups.forEach((g,gi)=>{
    const isSeries=g.items.length>1;
    const inner=g.items.map((it,ii)=>(
      <React.Fragment key={it.key}>
        {ii>0&&<Arr col={accentCol} w={14}/>}
        {it.component}
      </React.Fragment>
    ));
    rendered.push(
      isSeries
        ?<SeriesGroup key={gi} color={accentCol} label={seriesLabel}>{inner}</SeriesGroup>
        :<React.Fragment key={gi}>{inner}</React.Fragment>
    );
    if(g.gapAfter!==null){
      rendered.push(
        <SpacingBadge key={`gap-${gi}`} gap={g.gapAfter}
          gapK={g.gapK} accentCol={accentCol} onChange={set}/>
      );
    }
  });
  return <>{rendered}</>;
}

// ── CAD 면적 비교표 ───────────────────────────────────────────────
// 부재 목록: 급기 3개 + 배기 4개
const CAD_ITEMS=[
  {key:'cad_i_da',  label:'급기 DA 그릴',   sys:'i', color:'#1e40af', bg:'#dbeafe'},
  {key:'cad_i_sil', label:'급기 소음기',     sys:'i', color:'#1e40af', bg:'#dbeafe'},
  {key:'cad_i_dmp', label:'급기 댐퍼',       sys:'i', color:'#1e40af', bg:'#dbeafe'},
  {key:'cad_e_sil', label:'배기 소음기',     sys:'e', color:'#b91c1c', bg:'#fee2e2'},
  {key:'cad_e_dmp', label:'배기 댐퍼',       sys:'e', color:'#b91c1c', bg:'#fee2e2'},
  {key:'cad_e_grl', label:'배기 그릴',       sys:'e', color:'#b91c1c', bg:'#fee2e2'},
  {key:'cad_e_da',  label:'배기 DA 그릴',   sys:'e', color:'#b91c1c', bg:'#fee2e2'},
];

function CadComparePanel({C,d}){
  // CAD 입력값 state
  const initCad=()=>Object.fromEntries(CAD_ITEMS.map(it=>[it.key,'']));
  const [cadVals,setCadVals]=useState(initCad);
  // 저장된 비교 행 목록
  const [rows,setRows]=useState([]);

  // 현재 계산값 매핑 (gross 전체)
  const calcMap={
    cad_i_da:  C.ig.da,
    cad_i_sil: C.ig.sil,
    cad_i_dmp: C.ig.dmp,
    cad_e_sil: C.eg.sil,
    cad_e_dmp: C.eg.dmp,
    cad_e_grl: C.eg.grl,
    cad_e_da:  C.eg.da,
  };

  const handleSave=()=>{
    const mfg=MANUFACTURERS.find(m=>m.id===d.model);
    const sel=findModel(d.model,d.kw);
    const label=(mfg&&sel)?`${mfg.name} ${d.kw}kW`:'직접입력';
    const snap=Object.fromEntries(CAD_ITEMS.map(it=>[it.key, calcMap[it.key]]));
    setRows(prev=>[...prev,{id:Date.now(),label,snap}]);
  };

  const handleReset=()=>{setRows([]);setCadVals(initCad());};

  return(
    <div style={{width:320,flexShrink:0,background:'#fff',borderRadius:10,
      border:'1px solid #e5e7eb',padding:'14px',display:'flex',flexDirection:'column',gap:10,
      alignSelf:'flex-start'}}>

      {/* 제목 */}
      <div style={{fontSize:12,fontWeight:800,color:'#111',borderBottom:'1px solid #f3f4f6',paddingBottom:8}}>
        📐 CAD 면적 입력 · 비교표
      </div>

      {/* CAD 입력 */}
      <div style={{fontSize:10,color:'#6b7280',marginBottom:2}}>▼ CAD 실측 면적 입력 (m²)</div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
        <thead>
          <tr style={{background:'#f8fafc'}}>
            <th style={{padding:'4px 6px',textAlign:'left',fontWeight:700,color:'#374151',fontSize:10}}>부재</th>
            <th style={{padding:'4px 6px',textAlign:'center',fontWeight:700,color:'#374151',fontSize:10,width:72}}>CAD m²</th>
            <th style={{padding:'4px 6px',textAlign:'center',fontWeight:700,color:'#374151',fontSize:10,width:64}}>계산값</th>
            <th style={{padding:'4px 6px',textAlign:'center',fontWeight:700,color:'#374151',fontSize:10,width:52}}>차이</th>
          </tr>
        </thead>
        <tbody>
          {CAD_ITEMS.map(it=>{
            const cad=parseFloat(cadVals[it.key]);
            const calc=R(calcMap[it.key],2);
            const diff=(!isNaN(cad)&&cad>0)?R(calc-cad,2):null;
            const over=diff!==null&&diff>0;
            const under=diff!==null&&diff<0;
            return(
              <tr key={it.key} style={{borderBottom:'1px solid #f3f4f6'}}>
                <td style={{padding:'4px 6px',background:it.bg,color:it.color,fontWeight:700,fontSize:10,whiteSpace:'nowrap'}}>
                  {it.label}
                </td>
                <td style={{padding:'3px 4px',textAlign:'center'}}>
                  <input type="number" value={cadVals[it.key]} min={0} step={0.01}
                    onChange={e=>setCadVals(p=>({...p,[it.key]:e.target.value}))}
                    style={{width:64,textAlign:'center',border:'1.5px solid #d1d5db',borderRadius:4,
                      padding:'2px 3px',fontSize:11,fontWeight:700,fontFamily:'monospace'}}/>
                </td>
                <td style={{padding:'4px 6px',textAlign:'center',fontFamily:'monospace',
                  fontWeight:700,color:it.color,fontSize:11}}>{F(calc,2)}</td>
                <td style={{padding:'4px 6px',textAlign:'center',fontFamily:'monospace',
                  fontWeight:800,fontSize:11,
                  color:over?'#dc2626':under?'#2563eb':'#9ca3af'}}>
                  {diff!==null?(over?'+':'')+diff.toFixed(2):'—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 저장 버튼 */}
      <button onClick={handleSave}
        style={{padding:'6px 0',borderRadius:6,background:'#1e40af',color:'#fff',
          border:'none',fontWeight:700,fontSize:11,cursor:'pointer',letterSpacing:.3}}>
        💾 현재 설정 저장
      </button>

      {/* 저장된 비교 행 */}
      {rows.length>0&&(
        <div>
          <div style={{fontSize:10,color:'#6b7280',marginBottom:4}}>▼ 저장된 제조사별 계산값 비교</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,minWidth:280}}>
              <thead>
                <tr style={{background:'#1e293b',color:'#fff'}}>
                  <th style={{padding:'4px 6px',textAlign:'left',fontWeight:600,whiteSpace:'nowrap'}}>제조사/용량</th>
                  {CAD_ITEMS.map(it=>(
                    <th key={it.key} style={{padding:'4px 4px',textAlign:'center',fontWeight:600,
                      fontSize:9,whiteSpace:'nowrap',color:it.color==='#1e40af'?'#93c5fd':'#fca5a5'}}>
                      {it.label.replace('급기 ','').replace('배기 ','')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row=>(
                  <tr key={row.id} style={{borderBottom:'1px solid #f3f4f6'}}>
                    <td style={{padding:'4px 6px',fontWeight:700,fontSize:10,whiteSpace:'nowrap',
                      background:'#f8fafc'}}>{row.label}</td>
                    {CAD_ITEMS.map(it=>{
                      const calc=R(row.snap[it.key],2);
                      const cad=parseFloat(cadVals[it.key]);
                      const diff=(!isNaN(cad)&&cad>0)?R(calc-cad,2):null;
                      const over=diff!==null&&diff>0;
                      const under=diff!==null&&diff<0;
                      return(
                        <td key={it.key} style={{padding:'4px 4px',textAlign:'center',
                          fontFamily:'monospace',fontWeight:800,fontSize:10,
                          background:over?'#fee2e2':under?'#dbeafe':'#f9fafb',
                          color:over?'#dc2626':under?'#1d4ed8':'#374151'}}>
                          {F(calc,2)}
                          {diff!==null&&<div style={{fontSize:8,fontWeight:700}}>
                            {over?'▲':'▼'}{Math.abs(diff).toFixed(2)}
                          </div>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* 초기화 */}
          <button onClick={handleReset}
            style={{marginTop:6,width:'100%',padding:'5px 0',borderRadius:6,
              background:'#f3f4f6',color:'#6b7280',border:'1px solid #d1d5db',
              fontWeight:600,fontSize:10,cursor:'pointer'}}>
            🗑 전체 초기화
          </button>
        </div>
      )}
    </div>
  );
}

// ── DIAGRAM COMPONENT ────────────────────────────────────────────
function Diagram({d,C,set}){
  // Intake items
  const intakeItems=[
    {key:'i_da',component:<Card label="급기 DA" sub="외벽 그릴"
      etaK="i_da_eta" eta={d.i_da_eta} vK="v_i_da" vlim={d.v_i_da} absLim={ABS.i_da}
      gross_u={C.gi.da} gross_t={C.ig.da} net_u={C.ni_net.da} ref_net={C.oa}
      bg={IL_} border={IB} tc={IT} warn={C.warns.i_da} onChange={set}/>},
    {key:'i_sil',component:<Card label="급기 소음기" sub="배플형"
      etaK="i_sil_eta" eta={d.i_sil_eta} vK="v_i_sil" vlim={d.v_i_sil} absLim={ABS.i_sil}
      gross_u={C.gi.sil} gross_t={C.ig.sil} net_u={C.ni_net.sil} ref_net={C.oa}
      bg={IL_} border={IB} tc={IT} warn={C.warns.i_sil} onChange={set}/>},
    {key:'i_dmp',component:<Card label="급기 댐퍼" sub="방화/풍량"
      etaK="i_dmp_eta" eta={d.i_dmp_eta} vK="v_i_dmp" vlim={d.v_i_dmp} absLim={ABS.i_dmp}
      gross_u={C.gi.dmp} gross_t={C.ig.dmp} net_u={C.ni_net.dmp} ref_net={C.oa}
      bg={IL_} border={IB} tc={IT} warn={C.warns.i_dmp} onChange={set}/>},
  ];
  const intakeSpacings={0:d.ig_da_sil,1:d.ig_sil_dmp};
  const intakeSpacingKeys=['ig_da_sil','ig_sil_dmp'];

  // Build intake groups manually (SpacingBadge needs the correct key)
  const buildGroups=(items,spacingVals,spacingKeys)=>{
    const groups=[];
    // Each item in a group carries the gapKey connecting it to the previous item
    let cur=[{item:items[0],splitGapK:null}];
    spacingVals.forEach((gap,i)=>{
      if(gap===0) cur.push({item:items[i+1],splitGapK:spacingKeys[i]});
      else{
        groups.push({items:cur,gapAfter:gap,gapK:spacingKeys[i]});
        cur=[{item:items[i+1],splitGapK:null}];
      }
    });
    groups.push({items:cur,gapAfter:null,gapK:null});
    return groups;
  };

  const renderGroups=(groups,accentCol,seriesLabel)=>{
    const out=[];
    groups.forEach((g,gi)=>{
      const isSeries=g.items.length>1;
      // Build inner elements — series connectors are clickable "분리" arrows
      const inner=g.items.map(({item,splitGapK},ii)=>(
        <React.Fragment key={item.key}>
          {ii>0&&(
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',
              justifyContent:'center',gap:2,padding:'0 3px',flexShrink:0}}
              title="클릭 → 이격으로 분리">
              {/* 분리 버튼 */}
              <div onClick={()=>set(splitGapK,3000)}
                style={{fontSize:8,color:accentCol,background:'rgba(255,255,255,.8)',
                  border:`1px solid ${accentCol}60`,borderRadius:3,padding:'1px 5px',
                  cursor:'pointer',fontWeight:700,whiteSpace:'nowrap',
                  boxShadow:'0 1px 2px rgba(0,0,0,.1)'}}>
                분리↕
              </div>
              {/* 화살표 */}
              <div style={{display:'flex',alignItems:'center'}}>
                <div style={{height:2,width:10,background:accentCol}}/>
                <div style={{width:0,height:0,borderTop:'5px solid transparent',
                  borderBottom:'5px solid transparent',borderLeft:`7px solid ${accentCol}`}}/>
              </div>
            </div>
          )}
          {item.component}
        </React.Fragment>
      ));
      out.push(
        isSeries
          ?<SeriesGroup key={`sg${gi}`} color={accentCol} label={seriesLabel}>{inner}</SeriesGroup>
          :<React.Fragment key={`g${gi}`}>{inner}</React.Fragment>
      );
      if(g.gapAfter!=null){
        out.push(<SpacingBadge key={`sp${gi}`} gap={g.gapAfter} gapK={g.gapK}
          accentCol={accentCol} onChange={set}/>);
      }
    });
    return out;
  };

  const iGroups=buildGroups(intakeItems,[d.ig_da_sil,d.ig_sil_dmp],['ig_da_sil','ig_sil_dmp']);

  const exhaustItems=[
    {key:'e_sil',component:<Card label="배기 소음기" sub="배플형"
      etaK="e_sil_eta" eta={d.e_sil_eta} vK="v_e_sil" vlim={d.v_e_sil} absLim={ABS.e_sil}
      gross_u={C.ge.sil} gross_t={C.eg.sil} net_u={C.ne_net.sil} ref_net={C.ea}
      bg={EL} border={EB} tc={ET} warn={C.warns.e_sil} onChange={set}/>},
    {key:'e_dmp',component:<Card label="배기 댐퍼" sub=""
      etaK="e_dmp_eta" eta={d.e_dmp_eta} vK="v_e_dmp" vlim={d.v_e_dmp} absLim={ABS.e_dmp}
      gross_u={C.ge.dmp} gross_t={C.eg.dmp} net_u={C.ne_net.dmp} ref_net={C.ea}
      bg={EL} border={EB} tc={ET} warn={C.warns.e_dmp} onChange={set}/>},
    {key:'e_grl',component:<Card label="배기 그릴" sub="루버"
      etaK="e_grl_eta" eta={d.e_grl_eta} vK="v_e_grl" vlim={d.v_e_grl} absLim={ABS.e_grl}
      gross_u={C.ge.grl} gross_t={C.eg.grl} net_u={C.ne_net.grl} ref_net={C.ea}
      bg={EL} border={EB} tc={ET} warn={C.warns.e_grl} onChange={set}/>},
    {key:'e_da',component:<Card label="배기 DA" sub="외벽"
      etaK="e_da_eta" eta={d.e_da_eta} vK="v_e_da" vlim={d.v_e_da} absLim={ABS.e_da}
      gross_u={C.ge.da} gross_t={C.eg.da} net_u={C.ne_net.da} ref_net={C.ea}
      bg={EL} border={EB} tc={ET} warn={C.warns.e_da} onChange={set}/>},
  ];
  const eGroups=buildGroups(exhaustItems,
    [d.eg_sil_dmp,d.eg_dmp_grl,d.eg_grl_da],
    ['eg_sil_dmp','eg_dmp_grl','eg_grl_da']);

  return(
    <div>
      {/* INTAKE */}
      <div style={{background:'#eff6ff',borderRadius:10,padding:'14px 16px',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:12}}>
          <div style={{background:IB,color:'#fff',borderRadius:5,padding:'3px 9px',
            fontSize:11,fontWeight:700}}>급기</div>
          <span style={{fontSize:11,color:'#3b82f6'}}>외부 → 발전기실</span>
          <span style={{fontSize:10,color:'#93c5fd',marginLeft:4}}>
            이격거리 0 = 직렬 · 직렬 내 분리↕ 클릭 = 이격 분리 · 화살표 클릭 = mm 수정
          </span>
          <div style={{marginLeft:'auto',fontSize:11,color:IT,fontWeight:700}}>
            OA = {F(C.OA,2)} m²
          </div>
        </div>
        <div style={{overflowX:'auto',paddingBottom:6}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:0,minWidth:'max-content'}}>
            <div style={{fontSize:10,color:'#6b7280',textAlign:'center',marginRight:6}}>🌤<br/>외부</div>
            <Arr label="외기유입" col={IB}/>
            {renderGroups(iGroups,IB,'직렬')}
            <Arr label="급기공급" col={IB}/>
            <Gen ni={d.n_i} modelLabel={(()=>{const s=findModel(d.model,d.kw);return s?`${s.model.split(' / ')[0]} · ${d.kw}kW`:'';})()}/>
          </div>
        </div>
      </div>
      {/* EXHAUST */}
      <div style={{background:'#fef2f2',borderRadius:10,padding:'14px 16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:12}}>
          <div style={{background:EB,color:'#fff',borderRadius:5,padding:'3px 9px',
            fontSize:11,fontWeight:700}}>배기</div>
          <span style={{fontSize:11,color:'#ef4444'}}>발전기실 → 외부</span>
          <span style={{fontSize:10,color:'#fca5a5',marginLeft:4}}>
            이격거리 0 = 직렬 · 직렬 내 분리↕ 클릭 = 이격 분리 · 화살표 클릭 = mm 수정
          </span>
          <div style={{marginLeft:'auto',fontSize:11,color:ET,fontWeight:700}}>
            EA = {F(C.EA,2)} m²
          </div>
        </div>
        <div style={{overflowX:'auto',paddingBottom:6}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:0,minWidth:'max-content'}}>
            <Gen ne={d.n_e} modelLabel={(()=>{const s=findModel(d.model,d.kw);return s?`${s.model.split(' / ')[0]} · ${d.kw}kW`:'';})()}/>
            <Arr label="고온배기" col={EB}/>
            {renderGroups(eGroups,EB,'직렬')}
            <Arr label="토출" col={EB}/>
            <div style={{fontSize:10,color:'#6b7280',textAlign:'center',marginLeft:6}}>🌤<br/>외부</div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── MEMO TAB ─────────────────────────────────────────────────────
function MemoTab({C,d}){
  const qi=C.qi, qe=C.qe;
  const BX=({title,col,bg,children})=>(
    <div style={{background:bg,border:`1.5px solid ${col}40`,borderRadius:9,padding:'16px 18px',marginBottom:12}}>
      <div style={{fontSize:13,fontWeight:700,color:col,marginBottom:10,paddingBottom:7,borderBottom:`2px solid ${col}20`}}>{title}</div>
      {children}
    </div>
  );
  const Row=({label,val,mono,hi})=>(
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',padding:'5px 0',borderBottom:'1px solid rgba(0,0,0,.05)'}}>
      <span style={{fontSize:12,color:'#374151'}}>{label}</span>
      <span style={{fontFamily:mono?'monospace':'inherit',fontSize:mono?13:12,fontWeight:hi?800:600,color:hi?'#111':'#374151',textAlign:'right'}}>{val}</span>
    </div>
  );
  const Fml=({label,expr,result,col,legend})=>(
    <div style={{background:'rgba(255,255,255,.7)',borderRadius:6,padding:'8px 12px',marginBottom:6,borderLeft:`3px solid ${col||'#374151'}`}}>
      <div style={{fontSize:10,color:'#9ca3af',marginBottom:2}}>{label}</div>
      <div style={{fontFamily:'monospace',fontSize:13,fontWeight:700,color:'#111'}}>{expr}</div>
      {legend&&(
        <div style={{display:'flex',gap:14,marginTop:6,flexWrap:'wrap'}}>
          {legend.map((item,i)=>(
            <div key={i} style={{textAlign:'center'}}>
              <div style={{fontFamily:'monospace',fontSize:12,fontWeight:700,color:col||'#374151'}}>{item.sym}</div>
              <div style={{fontSize:9,color:'#9ca3af',marginTop:1,maxWidth:80}}>{item.desc}</div>
            </div>
          ))}
        </div>
      )}
      {result&&<div style={{fontSize:11,color:col||'#374151',marginTop:4,fontWeight:600}}>{result}</div>}
    </div>
  );
  const steps=[
    {step:'STEP 1',title:'발전기 풍량 확인',desc:'사양서에서 연소 공기량 + 냉각 풍량',val:`(${d.qcomb}+${d.qcool}) m³/min`},
    {step:'STEP 2',title:'단위유량 환산',desc:'m³/min → m³/s (÷ 60초)',val:`급기 ${((d.qcomb+d.qcool)/60).toFixed(2)} m³/s/대`},
    {step:'STEP 3',title:'OA/EA 산출',desc:'단위유량 ÷ 기준풍속 (GnC 표준 7/8 m/s)',val:`OA=${C.oa.toFixed(2)} / EA=${C.ea.toFixed(2)} m²`},
    {step:'STEP 4',title:'부재별 gross 산출',desc:'Q × sf ÷ (V × η) — 각 부재 독립 계산',val:'각 부재 1대 gross 면적'},
    {step:'STEP 5',title:'전체 gross',desc:'1대 gross × 대수 → 건축 입면/평면 반영',val:`전체 = 1대 × ${d.n_i}(급기)/${d.n_e}(배기)대`},
  ];
  return(
    <div style={{maxWidth:960,margin:'0 auto'}}>

      <BX title="① 기본 원리 — 연속 방정식 (Continuity Equation)" col="#374151" bg="#f8f7f4">
        <p style={{fontSize:12,color:'#6b7280',marginBottom:10,lineHeight:1.7}}>
          모든 단면에서 유량은 보존됩니다. <strong>Q(m³/s) = A_net(m²) × V(m/s)</strong>
        </p>
        <Fml label="순수 유효 개구면적 (Net Free Area)" expr="A_net  =  급기량(m³/min)  ÷  (V × 60)" col="#374151"
          legend={[
            {sym:'A_net',desc:'유효 개구면적 (m²) 공기가 실제 통과하는 순수 구멍 크기'},
            {sym:'Q',desc:'단위 유량 (m³/s) 발전기 1대당 필요 풍량'},
            {sym:'V',desc:'설계 풍속 (m/s) 부재별 통과 속도'},
          ]}/>
        <Fml label="설치 기준 전체 면적 (Gross Area = 실제 부재 크기)" expr="A_gross  =  급기량  ÷  (V × 60 × η)" col="#374151"
          legend={[
            {sym:'A_gross',desc:'실제 설치 크기 (m²) 건축 도면 반영값'},
            {sym:'η (에타)',desc:'개구율 (%) 부재 면적 중 실제 뚫린 비율'},
          ]}/>
        <Fml label="여유율 적용 → 최종 앱 계산식" expr="A_gross  =  급기량  ÷  (V × 60 × η)  × sf" col="#1e40af" result="← 핵심 공식 (여유율 포함)"
          legend={[
            {sym:'급기량',desc:'연소+냉각 풍량 m³/min 발전기 사양서 직접 입력'},
            {sym:'V',desc:'설계풍속 m/s 부재별 상이 (GnC 기준: 7/8 m/s)'},
            {sym:'60',desc:'단위환산 min→s (m³/min ÷ 60 = m³/s)'},
            {sym:'η (에타)',desc:'개구율 % DA=100, 소음기=50/39, 댐퍼=85'},
            {sym:'sf',desc:'여유율 Safety Factor 기본값 1.2'},
          ]}/>
        <div style={{background:'#fffbeb',border:'1px solid #fcd34d',borderRadius:5,padding:'8px 12px',marginTop:8,fontSize:11,color:'#92400e'}}>
          <strong>η↓ 또는 V↓ → gross 면적↑</strong><br/>
          개구율이 낮을수록(더 막혀있음), 풍속이 낮을수록(천천히 흘림) → 같은 유량을 위해 더 큰 설치 면적 필요
        </div>
      </BX>

      <BX title="② 계산 흐름 (Step by Step)" col="#1e40af" bg="#eff6ff">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:8,marginBottom:10}}>
          {steps.map((s,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,.7)',borderRadius:6,padding:'10px 12px'}}>
              <div style={{fontSize:10,fontWeight:700,color:'#93c5fd',marginBottom:2}}>{s.step}</div>
              <div style={{fontSize:12,fontWeight:700,color:'#1e3a5f',marginBottom:3}}>{s.title}</div>
              <div style={{fontSize:10,color:'#6b7280',marginBottom:4}}>{s.desc}</div>
              <div style={{fontSize:11,fontWeight:700,color:'#1e40af'}}>{s.val}</div>
            </div>
          ))}
        </div>
        <Fml label="현재 설정 — 급기 단위유량" col="#1e40af"
          expr={`Q = (${d.qcomb}+${d.qcool}) ÷ 60 = ${qi.toFixed(2)} m³/s/대`}
          result={`OA = ${qi.toFixed(2)} ÷ ${d.vref_i} = ${C.oa.toFixed(2)} m²/대`}/>
        <Fml label="현재 설정 — 배기 단위유량" col="#1e40af"
          expr={`Q = ${d.qcool} ÷ 60 = ${qe.toFixed(2)} m³/s/대`}
          result={`EA = ${qe.toFixed(2)} ÷ ${d.vref_e} = ${C.ea.toFixed(2)} m²/대`}/>
      </BX>

      <BX title="③ 부위별 풍속 기준 — 왜 다른가?" col="#b91c1c" bg="#fef2f2">
        <p style={{fontSize:12,color:'#6b7280',marginBottom:10,lineHeight:1.7}}>
          공식은 동일하지만 각 부재의 설치 환경과 물리적 제약이 달라 허용 풍속이 다릅니다.
        </p>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:500}}>
            <thead>
              <tr style={{background:'#374151',color:'#fff'}}>
                {['부재','설계 풍속','제한 근거','초과 시 문제'].map((h,i)=>(
                  <th key={i} style={{padding:'7px 10px',textAlign:'left',fontSize:11}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['DA 급기 그릴 (외부)','2.5 ~ 7 m/s','빗물 유입 (Rain Entrainment) 방지','빗물 침투, 보행자 소음 민원'],
                ['DA 배기 그릴 (외부)','4.0 ~ 8 m/s','배기 방향이라 유입 우려 없음','인근 공간 열기류 불쾌감'],
                ['배플형 소음기','5.5 ~ 8 m/s','재생음 (Self-generated Noise) 방지','소음기가 오히려 새 소음 생성'],
                ['방화/풍량 댐퍼','5.0 ~ 8 m/s','덕트 표준 (KS/ASHRAE)','날개 떨림, 차압 과다, 소음'],
                ['배기 그릴 (루버)','5.0 ~ 6 m/s','풍찰음 방지','휘파람 소리 발생'],
              ].map((r,i)=>(
                <tr key={i} style={{background:i%2?'#fff8f8':'#fff'}}>
                  {r.map((c,j)=><td key={j} style={{padding:'7px 10px',color:'#374151',fontSize:11}}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BX>

      <BX title="④ 이격거리와 직렬/독립 계산" col="#059669" bg="#f0fdf4">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div style={{background:'rgba(255,255,255,.7)',borderRadius:6,padding:'12px'}}>
            <div style={{fontSize:12,fontWeight:700,color:'#166534',marginBottom:6}}>✅ 3m 이상 이격 → 독립 검토</div>
            <div style={{fontSize:11,color:'#374151',lineHeight:1.7,marginBottom:8}}>이격 공간이 완충 플레넘 역할 → 공기가 압력을 회복하고 균일 분산. 각 부재를 별개로 계산해도 배압 문제 없음.</div>
            <div style={{fontFamily:'monospace',fontSize:12,color:'#166534',background:'#dcfce7',borderRadius:4,padding:'6px 8px'}}>
              A = Q × sf ÷ (V_부재 × η_부재)
            </div>
          </div>
          <div style={{background:'rgba(255,255,255,.7)',borderRadius:6,padding:'12px'}}>
            <div style={{fontSize:12,fontWeight:700,color:'#b91c1c',marginBottom:6}}>⚠ 직렬 연결 → 체인 곱연산</div>
            <div style={{fontSize:11,color:'#374151',lineHeight:1.7,marginBottom:8}}>이격 없이 밀착 → 압력 회복 없이 저항 누적. 모든 개구율을 곱해서 총 유효 개구율로 계산.</div>
            <div style={{fontFamily:'monospace',fontSize:12,color:'#b91c1c',background:'#fee2e2',borderRadius:4,padding:'6px 8px'}}>
              A = Q × sf ÷ (V × η₁ × η₂ × η₃)
            </div>
          </div>
        </div>
      </BX>

      <BX title="⑤ 현재 설정값 요약" col="#7c3aed" bg="#faf5ff">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'#1e40af',marginBottom:6}}>🔵 급기 계통</div>
            <Row label="단위유량 Q" val={`${qi.toFixed(2)} m³/s/대`} mono hi/>
            <Row label={`DA 그릴 (η=${d.i_da_eta}%, V=${d.v_i_da}m/s)`} val={`${C.gi.da.toFixed(2)} m²/대`} mono/>
            <Row label={`소음기 (η=${d.i_sil_eta}%, V=${d.v_i_sil}m/s)`} val={`${C.gi.sil.toFixed(2)} m²/대`} mono/>
            <Row label={`댐퍼 (η=${d.i_dmp_eta}%, V=${d.v_i_dmp}m/s)`} val={`${C.gi.dmp.toFixed(2)} m²/대`} mono/>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'#b91c1c',marginBottom:6}}>🔴 배기 계통</div>
            <Row label="단위유량 Q" val={`${qe.toFixed(2)} m³/s/대`} mono hi/>
            <Row label={`소음기 (η=${d.e_sil_eta}%, V=${d.v_e_sil}m/s)`} val={`${C.ge.sil.toFixed(2)} m²/대`} mono/>
            <Row label={`댐퍼 (η=${d.e_dmp_eta}%, V=${d.v_e_dmp}m/s)`} val={`${C.ge.dmp.toFixed(2)} m²/대`} mono/>
            <Row label={`그릴 (η=${d.e_grl_eta}%, V=${d.v_e_grl}m/s)`} val={`${C.ge.grl.toFixed(2)} m²/대`} mono/>
            <Row label={`DA (η=${d.e_da_eta}%, V=${d.v_e_da}m/s)`} val={`${C.ge.da.toFixed(2)} m²/대`} mono/>
          </div>
        </div>
        <div style={{marginTop:10,padding:'8px 12px',background:'rgba(124,58,237,.07)',borderRadius:5,fontSize:11,color:'#5b21b6',fontFamily:'monospace'}}>
          {`gross = 급기량 ÷ (V × 60 × η) × ${d.sf}(여유율)  ·  전체 = 1대 × N대`}
        </div>
        <div style={{marginTop:6,fontSize:10,color:'#9ca3af'}}>
          ※ 출처: {(()=>{const m=findMfg(d.model);const s=findModel(d.model,d.kw);
            return s?`${m.name} ${s.model} (${d.kw}kW) 사양서`:'직접 입력값';})()} · GnCenergy 카탈로그 · GnC에너지 공문 2026-05
        </div>
      </BX>

    </div>
  );
}



// ── IMPORT / EXPORT ──────────────────────────────────────────────
function ImportExportBar({d,C,set}){
  const fileRef=React.useRef();

  // ── Excel 파일 읽기 ──
  const handleFile=async(e)=>{
    const file=e.target.files[0];
    if(!file) return;
    const ext=file.name.split('.').pop().toLowerCase();

    if(ext==='xlsx'||ext==='xls'){
      const reader=new FileReader();
      reader.onload=(ev)=>{
        try{
          const wb=XLSX.read(new Uint8Array(ev.target.result),{type:'array'});
          const ws=wb.Sheets[wb.SheetNames[0]];
          const data=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});

          // 숫자만 추출하는 헬퍼
          const num=(v)=>{const n=parseFloat(String(v).replace(/[^0-9.]/g,''));return isNaN(n)?null:n;};

          // 행/열 스캔으로 핵심 숫자 찾기
          let qcool=null,qcomb=null,vref_i=null,vref_e=null;
          const flat=data.flat().map(v=>String(v));
          data.forEach((row)=>{
            row.forEach((cell,ci)=>{
              const s=String(cell).replace(/\s/g,'');
              // 냉각 풍량
              if(/냉각|Radiator|Cooling/.test(s)&&qcool===null){
                const nxt=num(row[ci+1])||num(row[ci+2]);
                if(nxt&&nxt>500) qcool=nxt;
              }
              // 연소 풍량
              if(/연소|Combustion/.test(s)&&qcomb===null){
                const nxt=num(row[ci+1])||num(row[ci+2]);
                if(nxt&&nxt>50&&nxt<1000) qcomb=nxt;
              }
              // 급기 풍속
              if(/급기.*풍속|vref_i|AirV/.test(s)&&vref_i===null){
                const nxt=num(row[ci+1]);
                if(nxt&&nxt>=3&&nxt<=12) vref_i=nxt;
              }
              // 배기 풍속
              if(/배기.*풍속|vref_e/.test(s)&&vref_e===null){
                const nxt=num(row[ci+1]);
                if(nxt&&nxt>=3&&nxt<=12) vref_e=nxt;
              }
            });
          });

          // 찾은 값 반영
          const updates=[];
          if(qcool){set('qcool',qcool);updates.push(`냉각Q=${qcool}`);}
          if(qcomb){set('qcomb',qcomb);updates.push(`연소Q=${qcomb}`);}
          if(vref_i){set('vref_i',vref_i);updates.push(`급기V=${vref_i}`);}
          if(vref_e){set('vref_e',vref_e);updates.push(`배기V=${vref_e}`);}
          if(qcool||qcomb){set('model','custom');}

          if(updates.length>0){
            alert('✅ 불러오기 완료\n'+updates.join(' · '));
          } else {
            alert('⚠ 파일에서 풍량 데이터를 찾지 못했습니다.\n엑셀 셀에 "냉각", "연소", "Radiator", "Combustion" 키워드가 포함되어야 합니다.');
          }
        } catch(err){
          alert('파일 읽기 오류: '+err.message);
        }
      };
      reader.readAsArrayBuffer(file);

    } else if(ext==='pdf'){
      alert('PDF 파일은 자동 파싱이 어렵습니다.\n사양서의 냉각Q, 연소Q 값을 전역 설정에서 직접 입력해 주세요.\n\n[참고] GnC에너지 카탈로그 엑셀(.xlsx) 파일을 사용하면 자동 불러오기가 됩니다.');
    } else {
      alert('지원 형식: .xlsx, .xls, .pdf');
    }
    e.target.value='';
  };

  // ── PDF 내보내기 ──
  const exportPDF=()=>{
    const printDiv=document.getElementById('print-area');
    const F2=(n,d_=2)=>isNaN(n)||!isFinite(n)?'—':Number(n).toFixed(d_);
    const _mfg=findMfg(d.model);
    const _sel=findModel(d.model,d.kw);
    const _modelLabel=_sel?`${_mfg.name} ${_sel.model} (${d.kw}kW)`:'직접 입력';

    const rows_i=[
      ['급기','DA 그릴',d.i_da_eta,d.v_i_da,C.gi.da,C.ig.da,C.ni_net.da,C.oa,'지상 DA 구조물'],
      ['급기','소음기 (배플형)',d.i_sil_eta,d.v_i_sil,C.gi.sil,C.ig.sil,C.ni_net.sil,C.oa,'샤프트 내부'],
      ['급기','댐퍼 (방화/풍량)',d.i_dmp_eta,d.v_i_dmp,C.gi.dmp,C.ig.dmp,C.ni_net.dmp,C.oa,'B4 벽체'],
    ];
    const rows_e=[
      ['배기','소음기 (배플형)',d.e_sil_eta,d.v_e_sil,C.ge.sil,C.eg.sil,C.ne_net.sil,C.ea,`이격 ${d.eg_sil_dmp}mm`],
      ['배기','댐퍼',d.e_dmp_eta,d.v_e_dmp,C.ge.dmp,C.eg.dmp,C.ne_net.dmp,C.ea,`이격 ${d.eg_dmp_grl}mm`],
      ['배기','그릴 (루버)',d.e_grl_eta,d.v_e_grl,C.ge.grl,C.eg.grl,C.ne_net.grl,C.ea,`이격 ${d.eg_grl_da}mm`],
      ['배기','DA 그릴',d.e_da_eta,d.v_e_da,C.ge.da,C.eg.da,C.ne_net.da,C.ea,'외벽'],
    ];
    const allRows=[...rows_i,...rows_e];
    const rowsHtml=allRows.map(r=>{
      const ok=r[6]>=r[7]*0.98;
      const bg=r[0]==='급기'?'#dbeafe':'#fee2e2';
      return `<tr>
        <td style="background:${bg};font-weight:700">${r[0]}</td>
        <td>${r[1]}</td>
        <td style="text-align:center">${r[2]}%</td>
        <td style="text-align:center">${r[3]} m/s</td>
        <td style="text-align:center;font-weight:700">${F2(r[4])} m²</td>
        <td style="text-align:center;font-weight:900;font-size:14px">${F2(r[5])} m²</td>
        <td style="text-align:center;color:${ok?'#166534':'#dc2626'};font-weight:700">${F2(r[6])} m²</td>
        <td>${r[8]}</td>
      </tr>`;
    }).join('');

    printDiv.innerHTML=`
      <div style="font-family:'Apple SD Gothic Neo',sans-serif;padding:20px;max-width:900px;margin:0 auto">
        <h2 style="color:#1e293b;border-bottom:2px solid #1e40af;padding-bottom:8px;margin-bottom:16px">
          발전기실 급·배기 개구율 검토 결과
        </h2>
        <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px">
          <tr><td style="padding:4px 8px;color:#6b7280">프로젝트</td><td style="padding:4px 8px;font-weight:600">식사 DC · 지하 4층 발전기실</td>
              <td style="padding:4px 8px;color:#6b7280">발전기</td><td style="padding:4px 8px;font-weight:600">${_modelLabel} × ${d.n_i}대</td></tr>
          <tr><td style="padding:4px 8px;color:#6b7280">급기량</td><td style="padding:4px 8px;font-weight:600">${d.qcomb+d.qcool} m³/min/대</td>
              <td style="padding:4px 8px;color:#6b7280">배기량</td><td style="padding:4px 8px;font-weight:600">${d.qcool} m³/min/대</td></tr>
          <tr><td style="padding:4px 8px;color:#6b7280">참조 OA</td><td style="padding:4px 8px;font-weight:600;color:#1e40af">${F2(C.oa)} m²/대</td>
              <td style="padding:4px 8px;color:#6b7280">참조 EA</td><td style="padding:4px 8px;font-weight:600;color:#b91c1c">${F2(C.ea)} m²/대</td></tr>
          <tr><td style="padding:4px 8px;color:#6b7280">여유율</td><td style="padding:4px 8px;font-weight:600">${d.sf}배</td>
              <td style="padding:4px 8px;color:#6b7280">기준 풍속</td><td style="padding:4px 8px;font-weight:600">급기 ${d.vref_i} m/s / 배기 ${d.vref_e} m/s (GnC 표준)</td></tr>
        </table>

        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead>
            <tr style="background:#1e293b;color:#fff">
              <th style="padding:7px 8px;text-align:left">계통</th>
              <th style="padding:7px 8px;text-align:left">부재</th>
              <th style="padding:7px 8px;text-align:center">η</th>
              <th style="padding:7px 8px;text-align:center">설계V</th>
              <th style="padding:7px 8px;text-align:center">1대 gross</th>
              <th style="padding:7px 8px;text-align:center">전체 gross</th>
              <th style="padding:7px 8px;text-align:center">net 확인</th>
              <th style="padding:7px 8px;text-align:left">비고</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>

        <div style="margin-top:12px;font-size:10px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:8px">
          ※ gross = 급기량 ÷ (V × 60 × η) × sf  ·  net = gross × η  ·  OA/EA 기준: GnCenergy 카탈로그 + ${_modelLabel} 사양서
          <br/>출력일: ${new Date().toLocaleDateString('ko-KR')}  ·  GnC에너지 공문 2026-05 반영 (DA=100%, 배기소음기=39%)
        </div>
      </div>`;
    printDiv.style.display='block';
    window.print();
    setTimeout(()=>{printDiv.style.display='none';},1000);
  };

  return(
    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
      {/* 파일 불러오기 */}
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.pdf"
        onChange={handleFile} style={{display:'none'}}/>
      <button onClick={()=>fileRef.current.click()}
        style={{display:'flex',alignItems:'center',gap:6,padding:'6px 14px',
          borderRadius:7,border:'1.5px solid #0ea5e9',color:'#0369a1',
          background:'#f0f9ff',fontSize:11,fontWeight:600,cursor:'pointer'}}>
        📂 카탈로그 불러오기
        <span style={{fontSize:9,color:'#7dd3fc'}}>.xlsx / .xls</span>
      </button>
      {/* PDF 내보내기 */}
      <button onClick={exportPDF}
        style={{display:'flex',alignItems:'center',gap:6,padding:'6px 14px',
          borderRadius:7,border:'1.5px solid #dc2626',color:'#dc2626',
          background:'#fff5f5',fontSize:11,fontWeight:600,cursor:'pointer'}}>
        📄 결과 PDF 출력
      </button>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────
function App(){
  const [d,setD]=useState(DEF);
  const [tab,setTab]=useState('diagram');
  const set=useCallback((k,v)=>{
    if(k==='_reset'){setD(DEF);return;}
    const val=(typeof v==='string'||typeof v==='boolean')?v:isNaN(v)?0:v;
    setD(p=>{
      const next={...p,[k]:val};
      // 직접입력 모드가 아닐 때, Q관련 값 변경 시 oa/ea 자동 연동
      if(['qcomb','qcool','vref_i','vref_e'].includes(k)){ // 직접입력 포함 모든 모드 연동
        const vi=next.vref_i||7.0;
        const ve=next.vref_e||8.0;
        next.oa=R((next.qcomb+next.qcool)/60/vi);
        next.ea=R(next.qcool/60/ve);
      }
      return next;
    });
  },[]);
  // URL 쿼리 파라미터로 초기값 주입 (외부 에이전트가 계산 근거를 이 화면으로 보여줄 때 사용)
  // 예: ?model=cummins&kw=3000&n_i=8&n_e=8&sf=1.2
  React.useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    if(params.has('model')||params.has('kw')){
      const mfgId=params.get('model')||d.model;
      const kwParam=params.has('kw')?parseFloat(params.get('kw')):null;
      const mfg=findMfg(mfgId);
      if(mfg){
        set('model',mfgId);
        const target=mfg.models.find(x=>x.kw===kwParam)||mfg.models.find(x=>x.isDefault)||mfg.models[0];
        if(target){
          set('kw',target.kw);
          set('qcomb',target.qcomb);
          set('qcool',target.qcool);
          set('vref_i',mfg.vref_i);
          set('vref_e',mfg.vref_e);
          if(target.cat_oa!=null) set('oa',target.cat_oa);
          if(target.cat_ea!=null) set('ea',target.cat_ea);
        }
      }
    }
    if(params.has('n_i')) set('n_i',parseInt(params.get('n_i')));
    if(params.has('n_e')) set('n_e',parseInt(params.get('n_e')));
    if(params.has('sf')) set('sf',parseFloat(params.get('sf')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const C=useMemo(()=>compute(d),[d]);
  const TABS=[{k:'diagram',l:'다이어그램'},{k:'area',l:'면적 결과'},{k:'velocity',l:'풍속 검토'},{k:'memo',l:'📋 산식 메모'}];
  const fileRef=React.useRef(null);
  const [importMsg,setImportMsg]=React.useState('');


  // ── Excel 파일 파싱 ───────────────────────────────────────────
  const handleExcelFile=(e)=>{
    const file=e.target.files[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try{
        const wb=window.XLSX.read(new Uint8Array(ev.target.result),{type:'array'});
        const ws=wb.Sheets[wb.SheetNames[0]];
        const rows=window.XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
        let qcool_row=-1,qcomb_row=-1,headers_row=-1;
        rows.forEach((r,i)=>{
          const cell=String(r[0]||'').toLowerCase();
          if(cell.includes('radiator')||cell.includes('냉각')) qcool_row=i;
          if(cell.includes('combustion')||cell.includes('연소')) qcomb_row=i;
          if(cell.includes('구분')||cell.includes('커밍스')||cell.includes('cummins')) headers_row=i;
        });
        if(qcool_row<0||qcomb_row<0){
          setImportMsg('❌ 냉각풍량/연소풍량 행을 찾지 못했습니다. 파일 형식을 확인하세요.');
          return;
        }
        const dataRow=rows[qcool_row];
        const combRow=rows[qcomb_row];
        // Find first numeric column
        let firstCol=1;
        for(let c=1;c<dataRow.length;c++){
          if(!isNaN(parseFloat(dataRow[c]))&&parseFloat(dataRow[c])>0){firstCol=c;break;}
        }
        const cool=parseFloat(dataRow[firstCol])||0;
        const comb=parseFloat(combRow[firstCol])||0;
        if(cool>0){
          set('qcool',cool);
          set('qcomb',comb);
          set('model','custom');
          setImportMsg(`✅ 가져오기 완료: 냉각Q=${cool} m³/min, 연소Q=${comb} m³/min`);
        } else {
          setImportMsg('❌ 숫자 데이터를 파싱하지 못했습니다.');
        }
      } catch(err){
        setImportMsg('❌ 파일 읽기 오류: '+err.message);
      }
      e.target.value='';
    };
    reader.readAsArrayBuffer(file);
  };

  // ── PDF 검토 보고서 내보내기 ──────────────────────────────────
  const exportPDF=()=>{
    const now=new Date().toLocaleDateString('ko-KR');
    const items=[
      {s:'급기',p:'DA 그릴',e:d.i_da_eta,v:d.v_i_da,u:C.gi.da,t:C.ig.da,net:C.ni_net.da,ref:C.oa},
      {s:'급기',p:'소음기',e:d.i_sil_eta,v:d.v_i_sil,u:C.gi.sil,t:C.ig.sil,net:C.ni_net.sil,ref:C.oa},
      {s:'급기',p:'댐퍼',e:d.i_dmp_eta,v:d.v_i_dmp,u:C.gi.dmp,t:C.ig.dmp,net:C.ni_net.dmp,ref:C.oa},
      {s:'배기',p:'소음기',e:d.e_sil_eta,v:d.v_e_sil,u:C.ge.sil,t:C.eg.sil,net:C.ne_net.sil,ref:C.ea},
      {s:'배기',p:'댐퍼',e:d.e_dmp_eta,v:d.v_e_dmp,u:C.ge.dmp,t:C.eg.dmp,net:C.ne_net.dmp,ref:C.ea},
      {s:'배기',p:'그릴',e:d.e_grl_eta,v:d.v_e_grl,u:C.ge.grl,t:C.eg.grl,net:C.ne_net.grl,ref:C.ea},
      {s:'배기',p:'DA 그릴',e:d.e_da_eta,v:d.v_e_da,u:C.ge.da,t:C.eg.da,net:C.ne_net.da,ref:C.ea},
    ];
    const rows=items.map(r=>{
      const ok=r.net>=r.ref*0.98;
      const qval=r.s==='급기'?F(C.qi,2):F(C.qe,2);
      return `<tr style="background:${r.s==='급기'?'#eff6ff':'#fff5f5'}">
        <td style="padding:7px 10px;font-weight:700;color:${r.s==='급기'?'#1e40af':'#b91c1c'}">${r.s}</td>
        <td style="padding:7px 10px">${r.p}</td>
        <td style="padding:7px 10px;text-align:center;font-family:monospace">${r.e}%</td>
        <td style="padding:7px 10px;text-align:center;font-family:monospace">${r.v} m/s</td>
        <td style="padding:7px 10px;text-align:center;font-family:monospace;font-size:10px;color:#6b7280">${qval}×${d.sf}÷(${r.v}×${r.e}%)</td>
        <td style="padding:7px 10px;text-align:center;font-family:monospace;font-weight:700">${F(r.u,2)} m²</td>
        <td style="padding:7px 10px;text-align:center;font-family:monospace;color:${ok?'#166534':'#dc2626'};font-weight:700">${F(r.net,2)} m²</td>
        <td style="padding:7px 10px;text-align:center;font-family:monospace;font-weight:900;font-size:15px">${F(r.t,2)} m²</td>
      </tr>`;
    }).join('');
    const modelInfo=findMfg(d.model);
    const selectedModel=findModel(d.model,d.kw);
    const html=`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>발전기실 급배기 개구율 검토 보고서</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;padding:20px;color:#111;}
  @media print{body{padding:0;} .no-print{display:none;}}
  h1{font-size:20px;font-weight:800;margin-bottom:4px;}
  h2{font-size:13px;font-weight:700;color:#374151;margin:16px 0 6px;}
  .meta{font-size:11px;color:#6b7280;margin-bottom:16px;}
  .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;}
  .card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px;text-align:center;}
  .card .label{font-size:10px;color:#9ca3af;margin-bottom:3px;}
  .card .val{font-size:18px;font-weight:900;color:#111;}
  .card .unit{font-size:10px;color:#9ca3af;}
  table{width:100%;border-collapse:collapse;font-size:12px;}
  th{background:#1e293b;color:#fff;padding:8px 10px;text-align:left;font-size:11px;}
  td{border-bottom:1px solid #e5e7eb;}
  .params{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
  .param-box{background:#f8f7f4;border-radius:6px;padding:12px;}
  .param-row{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #e5e7eb;font-size:11px;}
  .footer{margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;}
  .print-btn{background:#1e40af;color:#fff;border:none;padding:8px 18px;border-radius:5px;font-size:12px;cursor:pointer;margin-bottom:16px;}
</style></head><body>
<button class="no-print print-btn" onclick="window.print()">🖨️ PDF로 저장 (Ctrl+P)</button>
<h1>발전기실 급·배기 개구율 검토 보고서</h1>
<div class="meta">작성일: ${now} &nbsp;|&nbsp; 모델: ${selectedModel?modelInfo.name+' '+selectedModel.model+' · '+d.kw+'kW':'Custom'} &nbsp;|&nbsp; gross = 급기량 ÷ (V × 60 × η) × sf</div>

<h2>📊 요약</h2>
<div class="summary">
  <div class="card"><div class="label">급기 단위유량 Q</div><div class="val">${F(C.qi,2)}</div><div class="unit">m³/s/대</div></div>
  <div class="card"><div class="label">배기 단위유량 Q</div><div class="val">${F(C.qe,2)}</div><div class="unit">m³/s/대</div></div>
  <div class="card" style="border-color:#bfdbfe"><div class="label">참조 OA/대</div><div class="val" style="color:#1e40af">${F(C.oa,2)}</div><div class="unit">m²</div></div>
  <div class="card" style="border-color:#fecaca"><div class="label">참조 EA/대</div><div class="val" style="color:#b91c1c">${F(C.ea,2)}</div><div class="unit">m²</div></div>
</div>

<h2>⚙️ 설계 파라미터</h2>
<div class="params">
  <div class="param-box">
    <div style="font-weight:700;color:#1e40af;margin-bottom:6px">급기 계통</div>
    <div class="param-row"><span>발전기 대수</span><span style="font-weight:700">${d.n_i} 대</span></div>
    <div class="param-row"><span>DA 개구율</span><span>${d.i_da_eta}%</span></div>
    <div class="param-row"><span>소음기 개구율</span><span>${d.i_sil_eta}%</span></div>
    <div class="param-row"><span>댐퍼 개구율</span><span>${d.i_dmp_eta}%</span></div>
    <div class="param-row"><span>DA 설계풍속</span><span>${d.v_i_da} m/s</span></div>
    <div class="param-row"><span>소음기 설계풍속</span><span>${d.v_i_sil} m/s</span></div>
    <div class="param-row"><span>댐퍼 설계풍속</span><span>${d.v_i_dmp} m/s</span></div>
  </div>
  <div class="param-box">
    <div style="font-weight:700;color:#b91c1c;margin-bottom:6px">배기 계통</div>
    <div class="param-row"><span>발전기 대수</span><span style="font-weight:700">${d.n_e} 대</span></div>
    <div class="param-row"><span>소음기 개구율</span><span>${d.e_sil_eta}%</span></div>
    <div class="param-row"><span>댐퍼 개구율</span><span>${d.e_dmp_eta}%</span></div>
    <div class="param-row"><span>그릴 개구율</span><span>${d.e_grl_eta}%</span></div>
    <div class="param-row"><span>DA 개구율</span><span>${d.e_da_eta}%</span></div>
    <div class="param-row"><span>소음기 설계풍속</span><span>${d.v_e_sil} m/s</span></div>
    <div class="param-row"><span>DA 설계풍속</span><span>${d.v_e_da} m/s</span></div>
    <div class="param-row"><span>여유율</span><span style="font-weight:700;color:#374151">× ${d.sf}</span></div>
  </div>
</div>

<h2>📐 부재별 면적 산출 결과</h2>
<table>
  <thead><tr>
    <th>계통</th><th>부재</th><th>개구율</th><th>설계V</th><th>계산식</th>
    <th>1대 gross</th><th>net 면적</th><th>전체 gross</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>

<div class="footer">
  ※ 출처: ${selectedModel?modelInfo.name+' '+selectedModel.model+' ('+d.kw+'kW) 사양서':'직접 입력값'} · GnCenergy 카탈로그 · GnC에너지 공문 2026-05 &nbsp;|&nbsp;
  gross = 급기량 ÷ (V × 60 × η) × sf &nbsp;|&nbsp; net = gross × η ≥ OA/EA 충족 확인
</div>
</body></html>`;
    const w=window.open('','_blank','width=900,height=700');
    w.document.write(html);
    w.document.close();
  };

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh'}}>
      {/* HEADER */}
      <div style={{background:'#111827',color:'#fff',padding:'10px 20px',
        display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,gap:8}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,letterSpacing:-.2}}>발전기실 급·배기 개구율 계산기</div>
          <div style={{fontSize:9,color:'rgba(255,255,255,.4)',marginTop:1}}>
            {(()=>{const mfg=findMfg(d.model);const sel=findModel(d.model,d.kw);
              return sel?`${mfg.name} · ${sel.model} · ${d.kw}kW`:'직접 입력 모드';})()} · GnC 확정 (DA=100%, 배기소음기=39%, V:7/8m/s)
          </div>
        </div>
        <div style={{display:'flex',gap:5}}>
          {TABS.map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)}
              style={{padding:'5px 12px',borderRadius:5,fontSize:11,fontWeight:600,cursor:'pointer',border:'none',
                background:tab===t.k?'#3b82f6':'rgba(255,255,255,.1)',
                color:tab===t.k?'#fff':'rgba(255,255,255,.65)'}}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* Import/Export Bar */}
      <div style={{background:'#1a2535',borderTop:'1px solid rgba(255,255,255,.08)',
        padding:'6px 20px',display:'flex',gap:12,alignItems:'center',flexShrink:0}}>
        <ImportExportBar d={d} C={C} set={set}/>
      </div>

      {/* MAIN — no sidebar */}
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>

        {/* Global settings always visible */}
        <GlobalBar d={d} C={C} set={set}/>

        {/* DIAGRAM */}
        {tab==='diagram'&&(
          <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
            {/* 왼쪽: 다이어그램 */}
            <div style={{flex:1,minWidth:0,background:'#fff',borderRadius:10,border:'1px solid #e5e7eb',padding:'16px',marginBottom:12}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'#111'}}>시스템 레이아웃 다이어그램</div>
                  <div style={{fontSize:10,color:'#9ca3af'}}>
                    개구율·허용풍속·이격거리를 블록 안에서 직접 수정 · 이격거리 0 = 직렬 연결
                  </div>
                </div>
                <div style={{display:'flex',gap:10,fontSize:10}}>
                  <span style={{color:IB,fontWeight:600}}>■ 급기</span>
                  <span style={{color:EB,fontWeight:600}}>■ 배기</span>
                </div>
              </div>
              <Diagram d={d} C={C} set={set}/>
              <div style={{marginTop:10,padding:'7px 12px',background:'#f9fafb',borderRadius:6,
                display:'flex',gap:16,flexWrap:'wrap',fontSize:9,color:'#6b7280'}}>
                <span>📦 gross = 설치 기준 크기 (유효면적 ÷ 개구율)</span>
                <span>⚠ = 허용 풍속 초과</span>
                <span>점선 박스 = 직렬 연결</span>
                <span>mm 박스 = 클릭하여 이격거리 수정 (0 입력 시 직렬 전환)</span>
              </div>
            </div>
            {/* 오른쪽: CAD 비교표 */}
            <CadComparePanel C={C} d={d}/>
          </div>
        )}

        {/* AREA TABLE */}
        {tab==='area'&&(
          <div style={{background:'#fff',borderRadius:10,border:'1px solid #e5e7eb',padding:'16px',marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,color:'#111',marginBottom:12}}>부재별 면적 산출표</div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{background:'#1e293b',color:'#fff'}}>
                    {['계통','부재','개구율','설계V','계산식','1대 gross','net 면적','전체 gross','비고'].map((h,i)=>(
                      <th key={i} style={{padding:'8px 12px',textAlign:i>3?'center':'left',
                        fontWeight:600,fontSize:11,whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {s:'급기',p:'DA 그릴',e:d.i_da_eta,v:d.v_i_da,u:C.gi.da,t:C.ig.da,net:C.ni_net.da,bg:'#dbeafe',tc:'#1e3a5f',n:'지상 DA 구조물'},
                    {s:'급기',p:'소음기 (배플형)',e:d.i_sil_eta,v:d.v_i_sil,u:C.gi.sil,t:C.ig.sil,net:C.ni_net.sil,bg:'#dbeafe',tc:'#1e3a5f',n:'샤프트 내부'},
                    {s:'급기',p:'댐퍼 (방화/풍량)',e:d.i_dmp_eta,v:d.v_i_dmp,u:C.gi.dmp,t:C.ig.dmp,net:C.ni_net.dmp,bg:'#dbeafe',tc:'#1e3a5f',n:'B4 벽체 오프닝'},
                    {s:'배기',p:'소음기 (배플형)',e:d.e_sil_eta,v:d.v_e_sil,u:C.ge.sil,t:C.eg.sil,net:C.ne_net.sil,bg:'#fee2e2',tc:'#7f1d1d',n:`이격 ${d.eg_sil_dmp}mm`},
                    {s:'배기',p:'댐퍼',e:d.e_dmp_eta,v:d.v_e_dmp,u:C.ge.dmp,t:C.eg.dmp,net:C.ne_net.dmp,bg:'#fee2e2',tc:'#7f1d1d',n:`이격 ${d.eg_dmp_grl}mm`},
                    {s:'배기',p:'그릴',e:d.e_grl_eta,v:d.v_e_grl,u:C.ge.grl,t:C.eg.grl,net:C.ne_net.grl,bg:'#fee2e2',tc:'#7f1d1d',n:`이격 ${d.eg_grl_da}mm`},
                    {s:'배기',p:'DA 그릴',e:d.e_da_eta,v:d.v_e_da,u:C.ge.da,t:C.eg.da,net:C.ne_net.da,bg:'#fee2e2',tc:'#7f1d1d',n:'외벽'},
                  ].map((r,i)=>(
                    <tr key={i}>
                      <td style={{padding:'8px 12px',background:r.bg,color:r.tc,fontWeight:700,fontSize:11}}>{r.s}</td>
                      <td style={{padding:'8px 12px',fontWeight:600}}>{r.p}</td>
                      <td style={{padding:'8px 12px',textAlign:'center',fontFamily:'monospace',fontWeight:700}}>{r.e}%</td>
                      <td style={{padding:'8px 12px',textAlign:'center',fontFamily:'monospace',fontWeight:700,
                        color:r.s==='급기'?(r.v>ABS.i_da||r.v>ABS.i_sil||r.v>ABS.i_dmp?'#dc2626':'#059669')
                          :(r.v>ABS.e_sil?'#dc2626':'#059669')}}>{r.v} m/s</td>
                      <td style={{padding:'8px 12px',fontFamily:'monospace',fontSize:10,color:'#6b7280'}}>
                        {r.s==='급기'?d.qcomb+d.qcool:d.qcool}÷(V{r.v}×60×{r.e}%)×{d.sf}
                      </td>
                      <td style={{padding:'8px 12px',textAlign:'center',fontWeight:800,color:r.tc,background:r.bg}}>{F(r.u,2)} m²</td>
                      <td style={{padding:'8px 12px',textAlign:'center',fontWeight:700,fontSize:12,
                        color:r.net>=(r.s==='급기'?C.oa:C.ea)*0.98?'#059669':'#dc2626'}}>
                        {F(r.net,2)} m²</td>
                      <td style={{padding:'8px 12px',textAlign:'center',fontWeight:900,fontSize:14,color:r.tc,background:r.bg}}>{F(r.t,2)} m²</td>
                      <td style={{padding:'8px 12px',fontSize:10,color:'#9ca3af'}}>{r.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VELOCITY TABLE */}
        {tab==='velocity'&&(
          <div style={{background:'#fff',borderRadius:10,border:'1px solid #e5e7eb',padding:'16px'}}>
            <div style={{fontSize:13,fontWeight:700,color:'#111',marginBottom:12}}>부재별 통과 풍속 검토</div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{background:'#1e293b',color:'#fff'}}>
                    {['계통','부재','개구율','설계V (입력값)','절대 한계','판정','근거'].map((h,i)=>(
                      <th key={i} style={{padding:'8px 12px',textAlign:i>2?'center':'left',fontWeight:600,fontSize:11}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {s:'급기',p:'DA 그릴',e:d.i_da_eta,v:d.v_i_da,lim:ABS.i_da,bg:'#dbeafe',tc:'#1e3a5f',warn:C.warns.i_da,n:'빗물 유입 기준'},
                    {s:'급기',p:'소음기',e:d.i_sil_eta,v:d.v_i_sil,lim:ABS.i_sil,bg:'#dbeafe',tc:'#1e3a5f',warn:C.warns.i_sil,n:'재생음 방지'},
                    {s:'급기',p:'댐퍼',e:d.i_dmp_eta,v:d.v_i_dmp,lim:ABS.i_dmp,bg:'#dbeafe',tc:'#1e3a5f',warn:C.warns.i_dmp,n:'덕트 표준'},
                    {s:'배기',p:'소음기',e:d.e_sil_eta,v:d.v_e_sil,lim:ABS.e_sil,bg:'#fee2e2',tc:'#7f1d1d',warn:C.warns.e_sil,n:'재생음 방지'},
                    {s:'배기',p:'댐퍼',e:d.e_dmp_eta,v:d.v_e_dmp,lim:ABS.e_dmp,bg:'#fee2e2',tc:'#7f1d1d',warn:C.warns.e_dmp,n:'덕트 표준'},
                    {s:'배기',p:'그릴',e:d.e_grl_eta,v:d.v_e_grl,lim:ABS.e_grl,bg:'#fee2e2',tc:'#7f1d1d',warn:C.warns.e_grl,n:'직렬 구간'},
                    {s:'배기',p:'DA 그릴',e:d.e_da_eta,v:d.v_e_da,lim:ABS.e_da,bg:'#fee2e2',tc:'#7f1d1d',warn:C.warns.e_da,n:'토출 기준'},
                  ].map((r,i)=>(
                    <tr key={i}>
                      <td style={{padding:'8px 12px',background:r.bg,color:r.tc,fontWeight:700,fontSize:11}}>{r.s}</td>
                      <td style={{padding:'8px 12px',fontWeight:600}}>{r.p}</td>
                      <td style={{padding:'8px 12px',textAlign:'center',fontFamily:'monospace'}}>{r.e}%</td>
                      <td style={{padding:'8px 12px',textAlign:'center',fontFamily:'monospace',
                        fontWeight:800,color:r.warn?'#dc2626':'#059669',fontSize:14}}>{F(r.v,2)} m/s</td>
                      <td style={{padding:'8px 12px',textAlign:'center',fontFamily:'monospace',color:'#6b7280'}}>≤ {r.lim} m/s</td>
                      <td style={{padding:'8px 12px',textAlign:'center',fontWeight:700,fontSize:13,
                        color:r.warn?'#dc2626':'#059669'}}>{r.warn?'⚠ 초과':'✓ 적합'}</td>
                      <td style={{padding:'8px 12px',fontSize:10,color:'#9ca3af'}}>{r.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{marginTop:8,fontSize:10,color:'#9ca3af'}}>
              ※ 설계V = 각 부재에서 실제 설계한 통과 풍속 · gross = Q_unit × sf ÷ (설계V × η) · 절대 한계 초과 시 ⚠
            </div>
          </div>
        )}

        {/* MEMO TAB */}
        {tab==='memo'&&<MemoTab C={C} d={d}/>}

      </div>

      <div style={{background:'#1e293b',color:'rgba(255,255,255,.35)',textAlign:'center',
        padding:'7px',fontSize:10,flexShrink:0}}>
        GnC 확정값 적용 · 급기 {d.n_i}대/배기 {d.n_e}대 · OA={F(C.oa,2)} m²/대 · EA={F(C.ea,2)} m²/대 · DA 개구율 100% · 배기소음기 39%
      </div>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
