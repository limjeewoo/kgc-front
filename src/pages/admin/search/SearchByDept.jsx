import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// const BASE_URL = 'https://api.kmgc.world'; // 배포용
const BASE_URL = 'http://localhost:8080'; // 개발용

export default function SearchByDept() {
  const navigate = useNavigate();
  const accessToken = localStorage.getItem('accessToken');

  // 1. 상태 관리
  const [depts, setDepts] = useState([]); // 학과 목록
  const [students, setStudents] = useState([]); // 조회된 학생 목록
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');

  // 필터 상태 (명세서 18.2 쿼리 파라미터 기준)
  const [filters, setFilters] = useState({
    deptId: '', // 필수
    nationality: '',
    gender: '',
    grade: '',
    classSec: '',
  });

// 2. Axios 인스턴스 (인증 헤더 포함)
  const api = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  // 3. 학과 목록 조회 (GET /api/v1/depts)
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/api/v1/depts');
        if (res.data.success) {
          setDepts(res.data.data);
          if (res.data.data.length > 0) {
            setFilter('deptId', res.data.data[0].deptId);
          }
        }
      } catch (err) {
        console.error("학과 목록 로드 실패", err);
      }
    };
    fetchDepts();
  }, []);

  // 4. 학과별 학생 검색 (GET /api/v1/search/dept)
  const fetchStudents = useCallback(async () => {
    if (!filters.deptId) return;

    setIsLoading(true);
    setSelected(new Set());
    try {
      const res = await api.get('/api/v1/search/dept', { params: filters });
      if (res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      console.error("학생 목록 조회 실패", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // 5. 통계 계산
  const stats = {
    total: students.length,
    visaAlert: students.filter(s => {
      if (!s.expireDate) return false;
      const diff = new Date(s.expireDate) - new Date();
      return Math.ceil(diff / (1000 * 60 * 60 * 24)) <= 30;
    }).length,
  };

  // 6. 알림 전송 처리
  const handleNotify = async () => {
    if (!notifyMsg.trim()) return alert("메시지를 입력해주세요.");
    try {
      const targetIds = selected.size > 0 ? [...selected] : students.map(s => s.studentId);
      await api.post('/api/v1/notifications', {
        studentIds: targetIds,
        message: notifyMsg,
        type: 'ADMIN_NOTICE'
      });
      alert(`✅ ${targetIds.length}명에게 알림이 전송되었습니다.`);
      setShowNotifyModal(false);
      setNotifyMsg('');
    } catch (err) {
      alert("알림 전송에 실패했습니다.");
    }
  };

  // 핸들러 함수
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

  return (
    <div style={{ fontFamily: "'DM Sans','Noto Sans KR',sans-serif", fontSize: '14px', color: '#111827', background: '#F9FAFB', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .sd-topbar { background:#fff; padding:0 28px; height:58px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #E5E7EB; margin-bottom:24px; }
        .sd-topbar-left { display:flex; align-items:center; gap:10px; }
        .sd-breadcrumb { font-size:13px; color:#9CA3AF; }
        .sd-breadcrumb span { color:#111827; font-weight:600; }
        .sd-back-btn { width:30px; height:30px; border-radius:7px; background:#F3F4F6; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .sd-btn { padding:7px 14px; border-radius:8px; font-size:12.5px; font-weight:500; cursor:pointer; font-family:inherit; border:none; transition:0.15s; }
        .sd-btn-primary { background:#1A3A5C; color:#fff; }
        .sd-btn-secondary { background:#fff; border:1px solid #E5E7EB; color:#374151; }
        .sd-stat-banner { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; padding:0 28px; margin-bottom:18px; }
        .sd-stat-card { background:#fff; border-radius:12px; border:1px solid #E5E7EB; padding:16px 18px; }
        .sd-stat-label { font-size:11px; color:#9CA3AF; margin-bottom:6px; }
        .sd-stat-val { font-size:22px; font-weight:700; color:#111827; }
        .sd-stat-val.blue { color:#3B82F6; }
        .sd-stat-val.amber { color:#D97706; }
        .sd-filter-card { background:#fff; border-radius:14px; border:1px solid #E5E7EB; padding:18px 22px; margin:0 28px 18px 28px; }
        .sd-filter-row { display:flex; gap:16px; flex-wrap:wrap; }
        .sd-filter-group { display:flex; flex-direction:column; gap:4px; }
        .sd-filter-label { font-size:11px; font-weight:600; color:#9CA3AF; }
        .sd-select { padding:7px 10px; border-radius:8px; border:1px solid #E5E7EB; font-size:12.5px; min-width:140px; outline:none; }
        .sd-table-card { background:#fff; border-radius:14px; border:1px solid #E5E7EB; margin:0 28px; overflow:hidden; }
        .sd-table { width:100%; border-collapse:collapse; }
        .sd-table th { padding:12px 14px; font-size:11.5px; font-weight:600; color:#9CA3AF; text-align:left; background:#FAFAFA; border-bottom:1px solid #E5E7EB; }
        .sd-table td { padding:12px 14px; font-size:12.5px; border-bottom:1px solid #F9FAFB; }
        .sd-student-name { font-weight:600; color:#111827; }
        .sd-student-id { font-size:11px; color:#9CA3AF; }
        .sd-chip { font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px; background:#F0FDF4; color:#16A34A; }
        .sd-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:1000; }
        .sd-modal { background:#fff; border-radius:16px; padding:24px; width:400px; box-shadow:0 10px 25px rgba(0,0,0,0.1); }
        .sd-textarea { width:100%; height:120px; border:1px solid #E5E7EB; border-radius:8px; padding:12px; margin:12px 0; resize:none; font-family:inherit; }
      `}</style>

      <div className="sd-topbar">
        <div className="sd-topbar-left">
          <button className="sd-back-btn" onClick={() => navigate(-1)}>🔙</button>
          <div className="sd-breadcrumb">학생 관리 › <span>학과별 현황 검색</span></div>
        </div>
        <button className="sd-btn sd-btn-primary" onClick={() => setShowNotifyModal(true)}>
          일괄 알림 전송 {selected.size > 0 && `(${selected.size}명)`}
        </button>
      </div>

      <div className="sd-stat-banner">
        <div className="sd-stat-card">
          <div className="sd-stat-label">조회된 학생</div>
          <div className="sd-stat-val blue">{stats.total}명</div>
        </div>
        <div className="sd-stat-card">
          <div className="sd-stat-label">비자 만료 임박(D-30)</div>
          <div className="sd-stat-val amber">{stats.visaAlert}명</div>
        </div>
      </div>

      <div className="sd-filter-card">
        <div className="sd-filter-row">
          <div className="sd-filter-group">
            <span className="sd-filter-label">학과 선택</span>
            <select className="sd-select" value={filters.deptId} onChange={e => setFilter('deptId', e.target.value)}>
              {depts.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
            </select>
          </div>
          <div className="sd-filter-group">
            <span className="sd-filter-label">학년</span>
            <select className="sd-select" value={filters.grade} onChange={e => setFilter('grade', e.target.value)}>
              <option value="">전체</option>
              {[1, 2, 3, 4].map(g => <option key={g} value={g}>{g}학년</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="sd-table-card">
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>데이터를 불러오는 중...</div>
        ) : (
          <table className="sd-table">
            <thead>
              <tr>
                <th><input type="checkbox" onChange={toggleAll} checked={selected.size === students.length && students.length > 0} /></th>
                <th>이름(학번)</th>
                <th>국적</th>
                <th>상태</th>
                <th>학점(GPA)</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>조회된 학생이 없습니다.</td></tr>
              ) : (
                students.map(s => (
                  <tr key={s.studentId}>
                    <td><input type="checkbox" checked={selected.has(s.studentId)} onChange={() => toggleOne(s.studentId)} /></td>
                    <td>
                      <div className="sd-student-name">{s.korName}</div>
                      <div className="sd-student-id">{s.studentId}</div>
                    </td>
                    <td>{s.nationality}</td>
                    <td><span className="sd-chip">{s.enrollStatus}</span></td>
                    <td style={{ fontWeight: 600 }}>{s.gpa || '-'}</td>
                    <td>
                      <button className="sd-btn sd-btn-secondary" onClick={() => navigate(`/students/${s.studentId}`)}>상세보기</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showNotifyModal && (
        <div className="sd-modal-overlay">
          <div className="sd-modal">
            <div style={{ fontWeight: 700, fontSize: '16px' }}>알림 전송</div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
              {selected.size > 0 ? `${selected.size}명의 선택된 학생에게` : "학과 전체 학생에게"} 메시지를 보냅니다.
            </div>
            <textarea 
              className="sd-textarea" 
              placeholder="내용을 입력하세요..." 
              value={notifyMsg} 
              onChange={e => setNotifyMsg(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="sd-btn sd-btn-secondary" onClick={() => setShowNotifyModal(false)}>취소</button>
              <button className="sd-btn sd-btn-primary" onClick={handleNotify}>보내기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
