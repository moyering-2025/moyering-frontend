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
  const [replyOpenIndex, setReplyOpenIndex] = useState(null);
  const [revRegContent, setRevRegContent] = useState(''); // 답변 내용 관리 상태
  const user = useAtomValue(userAtom);
  const [token, setToken] = useAtom(tokenAtom);
  const [reviews, setReviews] = useState([]);
  const [selectedReviewId, setSelectedReviewId] = useState(null); // 선택된 리뷰 ID 상태
  const [replyStatus, setReplyStatus] = useState('');
  const [pageInfo, setPageInfo] = useState([]);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const calendarParam = params.get("calendarId");

  useEffect(() => {
    const params = {
      hostId: user.hostId,
      calendarId: calendarParam ? Number(calendarParam) : undefined,
      page: 0,
      size: 10,
    }

    token && myAxios(token, setToken).post('/host/review/search', params)
      .then((res) => {
        console.log(res.data);
        setReviews(res.data.content);
        setPageInfo(res.data.pageInfo);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [token]);

  const handleSearch = () => {
    const params = {
      hostId: user.hostId,
      searchFilter,
      searchQuery,
      startDate,
      endDate,
      replyStatus, // 추가된 필드
      page: 0,
      size: 10,
    };

    console.log("✅ 전송 데이터 확인:", JSON.stringify(params, null, 2));

    token && myAxios(token, setToken).post('/host/review/search', params)
      .then((res) => {
        console.log(res.data.content);
        setReviews(res.data.content);
        setPageInfo(res.data.pageInfo)
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleReset = () => {
    setSearchQuery('');
    setSearchFilter('클래스명');
    setStartDate('');
    setEndDate('');
  };

  const toggleExpand = (index) => {
    setExpandedIndex(index === expandedIndex ? null : index);
  };

  // 답변하기 버튼 클릭 시, 선택된 리뷰 ID를 상태에 저장
  const toggleReply = (index, reviewId) => {
    setReplyOpenIndex(replyOpenIndex === index ? null : index);
    setSelectedReviewId(reviewId); // 리뷰 ID 저장

    setTimeout(() => {
      setExpandedIndex(replyOpenIndex === index ? null : index);
    }, 400);
  };

  const handleReplyChange = (e) => {
    setRevRegContent(e.target.value); // 단일 문자열로 답변 내용 변경
  };

  const handleReplySubmit = (index) => {
    alert(`답변 저장됨: ${revRegContent}`);
    setRevRegContent(''); // 답변 제출 후, 상태 초기화
    setReplyOpenIndex(null);
  };

  useEffect(() => {
    handleSearch();
  }, [replyStatus, searchQuery, startDate, endDate])

  // 제출 시 선택된 리뷰 ID를 함께 보내기
  const submit = () => {
    if (revRegContent && selectedReviewId) {
      token && myAxios(token, setToken).post('/host/reviewReply', null, {
        params: {
          hostId: user.hostId,
          revRegContent: revRegContent, // 답변 내용
          reviewId: selectedReviewId, // 리뷰 ID
        },
      })
        .then((res) => {
          console.log(res.data);
          alert('답변이 저장되었습니다!');
          setRevRegContent(''); // 답변 입력 필드 초기화
          setReplyOpenIndex(null); // 폼 닫기

          return token && myAxios(token, setToken).get("/host/review", {
            params: { hostId: user.hostId },
          });
        })
        .then((res) => {
          setReviews(res.data); // 리뷰 업데이트
          setExpandedIndex(null); // 테이블 유지
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      alert('답변 내용과 리뷰 ID를 확인해 주세요.');
    }
  };

  return (
    <div className="KHJ-review-class-container">
      <div className="KHJ-review-class-search-area">
        <h3 className="KHJ-review-class-title">리뷰조회</h3>

        <div className="KHJ-review-class-form-row">
          <label className="KHJ-review-class-label">검색어</label>
          {/* <select value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)}>
            <option value="클래스명">클래스명</option>
            <option value="학생명">학생명</option>
          </select> */}
          <input
            type="text"
            placeholder="검색어를 입력하세요."
            className='KHJ-review-search'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {/* <button className="KHJ-review-class-search-btn" onClick={handleSearch}>검색</button> */}
          <button className="KHJ-review-class-reset-btn" onClick={handleReset}>초기화</button>
        </div>

        <div className="KHJ-review-class-form-row">
          <label className="KHJ-review-class-label">날짜</label>
          <input className="KHJ-review-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <span className="KHJ-review-class-date-separator">~</span>
          <input className="KHJ-review-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="KHJ-form-row">
          <label>답변 상태</label>
          <label>
            <input
              type="radio"
              name="status"
              value=""
              checked={replyStatus === ''}
              onChange={() => setReplyStatus('')}
            />
            전체
          </label>
          <label>
            <input
              type="radio"
              name="status"
              value="답변대기"
              checked={replyStatus === '답변대기'}
              onChange={() => setReplyStatus('답변대기')}
            />
            답변대기
          </label>
          <label>
            <input
              type="radio"
              name="status"
              value="답변완료"
              checked={replyStatus === '답변완료'}
              onChange={() => setReplyStatus('답변완료')}
            />
            답변완료
          </label>
        </div>
      </div>

      <div className="KHJ-review-class-result-area">
        <h4 className="KHJ-review-class-subtitle">검색 결과 : {reviews.length}건</h4>
        <table className="KHJ-review-class-table">
          <thead>
            <tr>
              <th>No</th>
              <th>클래스명</th>
              <th>회원이름</th>
              <th>리뷰날짜</th>
              <th>리뷰댓글상태</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review, index) => (
              <React.Fragment key={review.reviewId}>
                <tr className="KHJ-review-class-summary" onClick={() => toggleExpand(index)}>
                  <td>{index + 1}</td>
                  <td>{review.className}</td>
                  <td>{review.studentName}</td>
                  <td>{review.reviewDate}</td>
                  {review.state === 0 ? <td>답변대기</td> : <td>답변완료</td>}
                </tr>
                <tr>
                  <td colSpan="5" className="KHJ-review-class-detail-cell">
                    <div className={`KHJ-review-class-detail ${expandedIndex === index ? 'open' : ''}`}>
                      <div className="KHJ-review-class-content-wrapper">
                        <div className="KHJ-review-content">{review.content}</div>
                          <form className="KHJ-review-class-reply-form" onSubmit={(e) => {
                            e.preventDefault();
                            submit();
                          }}>
                            <textarea
                              placeholder={review.revRegContent || '답변을 입력하세요'}
                              className='KHJ-review-textarea'
                              value={revRegContent}
                              onChange={handleReplyChange}
                            />
                            <button type="submit">{review.state === 0 ? '답변 저장' : '답변 수정'}</button>
                          </form>
                      </div>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
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
                  <button key="prev" onClick={() => fetchClassList(currentPage - 1)} className="KHJ-page-button">
                    ◀ 이전
                  </button>
                );
              }

              for (let i = start; i <= end; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => fetchClassList(i)}
                    className={`KHJ-page-button ${i === currentPage ? 'active' : ''}`}
                  >
                    {i}
                  </button>
                );
              }

              if (currentPage < totalPage) {
                pages.push(
                  <button key="next" onClick={() => fetchClassList(currentPage + 1)} className="KHJ-page-button">
                    다음 ▶
                  </button>
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
