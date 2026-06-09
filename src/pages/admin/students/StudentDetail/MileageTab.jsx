import React, { useState, useEffect } from 'react';
import api from "../../../../api/axios";

/**
 * MileageTab.jsx — KM 마일리지 상세 히스토리 (종합 대시보드 수정본)
 *
 * 사용 API:
 * GET /api/v1/students/{studentId}/mileage — 마일리지 총점 + 이력 조회
 */

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '–';

const CATEGORY_META = {
  ATTEND:    { label: '출결',    icon: '📅', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
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
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('ALL');
  const [sort,    setSort]    = useState('DATE_DESC');

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    api.get(`/api/v1/students/${studentId}/mileage`)
      .then(res => {
        const responseData = res.data;
        if (responseData) {
          if (responseData.success && responseData.data) {
            setData(responseData.data);
          } else if (responseData.history || responseData.totalScore !== undefined) {
            setData(responseData);
          } else if (responseData.data && (responseData.data.history || responseData.data.totalScore !== undefined)) {
            setData(responseData.data);
          } else {
            console.warn('데이터는 받아왔으나 구조가 매핑되지 않습니다:', responseData);
            setData({ totalScore: 0, history: [] });
          }
        }
      })
      .catch(e => {
        console.error('MileageTab 로드 실패:', e);
        setData({ totalScore: 0, history: [] });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [studentId]);

  const history = data?.history || [];
  const total   = data?.totalScore ?? 0; // 보유 마일리지

  // ── 필터 + 정렬 ─────────────────────────────────────────
  const filtered = (filter === 'ALL' ? history : history.filter(h => h.category?.toUpperCase() === filter))
    .slice()
    .sort((a, b) => {
      if (sort === 'DATE_DESC') return new Date(b.earnedAt || b.createdAt) - new Date(a.earnedAt || a.createdAt);
      if (sort === 'DATE_ASC')  return new Date(a.earnedAt || a.createdAt) - new Date(b.earnedAt || b.createdAt);
      if (sort === 'SCORE_DESC') return (b.score ?? 0) - (a.score ?? 0);
      return 0;
    });

  // ── 대시보드용 신규 지표 연산 집계 로직 ──────────────────────
  const categoryTotals = Object.keys(CATEGORY_META).map(key => {
    const items = history.filter(h => h.category?.toUpperCase() === key && (h.score ?? 0) > 0);
    return { key, value: items.reduce((s, h) => s + (h.score ?? 0), 0), ...CATEGORY_META[key] };
  }).filter(c => c.value > 0);

  // 1. 누적 배정 마일리지 (순수 플러스 합산액)
  const totalEarned  = history.filter(h => (h.score ?? 0) > 0).reduce((s, h) => s + h.score, 0);
  // 차감 마일리지 계산
  const deducted = Math.abs(history.filter(h => (h.score ?? 0) < 0).reduce((s, h) => s + h.score, 0));

  // 2. 최고 점수 보유 이력 추출 (단일 건 기준 가장 높게 수여받은 내역)
  const maxScoreItem = history.length > 0 
    ? [...history].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0] 
    : null;

  const categories = Object.keys(CATEGORY_META);

  return (
    <div style={{ fontFamily: "'DM Sans','Noto Sans KR',sans-serif", color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        .mt-wrap { animation: fadeUp 0.28s ease; }

        /* ── 최신 대시보드 상단 3단 위젯 Grid 구조 ── */
        .mt-dashboard { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 1.5rem; }
        .mt-dash-card { background: #fff; border: 1px solid #F1F5F9; border-radius: 14px; padding: 22px 24px; display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .mt-dash-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
        
        .card-purple::before { background: #8B5CF6; }
        .card-blue::before { background: #3B82F6; }
        .card-emerald::before { background: #10B981; }

        .mt-dash-label { font-size: 12px; font-weight: 700; color: #64748B; margin-bottom: 6px; letter-spacing: -0.01em; }
        .mt-dash-value { font-size: 30px; font-weight: 800; color: #0F172A; line-height: 1.1; display: flex; align-items: baseline; gap: 4px; }
        .mt-dash-unit { font-size: 13px; font-weight: 500; color: #94A3B8; }
        .mt-dash-sub { font-size: 11px; color: #94A3B8; margin-top: 8px; font-weight: 500; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }

        /* 도넛 섹션 컴팩트 배치 */
        .mt-chart-section { display: flex; background: #fff; border: 1px solid #F1F5F9; border-radius: 14px; padding: 20px 24px; align-items: center; gap: 24px; margin-bottom: 1.5rem; }
        .mt-donut-wrap { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
        .mt-donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .mt-donut-score { font-size: 22px; font-weight: 800; color: #0F172A; line-height: 1; }
        .mt-donut-lbl { font-size: 10px; color: #94A3B8; font-weight: 600; margin-top: 3px; }
        
        .mt-category-chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .mt-chip { display: flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid transparent; }

        /* ── 필터/정렬 바 ── */
        .mt-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 8px; }
        .mt-filters { display: flex; gap: 5px; flex-wrap: wrap; }
        .mt-filter-btn { padding: 6px 13px; border-radius: 7px; border: 1.5px solid #E5E7EB; background: #fff; color: #6B7280; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
        .mt-filter-btn:hover { border-color: #93C5FD; color: #1D4ED8; background: #EFF6FF; }
        .mt-filter-btn.active { background: #1A3A5C; color: #fff; border-color: #1A3A5C; }
        .mt-sort { padding: 6px 12px; border: 1.5px solid #E5E7EB; border-radius: 7px; font-size: 11px; font-weight: 600; background: #fff; color: #374151; cursor: pointer; outline: none; }

        /* ── 히스토리 테이블 ── */
        .mt-card { background: #fff; border: 1px solid #F1F5F9; border-radius: 12px; overflow: hidden; }
        .mt-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .mt-table thead tr { background: #F8FAFC; }
        .mt-table th { padding: 10px 16px; font-size: 11px; font-weight: 700; color: #64748B; border-bottom: 1.5px solid #E2E8F0; text-align: left; }
        .mt-table th.right { text-align: right; }
        .mt-table td { padding: 11px 16px; border-bottom: 1px solid #F1F5F9; color: #374151; vertical-align: middle; }
        .mt-table td.right { text-align: right; }
        .mt-table tbody tr:hover { background: #F8FBFF; }

        .mt-cat-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 6px; font-size: 10px; font-weight: 700; border: 1px solid transparent; }
        .mt-score-cell { font-size: 13px; font-weight: 800; }
        .mt-score-plus  { color: #059669; }
        .mt-score-minus { color: #DC2626; }
        .mt-desc { color: #374151; font-weight: 500; }
        .mt-date { color: #94A3B8; font-size: 11px; }
        .mt-running { font-size: 11px; color: #CBD5E1; font-weight: 600; }

        .mt-empty { padding: 4rem; text-align: center; color: #CBD5E1; }
        .mt-empty-icon { font-size: 2.5rem; margin-bottom: 10px; }
        .mt-loading { display: flex; align-items: center; justify-content: center; padding: 4rem; gap: 10px; color: #94A3B8; font-size: 13px; }
        .mt-spinner { width: 20px; height: 20px; border: 2px solid #E5E7EB; border-top-color: #1A3A5C; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      <div className="mt-wrap">
        
        {/* ── 📊 상단 핵심 지표 대시보드 (보유 / 누적 배정 / 최고 기록) ── */}
        <div className="mt-dashboard">
          
          {/* 위젯 1: 현재 보유 마일리지 */}
          <div className="mt-dash-card card-purple">
            <div className="mt-dash-label">보유 마일리지</div>
            <div className="mt-dash-value">
              {total.toLocaleString()} <span className="mt-dash-unit">pt</span>
            </div>
            <div className="mt-dash-sub">현재 사용 가능한 실시간 최종 가용 점수</div>
          </div>

          {/* 위젯 2: 누적 배정 마일리지 */}
          <div className="mt-dash-card card-blue">
            <div className="mt-dash-label">누적 배정 마일리지</div>
            <div className="mt-dash-value" style={{ color: '#2563EB' }}>
              {totalEarned.toLocaleString()} <span className="mt-dash-unit">pt</span>
            </div>
            <div className="mt-dash-sub">
              차감 이력을 제외하고 부여받은 순수 총점 합계
            </div>
          </div>

          {/* 위젯 3: 단일 최고 기록 보유 항목 */}
          <div className="mt-dash-card card-emerald">
            <div className="mt-dash-label">최고 점수 보유 내역</div>
            <div className="mt-dash-value" style={{ color: '#059669' }}>
              {maxScoreItem ? `+${maxScoreItem.score?.toLocaleString()}` : '0'}{' '}
              <span className="mt-dash-unit">pt</span>
            </div>
            <div className="mt-dash-sub">
              {maxScoreItem ? `최고 항목: ${maxScoreItem.description || maxScoreItem.reason}` : '수여 내역 없음'}
            </div>
          </div>

        </div>

        {/* ── 🍩 카테고리별 분해 분석 차트 바 ── */}
        <div className="mt-chart-section">
          <div className="mt-donut-wrap">
            <DonutChart
              segments={categoryTotals.map(c => ({ color: c.color, value: c.value }))}
              total={totalEarned}
            />
            <div className="mt-donut-center">
              <div className="mt-donut-score">{total}</div>
              <div className="mt-donut-lbl">TOTAL</div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>카테고리별 누적 비율</div>
            {categoryTotals.length > 0 ? (
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
            ) : (
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>누적된 세부 카테고리별 통계가 없습니다.</div>
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
                  const sorted_asc = [...history].sort((a, b) => new Date(a.earnedAt || a.createdAt) - new Date(b.earnedAt || b.createdAt));
                  const runningMap = {};
                  let acc = 0;
                  sorted_asc.forEach(h => {
                    acc += h.score ?? 0;
                    runningMap[h.mileageId ?? h.id ?? ((h.earnedAt || h.createdAt) + h.score)] = acc;
                  });

                  return filtered.map((item, idx) => {
                    const meta    = getCategoryMeta(item.category);
                    const score   = item.score ?? 0;
                    const isPlus  = score >= 0;
                    const key     = item.mileageId ?? item.id ?? ((item.earnedAt || item.createdAt) + item.score);
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