import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = 'http://localhost:8080';

export default function SearchByDept({ onBack }) {
  const navigate = useNavigate();
  const accessToken = localStorage.getItem('accessToken');

  const [depts, setDepts] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');

  const [filters, setFilters] = useState({
    deptId: '', studentId: '', name: '', gender: '', nationality: '', grade: '', classSec: '',
  });

  const api = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const fetchStudents = useCallback(async (currentFilters) => {
    setIsLoading(true);
    setSelected(new Set());
    try {
      const params = {};
      Object.entries(currentFilters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          params[key] = String(val).trim();
        }
      });
      const res = await api.get('/api/v1/search/dept', { params });
      if (res.data.success) setStudents(res.data.data || []);
    } catch (err) {
      console.error('학생 목록 조회 실패', err);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [deptRes, natRes] = await Promise.allSettled([
          api.get('/api/v1/depts'),
          api.get('/api/v1/nationalities'),
        ]);
        if (deptRes.status === 'fulfilled' && deptRes.value.data.success) setDepts(deptRes.value.data.data);
        if (natRes.status === 'fulfilled' && natRes.value.data.success) setNationalities(natRes.value.data.data);
        fetchStudents({ deptId:'', studentId:'', name:'', gender:'', nationality:'', grade:'', classSec:'' });
      } catch (err) {
        console.error('초기 데이터 로드 실패', err);
      }
    };
    fetchInitialData();
  }, [fetchStudents]);

  const handleSearch = () => fetchStudents(filters);
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };
  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
  const toggleAll = () => {
    if (selected.size === students.length && students.length > 0) setSelected(new Set());
    else setSelected(new Set(students.map(s => s.studentId)));
  };
  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleNotify = async () => {
    if (!notifyMsg.trim()) return alert('메시지를 입력해주세요.');
    try {
      const targetIds = selected.size > 0 ? [...selected] : students.map(s => s.studentId);
      await api.post('/api/v1/notifications', {
        studentIds: targetIds, message: notifyMsg, type: 'ADMIN_NOTICE',
      });
      alert(`✅ ${targetIds.length}명에게 알림이 전송되었습니다.`);
      setShowNotifyModal(false);
      setNotifyMsg('');
    } catch (err) {
      alert('알림 전송에 실패했습니다.');
    }
  };

  const stats = {
    total: students.length,
    visaAlert: students.filter(s => {
      if (!s.expireDate) return false;
      return Math.ceil((new Date(s.expireDate) - new Date()) / 86400000) <= 30;
    }).length,
  };

  return (
    <div style={{ fontFamily:"'DM Sans','Noto Sans KR',sans-serif", fontSize:'14px', color:'#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        /* ── 탑바 ── */
        .sd-topbar { background:#fff; padding:0 24px; height:54px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #E5E7EB; margin-bottom:20px; border-radius:12px 12px 0 0; }
        .sd-topbar-left { display:flex; align-items:center; gap:10px; }
        .sd-back-btn { width:30px; height:30px; border-radius:7px; background:#F3F4F6; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#374151; }
        .sd-back-btn:hover { background:#E5E7EB; }
        .sd-breadcrumb { font-size:13px; color:#9CA3AF; }
        .sd-breadcrumb span { color:#111827; font-weight:600; }

        /* ── 통계 배너 ── */
        .sd-stat-row { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:16px; }
        .sd-stat-card { background:#fff; border-radius:12px; border:1px solid #F3F4F6; padding:14px 18px; }
        .sd-stat-label { font-size:11px; color:#9CA3AF; margin-bottom:5px; }
        .sd-stat-val { font-size:22px; font-weight:700; letter-spacing:-0.5px; }

        /* ── 필터 ── */
        .sd-filter-card { background:#fff; border-radius:12px; border:1px solid #F3F4F6; padding:16px 20px; margin-bottom:16px; }
        .sd-filter-row { display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end; }
        .sd-filter-group { display:flex; flex-direction:column; gap:5px; }
        .sd-filter-label { font-size:11px; font-weight:600; color:#9CA3AF; }
        .sd-select, .sd-input { padding:7px 10px; border-radius:8px; border:1px solid #E5E7EB; font-size:12.5px; font-family:inherit; color:#374151; background:#fff; outline:none; }
        .sd-select:focus, .sd-input:focus { border-color:#3B82F6; }
        .sd-input { width:130px; }
        .sd-search-btn { padding:8px 20px; background:#1A3A5C; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap; }
        .sd-search-btn:hover { background:#15304e; }
        .sd-notify-btn { padding:7px 14px; background:#F9FAFB; border:1px solid #E5E7EB; color:#374151; border-radius:8px; font-size:12.5px; font-weight:500; cursor:pointer; font-family:inherit; white-space:nowrap; }
        .sd-notify-btn:hover { background:#F3F4F6; }

        /* ── 테이블 카드 ── */
        .sd-card { background:#fff; border-radius:12px; border:1px solid #F3F4F6; overflow:hidden; }
        .sd-card-title { font-size:13px; font-weight:700; color:#111827; padding:14px 18px; border-bottom:1px solid #F3F4F6; display:flex; align-items:center; justify-content:space-between; }
        .sd-card-title-left { display:flex; align-items:center; gap:8px; }
        .sd-card-title-left::before { content:''; display:inline-block; width:3px; height:14px; background:#3B82F6; border-radius:2px; }

        /* ── 테이블 ── */
        .sd-table-wrap { overflow-x:auto; }
        .sd-table { width:100%; border-collapse:collapse; min-width:900px; }
        .sd-table th { padding:10px 12px; font-size:11.5px; font-weight:600; color:#9CA3AF; text-align:left; border-bottom:1px solid #F3F4F6; background:#FAFAFA; white-space:nowrap; }
        .sd-table th.center { text-align:center; }
        .sd-table td { padding:11px 12px; font-size:12.5px; border-bottom:1px solid #F9FAFB; vertical-align:middle; color:#374151; white-space:nowrap; }
        .sd-table td.center { text-align:center; }
        .sd-table tr:last-child td { border-bottom:none; }
        .sd-table tr:hover td { background:#F8FAFC; }

        /* ── 셀 스타일 ── */
        .sd-student-id { font-size:11px; font-weight:700; background:#F3F4F6; color:#6B7280; padding:2px 7px; border-radius:5px; font-family:'DM Sans',monospace; }
        .sd-eng-name { font-weight:600; color:#111827; }
        .sd-chip { font-size:11px; font-weight:600; padding:3px 8px; border-radius:20px; display:inline-block; }
        .sd-chip-green  { background:#F0FDF4; color:#16A34A; }
        .sd-chip-red    { background:#FEF2F2; color:#DC2626; }
        .sd-chip-gray   { background:#F3F4F6; color:#6B7280; }
        .sd-chip-blue   { background:#EFF6FF; color:#2563EB; }
        .sd-detail-btn { padding:5px 12px; border-radius:7px; background:#EFF6FF; color:#2563EB; border:none; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .15s; }
        .sd-detail-btn:hover { background:#DBEAFE; }

        /* ── 빈 상태 ── */
        .sd-empty { padding:48px; text-align:center; color:#9CA3AF; font-size:13px; }

        /* ── 모달 ── */
        .sd-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:1000; }
        .sd-modal { background:#fff; border-radius:16px; padding:24px; width:400px; box-shadow:0 20px 60px rgba(0,0,0,0.15); }
        .sd-modal-title { font-weight:700; font-size:15px; color:#111827; margin-bottom:4px; }
        .sd-modal-sub { font-size:12.5px; color:#9CA3AF; margin-bottom:12px; }
        .sd-textarea { width:100%; height:110px; border:1.5px solid #E5E7EB; border-radius:8px; padding:10px 12px; resize:none; font-family:inherit; font-size:13px; outline:none; box-sizing:border-box; }
        .sd-textarea:focus { border-color:#3B82F6; }
        .sd-modal-footer { display:flex; justify-content:flex-end; gap:8px; margin-top:12px; }
        .sd-modal-cancel { padding:8px 16px; background:#F3F4F6; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }
        .sd-modal-send { padding:8px 20px; background:#1A3A5C; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }
      `}</style>

      {/* ── 탑바 ── */}
      <div className="sd-topbar">
        <div className="sd-topbar-left">
          <button className="sd-back-btn" onClick={onBack || (() => navigate(-1))}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="sd-breadcrumb">통합 검색 › <span>다중 필터 검색</span></div>
        </div>
        <button className="sd-notify-btn" onClick={() => setShowNotifyModal(true)}>
          📢 알림 전송 {selected.size > 0 && `(${selected.size}명 선택)`}
        </button>
      </div>

      {/* ── 통계 배너 ── */}
      <div className="sd-stat-row">
        <div className="sd-stat-card">
          <div className="sd-stat-label">조회된 학생</div>
          <div className="sd-stat-val" style={{ color:'#3B82F6' }}>{stats.total} 명</div>
        </div>
        <div className="sd-stat-card">
          <div className="sd-stat-label">비자 만료 임박 (D-30)</div>
          <div className="sd-stat-val" style={{ color:'#D97706' }}>{stats.visaAlert} 명</div>
        </div>
        <div className="sd-stat-card">
          <div className="sd-stat-label">선택된 학생</div>
          <div className="sd-stat-val" style={{ color:'#6B7280' }}>{selected.size} 명</div>
        </div>
      </div>

      {/* ── 필터 ── */}
      <div className="sd-filter-card">
        <div className="sd-filter-row">
          <div className="sd-filter-group">
            <span className="sd-filter-label">학과</span>
            <select className="sd-select" style={{ minWidth:160 }} value={filters.deptId} onChange={e => setFilter('deptId', e.target.value)}>
              <option value="">전체 학과</option>
              {depts.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
            </select>
          </div>
          <div className="sd-filter-group">
            <span className="sd-filter-label">학년</span>
            <select className="sd-select" style={{ minWidth:80 }} value={filters.grade} onChange={e => setFilter('grade', e.target.value)}>
              <option value="">전체</option>
              {[1,2,3,4].map(g => <option key={g} value={g}>{g}학년</option>)}
            </select>
          </div>
          <div className="sd-filter-group">
            <span className="sd-filter-label">분반</span>
            <select className="sd-select" style={{ minWidth:70 }} value={filters.classSec} onChange={e => setFilter('classSec', e.target.value)}>
              <option value="">전체</option>
              {['A','B','C','D'].map(c => <option key={c} value={c}>{c}반</option>)}
            </select>
          </div>
          <div className="sd-filter-group">
            <span className="sd-filter-label">국적</span>
            <select className="sd-select" style={{ minWidth:110 }} value={filters.nationality} onChange={e => setFilter('nationality', e.target.value)}>
              <option value="">전체</option>
              {nationalities.map(nat => (
                <option key={nat.nationalityId} value={nat.nationalityName}>{nat.nationalityName}</option>
              ))}
            </select>
          </div>
          <div className="sd-filter-group">
            <span className="sd-filter-label">성별</span>
            <select className="sd-select" style={{ minWidth:70 }} value={filters.gender} onChange={e => setFilter('gender', e.target.value)}>
              <option value="">전체</option>
              <option value="남">남</option>
              <option value="여">여</option>
            </select>
          </div>
          <div className="sd-filter-group">
            <span className="sd-filter-label">학번</span>
            <input className="sd-input" placeholder="학번 입력" value={filters.studentId} onChange={e => setFilter('studentId', e.target.value)} onKeyDown={handleKeyDown} />
          </div>
          <div className="sd-filter-group">
            <span className="sd-filter-label">이름</span>
            <input className="sd-input" placeholder="이름 입력" value={filters.name} onChange={e => setFilter('name', e.target.value)} onKeyDown={handleKeyDown} />
          </div>
          <div className="sd-filter-group" style={{ marginLeft:'auto' }}>
            <button className="sd-search-btn" onClick={handleSearch}>조회하기</button>
          </div>
        </div>
      </div>

      {/* ── 결과 테이블 ── */}
      <div className="sd-card">
        <div className="sd-card-title">
          <div className="sd-card-title-left">
            학생 목록
            <span style={{ fontSize:12, fontWeight:600, background:'#EFF6FF', color:'#2563EB', padding:'2px 9px', borderRadius:20 }}>
              {students.length}명
            </span>
          </div>
          {selected.size > 0 && (
            <span style={{ fontSize:12, color:'#6B7280' }}>{selected.size}명 선택됨</span>
          )}
        </div>

        {isLoading ? (
          <div className="sd-empty">데이터를 불러오는 중입니다...</div>
        ) : (
          <div className="sd-table-wrap">
            <table className="sd-table">
              <thead>
                <tr>
                  <th className="center" style={{ width:40 }}>
                    <input type="checkbox" onChange={toggleAll} checked={selected.size === students.length && students.length > 0} />
                  </th>
                  <th>학번</th>
                  <th>영문명</th>
                  <th className="center">성별</th>
                  <th>국적</th>
                  <th className="center">학년/분반</th>
                  <th>연락처</th>
                  <th className="center">총이수학점</th>
                  <th className="center">평점</th>
                  <th className="center">등록상태</th>
                  <th className="center">상세</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="sd-empty">조건에 맞는 학생이 없습니다.</td>
                  </tr>
                ) : (
                  students.map(s => (
                    <tr key={s.studentId}>
                      <td className="center">
                        <input type="checkbox" checked={selected.has(s.studentId)} onChange={() => toggleOne(s.studentId)} />
                      </td>
                      <td><span className="sd-student-id">{s.studentId}</span></td>
                      <td>
                        <div className="sd-eng-name">{s.engName || '-'}</div>
                        {s.korName && <div style={{ fontSize:11, color:'#9CA3AF', marginTop:1 }}>{s.korName}</div>}
                      </td>
                      <td className="center">{s.gender || '-'}</td>
                      <td>{s.nationality || '-'}</td>
                      <td className="center">
                        {s.grade ? `${s.grade}학년` : '-'} {s.classSec ? `${s.classSec}반` : ''}
                      </td>
                      <td style={{ color:'#6B7280' }}>{s.phone || '-'}</td>
                      <td className="center">
                        <span style={{ fontWeight:600 }}>{s.totalCredits ?? '-'}</span>
                        {s.totalCredits != null && <span style={{ fontSize:11, color:'#9CA3AF' }}> 학점</span>}
                      </td>
                      <td className="center">
                        <span style={{ fontWeight:700, color: s.gpa >= 3.5 ? '#16A34A' : s.gpa >= 2.0 ? '#2563EB' : s.gpa ? '#DC2626' : '#9CA3AF' }}>
                          {s.gpa?.toFixed(2) ?? '-'}
                        </span>
                      </td>
                      <td className="center">
                        <span className={`sd-chip ${
                          s.enrollStatus === '재학' ? 'sd-chip-green'
                          : s.enrollStatus === '휴학' ? 'sd-chip-blue'
                          : s.enrollStatus === '제적' ? 'sd-chip-red'
                          : 'sd-chip-gray'
                        }`}>
                          {s.enrollStatus || '-'}
                        </span>
                      </td>
                      <td className="center">
                        <button className="sd-detail-btn" onClick={() => navigate(`/admin/students/${s.studentId}`)}>
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 알림 모달 ── */}
      {showNotifyModal && (
        <div className="sd-modal-overlay">
          <div className="sd-modal">
            <div className="sd-modal-title">📢 알림 전송</div>
            <div className="sd-modal-sub">
              {selected.size > 0 ? `${selected.size}명의 선택된 학생에게` : '조회된 모든 학생에게'} 메시지를 보냅니다.
            </div>
            <textarea
              className="sd-textarea"
              placeholder="학생들에게 전달할 내용을 입력하세요..."
              value={notifyMsg}
              onChange={e => setNotifyMsg(e.target.value)}
            />
            <div className="sd-modal-footer">
              <button className="sd-modal-cancel" onClick={() => setShowNotifyModal(false)}>취소</button>
              <button className="sd-modal-send" onClick={handleNotify}>전송하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}