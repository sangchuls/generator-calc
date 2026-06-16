# 발전기실 급·배기 개구율 계산기

발전기 제조사 카탈로그 기반 급기(OA) / 배기(EA) 유효 개구면적 자동 산출 도구입니다.

## 기능

- **제조사 선택**: Cummins / Caterpillar / MTU / Rehlko(Kohler) / 직접입력
- **카탈로그 연동**: 선택 kW에 따라 OA · EA · 풍량(Q) 자동 세팅
- **운전조건 동시 표시**: OA/EA · 연소Q · 냉각Q · 급기V · 배기V 한 줄 표시
- **시스템 레이아웃 다이어그램**: 급기·배기 부재별 gross/net 면적 시각화
- **CAD 면적 비교표**: 블록별 CAD 실측값 입력 → 계산값 대비 초과/미만 색상 표시
- **부재별 면적 산출표**: 개구율 · 설계풍속 · gross 산출 전체 정리
- **풍속 검토**: 각 부재 허용풍속 대비 설계풍속 비교
- **산식 메모**: 계산 근거 공식 정리

## 파일 구조

```
generator-calc/
├── index.html   # 진입점 (HTML 뼈대)
├── style.css    # 전역 스타일
├── app.jsx      # React 앱 전체 로직 (Babel 인라인 트랜스파일)
└── README.md
```

## 사용 방법

### 로컬 실행

`type="text/babel" src="..."` 방식은 `file://` 프로토콜에서 CORS 제한이 걸릴 수 있습니다.
아래 중 하나로 로컬 서버를 띄워 실행하세요.

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .
```

브라우저에서 `http://localhost:8080` 접속

### GitHub Pages 배포

1. GitHub 저장소 생성 (Public)
2. 파일 3개 업로드: `index.html` / `style.css` / `app.jsx`
3. Settings → Pages → Source: `main` 브랜치 / `/ (root)` 선택 → Save
4. 잠시 후 `https://{유저명}.github.io/{저장소명}/` 접속

## 적용 기준

- GnC에너지 카탈로그 기준 (급기 7 m/s / 배기 8 m/s)
- DA 개구율 100% · 배기소음기 개구율 39%
- 여유율 기본 1.2 (조정 가능)

## 라이선스

사내 설계 보조 도구 — 무단 배포 금지
