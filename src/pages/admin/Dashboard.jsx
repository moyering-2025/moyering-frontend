import React, { useEffect, useState } from 'react';
import Layout from "./Layout";
import './Dashboard.css';
import { myAxios } from './../../config';
import { tokenAtom } from '../../atoms';
import { useAtom } from 'jotai';

const Dashboard = () => {
  // 차트 기간 상태 관리
  const [mainChartPeriod, setMainChartPeriod] = useState('월별');
  const [trendChartPeriod, setTrendChartPeriod] = useState('월별');
  const [token, setToken] = useAtom(tokenAtom);
  const [userList, setUserList] = useState('');
  const [thisMonthMember, setThisMonthMember] = useState('');
  const [visitorLogCount, setVisitorLogCount] = useState('');
  const [currentDateVisitCount, setCurrentDateVisitCount] = useState('');
  const [allSettle, setAllSettle] = useState('');
  const [thisMonthSettle, setThisMonthSettle] = useState('');
  const [visitsByMonth, setVisitsByMonth] = useState([]);
  const [visitsByQuarter, setVisitsByQuarter] = useState([]);
  const [visitsByYear, setVisitsByYear] = useState([]);
  const [todayCalendarCount, setTodayCalendarCount] = useState('');
  const [todaySignClass, setTodaySignClass] = useState('');
  const [todaySettle, setTodaySettle] = useState('');
  const [mainChartData, setMainChartData] = useState({
    '월별': [],
    '분기별': [],
    '년도별': []
  })



  useEffect(() => {
    token && myAxios(token, setToken).get("/api/dashBoard")
      .then(res => {
        console.log(res);
        setUserList(res.data.userList);
        setThisMonthMember(res.data.thisMonthMemberCount);
        setVisitorLogCount(res.data.visitorLogCount);
        setCurrentDateVisitCount(res.data.currentDateVisitCount);
        setAllSettle(res.data.allSettle);
        setThisMonthSettle(res.data.thisMonthSettle);
        setVisitsByMonth(res.data.visitsByMonth);
        setVisitsByQuarter(res.data.visitsByQuarter);
        setVisitsByYear(res.data.visitsByYear);
        setTodayCalendarCount(res.data.todayCalendarCount);
        setTodaySignClass(res.data.todaySignClass);
        setTodaySettle(res.data.todaySettle);
        setMainChartData(prev => ({
          ...prev,
          '월별': res.data.monthlyStats,
          '분기별': res.data.resultQuater,
          '년도별': res.data.resultYear,
        }))
      })
      .catch(err => {
        console.log(err);
      })
  }, [token])

  // '월별': Object.entries(openClass).map(([key,value])=>({
  //       label:String(key).padStart(2,'0')+'월',
  //       value:value
  //     })),


  // 메인 차트 데이터 (기간별)
  //class - 월별 생성 클래스 수 student - 총클래스수 - 확정되지않은클래스 수(검수,폐강,반려(거절)을 제외한 수)   rate - 
  // const mainChartData = {
  //   '월별': [
  //     { label: '01월', class: 900, student: 750, rate: 83 },
  //     { label: '02월', class: 950, student: 800, rate: 84 },
  //     { label: '03월', class: 1100, student: 900, rate: 82 },
  //     { label: '04월', class: 1200, student: 1000, rate: 83 },
  //     { label: '05월', class: 1300, student: 1100, rate: 85 },
  //     { label: '06월', class: 1350, student: 1150, rate: 85 },
  //     { label: '07월', class: 1400, student: 1200, rate: 86 },
  //     { label: '08월', class: 1500, student: 1300, rate: 87 },
  //     { label: '09월', class: 1600, student: 1400, rate: 88 },
  //     { label: '10월', class: 1700, student: 1500, rate: 88 },
  //     { label: '11월', class: 1750, student: 1550, rate: 89 },
  //     { label: '12월', class: 1800, student: 1600, rate: 89 }
  //   ],
  //   '분기별': [
  //     { label: '1분기', class: 3000, student: 2500, rate: 83 },
  //     { label: '2분기', class: 3800, student: 3200, rate: 84 },
  //     { label: '3분기', class: 4500, student: 3900, rate: 87 },
  //     { label: '4분기', class: 5300, student: 4650, rate: 88 }
  //   ],
  //   '년도별': [
  //     { label: '2020년', class: 12000, student: 10000, rate: 83 },
  //     { label: '2021년', class: 14000, student: 12000, rate: 86 },
  //     { label: '2022년', class: 16000, student: 14000, rate: 88 },
  //     { label: '2023년', class: 18000, student: 16000, rate: 89 },
  //     { label: '2024년', class: 20000, student: 18000, rate: 90 }
  //   ]
  // };



  // 트렌드 차트 데이터 (기간별)
  const trendData = {
    '월별': Object.entries(visitsByMonth).map(([key, value]) => ({
      label: String(key).padStart(2, '0') + '월',
      value: value
    })),
    '분기별': Object.entries(visitsByQuarter).map(([key, value]) => ({
      label: String(key).padStart(2, '0') + '분기',
      value: value
    })),
    '년도별': Object.entries(visitsByYear).map(([key, value]) => ({
      label: String(key) + '년',
      value: value
    }))
  };

  // 현재 차트 데이터 가져오기
  const currentMainData = mainChartData[mainChartPeriod];
  const currentTrendData = trendData[trendChartPeriod];

  // 최대값 계산 (차트 스케일링용)
  const maxClass = Math.max(...currentMainData.map(d => d.class));
  const maxStudent = Math.max(...currentMainData.map(d => d.student));
  const maxTrend = Math.max(...currentTrendData.map(d => d.value));

  // 높이 계산 함수
  const getBarHeight = (value, max) => `${(value / max) * 80 + 10}%`;
  const getTrendHeight = (value, max) => 120 - (value / max) * 100;

  // SVG 라인 포인트 생성
  const generateLinePoints = (data, max, isRate = false) => {
    const width = 400;
    const stepX = width / (data.length - 1);

    return data.map((item, index) => {
      const x = index * stepX + 20;
      const value = isRate ? item.rate : item.student;
      const y = isRate ?
        120 - (value / 100) * 80 : // 비율은 0-100 기준
        120 - (value / max) * 80;
      return `${x},${y}`;
    }).join(' ');
  };

  // 좌표 계산 함수들
  const getXCoord = (index, total, width = 400, margin = 20) => {
    return (index * width / (total - 1)) + margin;
  };

  const getYCoordForValue = (value, max, baseHeight = 120, height = 80) => {
    return baseHeight - ((value / max) * height);
  };

  const getYCoordForRate = (rate, baseHeight = 120, height = 80) => {
    return baseHeight - ((rate / 100) * height);
  };


  return (
    <Layout>
      <div className="page-titleHY">
        <h1>대시보드</h1>
      </div>

      {/* 상단 통계 카드들 */}
      <div className="stats-gridHY">
        <div className="stat-cardHY">
          <div className="stat-iconHY">👥</div>
          <div className="stat-contentHY">
            <div className="stat-labelHY">총 회원 수</div>
            <div className="stat-valueHY">{userList}</div>
            <div className="stat-changeHY positive">+{thisMonthMember}</div>
          </div>
        </div>

        <div className="stat-cardHY">
          <div className="stat-iconHY">👥</div>
          <div className="stat-contentHY">
            <div className="stat-labelHY">총 방문자 수</div>
            <div className="stat-valueHY">{visitorLogCount}</div>
            <div className="stat-changeHY positive">+{currentDateVisitCount}</div>
          </div>
        </div>

        <div className="stat-cardHY">
          <div className="stat-iconHY">💰</div>
          <div className="stat-contentHY">
            <div className="stat-labelHY">총 매출</div>
            <div className="stat-valueHY">{allSettle}</div>
            <div className="stat-changeHY positive">+{thisMonthSettle}</div>
          </div>
        </div>

        <div className="stat-cardHY">
          <div className="stat-iconHY">👁️</div>
          <div className="stat-contentHY">
            <div className="stat-labelHY">OPEN 클래스</div>
            <div className="stat-valueHY">{todayCalendarCount}</div>
          </div>
        </div>

        {/* <div className="stat-cardHY">
          <div className="stat-iconHY">👁️</div>
          <div className="stat-contentHY">
            <div className="stat-labelHY">강사 신청 건</div>
            <div className="stat-valueHY blue">10</div>
          </div>
        </div> */}

        <div className="stat-cardHY">
          <div className="stat-iconHY">👁️</div>
          <div className="stat-contentHY">
            <div className="stat-labelHY">클래스 신청 건</div>
            <div className="stat-valueHY blue">{todaySignClass}</div>
          </div>
        </div>

        <div className="stat-cardHY">
          <div className="stat-iconHY">📊</div>
          <div className="stat-contentHY">
            <div className="stat-labelHY">정산 요청 건</div>
            <div className="stat-valueHY blue">{todaySettle}</div>
          </div>
        </div>

        {/* <div className="stat-cardHY">
          <div className="stat-iconHY">👥</div>
          <div className="stat-contentHY">
            <div className="stat-labelHY">신고 건</div>
            <div className="stat-valueHY blue">3</div>
          </div>
        </div> */}
      </div>

      {/* 메인 차트 - 동적 데이터 */}
      <div className="main-chart-sectionHY">
        <div className="chart-containerHY">
          <div className="chart-headerHY">
            <h2 className="chart-titleHY">클래스 개설 추이</h2>
            <div className="chart-controlsHY">
              <button
                className={`chart-btnHY ${mainChartPeriod === '월별' ? 'active' : ''}`}
                onClick={() => setMainChartPeriod('월별')}
              >
                월별
              </button>
              <button
                className={`chart-btnHY ${mainChartPeriod === '분기별' ? 'active' : ''}`}
                onClick={() => setMainChartPeriod('분기별')}
              >
                분기별
              </button>
              <button
                className={`chart-btnHY ${mainChartPeriod === '년도별' ? 'active' : ''}`}
                onClick={() => setMainChartPeriod('년도별')}
              >
                년도별
              </button>
            </div>
          </div>

          <div className="chart-contentHY">
            <div className="chart-y-axisHY">
              <span>{Math.round(maxClass * 1.0)}</span>
              <span>{Math.round(maxClass * 0.75)}</span>
              <span>{Math.round(maxClass * 0.5)}</span>
              <span>{Math.round(maxClass * 0.25)}</span>
              <span>0</span>
            </div>

            <div className="chart-areaHY">
              <div className="bar-chartHY">
                {currentMainData.map((data, index) => (
                  <div key={index} className="month-groupHY">
                    <div className="barsHY">
                      <div
                        className="barHY orange"
                        style={{ height: getBarHeight(data.class, maxClass) }}
                        title={`클래스: ${data.class.toLocaleString()}`}
                      ></div>
                      <div
                        className="barHY yellow"
                        style={{ height: getBarHeight(data.student, maxClass) }}
                        title={`학생: ${data.student.toLocaleString()}`}
                      ></div>
                    </div>
                    <span className="month-labelHY">{data.label}</span>
                  </div>
                ))}
              </div>

        
            </div>

            <div className="chart-y-axis-rightHY">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>
          </div>

          <div className="chart-legendHY">
            <div className="legend-itemHY">
              <span className="legend-color orange-bgHY"></span>
              <span className="legend-textHY">클래스 수</span>
            </div>
            <div className="legend-itemHY">
              <span className="legend-color green-lineHY"></span>
              <span className="legend-textHY">학정 수</span>
            </div>
            <div className="legend-itemHY">
              <span className="legend-color red-lineHY"></span>
              <span className="legend-textHY">학정율 (%)</span>
            </div>
          </div>

          <div className="chart-stats-boxHY">
            <div className="stats-rowHY">
              <span className="stat-dot orangeHY"></span>
              <span>클래스 수: {currentMainData[currentMainData.length - 1]?.class.toLocaleString?.() || 0}</span>
            </div>
            <div className="stats-rowHY">
              <span className="stat-dot greenHY"></span>
              <span>확정 수: {currentMainData[currentMainData.length - 1]?.student.toLocaleString()}</span>
            </div>
            <div className="stats-rowHY">
              <span>학정율 (%): {currentMainData[currentMainData.length - 1]?.rate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 트렌드 차트 - 동적 데이터 */}
      <div className="trend-sectionHY">
        <div className="trend-containerHY">
          <div className="trend-headerHY">
            <h3 className="trend-titleHY">방문자 수 </h3>
            <div className="trend-controlsHY">
              <button
                className={`trend-btnHY ${trendChartPeriod === '월별' ? 'active' : ''}`}
                onClick={() => setTrendChartPeriod('월별')}
              >
                월별
              </button>
              <button
                className={`trend-btnHY ${trendChartPeriod === '분기별' ? 'active' : ''}`}
                onClick={() => setTrendChartPeriod('분기별')}
              >
                분기별
              </button>
              <button
                className={`trend-btnHY ${trendChartPeriod === '년도별' ? 'active' : ''}`}
                onClick={() => setTrendChartPeriod('년도별')}
              >
                년도별
              </button>
            </div>
          </div>

          <div className="trend-chartHY">
            <div className="trend-y-axisHY">
              <span>{Math.round(maxTrend * 1.2).toLocaleString()}</span>
              <span>{Math.round(maxTrend * 0.9).toLocaleString()}</span>
              <span>{Math.round(maxTrend * 0.6).toLocaleString()}</span>
              <span>{Math.round(maxTrend * 0.3).toLocaleString()}</span>
              <span>0</span>
            </div>

            <div className="trend-areaHY">
              <svg className="trend-svgHY" viewBox="0 0 400 150">
                <defs>
                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#42A5F5" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#42A5F5" stopOpacity="0.2" />
                  </linearGradient>
                </defs>

                {/* 영역 차트 */}
                {currentTrendData?.length > 0 && (
                  <path
                    d={`M 0 ${getTrendHeight(currentTrendData[0].value, maxTrend)} ${currentTrendData.map((data, index) =>
                      `L ${(index * 400) / (currentTrendData.length - 1)} ${getTrendHeight(data.value, maxTrend)}`
                    ).join(' ')
                      } L 400 150 L 0 150 Z`}
                    fill="url(#blueGradient)"
                  />
                )}

                {/* 라인 */}
                <polyline
                  points={currentTrendData.map((data, index) =>
                    `${(index * 400) / (currentTrendData.length - 1)},${getTrendHeight(data.value, maxTrend)}`
                  ).join(' ')}
                  fill="none"
                  stroke="#42A5F5"
                  strokeWidth="3"
                />

                {/* 하이라이트 포인트  */}
                {currentTrendData.length >= 3 && (
                  <>
                    <circle
                      cx={(currentTrendData.length - 3) * 400 / (currentTrendData.length - 1)}
                      cy={getTrendHeight(currentTrendData[currentTrendData.length - 3].value, maxTrend)}
                      r="5"
                      fill="#42A5F5"
                    />
                    <rect
                      x={(currentTrendData.length - 3) * 400 / (currentTrendData.length - 1) - 40}
                      y={getTrendHeight(currentTrendData[currentTrendData.length - 3].value, maxTrend) - 25}
                      width="80"
                      height="35"
                      rx="6"
                      fill="white"
                      stroke="#42A5F5"
                      strokeWidth="1"
                    />
                    <text
                      x={(currentTrendData.length - 3) * 400 / (currentTrendData.length - 1)}
                      y={getTrendHeight(currentTrendData[currentTrendData.length - 3].value, maxTrend) - 12}
                      textAnchor="middle"
                      fill="#42A5F5"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {currentTrendData[currentTrendData.length - 3].label}
                    </text>
                    <text
                      x={(currentTrendData.length - 3) * 400 / (currentTrendData.length - 1)}
                      y={getTrendHeight(currentTrendData[currentTrendData.length - 3].value, maxTrend)}
                      textAnchor="middle"
                      fill="#42A5F5"
                      fontSize="9"
                    >
                      {/* 방문자 수: {currentTrendData[currentTrendData.length].value.toLocaleString()} */}
                    </text>
                  </>
                )}
              </svg>
            </div>

            <div className="trend-x-axisHY">
              {currentTrendData.map((data, index) => (
                <span key={index}>{data.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

    </Layout>
  );
};

export default Dashboard;