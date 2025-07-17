import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import Layout from "./Layout";
import { myAxios } from "../../config";
import { tokenAtom } from "../../atoms";
import "./ClassManagement.css";

// 백엔드 상태값을 관리자 화면용으로 변환하는 함수
const getDisplayStatus = (backendStatus) => {
  if (!backendStatus) return "";
  
  const statusMap = {
    "승인대기": "승인대기",
    "모집중": "모집중",
    "모집마감": "모집마감", 
    "종료": "종료",
    "폐강": "폐강",
    "반려": "반려"
  };
  
  return statusMap[backendStatus.trim()] || backendStatus;
};

// 처리하기 버튼을 표시할지 체크하는 함수 (백엔드 원본 상태 기준)
const shouldShowProcessButton = (backendStatus) => {
  if (!backendStatus) return false;
  
  const normalizedStatus = backendStatus.trim();
  // 백엔드에서 오는 실제 상태값 기준으로 체크
  return normalizedStatus === "승인대기";
};

const STATUS_OPTIONS = [
  { label: "전체", value: "" },
  { label: "승인대기", value: "승인대기" }, // 백엔드 값은 "검수중"이지만 화면에는 "승인대기"로 표시
  { label: "모집중", value: "모집중" },
  { label: "모집마감", value: "모집마감" },
  { label: "반려", value: "반려" },
  { label: "폐강", value: "폐강" },
  { label: "종료", value: "종료" }
];

const STATUS_STYLES = {
  모집중: "status-recruitingHY",
  승인대기: "status-pendingHY", // 표시용 상태 기준
  반려: "status-rejectedHY",
  모집마감: "status-fullHY",
  폐강: "status-cancelledHY",
  종료: "status-endedHY"
};

const PAGE_SIZE = 20;

const ClassManagement = () => {
  const navigate = useNavigate();
  const token = useAtomValue(tokenAtom);
  const setToken = useSetAtom(tokenAtom);

  // 상태 관리
  const [filters, setFilters] = useState({
    searchTerm: "",
    statusFilter: [],
    startDate: "",
    endDate: ""
  });

  const [currentPage, setCurrentPage] = useState(0);

  const [classData, setClassData] = useState({
    list: [],
    totalElements: 0,
    totalPages: 1
  });

  const [loading, setLoading] = useState(false);

  // API 호출 함수
  const fetchClassList = useCallback(async () => {
    if (!token) return;

    console.log('API 호출 - 페이지:', currentPage, '필터:', filters);

    setLoading(true);
    try {
      const params = {
        page: currentPage,
        size: PAGE_SIZE,
        ...(filters.searchTerm && { keyword: filters.searchTerm }),
        ...(filters.startDate && { fromDate: filters.startDate }),
        ...(filters.endDate && { toDate: filters.endDate }),
        ...(filters.statusFilter.length > 0 && { 
          statusFilter: filters.statusFilter.join(',') 
        })
      };

      console.log('요청 파라미터:', params);

      const { data } = await myAxios(token, setToken).get("/api/class", { params });
      
      console.log('응답 데이터:', data);

      setClassData({
        list: data.content || [],
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 1
      });
    } catch (error) {
      console.error("클래스 데이터 로딩 실패:", error);
      setClassData({ list: [], totalElements: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [token, setToken, filters, currentPage]);

  // 필터 업데이트 함수
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  }, []);

  // 상태 필터 토글
  const toggleStatusFilter = useCallback((value) => {
    if (value === "") {
      updateFilter("statusFilter", []);
    } else {
      setFilters(prev => ({
        ...prev,
        statusFilter: prev.statusFilter.includes(value)
          ? prev.statusFilter.filter(s => s !== value)
          : [...prev.statusFilter, value]
      }));
      setCurrentPage(0);
    }
  }, [updateFilter]);

  // 페이지 변경
  const changePage = useCallback((newPage) => {
    console.log('페이지 변경 시도:', newPage, '현재 페이지:', currentPage, '전체 페이지:', classData.totalPages);
    if (newPage >= 0 && newPage < classData.totalPages && newPage !== currentPage) {
      console.log('페이지 변경 실행:', currentPage, '->', newPage);
      setCurrentPage(newPage);
    }
  }, [classData.totalPages, currentPage]);

  // 클래스명 클릭 핸들러 - 상세 페이지로 이동
  const handleClassNameClick = useCallback((classId) => {
    console.log('클래스 상세 페이지로 이동:', classId);
    navigate(`/admin/class/${classId}`);
  }, [navigate]);

  // 처리하기 클릭 핸들러 - 상세 페이지로 이동
  const handleProcessClick = useCallback((classId) => {
    console.log('처리하기 클릭 - 상세 페이지로 이동:', classId);
    navigate(`/admin/class/${classId}`);
  }, [navigate]);

  // 페이지 번호 생성
  const pageNumbers = useMemo(() => {
    if (classData.totalPages <= 1) return [0];
    
    const maxVisible = 5;
    const current = currentPage;
    let start = Math.max(0, current - Math.floor(maxVisible / 2));
    let end = Math.min(classData.totalPages - 1, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, classData.totalPages]);

  // 데이터 fetch
  useEffect(() => {
    fetchClassList();
  }, [fetchClassList]);

  return (
    <Layout>
      <div className="page-titleHY">
        <h1>클래스 관리</h1>
      </div>

      {/* 검색 및 날짜 필터 */}
      <div className="search-sectionHY">
        <div className="search-boxHY">
          <input
            type="text"
            placeholder="일정ID, 클래스명, 강사명, 강사 ID 검색"
            value={filters.searchTerm}
            onChange={(e) => updateFilter("searchTerm", e.target.value)}
            className="search-inputHY"
          />
        </div>

        <div className="date-filter-group">
          <label className="date-labelHY">개설일</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => updateFilter("startDate", e.target.value)}
            className="date-inputHY"
          />
          <span className="date-separatorHY">~</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => updateFilter("endDate", e.target.value)}
            className="date-inputHY"
          />
        </div>
      </div>

      {/* 상태 필터 */}
      <div className="filter-sectionHY">
        {STATUS_OPTIONS.map(({ label, value }) => (
          <button
            key={value}
            className={`filter-btnHY ${
              value === "" 
                ? (filters.statusFilter.length === 0 ? "active" : "") 
                : (filters.statusFilter.includes(value) ? "active" : "")
            }`}
            onClick={() => toggleStatusFilter(value)}
          >
            {label}
            {value !== "" && filters.statusFilter.includes(value) && (
              <span className="filter-countHY">✓</span>
            )}
          </button>
        ))}
      </div>

      <div className="result-countHY">
        총 <strong>{classData.totalElements}</strong>건
      </div>

      {/* 테이블 */}
      <div className="table-containerHY">
        <table className="tableHY">
          <thead>
            <tr>
              <th>NO</th>
              <th style={{width: '80px'}}>클래스 ID </th>
              <th style={{width: '80px'}}>일정 ID</th>
              <th style={{width: '120px'}}>1차 카테고리</th>
              <th style={{width: '120px'}}>2차 카테고리</th>
              <th style={{width: '100px'}}>강사 ID</th>
              <th style={{width: '100px'}}>강사명</th>
              <th style={{width: '300px'}}>클래스명</th>
              <th style = {{width: '100px'}}>가격</th>
              <th style={{width: '100px'}}>등록 최소 인원</th>
              <th style={{width: '100px'}}>등록 최대 인원</th>
              <th style={{width: '100px'}}>개설일</th>
              <th style={{width: '100px'}}>상태</th>
              <th style={{width: '100px'}}>액션</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="14" className="loading-cellHY">데이터를 불러오는 중...</td>
              </tr>
            ) : classData.list.length === 0 ? (
              <tr>
                <td colSpan="14" className="empty-cellHY">데이터가 없습니다.</td>
              </tr>
            ) : (
              classData.list.map((item, idx) => {
                const displayStatus = getDisplayStatus(item.processStatus);
                
                return (
                  <tr key={`${item.classId}_${idx}`}>
                    <td>{(currentPage * PAGE_SIZE) + idx + 1}</td>
                    <td>{item.classId}</td>
                    <td>{item.calendarId}</td>
                    <td>{item.firstCategory}</td>
                    <td>{item.secondCategory}</td>
                    <td className="instructor-idHY">{item.hostUserName}</td>
                    <td>{item.hostName}</td>
                    <td className="class-nameHY">
                      <span
                        className="class-name-clickable"
                        onClick={() => handleClassNameClick(item.classId)}
                        style={{ 
                          cursor: 'pointer', 
                          color: '#3b82f6', 
                          textDecoration: 'underline' 
                        }}
                      >
                        {item.className}
                      </span>
                    </td>
                    <td className="priceHY">{item.price?.toLocaleString()}원</td>
                    <td className="text-center">{item.recruitMin}명</td>
                    <td className="text-center">{item.recruitMax}명</td>
                    <td>{item.regDate}</td>
                    <td>
                      {/* 화면에는 표시용 상태("승인대기") 표시 */}
                      <span className={`status-badgeHY ${STATUS_STYLES[displayStatus]}`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td className="actionHY">
                      {/* 백엔드 원본 상태로 버튼 표시 여부 결정 */}
                      {shouldShowProcessButton(item.processStatus) && (
                        <button
                          className="btn-processHY"
                          onClick={() => handleProcessClick(item.classId)}
                          disabled={loading}
                        >
                          처리하기
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {classData.totalPages > 1 && (
        <div className="paginationHY">
          <button
            className="page-btnHY prev"
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 0}
          >
            이전
          </button>
          <span className="page-numbersHY">
            {pageNumbers.map((num) => (
              <button
                key={num}
                className={`page-btnHY ${num === currentPage ? "activeHY" : ""}`}
                onClick={() => changePage(num)}
              >
                {num + 1}
              </button>
            ))}
          </span>
          <button
            className="page-btnHY next"
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage >= classData.totalPages - 1}
          >
            다음
          </button>
        </div>
      )}
    </Layout>
  );
};

export default ClassManagement;