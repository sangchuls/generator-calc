// api/compute.js — Vercel 서버리스 함수 (Node.js, zero-config: /api/* 아래 파일은 자동으로 엔드포인트가 된다)
// lib/calc.js 를 그대로 호출한다 — 화면(app.jsx)과 동일한 카탈로그/공식을 쓰므로 결과가 항상 일치한다.
//
// GET  /api/compute?manufacturer=cummins&kw=3500&n_i=17&n_e=17&sf=1.2
// POST /api/compute  { "manufacturer": "cummins", "kw": 3500, "n_i": 17, "n_e": 17, "sf": 1.2 }
// manufacturer/kw 생략 시 카탈로그 기본값(Cummins 3,000kW) 사용.

const { computeFromParams } = require("../lib/calc.js");

module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    const params = req.method === "POST" ? (req.body || {}) : (req.query || {});
    const result = computeFromParams(params);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
