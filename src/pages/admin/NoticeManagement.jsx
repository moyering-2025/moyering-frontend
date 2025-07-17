import React, { useState, useEffect } from 'react';
import {url} from "/src/config";
import { BsPinAngleFill } from "react-icons/bs";
import axios from "axios"; 
import Layout from "./Layout";
import { useNavigate } from 'react-router-dom';
import './NoticeManagement.css';

// 공지사항 관리
export default function NoticeList() {
  const navigate = useNavigate();
  const [noticeList, setNoticeList] = useState([]); // 공지사항 목록 
  const [pageInfo, setPageInfo] = useState({
    number: 0,
    totalPages: 1,
    totalElements: 0,
    size: 20,
    first: true,
    last: true
  }); // Spring Boot Pageable 형식
  const [search, setSearch] = useState({ // 검색 정보 
    page: 0, // Spring은 0부터 시작 
    keyword: ''
  });
  const [loading, setLoading] = useState(false); // 로딩 상태

  // UI 상태 관리
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' }); // 작성일 기준 내림차순 

  // 컴포넌트 마운트시 게시글 목록 로드
  // search.page : 페이지 이동할 때 새 데이터 로드, search.keyword : 검색어 변경할 때 새 데이터 로드 
  useEffect(() => { // 렌더링 될 때마다 실행 
    loadNoticeList();
  }, [search.page, search.keyword]);

  // 게시글 목록 API 호출
  const loadNoticeList = async () => {
    setLoading(true);
    try { 
      const params = {
        page: search.page,
        size: 20,
        sort: 'createdAt,desc'
      };
      
      // 검색어가 있을 때만 keyword 파라미터 추가
      if (search.keyword && search.keyword.trim()) {
        params.keyword = search.keyword.trim();
      }

      const response = await axios.get(`${url}/api/notice`, { params }); 
      
      setNoticeList(response.data.content || []);
      setPageInfo({
        number: response.data.number || 0,
        totalPages: response.data.totalPages || 1,
        totalElements: response.data.totalElements || 0,
        size: response.data.size || 10,
        first: response.data.first || true,
        last: response.data.last || true
      });
    } catch (error) {
      console.error('공지사항 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 검색어 변경 (디바운스 적용을 위해 useEffect 사용)
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch({...search, keyword: value, page: 0}); // 검색어 변경시 첫 페이지로
  };

  // 페이지 변경 (새로운 페이지 클릭하면 페이지 변경)
  const changePage = (newPage) => {
    if (newPage >= 0 && newPage < pageInfo.totalPages) {
      setSearch({...search, page: newPage});
    }
  };

  // 공지사항 등록 API
  const createNotice = async (noticeData) => {
    try {
      const response = await axios.post(`${url}/api/notice`, {
        title: noticeData.title,
        content: noticeData.content,
        pinYn: noticeData.pinYn || false,
        isHidden: false
      });
      
      if (response.status === 201) {
        loadNoticeList(); // 목록 새로고침
        return response.data;
      }
    } catch (error) {
      console.error('공지사항 등록 실패:', error);
      throw error;
    }
  };

  // 공지사항 수정 API
  const updateNotice = async (noticeId, noticeData) => {
    try {
      const response = await axios.put(`${url}/api/notice/${noticeId}`, {
        title: noticeData.title,
        content: noticeData.content,
        pinYn: noticeData.pinYn
      });
      
      if (response.status === 200) {
        loadNoticeList(); // 목록 새로고침
        return response.data;
      }
    } catch (error) {
      console.error('공지사항 수정 실패:', error);
      throw error;
    }
  };

  // 공지사항 삭제 API
  const deleteNotice = async (noticeId) => {
    if (!window.confirm('정말로 삭제하시겠습니까?')) return;
    
    try {
      const response = await axios.delete(`${url}/api/notice/${noticeId}`);
      
      if (response.status === 204 || response.status === 200) {
        loadNoticeList(); // 목록 새로고침
      }
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
    }
  };

  // 핀 상태 변경 API (메인화면 고정/해제)
  const togglePinStatus = async (noticeId, currentPinYn) => {
    try {
      const newPinYn = !currentPinYn;
      const response = await axios.patch(
        `${url}/api/notice/${noticeId}/pin?pinYn=${newPinYn}`
      );
      
      if (response.status === 200) {
        loadNoticeList(); // 목록 새로고침
      }
    } catch (error) {
      console.error('핀 상태 변경 실패:', error);
    }
  };

  // 새 공지사항 등록 페이지로 이동
  const handleNewNotice = () => {
    navigate('/admin/notice/create');
  };

  // 공지사항 수정 페이지로 이동
  const handleEditNotice = (noticeId) => {
    navigate(`/admin/notice/edit/${noticeId}`);
  };

  // 내용 100자 제한 함수
  const truncateContent = (content, maxLength = 100) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  // 정렬 함수 (클라이언트 사이드 정렬)
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 정렬된 공지사항 목록
  const sortedNoticeList = React.useMemo(() => {
    const sorted = [...noticeList].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // 날짜의 경우 Date 객체로 변환
      if (sortConfig.key === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    // 핀 고정된 항목을 맨 위로
    const pinnedItems = sorted.filter(notice => notice.pinYn === true);
    const unpinnedItems = sorted.filter(notice => notice.pinYn !== true);
    
    return [...pinnedItems, ...unpinnedItems];
  }, [noticeList, sortConfig]);

  const hideNotice = async (noticeId) => {
    console.log('=== 숨기기 시작 ===');
    console.log('요청 noticeId:', noticeId);
    
    try {
      const response = await axios.patch(`${url}/api/notice/${noticeId}/hide`);
      
      console.log('=== 서버 응답 ===');
      console.log('응답 상태:', response.status);
      console.log('응답 데이터:', response.data);
      console.log('응답 데이터 타입:', typeof response.data);
      
      if (response.status === 200) {
        if (response.data) {
          setNoticeList(prevList => {
            const newList = prevList.map(notice => {
              if (notice.noticeId === noticeId) {
                return response.data;
              }
              return notice;
            });
            return newList;
          });
        } else {
          await loadNoticeList();
        }
      }
    } catch (error) {
      console.error("숨기기에 실패했습니다.", error);
    }
  };

  const showNotice = async (noticeId) => {  
    try {
      const response = await axios.patch(`${url}/api/notice/${noticeId}/show`);    
      if (response.status === 200) {
        if (response.data) {
          console.log('=== 상태 업데이트 시작 ===');
          console.log('업데이트할 데이터:', response.data);
          console.log('업데이트할 데이터의 isHidden:', response.data.isHidden);
          
          setNoticeList(prevList => {
            const newList = prevList.map(notice => {
              if (notice.noticeId === noticeId) {
                return response.data;
              }
              return notice;
            });
            return newList;
          });
        } else {
          console.log('=== 응답 데이터가 없어서 전체 새로고침 ===');
          await loadNoticeList();
        }
      }
    } catch (error) {
      console.error("보이기 실패:", error);
    }
    
    console.log('=== 보이기 끝 ===');
  };

  // 페이지 번호 배열 생성 (최대 5개 페이지 번호 표시)
  const getPageNumbers = () => {
    const currentPage = pageInfo.number;
    const totalPages = pageInfo.totalPages;
    const maxVisible = 5;
    
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
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

  return (
    <Layout>
      {/* 페이지 제목 */}
      <div className="page-titleHY">
        <h1>공지사항 관리</h1>
      </div>
      <br />

      {/* 검색 영역 */}
      <div className="search-sectionHY">
        <div className="search-boxHY">
          <input
            type="text"
            placeholder="제목, 내용으로 검색"
            value={search.keyword}
            onChange={handleSearchChange}
            className="search-inputHY"
          />
        </div>
        <div className="right-alignHY">
          <button className="btn-primary new-notice-btnHY" onClick={handleNewNotice}>
            + 새 공지사항
          </button>
        </div>
      </div>
      
      {/* 검색 결과 수 */}
      <div className="mb-4">
        총 <strong>{pageInfo.totalElements}</strong>건
      </div>

      {/* 공지사항 테이블 */}
      <div className="table-containerHY">
        <table className="tableHY">
          <thead>
            <tr>
              <th>번호</th>
              <th 
                className="sortableHY"
                onClick={() => handleSort('createdAt')}
              >
                작성일
                {sortConfig.key === 'createdAt' && (
                  <span className="sort-indicatorHY">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th>제목</th>
              <th>내용</th>
              <th>게시</th>
              <th>고정</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {sortedNoticeList.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data-messageHY">
                  {loading ? '로딩 중...' : '등록된 공지사항이 없습니다.'}
                </td>
              </tr>
            ) : (
              sortedNoticeList.map((notice, index) => (
                <tr key={notice.noticeId} className={notice.pinYn ? 'pinned-row' : ''}>
                  <td>
                    {notice.pinYn && (
                      <span className="pin-iconHY">
                        <BsPinAngleFill 
                          style={{ 
                            color: '#dc2626', 
                            fill: '#dc2626',
                            fontSize: '16px'
                          }} 
                        />
                      </span>
                    )}
                    {pageInfo.number * pageInfo.size + index + 1}
                  </td>
                  <td>{formatDate(notice.createdAt)}</td>
                  <td>{notice.title}</td>
                  <td className="content-cellHY">
                    {truncateContent(notice.content)}
                  </td>
                  <td>
                    {notice.isHidden ? (
                      // 숨김 상태일 때는 "보이기" 버튼
                      <button 
                        className="notice-publish-btnHY unpublished"
                        onClick={() => showNotice(notice.noticeId)}
                      >
                        보이기
                      </button>
                    ) : (
                      // 보임 상태일 때는 "숨기기" 버튼
                      <button   
                        className="notice-publish-btnHY published"
                        onClick={() => hideNotice(notice.noticeId)}
                      >
                        숨기기
                      </button>
                    )}
                  </td>
                  <td>
                    <button 
                      className={`pin-btn ${notice.pinYn ? 'pinned' : 'unpinned'}`}
                      onClick={() => togglePinStatus(notice.noticeId, notice.pinYn)}
                      title={notice.pinYn ? '핀 해제' : '상단 고정'}
                    >
                      <BsPinAngleFill />
                    </button>
                  </td>
                  <td>
                    <div className="action-buttonsHY">
                      <button 
                        className="btn-editHY"
                        onClick={() => handleEditNotice(notice.noticeId)}
                      >
                        수정
                      </button>
                      <button 
                        className="btn-deleteHY"
                        onClick={() => deleteNotice(notice.noticeId)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="paginationHY">
        <button 
          className="page-btnHY prev"
          onClick={() => changePage(pageInfo.number - 1)}
          disabled={pageInfo.first}
        >
          이전
        </button>
        <span className="page-numbersHY">
          {getPageNumbers().map(num => (
            <button 
              key={num}
              className={`page-btnHY ${num === pageInfo.number ? 'activeHY' : ''}`}
              onClick={() => changePage(num)}
            >
              {num + 1}
            </button>
          ))}
        </span>
        <button 
          className="page-btnHY next"
          onClick={() => changePage(pageInfo.number + 1)}
          disabled={pageInfo.last}
        >
          다음
        </button>
      </div>
    </Layout>
  );
};