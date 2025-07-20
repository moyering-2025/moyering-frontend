import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { myAxios } from "/src/config"; 
import Layout from "./Layout";
import './MemberManagement.css';
import { useAtomValue } from 'jotai';
import { tokenAtom } from '../../atoms';

const MemberManagement = () => {
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [memberType, setMemberType] = useState('전체');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [memberData, setMemberData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(20);

  const navigate = useNavigate();
  const token = useAtomValue(tokenAtom);

  const handleSearchClick = () => {
    setHasSearched(true);
    setCurrentPage(0);
    fetchMembers(0); // 첫 페이지부터 조회
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const fetchMembers = async (page = currentPage) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        size: pageSize,
        sort: 'regDate,desc',
      };

      if (searchTerm.trim()) {
        params.keyword = searchTerm.trim();
      }

      if (memberType !== '전체') {
        const typeCode = memberType === '일반' ? 'ROLE_MB' : memberType === '강사' ? 'ROLE_HT' : null;
        if (typeCode) params.userType = typeCode;
      }

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await myAxios(token).get('/api/member', { params });

      if (response.data) {
        const { content, totalPages, totalElements, number } = response.data;
        setMemberData(content || []);
        setTotalPages(totalPages || 0);
        setTotalElements(totalElements || 0);
        setCurrentPage(number || 0);
      }
    } catch (err) {
      console.error('회원 목록 조회 실패:', err);
      setError('회원 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasSearched) {
      fetchMembers();
    }
  }, [currentPage]);

  useEffect(() => {
    if (hasSearched) {
      setCurrentPage(0);
      fetchMembers(0);
    }
  }, [memberType, startDate, endDate]);

  const handleMemberTypeChange = (type) => {
    setMemberType(type);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDateReset = () => {
    setStartDate('');
    setEndDate('');
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const handlePaymentHistory = (member) => {
    navigate('/admin/payment', {
      state: {
        userId: member.userId,
        username: member.username,
        userType: member.userType
      }
    });
  };

  const handleSettlementHistory = (member) => {
    navigate('/admin/settlement', {
      state: {
        userId: member.userId,
        username: member.username,
        userType: member.userType
      }
    });
  };

  return (
    <Layout>
      <div className="page-titleHY">
        <h1>회원 관리</h1>
      </div>
      <br />


      <div className="search-sectionHY">
        <div className="search-boxHY">
          <span className="search-iconHY"></span>
          <input
            type="text"
            placeholder="회원 아이디, 이메일 검색"
            value={searchTerm}
            onChange={handleSearch}
            onKeyDown = {handleKeyDown}
            className="search-inputHY"
            
          />
                            <button
            className="search-btnHY"
            onClick={handleSearchClick}
            type="button"
          >
            검색
          </button>
        </div>
      </div>
      

      {error && <div className="error-messageHY">{error}</div>}
      {loading && <div className="loading-messageHY">데이터를 불러오는 중...</div>}

      {hasSearched && (
        <>
          <div className="result-countHY">
            총 <strong>{memberData.length}</strong>건
          </div>

          <div className="table-containerHY">
            <table className="tableHY">
              <thead>
                <tr>
                  <th>No</th>
                  <th>회원 구분</th>
                  <th>아이디</th>
                  <th>회원명</th>
                  <th>이메일</th>
                  <th>연락처</th>
                  <th>가입일</th>
                  <th>결제내역</th>
                  <th>정산내역</th>
                </tr>
              </thead>
              <tbody>
                {memberData.length > 0 ? (
                  memberData.map((member, index) => (
                    <tr key={member.userId}>
                      <td>{(currentPage * pageSize) + index + 1}</td>
                      <td>
                        <span className={`member-typeHY ${member.userType === '강사' ? 'instructor' : 'general'}`}>
                          {member.userType}
                        </span>
                      </td>
                    
                      <td>{member.username}</td>
                      <td>{member.name}</td>
                      <td>{member.email}</td>
                      <td>{member.tel}</td>
                      <td>{formatDate(member.regDate)}</td>
                      <td>
                        <button
                          className="action-btnHY payment-btnHY"
                          onClick={() => handlePaymentHistory(member)}
                        >
                          결제내역
                        </button>
                      </td>
                      <td>
                        {member.userType === '강사' ? (
                          <button
                            className="action-btnHY settlement-btnHY"
                            onClick={() => handleSettlementHistory(member)}
                          >
                            정산내역
                          </button>
                        ) : (
                          <span className="no-settlement">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="no-dataHY">
                      {loading ? '데이터를 불러오는 중...' : '검색 결과가 없습니다.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="paginationHY">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
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
                    className={`page-btnHY ${currentPage === pageNumber ? 'active' : ''}`}
                  >
                    {pageNumber + 1}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="page-btnHY"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default MemberManagement;
