import React, { useState, useEffect } from 'react';
import api from "../../../../api/axios";

/**
 * MileageTab.jsx — KM 마일리지 상세 히스토리
 *
 * 사용 API:
 *   GET /api/v1/students/{studentId}/mileage — 마일리지 총점 + 이력 조회
 */

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '–';

const CATEGORY_META = {
  ATTEND:    { label: '출결',     icon: '📅', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  TOPIK:     { label: 'TOPIK',   icon: '📝', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
  ACTIVITY:  { label: '활동',    icon: '🏆', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  VOLUNTEER: { label: '봉사',    icon: '🤝', color: '#10B981', bg: '#ECFDF5', border: '#6EE7B7' },
  PENALTY:   { label: '차감',    icon: '⚠️', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  ETC:       { label: '기타',    icon: '📌', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
};

const getCategoryMeta = (category) =>
  CATEGORY_META[category?.toUpperCase()] || CATEGORY_META.ETC;

// ── 도넛 차트 (SVG) ──────────────────────────────────────
function DonutChart({ segments, total }) {
  const SIZE   = 120;
  const RADIUS = 46;
  const STROKE = 13;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const CIRC = 2 * Math.PI * RADIUS;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct  = total > 0 ? seg.value / total : 0;
    const dash = pct * CIRC;
    const arc  = { ...seg, dash, gap: CIRC - dash, offset: CIRC - offset };
    offset += dash;
    return arc;
  });

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: 'rotate(-90deg)' }}>
      {/* 배경 링 */}
      <circle cx={CX} cy={CY} r={RADIUS} fill="none" stroke="#F1F5F9" strokeWidth={STROKE} />
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={CX} cy={CY} r={RADIUS}
          fill="none"
          stroke={arc.color}
          strokeWidth={STROKE}
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={arc.offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      ))}
    </svg>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function MileageTab({ studentId }) {
  const [data,    setData]    = useState(null);   // { totalScore, history: [] }
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('ALL');
  const [sort,    setSort]    = useState('DATE_DESC'); // DATE_DESC | DATE_ASC | SCORE_DESC

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    api.get(`/api/v1/students/${studentId}/mileage`)
      .then(res => { if (res.data.success) setData(res.data.data); })
      .catch(e => console.error('MileageTab 로드 실패:', e))
      .finally(() => setLoading(false));
  }, [studentId]);

  const history = data?.history || [];
  const total   = data?.totalScore ?? 0;

  // ── 필터 + 정렬 ─────────────────────────────────────────
  const filtered = (filter === 'ALL' ? history : history.filter(h => h.category?.toUpperCase() === filter))
    .slice()
    .sort((a, b) => {
      if (sort === 'DATE_DESC') return new Date(b.earnedAt) - new Date(a.earnedAt);
      if (sort === 'DATE_ASC')  return new Date(a.earnedAt) - new Date(b.earnedAt);
      if (sort === 'SCORE_DESC') return (b.score ?? 0) - (a.score ?? 0);
      return 0;
    });

  // ── 카테고리별 집계 (도넛 + 요약용) ──────────────────────
  const categoryTotals = Object.keys(CATEGORY_META).map(key => {
    const items = history.filter(h => h.category?.toUpperCase() === key && (h.score ?? 0) > 0);
    return { key, value: items.reduce((s, h) => s + (h.score ?? 0), 0), ...CATEGORY_META[key] };
  }).filter(c => c.value > 0);

  const earned  = history.filter(h => (h.score ?? 0) > 0).reduce((s, h) => s + h.score, 0);
  const deducted = Math.abs(history.filter(h => (h.score ?? 0) < 0).reduce((s, h) => s + h.score, 0));

  const categories = Object.keys(CATEGORY_META);

  return (
    <div style={{ fontFamily: "'DM Sans','Noto Sans KR',sans-serif", color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes countUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

        .mt-wrap { animation: fadeUp 0.28s ease; }

        /* ── 상단 요약 ── */
        .mt-top { display:grid; grid-template-columns:auto 1fr; gap:20px; margin-bottom:1.5rem; background:#fff; border:1px solid #F1F5F9; border-radius:14px; padding:20px 24px; align-items:center; }
        .mt-donut-wrap { position:relative; width:120px; height:120px; flex-shrink:0; }
        .mt-donut-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none; }
        .mt-donut-score { font-size:22px; font-weight:800; color:#0F172A; line-height:1; }
        .mt-donut-lbl { font-size:10px; color:#94A3B8; font-weight:600; letter-spacing:0.05em; margin-top:3px; }

        .mt-score-right { display:flex; flex-direction:column; gap:12px; }
        .mt-score-row { display:flex; align-items:baseline; gap:8px; }
        .mt-score-big { font-size:36px; font-weight:800; color:#0F172A; line-height:1; animation:countUp 0.4s ease; }
        .mt-score-unit { font-size:14px; color:#94A3B8; font-weight:500; }

        .mt-score-sub { display:flex; gap:16px; }
        .mt-score-item { display:flex; align-items:center; gap:6px; font-size:12px; }
        .mt-score-dot { width:7px; height:7px; border-radius:50%; }

        .mt-category-chips { display:flex; gap:8px; flex-wrap:wrap; margin-top:4px; }
        .mt-chip { display:flex; align-items:center; gap:5px; padding:5px 10px; border-radius:20px; font-size:11px; font-weight:700; border:1px solid transparent; }

        /* ── 필터/정렬 바 ── */
        .mt-toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:8px; }
        .mt-filters { display:flex; gap:5px; flex-wrap:wrap; }
        .mt-filter-btn { padding:6px 13px; border-radius:7px; border:1.5px solid #E5E7EB; background:#fff; color:#6B7280; font-size:11px; font-weight:700; cursor:pointer; transition:all 0.15s; font-family:inherit; }
        .mt-filter-btn:hover { border-color:#93C5FD; color:#1D4ED8; background:#EFF6FF; }
        .mt-filter-btn.active { background:#1A3A5C; color:#fff; border-color:#1A3A5C; }

        .mt-sort { padding:6px 12px; border:1.5px solid #E5E7EB; border-radius:7px; font-size:11px; font-weight:600; background:#fff; color:#374151; cursor:pointer; font-family:inherit; outline:none; }

        /* ── 히스토리 테이블 ── */
        .mt-card { background:#fff; border:1px solid #F1F5F9; border-radius:12px; overflow:hidden; }
        .mt-table { width:100%; border-collapse:collapse; font-size:12px; }
        .mt-table thead tr { background:#F8FAFC; }
        .mt-table th { padding:10px 16px; font-size:11px; font-weight:700; color:#64748B; border-bottom:1.5px solid #E2E8F0; text-align:left; white-space:nowrap; letter-spacing:0.03em; }
        .mt-table th.right { text-align:right; }
        .mt-table tbody tr { transition:background 0.12s; }
        .mt-table tbody tr:hover { background:#F8FBFF; }
        .mt-table tbody tr:last-child td { border-bottom:none; }
        .mt-table td { padding:11px 16px; border-bottom:1px solid #F1F5F9; color:#374151; vertical-align:middle; }
        .mt-table td.right { text-align:right; }

        .mt-cat-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:6px; font-size:10px; font-weight:700; border:1px solid transparent; white-space:nowrap; }
        .mt-score-cell { font-size:13px; font-weight:800; }
        .mt-score-plus  { color:#059669; }
        .mt-score-minus { color:#DC2626; }
        .mt-desc { color:#374151; font-weight:500; }
        .mt-date { color:#94A3B8; font-size:11px; white-space:nowrap; }

        /* 누적 점수 표시 */
        .mt-running { font-size:11px; color:#CBD5E1; font-weight:600; }

        /* ── 빈 상태 ── */
        .mt-empty { padding:4rem; text-align:center; color:#CBD5E1; }
        .mt-empty-icon { font-size:2.5rem; margin-bottom:10px; }
        .mt-empty-txt  { font-size:13px; }

        /* ── 로딩 ── */
        @keyframes spin { to{transform:rotate(360deg)} }
        .mt-loading { display:flex; align-items:center; justify-content:center; padding:4rem; gap:10px; color:#94A3B8; font-size:13px; }
        .mt-spinner { width:20px; height:20px; border:2px solid #E5E7EB; border-top-color:#1A3A5C; border-radius:50%; animation:spin 0.7s linear infinite; }

        /* ── 하단 집계 행 ── */
        .mt-table tfoot tr { background:#F8FAFC; }
        .mt-table tfoot td { padding:10px 16px; font-size:12px; font-weight:700; color:#374151; border-top:2px solid #E2E8F0; }
      `}</style>

      <div className="mt-wrap">

        {/* ── 상단 요약 카드 ── */}
        <div className="mt-top">
          {/* 도넛 차트 */}
          <div className="mt-donut-wrap">
            <DonutChart
              segments={categoryTotals.map(c => ({ color: c.color, value: c.value }))}
              total={earned}
            />
            <div className="mt-donut-center">
              <div className="mt-donut-score">{total}</div>
              <div className="mt-donut-lbl">TOTAL</div>
            </div>
          </div>

          {/* 점수 요약 */}
          <div className="mt-score-right">
            <div>
              <div className="mt-score-row">
                <div className="mt-score-big">{total.toLocaleString()}</div>
                <div className="mt-score-unit">KM Point</div>
              </div>
              <div className="mt-score-sub" style={{ marginTop: 6 }}>
                <div className="mt-score-item">
                  <div className="mt-score-dot" style={{ background: '#10B981' }} />
                  <span style={{ color: '#64748B' }}>획득</span>
                  <span style={{ fontWeight: 700, color: '#059669' }}>+{earned.toLocaleString()}</span>
                </div>
                <div className="mt-score-item">
                  <div className="mt-score-dot" style={{ background: '#EF4444' }} />
                  <span style={{ color: '#64748B' }}>차감</span>
                  <span style={{ fontWeight: 700, color: '#DC2626' }}>−{deducted.toLocaleString()}</span>
                </div>
                <div className="mt-score-item">
                  <div className="mt-score-dot" style={{ background: '#94A3B8' }} />
                  <span style={{ color: '#64748B' }}>이력 수</span>
                  <span style={{ fontWeight: 700, color: '#374151' }}>{history.length}건</span>
                </div>
              </div>
            </div>

            {/* 카테고리별 칩 */}
            {categoryTotals.length > 0 && (
              <div className="mt-category-chips">
                {categoryTotals.map(c => (
                  <div
                    key={c.key}
                    className="mt-chip"
                    style={{ background: c.bg, color: c.color, borderColor: c.border }}
                  >
                    <span>{c.icon}</span>
                    {c.label}
                    <span style={{ marginLeft: 2, opacity: 0.8 }}>{c.value.toLocaleString()}pt</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 필터 / 정렬 ── */}
        <div className="mt-toolbar">
          <div className="mt-filters">
            <button
              className={`mt-filter-btn ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              전체 ({history.length})
            </button>
            {categories.map(key => {
              const cnt = history.filter(h => h.category?.toUpperCase() === key).length;
              if (cnt === 0) return null;
              const meta = CATEGORY_META[key];
              return (
                <button
                  key={key}
                  className={`mt-filter-btn ${filter === key ? 'active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {meta.icon} {meta.label} ({cnt})
                </button>
              );
            })}
          </div>

          <select
            className="mt-sort"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="DATE_DESC">최신순</option>
            <option value="DATE_ASC">오래된순</option>
            <option value="SCORE_DESC">점수 높은순</option>
          </select>
        </div>

        {/* ── 히스토리 테이블 ── */}
        <div className="mt-card">
          {loading ? (
            <div className="mt-loading">
              <div className="mt-spinner" />
              마일리지 이력을 불러오는 중...
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-empty">
              <div className="mt-empty-icon">🏅</div>
              <div className="mt-empty-txt">
                {filter === 'ALL' ? '마일리지 이력이 없습니다.' : `${CATEGORY_META[filter]?.label} 이력이 없습니다.`}
              </div>
            </div>
          ) : (
            <table className="mt-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>No</th>
                  <th style={{ width: 80 }}>카테고리</th>
                  <th>내용</th>
                  <th style={{ width: 100 }}>획득일</th>
                  <th className="right" style={{ width: 80 }}>점수</th>
                  <th className="right" style={{ width: 90 }}>누적 점수</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // 누적 점수 계산용 — 날짜 오름차순 기준으로 누적 후 현재 정렬 순서에 맵핑
                  const sorted_asc = [...history].sort((a, b) => new Date(a.earnedAt) - new Date(b.earnedAt));
                  const runningMap = {};
                  let acc = 0;
                  sorted_asc.forEach(h => {
                    acc += h.score ?? 0;
                    runningMap[h.mileageId ?? h.id ?? (h.earnedAt + h.score)] = acc;
                  });

                  return filtered.map((item, idx) => {
                    const meta    = getCategoryMeta(item.category);
                    const score   = item.score ?? 0;
                    const isPlus  = score >= 0;
                    const key     = item.mileageId ?? item.id ?? (item.earnedAt + item.score);
                    const running = runningMap[key];

                    return (
                      <tr key={key ?? idx}>
                        <td style={{ color: '#CBD5E1', fontSize: 11 }}>{idx + 1}</td>
                        <td>
                          <span
                            className="mt-cat-badge"
                            style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}
                          >
                            {meta.icon} {meta.label}
                          </span>
                        </td>
                        <td className="mt-desc">{item.description || item.reason || '–'}</td>
                        <td className="mt-date">{fmt(item.earnedAt || item.createdAt)}</td>
                        <td className={`right mt-score-cell ${isPlus ? 'mt-score-plus' : 'mt-score-minus'}`}>
                          {isPlus ? '+' : ''}{score.toLocaleString()}
                        </td>
                        <td className="right mt-running">
                          {running != null ? running.toLocaleString() : '–'}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ color: '#64748B' }}>
                    {filtered.length}건 표시 중
                  </td>
                  <td className="right" style={{ color: '#059669' }}>
                    +{filtered.filter(h => (h.score ?? 0) > 0).reduce((s, h) => s + h.score, 0).toLocaleString()}
                  </td>
                  <td className="right" style={{ color: '#0F172A' }}>
                    총 {total.toLocaleString()} pt
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}