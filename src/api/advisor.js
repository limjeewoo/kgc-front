import axios from './axios'; // 인터셉터가 적용된 커스텀 axios 인스턴스 불러오기

// 백엔드 API 기본 경로 (실제 백엔드 컨트롤러 매핑 주소에 맞게 수정하세요)
const BASE_URL = '/api/v1/advisors'; 

export const advisorApi = {
  /**
   * 1. 학생에게 지도교수 배정 (등록/수정)
   * @param {Object} data - { studentId: "학번", professorId: "교수사번" }
   */
  assignAdvisor: async (data) => {
    const response = await axios.post(`${BASE_URL}/assign`, data);
    return response.data;
  },

  /**
   * 2. 특정 교수가 담당하는 학생 목록 조회 (교수 대시보드에서 주로 사용)
   * @param {string} professorId - 교수 사번
   */
  getStudentsByProfessor: async (professorId) => {
    const response = await axios.get(`${BASE_URL}/professors/${professorId}/students`);
    return response.data;
  },

  /**
   * 3. 특정 학생의 담당 지도교수 조회 (학생 상세 페이지에서 사용)
   * @param {string} studentId - 학번
   */
  getAdvisorByStudent: async (studentId) => {
    const response = await axios.get(`${BASE_URL}/students/${studentId}`);
    return response.data;
  },

  /**
   * 4. 지도교수 배정 해제
   * @param {Object} data - { studentId: "학번", professorId: "교수사번" }
   */
  unassignAdvisor: async (data) => {
    // DELETE 요청은 본문(body)을 보낼 때 `data` 속성으로 감싸야 합니다.
    const response = await axios.delete(`${BASE_URL}/unassign`, { data });
    return response.data;
  },

  /**
   * (옵션) 5. 일괄 배정 (다수의 학생을 한 교수에게 한 번에 배정할 때)
   * @param {Object} data - { professorId: "교수사번", studentIds: ["학번1", "학번2", ...] }
   */
  assignBulkAdvisors: async (data) => {
    const response = await axios.post(`${BASE_URL}/assign/bulk`, data);
    return response.data;
  }
};