// lib/calc.js
// 발전기실 급배기 개구면적 계산의 단일 소스. app.jsx(브라우저 UI)와 api/compute.js(Vercel 서버리스)가
// 이 파일을 그대로 공유한다 — 카탈로그나 공식을 고치면 화면과 API 양쪽에 동시에 반영된다.
// 브라우저에서는 <script src="lib/calc.js">로 로드되어 window.GeneratorCalc 전역이 생기고,
// Node(api/compute.js)에서는 require('../lib/calc.js')로 그대로 쓴다.

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.GeneratorCalc = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {

  const R = (n, d = 2) => (isNaN(n) || !isFinite(n) ? 0 : Math.round(n * Math.pow(10, d)) / Math.pow(10, d));

  // ── 발전기 제조사별 × kW별 사양 데이터 ─────────────────────────────
  // 출처: GnCenergy 카탈로그 (p.13 Cummins, p.14 Caterpillar, p.18 MTU)
  const MANUFACTURERS = [
    { id: 'cummins', name: 'Cummins', vref_i: 7.0, vref_e: 8.0,
      models: [
        { kw: 800,  model: 'C800D6 / QSK23-G3',    qcool: 888,  qcomb: 67.9,  cat_oa: 2.3, cat_ea: 1.9 },
        { kw: 1000, model: 'C1000D6B / KTA38-G14', qcool: 981,  qcomb: 86.1,  cat_oa: 2.5, cat_ea: 2.0 },
        { kw: 1250, model: 'C1250D6 / KTA50-G3',   qcool: 1518, qcomb: 110.4, cat_oa: 3.9, cat_ea: 3.2 },
        { kw: 1500, model: 'C1500D6 / KTA50-G9',   qcool: 1362, qcomb: 125,   cat_oa: 3.5, cat_ea: 2.8 },
        { kw: 2000, model: 'C2000D6 / QSK60-G6',   qcool: 1998, qcomb: 174,   cat_oa: 5.2, cat_ea: 4.2 },
        { kw: 2250, model: 'C2250D6A / QSK60-G9',  qcool: 2040, qcomb: 183,   cat_oa: 5.3, cat_ea: 4.3 },
        { kw: 2500, model: 'DQKAN / QSK60-G19',    qcool: 2649, qcomb: 193,   cat_oa: 6.8, cat_ea: 5.5 },
        { kw: 2750, model: 'DQLD / QSK78-G8',      qcool: 3060, qcomb: 236,   cat_oa: 6.9, cat_ea: 6.4 },
        { kw: 3000, model: 'C3000D6EB / QSK78-G37',qcool: 2751, qcomb: 262,   cat_oa: 7.2, cat_ea: 5.7, isDefault: true },
        { kw: 3250, model: 'C3250D6 / QSK95-G2',   qcool: 3135, qcomb: 279,   cat_oa: 8.1, cat_ea: 6.5 },
        { kw: 3500, model: 'C3500D6 / QSK95-G2',   qcool: 3135, qcomb: 284,   cat_oa: 8.1, cat_ea: 6.5 },
      ] },
    { id: 'cat', name: 'Caterpillar', vref_i: 8.0, vref_e: 8.0,
      models: [
        { kw: 800,  model: '3412C',     qcool: 923,  qcomb: 70,  cat_oa: 2.1, cat_ea: 1.9 },
        { kw: 1000, model: 'C32',       qcool: 1175, qcomb: 83,  cat_oa: 2.6, cat_ea: 2.4 },
        { kw: 1250, model: '3512',      qcool: 1397, qcomb: 106, cat_oa: 3.1, cat_ea: 2.9 },
        { kw: 1500, model: '3512B',     qcool: 1611, qcomb: 126, cat_oa: 3.6, cat_ea: 3.4 },
        { kw: 1750, model: '3516',      qcool: 1611, qcomb: 159, cat_oa: 3.7, cat_ea: 2.8 },
        { kw: 2000, model: '3516B',     qcool: 1674, qcomb: 164, cat_oa: 3.8, cat_ea: 3.5 },
        { kw: 2500, model: '3516C',     qcool: 2356, qcomb: 202, cat_oa: 5.3, cat_ea: 4.9 },
        { kw: 2750, model: '3516E',     qcool: 2688, qcomb: 229, cat_oa: 6.1, cat_ea: 5.6 },
        { kw: 3000, model: 'C175-16',   qcool: 2933, qcomb: 264, cat_oa: 6.7, cat_ea: 6.1, isDefault: true },
        { kw: 3250, model: 'C175-16',   qcool: 3296, qcomb: 271, cat_oa: 7.4, cat_ea: 6.9 },
        { kw: 3500, model: 'C175-20',   qcool: 3426, qcomb: 312, cat_oa: 7.8, cat_ea: 7.1 },
        { kw: 3900, model: 'C175-20',   qcool: 3426, qcomb: 339, cat_oa: 7.8, cat_ea: 7.1 },
      ] },
    { id: 'mtu', name: 'MTU', vref_i: 7.0, vref_e: 8.0,
      models: [
        { kw: 800,  model: '12V2000G45',  qcool: 1080, qcomb: 66,  cat_oa: 2.7,  cat_ea: 2.3 },
        { kw: 900,  model: '16V2000G45',  qcool: 1476, qcomb: 84,  cat_oa: 3.7,  cat_ea: 3.1 },
        { kw: 1000, model: '16V2000G85',  qcool: 1476, qcomb: 87,  cat_oa: 3.7,  cat_ea: 3.1 },
        { kw: 1250, model: '16V2000G86S', qcool: 1709, qcomb: 108, cat_oa: 3.8,  cat_ea: 3.1 },
        { kw: 1600, model: '12V4000G74S', qcool: 1598, qcomb: 138, cat_oa: 4.1,  cat_ea: 3.3 },
        { kw: 1750, model: '12V4000G84S', qcool: 1850, qcomb: 144, cat_oa: 4.7,  cat_ea: 3.9 },
        { kw: 2100, model: '16V4000G74S', qcool: 2141, qcomb: 186, cat_oa: 5.5,  cat_ea: 4.5 },
        { kw: 2300, model: '16V4000G84S', qcool: 2522, qcomb: 192, cat_oa: 6.5,  cat_ea: 5.3 },
        { kw: 2500, model: '20V4000G64S', qcool: 2591, qcomb: 228, cat_oa: 6.7,  cat_ea: 5.4 },
        { kw: 2750, model: '20V4000G74S', qcool: 3643, qcomb: 246, cat_oa: 9.3,  cat_ea: 7.6, isDefault: true },
        { kw: 3250, model: '20V4000G94S', qcool: 4079, qcomb: 270, cat_oa: 10.4, cat_ea: 8.5 },
      ] },
    { id: 'rehlko', name: 'Rehlko (Kohler)', vref_i: 7.0, vref_e: 8.0,
      models: [
        { kw: 3000, model: 'KD3000UE', qcool: 3570, qcomb: 266, cat_oa: 9.13, cat_ea: 7.44, isDefault: true },
      ] },
    { id: 'custom', name: '직접 입력', vref_i: 7.0, vref_e: 8.0, models: [] },
  ];

  const findModel = (mfgId, kw) => {
    const mfg = MANUFACTURERS.find(m => m.id === mfgId);
    if (!mfg || !mfg.models.length) return null;
    return mfg.models.find(x => x.kw === kw) || mfg.models.find(x => x.isDefault) || mfg.models[0];
  };
  const findMfg = (mfgId) => MANUFACTURERS.find(m => m.id === mfgId);

  // ── 확정 기준값 (GnC에너지 공문 2026-05 + Cummins C3000D6EB 사양서) ──
  const DEF = {
    model: 'cummins', kw: 3000,
    oa: 7.2, ea: 5.7, n_i: 8, n_e: 8, sf: 1.2,
    qcomb: 262, qcool: 2751, vref_i: 7.0, vref_e: 8.0,
    i_da_eta: 100, i_sil_eta: 50, i_dmp_eta: 85,
    e_sil_eta: 39, e_dmp_eta: 85, e_grl_eta: 50, e_da_eta: 100,
    v_i_da: 7.0, v_i_sil: 6.0, v_i_dmp: 5.0,
    v_e_sil: 8.0, v_e_dmp: 6.0, v_e_grl: 5.5, v_e_da: 8.0,
    ig_da_sil: 3000, ig_sil_dmp: 3000,
    eg_sil_dmp: 0, eg_dmp_grl: 0, eg_grl_da: 3000,
  };

  // 절대 풍속 한계 (물리적 제약)
  const ABS = { i_da: 8.0, i_sil: 8.0, i_dmp: 8.0, e_sil: 8.0, e_dmp: 8.0, e_grl: 6.0, e_da: 8.0 };

  // 핵심 공식: gross_1대 = Q_unit × sf / (V설계 × η)
  function compute(d) {
    const Vref_i = d.vref_i || 7.0;
    const Vref_e = d.vref_e || 8.0;
    const oa = d.oa;
    const ea = d.ea;
    const oa_q = R((d.qcomb + d.qcool) / 60 / Vref_i);
    const ea_q = R(d.qcool / 60 / Vref_e);
    const qi = oa * Vref_i, qe = ea * Vref_e;
    const OA = R(oa * d.n_i * d.sf), EA = R(ea * d.n_e * d.sf);
    const safe = (v) => (v <= 0 ? 0.01 : v);
    const gi = {
      da:  R(qi * d.sf / (safe(d.v_i_da)  * (d.i_da_eta  / 100))),
      sil: R(qi * d.sf / (safe(d.v_i_sil) * (d.i_sil_eta / 100))),
      dmp: R(qi * d.sf / (safe(d.v_i_dmp) * (d.i_dmp_eta / 100))),
    };
    const ge = {
      sil: R(qe * d.sf / (safe(d.v_e_sil) * (d.e_sil_eta / 100))),
      dmp: R(qe * d.sf / (safe(d.v_e_dmp) * (d.e_dmp_eta / 100))),
      grl: R(qe * d.sf / (safe(d.v_e_grl) * (d.e_grl_eta / 100))),
      da:  R(qe * d.sf / (safe(d.v_e_da)  * (d.e_da_eta  / 100))),
    };
    const ig = { da: R(gi.da * d.n_i), sil: R(gi.sil * d.n_i), dmp: R(gi.dmp * d.n_i) };
    const eg = { sil: R(ge.sil * d.n_e), dmp: R(ge.dmp * d.n_e), grl: R(ge.grl * d.n_e), da: R(ge.da * d.n_e) };
    const ni_net = {
      da:  R(gi.da  * (d.i_da_eta  / 100), 3),
      sil: R(gi.sil * (d.i_sil_eta / 100), 3),
      dmp: R(gi.dmp * (d.i_dmp_eta / 100), 3),
    };
    const ne_net = {
      sil: R(ge.sil * (d.e_sil_eta / 100), 3),
      dmp: R(ge.dmp * (d.e_dmp_eta / 100), 3),
      grl: R(ge.grl * (d.e_grl_eta / 100), 3),
      da:  R(ge.da  * (d.e_da_eta  / 100), 3),
    };
    const warns = {
      i_da: d.v_i_da > ABS.i_da, i_sil: d.v_i_sil > ABS.i_sil, i_dmp: d.v_i_dmp > ABS.i_dmp,
      e_sil: d.v_e_sil > ABS.e_sil, e_dmp: d.v_e_dmp > ABS.e_dmp, e_grl: d.v_e_grl > ABS.e_grl, e_da: d.v_e_da > ABS.e_da,
    };
    return { oa, ea, oa_q, ea_q, OA, EA, qi, qe, gi, ge, ig, eg, ni_net, ne_net, warns, Vref_i, Vref_e };
  }

  // manufacturer/kw/n_i/n_e/sf 만 받아서 DEF 기반으로 완전한 입력을 구성 + compute까지 실행하는 편의 함수.
  // api/compute.js(HTTP) 와 app.jsx(UI) 양쪽에서 같은 진입점으로 쓴다.
  function computeFromParams(params) {
    const mfgId = params.manufacturer || DEF.model;
    const mfg = findMfg(mfgId);
    if (!mfg) throw new Error(`알 수 없는 제조사: ${mfgId}`);
    const kw = params.kw != null ? Number(params.kw) : null;
    const model = findModel(mfgId, kw);
    if (!model) throw new Error(`${mfgId} 카탈로그에 등록된 모델이 없습니다`);

    const d = {
      ...DEF,
      model: mfgId, kw: model.kw,
      vref_i: mfg.vref_i, vref_e: mfg.vref_e,
      oa: model.cat_oa, ea: model.cat_ea, qcomb: model.qcomb, qcool: model.qcool,
      n_i: params.n_i != null ? Number(params.n_i) : DEF.n_i,
      n_e: params.n_e != null ? Number(params.n_e) : DEF.n_e,
      sf: params.sf != null ? Number(params.sf) : DEF.sf,
    };
    const result = compute(d);
    return {
      manufacturer: mfg.name, model: model.model, kw: model.kw,
      n_i: d.n_i, n_e: d.n_e, sf: d.sf,
      catalog: { oa_m2: d.oa, ea_m2: d.ea, qcomb_m3min: model.qcomb, qcool_m3min: model.qcool },
      oa_calc_from_Q_m2: result.oa_q, ea_calc_from_Q_m2: result.ea_q,
      OA_total_m2: result.OA, EA_total_m2: result.EA,
      per_unit_gross_m2: { intake: result.gi, exhaust: result.ge },
      total_gross_m2: { intake: result.ig, exhaust: result.eg },
      velocity_warnings: Object.fromEntries(Object.entries(result.warns).filter(([, v]) => v)),
      basis: "GnCenergy 카탈로그 + GnC에너지 공문(2026-05) 확정값. gross = Q×sf/(V×η)",
    };
  }

  return { MANUFACTURERS, DEF, ABS, findModel, findMfg, compute, computeFromParams };
});
