import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from "./Footer";
import './NoticeList.css';
import logoImage from "/no-image_1.png";
import { useAtomValue, useSetAtom, useAtom } from "jotai";
import { tokenAtom, userAtom, alarmsAtom } from "../../atoms";
import { myAxios, url } from "../../config";
import { BsPinAngle,BsPinAngleFill } from "react-icons/bs";
export default function NoticeList() {
  const user = useAtomValue(userAtom);
  const navigate = useNavigate();
  const token = useAtomValue(tokenAtom);
  const setUser = useSetAtom(userAtom);
  const setToken = useSetAtom(tokenAtom);
  const [loading, setLoading] = useState(false);
  
  const [noticeList, setNoticeList] = useState([]);
  const [page, setPage] = useState(1);

  // 페이지네이션 관련 상태
  const [pageInfo, setPageInfo] = useState({
    curPage: 1,
    allPage: 1,
    startPage: 1,
    endPage: 1
  }); 

  // 데이터 로딩 함수 - 개선된 버전
  const loadNoticeList = useCallback(async (targetPage = page) => {
    setLoading(true);
    try {
      const requestData = {
        page: targetPage,
      };

      const response = await myAxios().post('/noticeList', requestData);
      const data = response.data;
      
      // 응답 데이터 검증 및 처리
      if (data && typeof data === 'object') {
        // 고정 공지와 일반 공지를 분리하여 정렬
        const notices = data.alarmList || [];
        const pinnedNotices = notices.filter(notice => notice.pinYn);
        const regularNotices = notices.filter(notice => !notice.pinYn);
        
        // 고정 공지를 맨 위에, 일반 공지를 아래에 배치
        const sortedNotices = [...pinnedNotices, ...regularNotices];
        
        setNoticeList(sortedNotices);
        setPageInfo(data.pageInfo || {
          curPage: targetPage,
          allPage: 1,
          startPage: 1,
          endPage: 1
        });
      } else {
        console.warn('예상하지 못한 응답 형태:', data);
        setNoticeList([]);
        setPageInfo({
          curPage: targetPage,
          allPage: 1,
          startPage: 1,
          endPage: 1
        });
      }
      
    } catch (error) {
      console.error('공지사항 로딩 실패:', error);
      
      // 에러 상세 정보 로깅
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
        
        // 401 에러 처리 (토큰 만료)
        if (error.response.status === 401) {
          setToken(null);
          setUser(null);
          navigate('/login');
          return;
        }
      } else if (error.request) {
        console.error('Request error:', error.request);
      } else {
        console.error('Error:', error.message);
      }
      
      setNoticeList([]);
      setPageInfo({
        curPage: targetPage,
        allPage: 1,
        startPage: 1,
        endPage: 1
      });
      
    } finally {
      setLoading(false);
    }
  }, [page, setToken, setUser, navigate]);

  // 페이지 변경 핸들러 - 개선된 버전
  const handlePageChange = useCallback((newPage) => {
    if (newPage === page || loading) return;
    
    setPage(newPage);
    loadNoticeList(newPage);
  }, [page, loading, loadNoticeList]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadNoticeList(1);
  }, []);

  // 공지사항 클릭 핸들러
  const handleNoticeClick = useCallback((noticeId) => {
    navigate(`/notice/${noticeId}`);
  }, [navigate]);

  // 날짜 포맷팅 함수
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }, []);

  // 페이지 번호 배열 생성
  const generatePageNumbers = useCallback(() => {
    const pages = [];
    for (let i = pageInfo.startPage; i <= pageInfo.endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [pageInfo.startPage, pageInfo.endPage]);

  // 고정 공지 표시 함수
  const renderTitle = useCallback((notice) => {
    return (
      <span className={notice.pinYn ? 'NoticeList_pinned_osk' : ''}>
        {notice.pinYn && <span className="NoticeList_pin_icon_osk">[공지] </span>}
        {notice.title || ''}
      </span>
    );
  }, []);

  // 번호 표시 함수 (고정 공지 고려)
  const renderRowNumber = useCallback((notice, index) => {
    if (notice.pinYn) {
      return <BsPinAngleFill />;
    }
    // 일반 공지의 경우 전체 목록에서의 순서를 계산
    const totalItems = pageInfo.allPage > 0 ? 
      ((pageInfo.curPage - 1) * 10) + (index + 1) : index + 1;
    return totalItems;
  }, [pageInfo.allPage, pageInfo.curPage]);

  return (
  <>
      <Header />
    <div className="NoticeList_container_osk">
      
      <main className="NoticeList_main_osk">
        <div className="NoticeList_content_osk">
          <div className="NoticeList_header_section_osk">
            <h1 className="NoticeList_title_osk">공지사항</h1>
            
            {/* 로딩 상태 표시 */}
            {loading && (
              <div className="NoticeList_loading_osk">
                <div className="NoticeList_loading_spinner_osk"></div>
                <span>로딩 중...</span>
              </div>
            )}
          </div>
          
          {/* 공지사항 테이블 */}
          <div className="NoticeList_table_section_osk">
            <div className="NoticeList_table_wrapper_osk">
              <table className="NoticeList_table_osk">
                <thead className="NoticeList_thead_osk">
                  <tr>
                    <th className="NoticeList_th_number_osk">번호</th>
                    <th className="NoticeList_th_title_osk">제목</th>
                    <th className="NoticeList_th_date_osk">작성일</th>
                  </tr>
                </thead>
                <tbody className="NoticeList_tbody_osk">
                  {noticeList.length > 0 ? (
                    noticeList.map((notice, index) => (
                      <tr 
                        key={notice.noticeId} 
                        className={`NoticeList_tr_osk ${notice.pinYn ? 'NoticeList_tr_pinned_osk' : ''}`}
                        onClick={() => handleNoticeClick(notice.noticeId)}
                      >
                        <td className="NoticeList_td_number_osk">
                          {renderRowNumber(notice, notice.noticeId)}
                        </td>
                        <td className="NoticeList_td_title_osk">
                          {renderTitle(notice)} 
                        </td>
                        <td className="NoticeList_td_date_osk">
                          {formatDate(notice.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    !loading && (
                      <tr>
                        <td colSpan="3" className="NoticeList_no_data_osk">
                          등록된 공지사항이 없습니다.
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 페이지네이션 */}
          {pageInfo.allPage > 1 && (
            <div className="NoticeList_pagination_osk">
              {pageInfo.curPage > 1 && (
                <button
                  className="NoticeList_pagination_btn_osk"
                  onClick={() => handlePageChange(pageInfo.curPage - 1)}
                  disabled={loading}
                >
                  〈
                </button>
              )}
              {generatePageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={
                    pageInfo.curPage === pageNum
                      ? "NoticeList_pagination_btn_osk NoticeList_pagination_active_osk"
                      : "NoticeList_pagination_btn_osk"
                  }
                  disabled={loading}
                >
                  {pageNum}
                </button>
              ))}
              {pageInfo.curPage < pageInfo.allPage && (
                <button
                  className="NoticeList_pagination_btn_osk"
                  onClick={() => handlePageChange(pageInfo.curPage + 1)}
                  disabled={loading}
                >
                  〉
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
      
      <Footer />
      </>
  );
}