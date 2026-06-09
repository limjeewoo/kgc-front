import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = 'http://localhost:8080'; // 개발용

export default function SearchByDept({ onBack }) {
  const navigate = useNavigate();
  const accessToken = localStorage.getItem('accessToken');

  // 1. 상태 관리
  const [depts, setDepts] = useState([]); // 학과 목록
  const [nationalities, setNationalities] = useState([]); // 국적 목록
  const [students, setStudents] = useState([]); // 조회된 학생 목록
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState('');

  // 2. 확장된 필터 상태
  const [filters, setFilters] = useState({
    deptId: '',       // 선택 (optional)
    studentId: '',    
    name: '',         
    gender: '',
    nationality: '',  // 이제 ID 대신 국적 이름(예: "한국", "베트남")이 저장됩니다.
    grade: '',
    classSec: '',
  });

  // Axios 인스턴스
  const api = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  // 4. 다중 필터 적용 검색
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
      if (res.data.success) {
        setStudents(res.data.data || []);
      }
    } catch (err) {
      console.error("학생 목록 조회 실패", err);
      setStudents([]); 
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // 3. 초기 데이터 로드 (학과 및 국적 목록)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [deptRes, natRes] = await Promise.allSettled([
          api.get('/api/v1/depts'),
          api.get('/api/v1/nationalities') 
        ]);

        if (deptRes.status === 'fulfilled' && deptRes.value.data.success) {
          setDepts(deptRes.value.data.data);
        }
        if (natRes.status === 'fulfilled' && natRes.value.data.success) {
          setNationalities(natRes.value.data.data);
        }
        
        fetchStudents({
          deptId: '', studentId: '', name: '', gender: '', nationality: '', grade: '', classSec: ''
        });
      } catch (err) {
        console.error("초기 데이터 로드 실패", err);
      }
    };
    fetchInitialData();
  }, [fetchStudents]);

  const handleSearch = () => {
    fetchStudents(filters);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const stats = {
    total: students.length,
    visaAlert: students.filter(s => {
      if (!s.expireDate) return false;
      const diff = new Date(s.expireDate) - new Date();
      return Math.ceil(diff / (1000 * 60 * 60 * 24)) <= 30;
    }).length,
  };

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
        .sd-btn-search { background:#3B82F6; color:#fff; padding:8px 20px; font-weight:600; }
        .sd-btn-secondary { background:#fff; border:1px solid #E5E7EB; color:#374151; }
        .sd-stat-banner { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; padding:0 28px; margin-bottom:18px; }
        .sd-stat-card { background:#fff; border-radius:12px; border:1px solid #E5E7EB; padding:16px 18px; }
        .sd-stat-label { font-size:11px; color:#9CA3AF; margin-bottom:6px; }
        .sd-stat-val { font-size:22px; font-weight:700; color:#111827; }
        .sd-stat-val.blue { color:#3B82F6; }
        .sd-stat-val.amber { color:#D97706; }
        .sd-filter-card { background:#fff; border-radius:14px; border:1px solid #E5E7EB; padding:18px 22px; margin:0 28px 18px 28px; }
        .sd-filter-row { display:flex; gap:16px; flex-wrap:wrap; align-items:flex-end; }
        .sd-filter-group { display:flex; flex-direction:column; gap:6px; }
        .sd-filter-label { font-size:11px; font-weight:600; color:#6B7280; }
        .sd-select, .sd-input { padding:8px 12px; border-radius:8px; border:1px solid #E5E7EB; font-size:13px; outline:none; font-family:inherit; }
        .sd-select:focus, .sd-input:focus { border-color: #3B82F6; }
        .sd-input { width: 140px; }
        .sd-select { min-width: 110px; }
        .sd-table-card { background:#fff; border-radius:14px; border:1px solid #E5E7EB; margin:0 28px; overflow:hidden; }
        .sd-table { width:100%; border-collapse:collapse; }
        .sd-table th { padding:12px 14px; font-size:12px; font-weight:600; color:#6B7280; text-align:left; background:#F8FAFC; border-bottom:1px solid #E2E8F0; }
        .sd-table td { padding:12px 14px; font-size:13px; border-bottom:1px solid #F1F5F9; }
        .sd-student-name { font-weight:700; color:#111827; }
        .sd-student-id { font-size:11.5px; color:#9CA3AF; margin-top:2px; }
        .sd-chip { font-size:11px; font-weight:700; padding:4px 8px; border-radius:6px; background:#F0FDF4; color:#16A34A; }
        .sd-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; }
        .sd-modal { background:#fff; border-radius:16px; padding:24px; width:400px; box-shadow:0 10px 25px rgba(0,0,0,0.1); }
        .sd-textarea { width:100%; height:120px; border:1px solid #E5E7EB; border-radius:8px; padding:12px; margin:12px 0; resize:none; font-family:inherit; }
        .sd-textarea:focus { border-color: #3B82F6; outline: none; }
      `}</style>

      {/* 상단바 */}
      <div className="sd-topbar">
        <div className="sd-topbar-left">
          <button className="sd-back-btn" onClick={onBack || (() => navigate(-1))}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="sd-breadcrumb">통합 검색 › <span>다중 필터 검색</span></div>
        </div>
        <button className="sd-btn sd-btn-primary" onClick={() => setShowNotifyModal(true)}>
          일괄 알림 전송 {selected.size > 0 && `(${selected.size}명)`}
        </button>
      </div>

      {/* 통계 배너 */}
      <div className="sd-stat-banner">
        <div className="sd-stat-card">
          <div className="sd-stat-label">조회된 학생</div>
          <div className="sd-stat-val blue">{stats.total}명</div>
        </div>
        <div className="sd-stat-card">
          <div className="sd-stat-label">비자 만료 임박 (D-30)</div>
          <div className="sd-stat-val amber">{stats.visaAlert}명</div>
        </div>
      </div>

      {/* 확장된 검색 필터 */}
      <div className="sd-filter-card">
        <div className="sd-filter-row">
          <div className="sd-filter-group">
            <span className="sd-filter-label">학과</span>
            <select className="sd-select" style={{width:'160px'}} value={filters.deptId} onChange={e => setFilter('deptId', e.target.value)}>
              <option value="">전체 학과</option>
              {depts.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
            </select>
          </div>
          <div className="sd-filter-group">
            <span className="sd-filter-label">학년/반</span>
            <div style={{display:'flex', gap:'6px'}}>
              <select className="sd-select" style={{width:'80px'}} value={filters.grade} onChange={e => setFilter('grade', e.target.value)}>
                <option value="">학년</option>
                {[1, 2, 3, 4].map(g => <option key={g} value={g}>{g}학년</option>)}
              </select>
              <select className="sd-select" style={{width:'70px'}} value={filters.classSec} onChange={e => setFilter('classSec', e.target.value)}>
                <option value="">반</option>
                {['A', 'B', 'C', 'D'].map(c => <option key={c} value={c}>{c}반</option>)}
              </select>
            </div>
          </div>
          <div className="sd-filter-group">
            <span className="sd-filter-label">국적 및 성별</span>
            <div style={{display:'flex', gap:'6px'}}>
              {/* 수정된 핵심 영역: value를 nationalityId 대신 nationalityName(텍스트)으로 바인딩 */}
              <select className="sd-select" style={{width:'120px'}} value={filters.nationality} onChange={e => setFilter('nationality', e.target.value)}>
                <option value="">전체 국적</option>
                {nationalities.map((nat) => (
                  <option key={nat.nationalityId} value={nat.nationalityName}>
                    {nat.nationalityName}
                  </option>
                ))}
              </select>
              <select className="sd-select" style={{width:'80px'}} value={filters.gender} onChange={e => setFilter('gender', e.target.value)}>
                <option value="">성별</option>
                <option value="남">남</option>
                <option value="여">여</option>
              </select>
            </div>
          </div>
          <div className="sd-filter-group">
            <span className="sd-filter-label">학번</span>
            <input 
              type="text" 
              className="sd-input" 
              placeholder="학번 입력" 
              value={filters.studentId} 
              onChange={e => setFilter('studentId', e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="sd-filter-group">
            <span className="sd-filter-label">이름</span>
            <input 
              type="text" 
              className="sd-input" 
              placeholder="이름 입력" 
              value={filters.name} 
              onChange={e => setFilter('name', e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="sd-filter-group" style={{marginLeft: 'auto'}}>
            <button className="sd-btn sd-btn-search" onClick={handleSearch}>조회하기</button>
          </div>
        </div>
      </div>

      {/* 학생 목록 테이블 */}
      <div className="sd-table-card">
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF' }}>데이터를 불러오는 중입니다...</div>
        ) : (
          <table className="sd-table">
            <thead>
              <tr>
                <th style={{width:'40px', textAlign:'center'}}>
                  <input type="checkbox" onChange={toggleAll} checked={selected.size === students.length && students.length > 0} />
                </th>
                <th>이름 및 학번</th>
                <th>학과 정보</th>
                <th>국적 / 성별</th>
                <th>상태</th>
                <th>평점(GPA)</th>
                <th style={{textAlign:'right'}}>작업</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>조건에 맞는 학생이 없습니다.</td></tr>
              ) : (
                students.map(s => (
                  <tr key={s.studentId}>
                    <td style={{textAlign:'center'}}>
                      <input type="checkbox" checked={selected.has(s.studentId)} onChange={() => toggleOne(s.studentId)} />
                    </td>
                    <td>
                      <div className="sd-student-name">{s.korName} <span style={{fontWeight:400, color:'#6B7280', fontSize:'12px'}}>{s.engName}</span></div>
                      <div className="sd-student-id">{s.studentId}</div>
                    </td>
                    <td>
                      <div style={{fontWeight:600}}>{s.deptName || s.deptId}</div>
                      <div style={{fontSize:'12px', color:'#6B7280'}}>{s.grade}학년 {s.classSec}반</div>
                    </td>
                    <td>{s.nationality} / {s.gender}</td>
                    <td><span className="sd-chip">{s.enrollStatus}</span></td>
                    <td style={{ fontWeight: 600 }}>{s.gpa || s.totalGpa || '-'}</td>
                    <td style={{textAlign:'right'}}>
                      <button 
                        className="sd-btn sd-btn-secondary" 
                        onClick={() => navigate(`/admin/students/${s.studentId}`)}
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 알림 전송 모달 */}
      {showNotifyModal && (
        <div className="sd-modal-overlay">
          <div className="sd-modal">
            <div style={{ fontWeight: 700, fontSize: '18px', color: '#111827' }}>알림 전송</div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px' }}>
              {selected.size > 0 ? `${selected.size}명의 선택된 학생에게` : "조회된 모든 학생에게"} 메시지를 보냅니다.
            </div>
            <textarea 
              className="sd-textarea" 
              placeholder="학생들에게 전달할 내용을 입력하세요..." 
              value={notifyMsg} 
              onChange={e => setNotifyMsg(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="sd-btn sd-btn-secondary" onClick={() => setShowNotifyModal(false)}>취소</button>
              <button className="sd-btn sd-btn-primary" onClick={handleNotify}>전송하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}