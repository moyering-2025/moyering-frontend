import React, { useState,useEffect  } from "react";
import styles from "./ClassRingDetailInquiryList.module.css";
import { useNavigate,useParams } from "react-router";
import { url, myAxios } from "../../config";
import {
    inquiryListAtom,
    classDetailAtom,
    calendarListAtom,
} from '../../atom/classAtom';
import { useSetAtom, useAtomValue, useAtom } from "jotai";
import "./GatheringDetail.css";
import { userAtom, tokenAtom } from "../../atoms";
import {
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "reactstrap";
import { CiCalendar, CiClock1, CiLocationOn } from "react-icons/ci";

export default function ClassRingDetailInquiryList({classId}) {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const setInquiryListAtom = useSetAtom(inquiryListAtom);
    const inquiryList = useAtomValue(inquiryListAtom);
    const user = useAtomValue(userAtom);
    const [token,setToken] = useAtom(tokenAtom)
    const classDetail = useAtomValue(classDetailAtom);
    const calendarList = useAtomValue(calendarListAtom);
    
    const navigate = useNavigate();
        const fetchInquiry = async () => {
        try {
        const res = await myAxios().get(
            `/class/classInquiryList/${classId}?page=${currentPage - 1}&size=5`
        );
        setInquiryListAtom(res.data.content);
        setTotalPages(res.data.totalPages);
        } catch (err) {
        console.error("문의 불러오기 실패", err);
        }
    };
    useEffect(() => {
        fetchInquiry(); 
    }, [currentPage]);

    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [questionContent, setQuestionContent] = useState("");
    
    // 문의하기 모달 관련 함수들
    const toggleQuestionModal = () => {
    if (!user || !token) {
        if (
        confirm(
            "로그인이 필요한 서비스입니다. 로그인 페이지로 이동하시겠습니까?"
        )
        ) {
        navigate("/userlogin");
        } else {
        return;
        }
    } else {
        setIsQuestionModalOpen(!isQuestionModalOpen);
        if (isQuestionModalOpen) {
        setQuestionContent("");
        }
    }
    };

    const submit = async (e) => {
    e.preventDefault();

    if (!questionContent.trim()) {
        alert("문의 내용을 입력해주세요.");
        return;
    }

    const formDataToSend = {
        calendarId: calendarList[0].calendarId,
        content: questionContent.trim(),
    };

    try {
        console.log(token);
        const response = await myAxios(token,setToken).post(
        `/user/writeClassInquiry`,
        formDataToSend
        );

        if (response.status === 200 && typeof response.data === "number") {
            toggleQuestionModal(); // 모달 닫기
            setQuestionContent(""); // 입력 초기화
            setCurrentPage(1);
        fetchInquiry();
        } else {
        alert("문의 등록에 실패했습니다. 다시 시도해주세요.");
        }
    } catch (error) {
        console.error("문의 등록 중 오류 발생:", error);
        alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
    };
    return (
        <div>
            <h2>문의</h2>
            <div className={styles.questionsTable}>
                <div className={styles.questionsHeader}>
                <div>답변상태</div>
                <div>제목</div>
                <div>작성자</div>
                <div>작성일</div>
                </div>
                {inquiryList.map((q, i) => (
                <div key={q.inquiryId} className={`${styles.questionsRow} ${i % 2 === 1 ? styles.alternate : ""}`}>
                    <div className={styles.questionsGrid}>
                    <div>{q.iqResContent ? "답변완료" :"답변대기"}</div>
                    <div>{q.content}</div>
                    <div>{q.studentName}</div>
                    <div>{q.inquiryDate}</div>
                    </div>
                    {q.iqResContent &&  (
                    <div className={styles.answerSection}>
                        <div className={styles.answerHeader}>
                        <span className={styles.answerBadge}>답변</span>
                        <span className={styles.answerAuthor}>{q.hostName}</span>
                        <span className={styles.answerDate}>{q.responseDate}</span>
                        </div>
                        <div className={styles.answerContent}>{q.iqResContent}</div>
                    </div>
                    )}
                </div>
                ))}
            </div>
            {inquiryList.length>0?
                <div className={styles.pagination}>
                <button
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    &lt;
                </button>
        
                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                    key={i}
                    className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.pageBtnActive : ""}`}
                    onClick={() => setCurrentPage(i + 1)}
                    disabled={currentPage === i + 1}
                    >
                    {i + 1}
                    </button>
                ))}
        
                <button
                    className={styles.pageBtn}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    &gt;
                </button>
                </div>
                : <div className={styles.noneInq}>문의가 존재하지 않습니다.</div>
                }
            <div className={styles.questionButtonWrap}>
                </div>
        
        {/* 문의 모달 */}
        {isQuestionModalOpen && (
        <form>
            <Modal
            isOpen={isQuestionModalOpen}
            toggle={toggleQuestionModal}
            className="GatheringDetail_question-modal_osk"
            size="lg"
            centered
            >
            <ModalHeader
                toggle={toggleQuestionModal}
                className="GatheringDetail_modal-header_osk"
            >
                <span className="GatheringDetail_modal-title_osk">
                    {classDetail.name} 문의하기
                </span>
            </ModalHeader>
            <ModalBody className="GatheringDetail_modal-body_osk">
                <div className="GatheringDetail_gathering-info_osk">
                    <img
                        src={`${url}/image?filename=${classDetail.imgName1}`}
                        alt="클래스 이미지"
                        className="GatheringDetail_gathering-image_osk"
                    />
                <div className="GatheringDetail_gathering-details_osk">
                    <div className="GatheringDetail_gathering-info-item_osk">
                    <span>
                        {classDetail.name}<br />
                    </span>
                    </div>
                    <div className="GatheringDetail_gathering-info-item_osk">
                    <CiCalendar className="GatheringDetail_gathering-info-icon_osk" />
                    <span>
                        가장 빠른 수업일 : {calendarList[0].startDate}<br />
                    </span>
                    </div>
                    <div className="GatheringDetail_gathering-info-item_osk">
                    <CiLocationOn className="GatheringDetail_gathering-info-icon_osk" />
                    <span>
                        장소: {classDetail.addr} {classDetail.detailAddr} {classDetail.locName}
                    </span>
                    </div>
                </div>
                </div>



                <div className="GatheringDetail_input-section_osk">
                <label className="GatheringDetail_input-label_osk">
                    문의 사항
                </label>
                <textarea
                    value={questionContent}
                    onChange={(e) => setQuestionContent(e.target.value)}
                    placeholder="문의 사항에 대해 자세히 알려주세요"
                    rows={6}
                    className="GatheringDetail_textarea-field_osk"
                />
                </div>
            </ModalBody>
            <ModalFooter className="GatheringDetail_modal-footer_osk">
                <button
                className="GatheringDetail_modal-btn_osk GatheringDetail_modal-btn-cancel_osk"
                onClick={toggleQuestionModal}
                >
                취소
                </button>
                <input
                type="submit"
                className="GatheringDetail_modal-btn_osk GatheringDetail_modal-btn-submit_osk"
                onClick={submit}
                value="문의하기"
                />
            </ModalFooter>
            </Modal>
        </form>
    )}
        </div>  
    );
}