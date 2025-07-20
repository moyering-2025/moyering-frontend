import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { myAxios } from "/src/config";
import Layout from "./Layout";
import { useAtomValue } from 'jotai';
import { tokenAtom } from '../../atoms';
import SettlementModal from './SettlementModal'; 
import './SettlementManagement.css';

const SettlementManagement = () => {
  const location = useLocation();
  const userInfo = location.state; 
  const token = useAtomValue(tokenAtom);
  
  // 검색 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // 백엔드 연동 데이터
  const [settlementData, setSettlementData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 페이징 관련 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(20);
  
  // 모달 관련 상태
  const [showModal, setShowModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  // 초기화 완료 상태
  const [isInitialized, setIsInitialized] = useState(false);

  // ===== API 호출 함수 =====
  const fetchSettlementData = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let endpoint = '/api/settlement';
      const params = {
        page: currentPage,
        size: pageSize,
        sort: 'settlementDate,desc'
      };
      
      // 검색어 처리
      if (searchTerm.trim()) {
        params.keyword = searchTerm.trim();
      }
      
      // 날짜 필터링
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }
      
      console.log('API 호출 - endpoint:', endpoint, 'params:', params);
      const response = await myAxios(token).get(endpoint, { params });
      
      if (response.data) {
        const { content, totalPages, totalElements, number } = response.data;
        
        // 중복 제거 및 정렬 (백엔드 보완용)
        const uniqueContent = [];
        const seenIds = new Set();
        
        (content || []).forEach(item => {
          if (!seenIds.has(item.settlementId)) {
            seenIds.add(item.settlementId);
            uniqueContent.push(item);
          }
        });
        
        setSettlementData(uniqueContent);
                    console.log(response.data);

        setTotalPages(totalPages || 0);
        setTotalElements(totalElements || 0);
        setCurrentPage(number || 0);
      }
    } catch (err) {
      console.error('정산 목록 조회 실패:', err);
      setError('정산 목록을 불러오는데 실패했습니다.');
    } finally {

      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, startDate, endDate, token]);

  // 정산하기 버튼 클릭 핸들러 - 모달 열기
  const handleSettlement = (settlementItem) => {
    setSelectedSettlement(settlementItem);
    setShowModal(true);
  };

  // 정산 확정 처리 - 모달에서 호출됨
const handleConfirmSettlement = async (settlementId, stats) => {
    try {
        const response = await myAxios(token).put(
            `/api/settlement/${settlementId}/complete`, 
            {
                totalSettlementAmount: settlementData.settleAmountToDo,
                totalPayments: settlementData.settleAmountToDo
            },
            {
                headers: {
                    'Content-Type': 'application/json'  // 이 API 호출에서만 명시적 설정
                }
            }
        );
        
        if (response.status === 200) {
            alert('정산이 완료되었습니다.');
            fetchSettlementData();
            handleCloseModal();
        }
    } catch (err) {
        console.error('정산 처리 실패:', err);
        alert('정산 처리에 실패했습니다.');
    }
};
  // 수강생 목록 조회 API (실제 연동 시 사용)
  const fetchStudentList = async (classId) => {
    try {
      const response = await myAxios(token).get(`/api/class/${classId}/students`);
      return response.data || [];
    } catch (err) {
      console.error('수강생 조회 실패:', err);
      throw err;
    }
  };

  // 클래스명 클릭 핸들러 (수강생 조회용)
  const handleClassNameClick = (classInfo) => {
    setSelectedSettlement(classInfo);
    setShowModal(true);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSettlement(null);
  };

  // ===== useEffect 훅들 =====
  // 초기 설정 - userInfo가 있으면 검색어 설정
  useEffect(() => {
    console.log('받은 userInfo:', userInfo);
    if (userInfo && userInfo.username) {
      console.log('검색어 설정:', userInfo.username);
      setSearchTerm(userInfo.username);
    }
    setIsInitialized(true); // 초기화 완료
  }, [userInfo]);

  // 초기화 완료 후 첫 데이터 로딩
  useEffect(() => {
    if (isInitialized) {
      console.log('초기 데이터 로딩 시작, searchTerm:', searchTerm);
      fetchSettlementData();
    }
  }, [isInitialized, fetchSettlementData]);

  // 페이지 변경 시 (초기화 완료 후에만)
  useEffect(() => {
    if (isInitialized && currentPage > 0) { // currentPage가 0이 아닐 때만
      fetchSettlementData();
    }
  }, [currentPage, isInitialized, fetchSettlementData]);

  // 검색어 디바운스 처리 (초기화 완료 후에만)
  useEffect(() => {
    if (!isInitialized) return;
    
    const timer = setTimeout(() => {
      console.log('검색어 변경으로 인한 API 호출:', searchTerm);
      setCurrentPage(0);
      fetchSettlementData();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, isInitialized]);

  // 날짜 필터 변경 시 (초기화 완료 후에만)
  useEffect(() => {
    if (!isInitialized) return;
    
    console.log('날짜 필터 변경으로 인한 API 호출');
    setCurrentPage(0);
    fetchSettlementData();
  }, [startDate, endDate, isInitialized]);

  // ===== 헬퍼 함수들 =====
  // 금액 포맷팅
  const formatAmount = (amount) => {
    if (!amount || amount === 0) return '0';
    return amount.toLocaleString('ko-KR');
  };

  // 날짜 포맷팅
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR');
  };

  // 상태별 스타일 클래스
  const getStatusClass = (status) => {
    switch (status) {
      case 'PENDING':
      case 'WT':
      case 'WP':  
        return 'status-pendingHY';
      case 'COMPLETED':
      case 'CP':
        return 'status-completedHY';
        case 'RQ' : 
        return  'status_soy';
      default:
        return '';
    }
  };

  // 상태 텍스트 변환
  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
      case 'WT':
      case 'WP':
        return '정산대기';
      case 'RQ':
        return '정산요청';
      case 'COMPLETED':
      case 'CP':
        return '정산완료';
      default:
        return status;
    }
  };

  // ===== 이벤트 핸들러들 =====
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleResetFilters = () => {
    setSearchTerm(userInfo?.username || '');
    setStartDate('');
    setEndDate('');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages && newPage !== currentPage && !loading) {
      setCurrentPage(newPage);
    }
  };

  // ===== 렌더링 =====
  return (
    <Layout>
      {/* 페이지 헤더 */}
      <div className="page-titleHY">
        <h1>
          {userInfo ? `${userInfo.username}님의 정산 관리` : '정산 관리'}
        </h1>
        {userInfo && (
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
            회원 구분: {userInfo.userType}
          </div>
        )}
      </div>

      {/* 검색 영역 */}
      <div className="search-sectionHY">
        <div className="search-boxHY">
          <input
            type="text"
            placeholder="강사 ID, 강사명, 클래스명 검색"
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-inputHY"
          />
        </div>
        
        <div className="date-filter-group">
          <label className="date-labelHY">정산 기간</label>
          <input
            type="date"
            className="date-inputHY"
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="date-separatorHY">~</span>
          <input
            type="date"
            className="date-inputHY"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          
          {(searchTerm !== (userInfo?.username || '') || startDate || endDate) && (
            <button 
              className="reset-filterHY"
              onClick={handleResetFilters}
              type="button"
            >
              필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* 결과 수 표시 */}
      <div className="result-countHY">
        총 <strong>{totalElements}</strong>건
        {(startDate || endDate) && (
          <span className="filter-infoHY">
            {startDate && endDate ? ` (${startDate} ~ ${endDate})` :
             startDate ? ` (${startDate} 이후)` :
             ` (${endDate} 이전)`}
          </span>
        )}
      </div>

      {/* 테이블 */}
      <div className="table-containerHY">
        <table className="tableHY">
          <thead>
            <tr>
              <th>NO</th>
              <th>정산 ID</th>
              <th>클래스 일정 ID</th>
              <th>강사 ID</th>
              <th>강사명</th>
              <th>클래스명</th>
              <th>정산 금액</th>
              <th>정산 예정일</th>
              <th>정산 확정 금액</th>
              <th>정산 완료일</th>
              <th>은행</th>
              <th>계좌번호</th>
              <th>상태</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {settlementData.length > 0 ? (
              settlementData.map((item, index) => (
                <tr key={item.settlementId}>
                  <td className="no-columnHY">
                    {(currentPage * pageSize) + index + 1}
                  </td>
                  <td className="settlement-idHY">{item.settlementId}</td>
                  <td className="calendar-idHY">{item.calendarId}</td>
                  <td className="host-idHY">{item.username}</td>
                  <td className="host-nameHY">{item.hostName}</td>
                  <td className="class-nameHY">
                    <span         
                      className="class-name-clickable"
                      onClick={() => handleClassNameClick(item)}
                      style={{ cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline' }}
                    >
                      {item.className}
                    </span>
                  </td>
                  <td className="expected-amountHY">
                    {formatAmount(item.settleAmountToDo)}원
                  </td>
                  <td className="settlement-dateHY">{formatDate(item.settlementDate)}</td>
                  <td className="settlement-amountHY">
                    {formatAmount(item.settleAmountToDo)}원
                  </td>
                  <td className="settled-dateHY">{formatDate(item.settledAt)}</td>
                  <td className="bank-nameHY">{item.bankName || '-'}</td>
                  <td className="account-numHY">{item.accNum || '-'}</td>
                  <td className="statusHY">
                    <span className={`status-badgeHY ${getStatusClass(item.settlementStatus)} `}>
                      {getStatusText(item.settlementStatus)}
                    </span>
                  </td>
                  <td className="actionHY">
                    {(item.settlementStatus === 'PENDING' || 
                      item.settlementStatus === 'WT' || 
                      item.settlementStatus === 'WP' || 
                      item.settlementStatus === 'RQ') ? (
           <button 
  className={`btn-settlementHY ${item.settlementStatus === 'RQ' ? 'request' : ''}`}
  onClick={() => handleSettlement(item)}
  disabled={loading}
>
  {item.settlementStatus === 'RQ' ? '정산요청' : '정산하기'}
</button>
                    ) : (
                      <span className="action-disabledHY">
                        {(item.settlementStatus === 'CP') ? '정산완료' : '처리완료'}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="14" style={{ textAlign: 'center', padding: '20px' }}>
                  {loading ? '데이터를 불러오는 중...' : 
                   error ? '데이터를 불러올 수 없습니다.' :
                   userInfo ? 
                    `${userInfo.username}님의 정산 내역이 없습니다.` : 
                    '정산 내역이 없습니다.'
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이징 */}
      {totalPages > 1 && (
        <div className="paginationHY">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0 || loading}
            className="page-btnHY"
          >
            이전
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const startPage = Math.max(0, currentPage - 2);
            const pageNumber = startPage + i;
            
            if (pageNumber >= totalPages) return null;
            
            return (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                disabled={loading}
                className={`page-btnHY ${currentPage === pageNumber ? 'active' : ''}`}
              >
                {pageNumber + 1}
              </button>
            );
          })}
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1 || loading}
            className="page-btnHY"
          >
            다음
          </button>
        </div>
      )}

      {/* 정산 확인 모달 */}
      <SettlementModal
        isOpen={showModal}
        onClose={handleCloseModal}
        settlementInfo={selectedSettlement}
        onConfirmSettlement={handleConfirmSettlement}
      />
    </Layout>
  );
};

export default SettlementManagement;