import React, { useEffect, useState } from 'react';
import './ClassSettlement.css';
import { tokenAtom, userAtom } from './../../atoms';
import { useAtom, useAtomValue } from 'jotai';
import { myAxios } from './../../config';
import dayjs from 'dayjs';

const ClassSettlement = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [token, setToken] = useAtom(tokenAtom);
  const user = useAtomValue(userAtom);
  const [settlementList, setSettlementList] = useState([]);
  const [pageInfo, setPageInfo] = useState([]);
  const [curPage, setCurPage] = useState(1);

  const fetchData = (startDateParam = startDate, endDateParam = endDate, pageParam = curPage) => {
    const params = {
      hostId: user.hostId,
      startDate: startDateParam,
      endDate: endDateParam,
      page: pageParam - 1,
      size: 10,
    };
    token &&
      myAxios(token, setToken)
        .post("/host/settlementList", params)
        .then(res => {
          console.log(res.data)
          setSettlementList(res.data.content);
          setPageInfo(res.data.pageInfo);
          setCurPage(res.data.pageInfo.curPage); // 갱신
        })
        .catch(err => console.log(err));
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchData(startDate, endDate);
    }
  }, [startDate, endDate]);

  const handleDateFilterClick = (label) => {
    const today = new Date();
    let newStart = new Date(today);
    let newEnd = new Date(today);

    switch (label) {
      case '오늘':
        break;
      case '1개월':
        newStart.setMonth(today.getMonth() - 1);
        break;
      case '3개월':
        newStart.setMonth(today.getMonth() - 3);
        break;
      case '6개월':
        newStart.setMonth(today.getMonth() - 6);
        break;
      case '1년':
        newStart.setFullYear(today.getFullYear() - 1);
        break;
      case '전체':
        newStart = '';
        newEnd = '';
        break;
      default:
        break;
    }

    const newStartStr = newStart ? newStart.toISOString().split('T')[0] : '';
    const newEndStr = newEnd ? newEnd.toISOString().split('T')[0] : '';

    setStartDate(newStartStr);
    setEndDate(newEndStr);
    setDateFilter(label);
    fetchData(newStartStr, newEndStr);
  };

  const settleRequest = (settlementId) => {
    token && myAxios(token, setToken).post(`/host/settlementRequest?settlementId=${settlementId}`)
      .then(res => {
        console.log(res);
        alert("정산요청 완료!")
        fetchData();
      })
      .catch(err => {
        console.log(err);
        alert("정산요청 실패!")
      })
  }

  const isSettlementAllowed = (settlementDateStr, settlementStatus) => {
    // 1. RQ이면 무조건 비활성화
    if (settlementStatus === 'RQ') return false;

    // 2. WT인 경우, 정산일이 "오늘보다 7일 이상 전"이면 활성화
    if (settlementStatus === 'WT') {
      const today = dayjs();
      const settlementDate = dayjs(settlementDateStr);

      // 날짜가 '오늘 - 7일'보다 같거나 이전이면 활성화
      return settlementDate.isBefore(today.subtract(7, 'day')) || settlementDate.isSame(today.subtract(7, 'day'), 'day');
    }

    // 그 외는 모두 비활성화
    return false;
  };


  const totalAmount = settlementList
    .filter((s) => s.settlementStatus === 'CP')
    .reduce((acc, cur) => acc + cur.amount, 0);

  return (
    <div className="KHJ-class-settlement-container">
      <div className="KHJ-settlement-search">
        <h3>정산 계획 조회</h3>
        <div className="KHJ-search-row">
          <label>조회기간</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <span>~</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <div className="KHJ-quick-buttons">
            {['오늘', '1개월', '3개월', '6개월', '1년', '전체'].map((label) => (
              <button
                key={label}
                className={dateFilter === label ? 'KHJ-active' : ''}
                onClick={() => handleDateFilterClick(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="KHJ-settlement-result">
        <div className="KHJ-settlement-header">
          {/* <span>총 정산된 금액 : {totalAmount.toLocaleString()}</span> */}
        </div>

        <table className="KHJ-settlement-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>정산 금액</th>
              <th>수수료</th>
              <th>정산예정일</th>
              <th>정산 상태</th>
              <th>정산 요청</th>
            </tr>
          </thead>
          <tbody>
            {settlementList.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.settleAmountToDo}</td>
                <td>10%</td>
                <td>{item.settlementDate}</td>
                <td>
                  {item.settlementStatus === 'WT' ? '정산대기' :
                    item.settlementStatus === 'RQ' ? '정산요청완료' : '정산완료'}
                </td>
                <td>
                  {isSettlementAllowed(item.settlementDate, item.settlementStatus) ? (
                    <button className="KHJ-settle-btn" onClick={() => settleRequest(item.settlementId)}>정산 요청</button>
                  ) : (
                    <button className="KHJ-cancel-btn" disabled>정산 요청</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {settlementList.length === 0 && <div className="KHJ-no-data">조회된 목록이 없습니다.</div>}
        <div className="KHJ-info-msg">
          정산은 매일 00:00시에 진행되며,<br />
          <strong>수업 7일 후에도 정산이 완료되지 않았다면 정산요청 버튼을 눌러주세요!</strong>
        </div>

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
                  <button key="prev" onClick={() => fetchData(currentPage - 1)} className="KHJ-page-button">
                    ◀ 이전
                  </button>
                );
              }

              for (let i = start; i <= end; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => fetchData(i)}
                    className={`KHJ-page-button ${i === currentPage ? 'active' : ''}`}
                  >
                    {i}
                  </button>
                );
              }

              if (currentPage < totalPage) {
                pages.push(
                  <button key="next" onClick={() => fetchData(currentPage + 1)} className="KHJ-page-button">
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

export default ClassSettlement;
