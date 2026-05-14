import React, { useState } from 'react';
import axios from 'axios';

// ── API 설정 ──────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: 'http://localhost:8080', // 명세서 기준 로컬 주소
  headers: { 'Content-Type': 'application/json' },
});

// 요청 시마다 로컬 스토리지에서 토큰을 가져와 헤더에 삽입
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const WEEK_LABELS = ['1주','2주','3주','4주','5주','6주','7주','8주','9주','10주','11주','12주','13주','14주','15주'];

const CLASS_TYPE_COLOR = {
  '오프': { bg: 'transparent', color: '#374151' },
  '온':   { bg: '#EFF6FF',     color: '#2563EB' },
  '교필': { bg: '#F3F0FF',     color: '#7C3AED' },
  '초':   { bg: '#F0FDF4',     color: '#16A34A' },
};

function getTypeStyle(classType = '') {
  if (classType.includes('온')) return CLASS_TYPE_COLOR['온'];
  if (classType.includes('교필')) return CLASS_TYPE_COLOR['교필'];
  if (classType.startsWith('초')) return CLASS_TYPE_COLOR['초'];
  return CLASS_TYPE_COLOR['오프'];
}

export default function SearchByStudent({ onBack }) {
  const [query, setQuery] = useState('');
  const [student, setStudent] = useState(null);
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setSearched(true);
    
    try {
      // 명세서 18.1 개인별 검색 API 호출
      const response = await api.get(`/api/v1/search/student/${query}`);
      
      if (response.data.success) {
        setStudent(response.data.data);
      } else {
        setStudent(null);
      }
    } catch (error) {
      console.error("학생 조회 중 오류 발생:", error);
      setStudent(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <>
      <style>{`
        .sbs-wrap { font-family: 'DM Sans', 'Noto Sans KR', sans-serif; }
        .sbs-search-row { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
        .sbs-input { flex: 1; max-width: 360px; padding: 0.65rem 1rem; border: 1.5px solid #E5E7EB; border-radius: 0.625rem; font-size: 0.875rem; outline: none; background:#fff; }
        .sbs-search-btn { padding: 0.65rem 1.4rem; background: #1A3A5C; color: #fff; border: none; border-radius: 0.625rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
        .sbs-card { background: #fff; border-radius: 0.875rem; border: 1px solid #F3F4F6; margin-bottom: 1rem; overflow: hidden; }
        .sbs-card-header { padding: 0.875rem 1.25rem; border-bottom: 1px solid #F3F4F6; font-weight: 700; font-size: 0.875rem; color: #1A3A5C; display: flex; align-items: center; gap: 0.5rem; }
        .sbs-card-header::before { content:''; display:inline-block; width:3px; height:1rem; background:#3B82F6; border-radius:2px; }
        .sbs-profile-top { display: flex; gap: 1.5rem; padding: 1.25rem; align-items: flex-start; }
        .sbs-photo { width: 88px; height: 110px; border-radius: 0.5rem; background: #EFF6FF; border: 2px solid #DBEAFE; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
        .sbs-info-main { flex: 1; }
        .sbs-name-row { display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 0.625rem; flex-wrap: wrap; }
        .sbs-eng-name { font-size: 1.25rem; font-weight: 700; color: #111827; }
        .sbs-kor-name { font-size: 0.9375rem; color: #6B7280; font-weight: 500; }
        // .sbs-id-badge { font-size: 0.75rem; background: #EFF6FF; color: #2563EB; padding: 2px 10px; border-radius: 20px; font-weight: 700; }
        .sbs-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .sbs-tag { font-size: 0.6875rem; padding: 3px 10px; border-radius: 20px; font-weight: 600; }
        // .tag-blue { background: #EFF6FF; color: #2563EB; }
        // .tag-green { background: #F0FDF4; color: #16A34A; }
        // .tag-purple { background: #F5F3FF; color: #7C3AED; }
        // .tag-red { background: #FEF2F2; color: #EF4444; }
        // .tag-gray { background: #F3F4F6; color: #374151; }
        .sbs-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem 1.5rem; }
        .sbs-info-label { font-size: 0.6875rem; color: #9CA3AF; font-weight: 500; margin-bottom: 2px; }
        .sbs-info-value { font-size: 0.8125rem; font-weight: 600; color: #111827; }
        .sbs-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid #F3F4F6; }
        .sbs-stat-box { padding: 0.875rem 1.25rem; text-align: center; border-right: 1px solid #F3F4F6; }
        .sbs-stat-val { font-size: 1.375rem; font-weight: 700; color: #111827; }
        .sbs-stat-lbl { font-size: 0.6875rem; color: #9CA3AF; margin-top: 2px; }
        .sbs-table-wrap { overflow-x: auto; }
        .sbs-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; min-width: 700px; }
        .sbs-table th { padding: 0.5rem 0.5rem; background: #F9FAFB; color: #6B7280; font-weight: 600; text-align: center; border-bottom: 1px solid #F3F4F6; }
        .sbs-table td { padding: 0.5rem 0.5rem; border-bottom: 1px solid #F9FAFB; text-align: center; vertical-align: middle; }
        .week-dot { display: inline-block; width: 18px; height: 18px; border-radius: 50%; background: #D1FAE5; font-size: 0.6rem; font-weight: 700; color: #065F46; line-height: 18px; }
        .sbs-counsel-item { padding: 1rem 1.25rem; border-bottom: 1px solid #F9FAFB; }
        .sbs-counsel-text { font-size: 0.8125rem; color: #374151; line-height: 1.65; background: #F9FAFB; border-radius: 0.5rem; padding: 0.75rem 1rem; margin-bottom: 0.75rem; }
        .sbs-not-found { padding: 3rem; text-align: center; background:#fff; border-radius:0.875rem; }
      `}</style>

      <div className="sbs-wrap">
        {/* ── 검색바 ── */}
        <div className="sbs-search-row">
          <input
            className="sbs-input"
            placeholder="학번을 입력하세요 (예: 25071001)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="sbs-search-btn" onClick={handleSearch} disabled={isLoading}>
            {isLoading ? '조회 중...' : '검색'}
          </button>
        </div>

        {/* ── 초기 상태 ── */}
        {!searched && (
          <div className="sbs-not-found">
            <div style={{fontSize:'2.5rem', marginBottom:'0.75rem'}}>🔍</div>
            <p style={{fontWeight:600, color:'#374151'}}>학번으로 학생을 검색하세요</p>
          </div>
        )}

        {/* ── 결과 없음 ── */}
        {searched && !student && !isLoading && (
          <div className="sbs-not-found">
            <div style={{fontSize:'2.5rem', marginBottom:'0.75rem'}}>😶</div>
            <p style={{fontWeight:600, color:'#374151'}}>학생 정보를 찾을 수 없습니다</p>
          </div>
        )}

        {/* ── 학생 정보 (성공 시) ── */}
        {student && (
          <>
            <div className="sbs-card">
              <div className="sbs-card-header">학생 기본 정보</div>
              <div className="sbs-profile-top">
                <div className="sbs-photo">
                  {student.photoUrl ? <img src={student.photoUrl} alt="프로필" /> : <span style={{fontSize:'2.5rem', color:'#BFDBFE'}}>👤</span>}
                </div>
                <div className="sbs-info-main">
                  <div className="sbs-name-row">
                    <span className="sbs-eng-name">{student.engName}</span>
                    <span className="sbs-kor-name">{student.korName}</span>
                    <span className="sbs-id-badge">{student.studentId}</span>
                  </div>
                  <div className="sbs-tags">
                    <span className="sbs-tag tag-blue">{student.gender}</span>
                    <span className="sbs-tag tag-gray">🌏 {student.nationality}</span>
                    <span className="sbs-tag tag-purple">TOPIK {student.topikLevel || '없음'}급</span>
                    <span className={`sbs-tag ${student.enrollStatus === '등록' ? 'tag-blue' : 'tag-red'}`}>{student.enrollStatus}</span>
                  </div>
                  <div className="sbs-info-grid">
                    <div className="sbs-info-item">
                      <span className="sbs-info-label">출신 교육기관</span>
                      <span className="sbs-info-value">{student.instituteName || '정보 없음'}</span>
                    </div>
                    <div className="sbs-info-item">
                      <span className="sbs-info-label">소속 학과</span>
                      <span className="sbs-info-value">{student.deptName}</span>
                    </div>
                    <div className="sbs-info-item">
                      <span className="sbs-info-label">연락처</span>
                      <span className="sbs-info-value">{student.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sbs-stats-row">
                <div className="sbs-stat-box">
                  <div className="sbs-stat-val">{student.totalCredits || 0}</div>
                  <div className="sbs-stat-lbl">취득 학점</div>
                </div>
                <div className="sbs-stat-box">
                  <div className="sbs-stat-val">{student.totalGpa?.toFixed(2) || '0.00'}</div>
                  <div className="sbs-stat-lbl">전체 평점</div>
                </div>
                <div className="sbs-stat-box">
                  <div className="sbs-stat-val">{student.totalAttend || 0}</div>
                  <div className="sbs-stat-lbl">총 출석</div>
                </div>
                <div className="sbs-stat-box">
                  <div className="sbs-stat-val" style={{color: student.totalAbsent > 3 ? '#EF4444' : '#111827'}}>{student.totalAbsent || 0}</div>
                  <div className="sbs-stat-lbl">총 결석</div>
                </div>
              </div>
            </div>

            {/* 출결 현황 (명세서 13.2 기반 연동 가능성) */}
            <div className="sbs-card">
              <div className="sbs-card-header">과목별 출결 상세</div>
              <div className="sbs-table-wrap">
                <table className="sbs-table">
                  <thead>
                    <tr>
                      <th>상태</th>
                      <th>과목명</th>
                      {WEEK_LABELS.map(w => <th key={w}>{w}</th>)}
                      <th>출석</th>
                      <th>결석</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(student.enrollments || []).map((en, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className={`eval-badge ${en.warningStatus === '위험' ? 'eval-주의' : ''}`}>
                            {en.warningStatus || '정상'}
                          </span>
                        </td>
                        <td style={{textAlign:'left'}}>{en.courseName}</td>
                        {(en.attendances || []).map((at, aidx) => (
                          <td key={aidx}>
                            {at.status === 1 ? <span className="week-dot">✓</span> : at.status === 2 ? <span style={{color:'#EF4444', fontWeight:700}}>X</span> : '-'}
                          </td>
                        ))}
                        <td>{en.totalAttend}</td>
                        <td>{en.totalAbsent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 상담 내역 (명세서 16.2 기반) */}
            <div className="sbs-card">
              <div className="sbs-card-header">상담 이력 요약</div>
              {(student.consultations || []).length === 0 ? (
                <div className="sbs-empty" style={{padding:'20px', textAlign:'center', color:'#9CA3AF'}}>기록된 상담 내역이 없습니다.</div>
              ) : (
                student.consultations.map((c, i) => (
                  <div className="sbs-counsel-item" key={i}>
                    <div style={{fontSize:'0.75rem', fontWeight:700, marginBottom:'5px'}}>{c.consultDate} | 상담자: {c.professorName} 교수</div>
                    <div className="sbs-counsel-text">{c.rawContent}</div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}