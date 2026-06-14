import React, { useState, useEffect } from 'react';
import api from "../../../../api/axios";

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

const getCategoryMeta = (category, amount) => {
  if (amount < 0) return CATEGORY_META.PENALTY;
  return CATEGORY_META[category?.toUpperCase()] || CATEGORY_META.ETC;
};

// 도넛 차트 컴포넌트
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

export default function MileageTab({ studentId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [sort, setSort] = useState('DATE_DESC');

  // 마일리지 데이터 조회 API 호출
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
            setData({ totalScore: 0, history: [] });
          }
        }
      })
      .catch(e => {
        console.error('마일리지 로드 실패:', e);
        setData({ totalScore: 0, history: [] });
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  const history = data?.history || [];
  const total   = data?.totalScore ?? 0;

  // 필터 및 정렬 처리 (changeAmount 필드 사용)
  const filtered = history.filter(h => {
    const amount = h.changeAmount ?? h.score ?? 0;
    if (filter === 'ALL') return true;
    if (filter === 'PENALTY') return amount < 0;
    return h.category?.toUpperCase() === filter && amount >= 0;
  }).slice().sort((a, b) => {
    const aAmount = a.changeAmount ?? a.score ?? 0;
    const bAmount = b.changeAmount ?? b.score ?? 0;
    if (sort === 'DATE_DESC') return new Date(b.earnedAt || b.createdAt) - new Date(a.earnedAt || a.createdAt);
    if (sort === 'DATE_ASC')  return new Date(a.earnedAt || a.createdAt) - new Date(b.earnedAt || b.createdAt);
    if (sort === 'SCORE_DESC') return bAmount - aAmount;
    return 0;
  });

  // 카테고리별 누적 점수 연산
  const categoryTotals = Object.keys(CATEGORY_META).map(key => {
    if (key === 'PENALTY') return null; 
    const items = history.filter(h => h.category?.toUpperCase() === key && (h.changeAmount ?? h.score ?? 0) > 0);
    return { key, value: items.reduce((s, h) => s + (h.changeAmount ?? h.score ?? 0), 0), ...CATEGORY_META[key] };
  }).filter(c => c && c.value > 0);

  const totalEarned = history.filter(h => (h.changeAmount ?? h.score ?? 0) > 0).reduce((s, h) => s + (h.changeAmount ?? h.score), 0);

  const maxScoreItem = history.length > 0 
    ? [...history].sort((a, b) => (b.changeAmount ?? b.score ?? 0) - (a.changeAmount ?? a.score ?? 0))[0] 
    : null;

  const categories = Object.keys(CATEGORY_META);

  return (
    <div style={{ fontFamily: "'DM Sans','Noto Sans KR',sans-serif", color: '#111827' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .mt-wrap { animation: fadeUp 0.28s ease; }
        
        .mt-dashboard { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 1.5rem; }
        .mt-dash-card { background: #fff; border: 1px solid #F1F5F9; border-radius: 14px; padding: 22px 24px; display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden; }
        .mt-dash-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
        .card-purple::before { background: #8B5CF6; }
        .card-blue::before { background: #3B82F6; }
        .card-emerald::before { background: #10B981; }

        .mt-dash-label { font-size: 12px; font-weight: 700; color: #64748B; margin-bottom: 6px; }
        .mt-dash-value { font-size: 30px; font-weight: 800; color: #0F172A; display: flex; align-items: baseline; gap: 4px; }
        .mt-dash-unit { font-size: 13px; font-weight: 500; color: #94A3B8; }
        .mt-dash-sub { font-size: 11px; color: #94A3B8; margin-top: 8px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .mt-chart-section { display: flex; background: #fff; border: 1px solid #F1F5F9; border-radius: 14px; padding: 20px 24px; align-items: center; gap: 24px; margin-bottom: 1.5rem; }
        .mt-donut-wrap { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
        .mt-donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .mt-donut-score { font-size: 22px; font-weight: 800; color: #0F172A; line-height: 1; }
        .mt-donut-lbl { font-size: 11px; color: #94A3B8; font-weight: 700; margin-top: 3px; }
        
        .mt-category-chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .mt-chip { display: flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }

        .mt-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 8px; }
        .mt-filters { display: flex; gap: 5px; flex-wrap: wrap; }
        .mt-filter-btn { padding: 6px 13px; border-radius: 7px; border: 1.5px solid #E5E7EB; background: #fff; color: #6B7280; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
        .mt-filter-btn:hover { border-color: #93C5FD; color: #1D4ED8; background: #EFF6FF; }
        .mt-filter-btn.active { background: #1A3A5C; color: #fff; border-color: #1A3A5C; }
        .mt-sort { padding: 6px 12px; border: 1.5px solid #E5E7EB; border-radius: 7px; font-size: 11px; font-weight: 600; background: #fff; color: #374151; cursor: pointer; outline: none; }

        .mt-card { background: #fff; border: 1px solid #F1F5F9; border-radius: 12px; overflow: hidden; }
        .mt-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .mt-table thead tr { background: #F8FAFC; }
        .mt-table th { padding: 10px 16px; font-size: 11px; font-weight: 700; color: #64748B; border-bottom: 1.5px solid #E2E8F0; text-align: left; }
        .mt-table th.right { text-align: right; }
        .mt-table td { padding: 11px 16px; border-bottom: 1px solid #F1F5F9; color: #374151; vertical-align: middle; }
        .mt-table td.right { text-align: right; }
        .mt-table tbody tr:hover { background: #F8FBFF; }

        .mt-cat-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 6px; font-size: 10px; font-weight: 700; }
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
        
        <div className="mt-dashboard">
          <div className="mt-dash-card card-purple">
            <div className="mt-dash-label">보유 마일리지</div>
            <div className="mt-dash-value">
              {total.toLocaleString()} <span className="mt-dash-unit">점</span>
            </div>
            <div className="mt-dash-sub">현재 사용 가능한 실시간 점수</div>
          </div>

          <div className="mt-dash-card card-blue">
            <div className="mt-dash-label">누적 배정 마일리지</div>
            <div className="mt-dash-value" style={{ color: '#2563EB' }}>
              {totalEarned.toLocaleString()} <span className="mt-dash-unit">점</span>
            </div>
            <div className="mt-dash-sub">차감 이력을 제외한 총 획득 점수</div>
          </div>

          <div className="mt-dash-card card-emerald">
            <div className="mt-dash-label">최고 점수 획득 내역</div>
            <div className="mt-dash-value" style={{ color: '#059669' }}>
              {maxScoreItem ? `+${(maxScoreItem.changeAmount ?? maxScoreItem.score)?.toLocaleString()}` : '0'} 
              <span className="mt-dash-unit">점</span>
            </div>
            <div className="mt-dash-sub">
              {maxScoreItem ? `항목: ${maxScoreItem.reason || maxScoreItem.description}` : '수여 내역 없음'}
            </div>
          </div>
        </div>

        <div className="mt-chart-section">
          <div className="mt-donut-wrap">
            <DonutChart
              segments={categoryTotals.map(c => ({ color: c.color, value: c.value }))}
              total={totalEarned}
            />
            <div className="mt-donut-center">
              <div className="mt-donut-score">{total}</div>
              <div className="mt-donut-lbl">총점</div>
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
                    style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
                  >
                    <span>{c.icon}</span>
                    {c.label}
                    <span style={{ marginLeft: 2, opacity: 0.8 }}>{c.value.toLocaleString()}점</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>누적된 통계가 없습니다.</div>
            )}
          </div>
        </div>

        <div className="mt-toolbar">
          <div className="mt-filters">
            <button
              className={`mt-filter-btn ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              전체 ({history.length})
            </button>
            {categories.map(key => {
              const meta = CATEGORY_META[key];
              const cnt = history.filter(h => {
                const amount = h.changeAmount ?? h.score ?? 0;
                if (key === 'PENALTY') return amount < 0;
                return h.category?.toUpperCase() === key && amount >= 0;
              }).length;
              
              if (cnt === 0) return null;
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
                  <th style={{ width: 100 }}>처리일자</th>
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
                    const amount = h.changeAmount ?? h.score ?? 0;
                    acc += amount;
                    runningMap[h.mileageId ?? h.id ?? ((h.earnedAt || h.createdAt) + amount)] = acc;
                  });

                  return filtered.map((item, idx) => {
                    const amount  = item.changeAmount ?? item.score ?? 0;
                    const meta    = getCategoryMeta(item.category, amount);
                    const isPlus  = amount >= 0;
                    const key     = item.mileageId ?? item.id ?? ((item.earnedAt || item.createdAt) + amount);
                    const running = runningMap[key];

                    return (
                      <tr key={key ?? idx}>
                        <td style={{ color: '#CBD5E1', fontSize: 11 }}>{idx + 1}</td>
                        <td>
                          <span
                            className="mt-cat-badge"
                            style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                          >
                            {meta.icon} {meta.label}
                          </span>
                        </td>
                        <td className="mt-desc">{item.reason || item.description || '–'}</td>
                        <td className="mt-date">{fmt(item.earnedAt || item.createdAt)}</td>
                        <td className={`right mt-score-cell ${isPlus ? 'mt-score-plus' : 'mt-score-minus'}`}>
                          {isPlus ? '+' : ''}{amount.toLocaleString()}
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
                    +{filtered.filter(h => (h.changeAmount ?? h.score ?? 0) > 0).reduce((s, h) => s + (h.changeAmount ?? h.score), 0).toLocaleString()}
                  </td>
                  <td className="right" style={{ color: '#0F172A' }}>
                    총 {total.toLocaleString()} 점
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