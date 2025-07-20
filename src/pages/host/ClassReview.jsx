import React, { useEffect, useState } from 'react';
import './ClassReview.css';
import { myAxios } from './../../config';
import { useAtom, useAtomValue } from 'jotai';
import { tokenAtom, userAtom } from '../../atoms';
import { useLocation } from 'react-router';

const ClassReview = () => {
  const [searchFilter, setSearchFilter] = useState('클래스명');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [revRegContent, setRevRegContent] = useState('');
  const user = useAtomValue(userAtom);
  const [token, setToken] = useAtom(tokenAtom);
  const [reviews, setReviews] = useState([]);
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [replyStatus, setReplyStatus] = useState('');
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, curPage: 1, allPage: 1 });
  const [currentPage, setCurrentPage] = useState(0);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const calendarParam = params.get("calendarId");

  const fetchReviews = (page = 0) => {
    let statusParam = null;
    if (replyStatus === '답변대기') statusParam = 0;
    else if (replyStatus === '답변완료') statusParam = 1;

    const reqParams = {
      hostId: user.hostId,
      calendarId: calendarParam ? Number(calendarParam) : undefined,
      searchFilter,
      searchQuery,
      startDate,
      endDate,
      replyStatus: statusParam,
      page,
      size: 5,
    };

    token && myAxios(token, setToken).post('/host/review/search', reqParams)
      .then((res) => {
        setReviews(res.data.content);
        setPageInfo(res.data.pageInfo);
        setCurrentPage(page);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchReviews(currentPage);
  }, [token, replyStatus, searchQuery, startDate, endDate]);

  const handleReset = () => {
    setSearchQuery('');
    setSearchFilter('클래스명');
    setStartDate('');
    setEndDate('');
    setReplyStatus('');
    setCurrentPage(0);
    fetchReviews(0);
  };

  const toggleExpand = (index, reviewId) => {
    setExpandedIndex(index === expandedIndex ? null : index);
    setSelectedReviewId(reviewId);
    if (index !== expandedIndex) {
      const review = reviews.find((r) => r.reviewId === reviewId);
      if (review) setRevRegContent(review.revRegContent || '');
    }
  };

  const handleReplyChange = (e) => setRevRegContent(e.target.value);

  const submit = () => {
    if (revRegContent && selectedReviewId) {
      token && myAxios(token, setToken).post('/host/reviewReply', null, {
        params: {
          hostId: user.hostId,
          revRegContent,
          reviewId: selectedReviewId,
        },
      })
        .then(() => {
          alert('답변이 등록되었습니다!');
          setRevRegContent('');
          setExpandedIndex(null);
          fetchReviews(currentPage);
        })
        .catch((err) => console.error(err));
    } else {
      alert('답변 내용과 리뷰 ID를 확인해 주세요.');
    }
  };

  const handleStartDateChange = (e) => {
    const newStart = e.target.value;
    if (endDate && newStart > endDate) {
      alert("시작 날짜는 종료 날짜보다 늦을 수 없습니다.");
      return;
    }
    setStartDate(newStart);
  };

  const handleEndDateChange = (e) => {
    const newEnd = e.target.value;
    if (startDate && newEnd < startDate) {
      alert("종료 날짜는 시작 날짜보다 빠를 수 없습니다.");
      return;
    }
    setEndDate(newEnd);
  };

  const goToPage = (page) => {
    if (page >= 0 && page < pageInfo.allPage) {
      fetchReviews(page);
    }
  };

  return (
    <div className="KHJ-review-class-container">
      <div className="KHJ-review-class-search-area">
        <h3 className="KHJ-review-class-title">리뷰조회</h3>
        <div className="KHJ-review-class-form-row">
          <input type="text" placeholder="검색어를 입력하세요." className='KHJ-review-search' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="KHJ-review-class-form-row">
          <input className="KHJ-review-date" type="date" value={startDate} onChange={handleStartDateChange} />
          <span className="KHJ-review-class-date-separator">~</span>
          <input className="KHJ-review-date" type="date" value={endDate} onChange={handleEndDateChange} />
        </div>
        <div className="KHJ-form-row">
          <div className="KHJ-radio-buttons">
            {['전체', '답변대기', '답변완료'].map(key => (
              <label key={key} className={`KHJ-radio-button ${replyStatus === key ? 'active' : ''}`}>
                <input type="radio" name="replyStatus" value={key} checked={replyStatus === key} onChange={() => setReplyStatus(key)} />
                <span>{key}</span>
              </label>
            ))}
          </div>
          <button className="KHJ-review-class-reset-btn" onClick={handleReset}>초기화</button>
        </div>
      </div>

      <div className="KHJ-review-class-result-area">
        {reviews.length === 0 && (
          <div className="noneDiv"><div className="classNone"><div className="KHJ-no-data">조회된 목록이 없습니다.</div></div></div>
        )}

        {reviews.map((review, index) => (
          <div key={review.reviewId} className="KHJ-review-card">
            <div className="KHJ-review-summary" onClick={() => toggleExpand(index, review.reviewId)}>
              <p><strong>{review.className}</strong> | 수강생: {review.studentName} | 리뷰날짜: {review.reviewDate}</p>
              <span>{review.state === 0 ? '답변대기' : '답변완료'}</span>
            </div>
            <div className="KHJ-review-content-wrapper">
              <div style={{ float: 'left', padding: "0 2px 2px 2px", marginRight: "20px", color: "gray" }}>문의 <span style={{ color: "lightGray" }}>&nbsp;|</span></div>
              <div className="KHJ-review-content"><p>{review.content}</p></div>
            </div>
            {expandedIndex === index && (
              <div className="KHJ-reply-dropdown">
                <div className="KHJ-inquiry-content-wrapper">
                  <div style={{ float: 'left', padding: "2px", marginRight: "20px", color: "gray" }}>답변 <span style={{ color: "lightGray" }}>&nbsp;|</span></div>
                  <form className="KHJ-review-reply-form" onSubmit={(e) => { e.preventDefault(); submit(); }}>
                    <textarea className="KHJ-review-textarea" placeholder={review.revRegCotnent || "답변을 입력하세요"} value={revRegContent} onChange={handleReplyChange} />
                    <button type="submit">{review.state === 0 ? '답변 등록' : '답변 수정'}</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        ))}

        {pageInfo.allPage > 1 && (
          <div className="KHJ-pagination">
            {(() => {
              const totalPage = pageInfo.allPage;
              const currentPage = pageInfo.curPage;
              const maxButtons = 5;
              let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
              let end = start + maxButtons - 1;
              if (end > totalPage) {
                end = totalPage;
                start = Math.max(1, end - maxButtons + 1);
              }
              const pages = [];
              if (currentPage > 1) {
                pages.push(
                  <button key="prev" onClick={() => goToPage(currentPage - 2)} className="KHJ-page-button">◀ 이전</button>
                );
              }
              for (let i = start; i <= end; i++) {
                pages.push(
                  <button key={i} onClick={() => goToPage(i - 1)} className={`KHJ-page-button ${i === currentPage ? 'active' : ''}`}>{i}</button>
                );
              }
              if (currentPage < totalPage) {
                pages.push(
                  <button key="next" onClick={() => goToPage(currentPage)} className="KHJ-page-button">다음 ▶</button>
                );
              }
              return pages;
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassReview;
