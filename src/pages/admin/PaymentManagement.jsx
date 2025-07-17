// src/components/pages/PaymentManagement.jsx

import React, { useState, useEffect } from 'react';
import Layout from "./Layout";
import './PaymentManagement.css';
import { myAxios } from '../../config';
import { useAtomValue } from 'jotai';
import { tokenAtom } from '../../atoms';
import { useLocation } from 'react-router-dom';

const PaymentManagement = () => {
  const token = useAtomValue(tokenAtom);
  const location = useLocation();
  const userInfo = location.state; // MemberManagement에서 전달받은 사용자 정보
  const pageSize = 20;
  
  // 상태 관리
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); 
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // 사용자 정보가 있으면 검색어를 자동으로 설정
  useEffect(() => {
    if (userInfo && userInfo.username) {
      setSearchTerm(userInfo.username);
      setDebouncedSearchTerm(userInfo.username); // 이것도 같이 설정해야 함
    }
  }, [userInfo]);

  // 디바운싱: 검색어 입력 후 500ms 대기
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(0); // 새로운 검색시 첫 페이지로
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 데이터 로딩 - debouncedSearchTerm 사용
  useEffect(() => {
    const fetchPayments = async () => {
      // AdminPaymentSearchCond에 맞게 파라미터 구성
      const params = {
        page: currentPage,
        size: 20,
        keyword: debouncedSearchTerm || undefined, // debouncedSearchTerm 사용!
        status: statusFilter || undefined,
        fromDate: startDate || undefined,
        toDate: endDate || undefined,
      };

      // // 특정 사용자의 결제 내역을 조회하는 경우 userId 추가
     
      try {
        const response = await myAxios(token).get('/api/payment', { params });
        const data = response.data;
        setPayments(data.content || []);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
      } catch (error) {
        console.error("결제 목록 조회 실패:", error);
        setPayments([]);
        setTotalPages(1);
        setTotalElements(0);
      }
    };

    fetchPayments();
  }, [token, debouncedSearchTerm, statusFilter, startDate, endDate, currentPage, userInfo]);
  // ↑ searchTerm이 아니라 debouncedSearchTerm을 의존성으로 사용

  const formatAmount = (amount) => {
    return amount != null ? amount.toLocaleString('ko-KR') : '0';
  };

  const getStatusClass = (status) => {
    const statusMap = {
      '결제완료': 'status-completed',
      '취소됨': 'status-canceled'
    };
    return statusMap[status] || '';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleStatusChange = (status) => setStatusFilter(status === '전체' ? '' : status);

  const handleExcelDownload = () => alert('엑셀 파일을 다운로드합니다.');
  
  // 페이지네이션 - 페이지 번호 배열 생성 (공지사항 관리와 동일)
  const getPageNumbers = () => {
    const currentPageNum = currentPage;
    const maxVisible = 5;
    
    let start = Math.max(0, currentPageNum - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages - 1, start + maxVisible - 1);
    
    // 끝에서부터 계산해서 start 조정
    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }
    
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // 페이지 변경
  const changePage = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <Layout>
      <div className="page-titleHY">
        <h1>
          {userInfo ? `${userInfo.username}님의 결제 내역` : '결제 관리'}
        </h1>
        {userInfo && (
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
            회원 구분: {userInfo.userType}
          </div>
        )}
      </div>
      
      <div className="search-sectionHY">
        <div className="search-boxHY">
          <input
            type="text"
            placeholder="주문번호, 클래스명, 수강생 ID 검색"
            value={searchTerm}
            onChange={handleSearch}
            className="search-inputHY"
          />
        </div>
        <div className="date-filter-group">
          <label className="date-labelHY">결제 기간</label>
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
        </div>
      </div>

      {/* 필터와 엑셀 다운로드 */}
      <div className="filter-and-action-sectionHY">
        <div className="filter-sectionHY">
          {['전체', '결제완료', '취소됨'].map(status => (
            <button
              key={status}
              className={`filter-btnHY ${statusFilter === (status === '전체' ? '' : status) ? 'active' : ''}`}
              onClick={() => handleStatusChange(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
      
      총 <strong>{totalElements}</strong>건
    
      <div className="table-wrapperHY">
        <table className="tableHY">
          <thead>
            <tr>
              <th>No</th>
              <th style={{ width: '80px' }}>결제번호</th>
              <th style={{ width: '150px' }}>주문번호</th>
              <th style={{ width: '100px' }}>수강생 ID</th>
              <th style={{ width: '300px' }}>클래스명</th>
              <th style={{ width: '80px' }}>클래스금액</th>
              <th style={{ width: '50px' }}>쿠폰 유형</th>
              <th style={{width: '50px'}}>할인 유형</th>
              <th style={{width: '80px'}}>할인금액/비율</th>
              <th style={{width: '80px'}}>총 결제 금액</th>
              <th style={{width: '70px'}}>결제 유형</th>
              <th style={{width: '80px'}}>결제 상태</th>
              <th style={{width: '130px'}}>결제일시</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p, idx) => (
              <tr key={p.paymentId}>
                <td>{(currentPage * pageSize) + idx + 1}</td>
                <td>{p.paymentId}</td>
                <td>{p.orderNo}</td>
                <td>{p.studentId}</td>
                <td className='classNameHy'>{p.className}</td>
                <td>{formatAmount(p.classAmount)}원</td>
                <td>{p.couponType || '-'}</td>
                <td>{p.discountType || '-'}</td>
                <td>
                  {p.calculatedDiscountAmount != null ? `${formatAmount(p.calculatedDiscountAmount)}원` : '-'}
                  {p.discountType === 'RT' && p.discountAmount != null ? ` (${p.discountAmount}%)` : ''}
                </td>
                <td>{formatAmount(p.totalAmount)}원</td>
                <td>{p.paymentType}</td>
                <td><span className={`status-badge ${getStatusClass(p.status)}`}>{p.status}</span></td>
                <td>{formatDate(p.payDate)}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan="12" style={{ textAlign: 'center', padding: '20px' }}>결제 내역이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 - 공지사항 관리와 동일한 스타일 */}
      <div className="paginationHY">
        <button 
          className="page-btnHY prev"
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 0}
        >
          이전
        </button>
        <span className="page-numbersHY">
          {getPageNumbers().map(num => (
            <button 
              key={num}
              className={`page-btnHY ${num === currentPage ? 'activeHY' : ''}`}
              onClick={() => changePage(num)}
            >
              {num + 1}
            </button>
          ))}
        </span>
        <button 
          className="page-btnHY next"
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
        >
          다음
        </button>
      </div>
    </Layout>
  );
};

export default PaymentManagement;