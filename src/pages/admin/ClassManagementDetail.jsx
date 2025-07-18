import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import Layout from "./Layout";
import { tokenAtom } from "../../atoms";
import { myAxios } from "../../config";
import "./ClassManagementDetail.css";

const ClassManagementDetail = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const token = useAtomValue(tokenAtom);
  const setToken = useSetAtom(tokenAtom);
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(false);

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

  // 승인/거절 버튼을 표시할지 체크하는 함수 (백엔드 원본 상태 기준)
  const shouldShowApprovalButtons = (backendStatus) => {
    if (!backendStatus) return false;
    
    const normalizedStatus = backendStatus.trim();
    // 백엔드에서 오는 실제 상태값 기준으로 체크
    return normalizedStatus === "승인대기";
  };

  // 상태에 따른 CSS 클래스 반환 함수 (표시용 상태 기준)
  const getStatusClass = (displayStatus) => {
    switch (displayStatus) {
      case "승인대기": return "warning";
      case "모집중": return "success";
      case "모집마감": return "info";
      case "종료": return "secondary";
      case "폐강": 
      case "반려": return "danger";
      default: return "";
    }
  };

  const fetchClassDetail = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const response = await myAxios(token, setToken).get(`/api/class/${classId}/detail`);
      setClassData(response.data);
      
      // 상태 매핑 디버깅
      console.log("받아온 클래스 데이터:", response.data);
      console.log("백엔드 원본 상태:", response.data.processStatus);
      console.log("화면 표시 상태:", getDisplayStatus(response.data.processStatus));
      console.log("버튼 표시 여부:", shouldShowApprovalButtons(response.data.processStatus));
      
    } catch (error) {
      console.error("클래스 상세 데이터 로딩 실패:", error);
      alert("클래스 정보를 불러오는데 실패했습니다.");
      navigate("/admin/class");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm("클래스를 승인하시겠습니까?")) return;
    
    try {
      await myAxios(token, setToken).patch(`/api/class/${classId}/approve`);
      alert("클래스가 승인되었습니다.");
      // 승인 후 데이터 다시 조회
      fetchClassDetail();
    } catch (error) {
      console.error("승인 처리 실패:", error);
      alert("승인 처리에 실패했습니다.");
    }
  };

  const handleReject = async () => {
    if (!window.confirm("클래스를 거절하시겠습니까?")) return;
    
    try {
      await myAxios(token, setToken).patch(`/api/class/${classId}/reject`);
      alert("클래스가 거절되었습니다.");
      // 거절 후 데이터 다시 조회
      fetchClassDetail();
    } catch (error) {
      console.error("거절 처리 실패:", error);
      alert("거절 처리에 실패했습니다.");
    }
  };

  useEffect(() => {
    fetchClassDetail();
  }, [classId]);

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="loading-spinner">데이터를 불러오는 중...</div>
        </div>
      </Layout>
    );
  }

  if (!classData) {
    return (
      <Layout>
        <div className="error-container">
          <div className="error-message">클래스 정보를 찾을 수 없습니다.</div>
        </div>
      </Layout>
    );
  }

  // 키워드를 배열로 변환 (콤마로 구분된 문자열을 배열로)
  const keywordsArray = classData.keywords ? classData.keywords.split(',').map(k => k.trim()) : [];

  return (
    <Layout>
      <div className="page-titleHY">
        <h1>클래스 상세</h1>
      </div>
      <div className="class-detail-container">
        <div className="header">
          <h5>{classData.className}</h5>
          <div className="action-buttons">
            {/* 백엔드 원본 상태("검수중")로 버튼 표시 여부 결정 */}
            {shouldShowApprovalButtons(classData.processStatus) && (
              <>
                <button className="btn-approve" onClick={handleApprove}>승인</button>
                <button className="btn-reject" onClick={handleReject}>거절</button>
              </>
            )}
          </div>
        </div>

        <div className="download-links">
          <div>포트폴리오 : 
            {classData.portfolioName ? (
              <a href={`/api/files/download/${classData.portfolioName}`} download> 다운로드</a>
            ) : (
              <span> (파일 없음)</span>
            )}
          </div>
          <div>강의자료 :
            {classData.materialName ? (
              <a href={`/api/files/download/${classData.materialName}`} download> 다운로드</a>
            ) : (
              <span> (파일 없음)</span>
            )}
          </div>
        </div>



        <h6>&lt; 클래스 정보 &gt;</h6>
        <table className="info-table">
          <thead>
            <tr><th>클래스 ID</th><th>일정 ID</th><th>카테고리</th><th>클래스명</th><th>가격</th><th>위치</th><th>상세주소</th><th>최소 인원</th><th>최대 인원</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>{classData.classId}</td>
              <td>{classData.calendarId}</td>
              <td>{classData.firstCategory}&gt;{classData.secondCategory}</td>
              <td>{classData.className}</td>
              <td>{classData.price?.toLocaleString()} 원</td>
              <td>{classData.location}</td>
              <td>{classData.detailAddr || classData.location}</td>
              <td>{classData.recruitMin}</td>
              <td>{classData.recruitMax}</td>
            </tr>
          </tbody>
        </table>

        <h6>&lt; 상세 설명 &gt;</h6>
        <div 
          className="description-box" 
          dangerouslySetInnerHTML={{
            __html: classData.description || "(내용 없음)"
          }}
        ></div>
        
        <div className="bottom-section">
          <div className="schedule-section">
            <h6>&lt; 스케줄 목록 &gt;</h6>
            {classData.schedules && classData.schedules.length > 0 ? (
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>일정 ID</th>
                    <th>클래스 일자</th>
                    <th>시작시간</th>
                    <th>종료시간</th>
                    <th>상태</th>
                    <th>등록 인원</th>
                  </tr>
                </thead>
                <tbody>
                  {classData.schedules.map((schedule, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{schedule.calendarId}</td>
                      <td>{schedule.startDate}</td>
                      <td>{classData.scheduleStart || "미설정"}</td>
                      <td>{classData.scheduleEnd || "미설정"}</td>
                      <td>
                        <span className={`badge ${getStatusClass(getDisplayStatus(schedule.status))}`}>
                          {getDisplayStatus(schedule.status)}
                        </span>
                      </td>
                      <td>{schedule.registeredCount || 0} / {classData.recruitMax}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-schedules">
                <p>등록된 일정이 없습니다.</p>
                <div className="schedule-item">
                  시작시간: {classData.scheduleStart || "미설정"}
                  <br />
                  종료시간: {classData.scheduleEnd || "미설정"}
                  <br />
                  상태: {getDisplayStatus(classData.processStatus) || "미설정"}
                </div>
              </div>
            )}
          </div>

          <div className="extra-info-section">
            <h6>&lt; 부가정보 &gt;</h6>
            <table>
              <thead><tr><th>포함 사항</th><th>준비물</th><th>검색 키워드</th></tr></thead>
              <tbody>
                <tr>
                  <td>{classData.inclusion || "-"}</td>
                  <td>{classData.preparation || "-"}</td>
                  <td>{keywordsArray.join(", ") || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <h6>&lt; 수강생 목록 &gt;</h6>
        {classData.students && classData.students.length > 0 ? (
          <table className="students-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>회원 ID</th>
                <th>이름</th>
                <th>연락처</th>
                <th>이메일</th>
      
              </tr>
            </thead>
            <tbody>
              {classData.students.map((student, idx) => (
                <tr key={idx}>
                   <td>{idx + 1}</td>
                   <td>{student.username}</td>
                  <td>{student.name}</td>
                  <td>{student.phone}</td>
                  <td>{student.email}</td>
         
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-students">
            <p>등록된 수강생이 없습니다.</p>
          </div>
        )}

        <p className="note">
          등록요청 상태에서는 수강생 목록이 표시되지 않습니다.<br/>
          모집중, 모집마감, 폐강, 종료된 경우에만 수강생 목록이 표시됩니다.
        </p>
      </div>
    </Layout>
  );
};

export default ClassManagementDetail;