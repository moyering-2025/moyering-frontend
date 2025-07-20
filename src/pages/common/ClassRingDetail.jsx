import React, { useState, useEffect } from "react";
import { CiCalendar, CiClock1, CiLocationOn } from "react-icons/ci";
import { GoHeart, GoHeartFill } from "react-icons/go";
import { GoPeople } from "react-icons/go";
import { BiChevronDown } from "react-icons/bi";
import styles from "./ClassRingDetail.module.css";
import Header from "./Header";
import { useNavigate, useParams } from "react-router";
import { useSetAtom, useAtomValue, useAtom } from "jotai";
import {
  calendarListAtom,
  classDetailAtom,
  currListAtom,
  hostAtom,
  reviewListAtom,
  classLikesAtom,
} from '../../atom/classAtom';
import { tokenAtom, userAtom } from "../../atoms";
import { myAxios } from "../../config";
import KakaoMap from "./KakaoMap";
import { url } from '../../config';
import { FaStar } from "react-icons/fa";
import ClassRingDetailInquiryList from "./ClassRingDetailInquiryList";
import ClassRingReviewList from "./ClassRingReviewList";
import useFetchUserClassLikes from "../../hooks/common/useFetchUserClassLikes";
import Footer from "./Footer";
import "./GatheringDetail.css";
import {
  Table,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "reactstrap";

export default function ClassRingDetail() {
  useFetchUserClassLikes();
  const classLikes = useAtomValue(classLikesAtom);
  const [activeTab, setActiveTab] = useState("details");
  const [isExpanded, setIsExpanded] = useState(false);
  const PREVIEW_LENGTH = 300;
  const navigate = useNavigate();

  const { classId } = useParams();
  const [token, setToken] = useAtom(tokenAtom);
  const user = useAtomValue(userAtom);
  const setCalendarList = useSetAtom(calendarListAtom);
  const setClassDetailAtom = useSetAtom(classDetailAtom);
  const setCurrListAtom = useSetAtom(currListAtom);
  const setHostAtom = useSetAtom(hostAtom);
  const setReviewListAtom = useSetAtom(reviewListAtom);
  const [detailDtos, setDetailDtos] = useState([]);
  const [recommends, setRecommends] = useState([]);
  const [registeds, setRegisteds] = useState([]);

  const calendarList = useAtomValue(calendarListAtom);
  const classDetail = useAtomValue(classDetailAtom);
  const currList = useAtomValue(currListAtom);
  const host = useAtomValue(hostAtom);
  const reviews = useAtomValue(reviewListAtom);

  const description = classDetail ? classDetail.detailDescription : '';
  const previewText = description.length > PREVIEW_LENGTH ? description.slice(0, PREVIEW_LENGTH) + "..." : description;
  const shouldShowMore = description.length > PREVIEW_LENGTH;

  const [coupons, setCoupons] = useState([]);
  const [myCoupons, setMyCoupons] = useState([]);

  const handleExpandClick = () => setIsExpanded(true);
  const handleTabClick = (id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 140, behavior: "smooth" });
    setActiveTab(id);
  };

  useEffect(() => {
    const sections = ["details", "schedule", "location", "instructor", "reviews", "questions"];
    const onScroll = () => {
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && window.scrollY + 200 >= el.offsetTop) {
          setActiveTab(sections[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    myAxios(token, setToken)
      .get(`/class/classRingDetail/${classId}`)
      .then((res) => {
        setCalendarList(res.data.calendarList);
        setClassDetailAtom(res.data.hostClass);
        setCurrListAtom(res.data.currList);
        setHostAtom(res.data.host);
        setReviewListAtom(res.data.reviews);
        setCoupons(res.data.coupons);
        setMyCoupons(res.data.userCoupons || []);
        setDetailDtos(res.data.detailDtos || []);
        setRecommends(res.data.recommends || []);
        setRegisteds(res.data.registeds || []);
        console.log(res.data);
      })
      .catch((err) => console.error("클래스 추천 데이터 로딩 실패", err));
  }, [token, classId]);

  const [selectedCalendarId, setSelectedCalendarId] = useState('');
  const selectedCalendar = calendarList.find(c => c.calendarId == selectedCalendarId);

  useEffect(() => {
    if (calendarList.length > 0) {
      setSelectedCalendarId(calendarList[0].calendarId);
    }
  }, [classId, calendarList]);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [downloadedIds, setDownloadedIds] = useState([]);

  const handleDownload = async (classCouponId) => {
    if (!user || !token) {
      if (confirm("로그인이 필요한 서비스입니다. 로그인 페이지로 이동하시겠습니까?")) {
        navigate("/userlogin");
      }
      return;
    }
    try {
      token && await myAxios(token, setToken).post("/user/classCoupons/download", {
        classCouponId,
      });

      setCoupons(prev =>
        prev.map(c =>
          c.classCouponId === classCouponId
            ? { ...c, usedCnt: c.usedCnt + 1 }
            : c
        )
      );

      setMyCoupons(prev => [
        ...prev,
        { classCouponId },
      ]);
      setDownloadedIds(prev => [...prev, classCouponId]);

    } catch (err) {
      console.error("쿠폰 다운로드 실패", err);
      alert(err.response?.data?.message || "쿠폰 다운로드 중 오류 발생");
    }
  };

  const [isLiked, setIsLiked] = useState(false);
  useEffect(() => {
    const liked = classLikes.some((like) => like.classId === Number(classId));
    setIsLiked(liked);
  }, [classLikes, classId]);

  const handleHeart = async (classId) => {
    try {
      const res = token && await myAxios(token, setToken).post("/user/toggle-like", {
        classId: classId
      });
      const updated = token && await myAxios(token, setToken).get(`/class/classRingDetail/${classId}`);
      setIsLiked(!isLiked);
    } catch (err) {
      console.error("좋아요 실패", err);
      alert(err.response?.data?.message || "쿠폰 좋아요 중 오류 발생");
    }
  };

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionContent, setQuestionContent] = useState("");

  const toggleQuestionModal = () => {
    if (!user || !token) {
      if (confirm("로그인이 필요한 서비스입니다. 로그인 페이지로 이동하시겠습니까?")) {
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
      calendarId: selectedCalendarId,
      content: questionContent.trim(),
    };

    try {
      const response = await myAxios(token, setToken).post(
        `/user/writeClassInquiry`,
        formDataToSend
      );

      if (response.status === 200 && typeof response.data === "number") {
        toggleQuestionModal();
        setQuestionContent("");
      } else {
        alert("문의 등록에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("문의 등록 중 오류 발생:", error);
      alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  function truncateHtml(html, maxLength) {
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  }

  return (
    <>
      <Header />
      <div className={styles.detailWrapper}>
        <main className={styles.mainContent}>
          {classDetail?.imgName1 && (
            <img src={`${url}/image?filename=${classDetail?.imgName1}`} alt="클래스 이미지" className={styles.mainImage} />
          )}
          {/* 메뉴 */}
          <nav className={styles.tabs}>
            {[
              { id: "details", label: "상세 정보" },
              { id: "location", label: "위치" },
              { id: "instructor", label: "강사소개" },
              { id: "reviews", label: "후기" },
              { id: "questions", label: "문의" },
              { id: "recommend", label: "추천" }
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                className={`${styles.tab} ${activeTab === id ? styles.active : ""}`}
              >
                {label}
              </button>
            ))}
          </nav>
          {/* 상세정보 */}
          <section className={styles.section} id="details">
            <h2>클래스 소개</h2>
            <div
              dangerouslySetInnerHTML={{
                __html: isExpanded
                  ? description
                  : truncateHtml(description, 100)  // 미리보기
              }}
            />

            {shouldShowMore && !isExpanded && (
              <button onClick={handleExpandClick} className={styles.moreBtn}>
                더보기 <BiChevronDown />
              </button>
            )}

            {/* 준비물 섹션 */}
            <div className={styles.preparation}>
              {classDetail?.preparation && (
                <>
                  <h3>준비물</h3>
                  <p>
                    {classDetail.preparation.split(',').map((item, index) => (
                      <span key={index} className={styles.tagStyle}>
                        {item.trim()}
                      </span>
                    ))}
                  </p>
                </>
              )}

              {classDetail?.incluision && (
                <>
                  <h3>포함사항</h3>
                  <p>
                    {classDetail.incluision.split(',').map((item, index) => (
                      <span key={index} className={styles.tagStyle}>
                        {item.trim()}
                      </span>
                    ))}
                  </p>
                </>
              )}

              {classDetail?.keywords && (
                <>
                  <h3>키워드</h3>
                  <p>
                    {classDetail.keywords.split(',').map((item, index) => (
                      <span key={index} className={styles.tagStyle}>
                        {item.trim()}
                      </span>
                    ))}
                  </p>
                </>
              )}
            </div>
            <hr />
            {/* 커리큘럼 섹션 */}
            <div className={styles.curriculum}><h3><CiClock1 className={styles.infoIcon} />커리큘럼</h3>
              <ul className={styles.curriculumList}>{detailDtos?.map((curr) => {
                return (
                  <li key={curr.scheduleId} className={styles.curriculumItem}>
                    <span className={styles.curriculumTime}>        {curr.startTime} ~ {curr.endTime} </span>
                    <span className={styles.curriculumContent}>{curr.content} </span>
                  </li>
                );
              })}
              </ul>
            </div>
          </section>
          {/* 위치 */}
          <section className={styles.section} id="location">
            <h2>위치</h2>
            <div className={styles.row}><CiLocationOn className={styles.infoIcon} /> {classDetail?.addr} {classDetail?.detailAddr} {classDetail?.locName}</div>
            <div className={styles.mapPlaceholder}>
              {classDetail?.latitude && classDetail?.longitude ? (
                <KakaoMap
                  latitude={classDetail.latitude}
                  longitude={classDetail.longitude}
                  address={`${classDetail.addr} ${classDetail.detailAddr ?? ""}`}
                />
              ) : (
                <div>지도를 로드할 데이터를 불러오는 중입니다...</div>
              )}
            </div>
          </section>
          {/* 강사소개 */}
          <section className={styles.section} id="instructor">
            <h2>강사소개</h2>
            <div className={styles.instructorCard}>
              {host?.profile && (
                <img className={styles.instructorImage} src={`${url}/image?filename=${host?.profile}`} alt="강사 이미지" />
              )}
              <div className={styles.instructorInfo}>
                <h3>{host?.name}</h3>
                <p>{host?.intro}</p>
                <div className={styles.instructorTags}>
                  {host?.tag1 && <span>{host.tag1}</span>}
                  {host?.tag2 && <span>{host.tag2}</span>}
                  {host?.tag3 && <span>{host.tag3}</span>}
                  {host?.tag4 && <span>{host.tag4}</span>}
                  {host?.tag5 && <span>{host.tag5}</span>}
                </div>
              </div>
            </div>
          </section>
          {/* 후기 */}
          <section className={styles.section} id="reviews">
            <h2>후기</h2>
            {/* <div className={styles.reviewCard}>
              {reviews.map((r, i) => (
                <div key={r?.reviewId} className={styles.reviewDiv}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewAuthor}>
                      <img src={`${url}/image?filename=${r?.profileName}`} alt="작성자 프로필 사진 " width="30" height="30" style={{ borderRadius: "50%" }} />
                      {r?.studentName}
                      <span className={styles.reviewStars}>
                        {[...Array(r.star)].map((_, i) => (
                          <FaStar key={i} color="#FFD700" />
                        ))}
                      </span>
                    </div>
                    <span>{r?.reviewDate}</span>
                  </div>
                  <div className={styles.reviewContent}>
                    {r?.content}
                  </div>
                  {r?.revRegCotnent &&
                    <div className={styles.reviewReply}>
                      <div className={styles.reviewAuthor}>
                        <div className={styles.reviewReplyHeader}>
                          <img src={`${url}/image?filename=${r?.hostProfileName}`} alt="작성자 프로필 사진 " width="30" height="30" style={{ borderRadius: "50%" }} />
                          {r?.hostName}
                        </div>
                        <span className={styles.responseDate}>{r?.responseDate}</span>
                      </div>
                      <div>
                        {r?.revRegCotnent}
                      </div>
                    </div>
                  }
                </div>
              ))}
            </div>
            {host && (
              <button
                className={styles.reviewMoreBtn}
                onClick={() => navigate(`/classRingReviewList/${classId}?className=${encodeURIComponent(classDetail?.name)}`)}
              >
                더보기
              </button>
            )} */}
            <ClassRingReviewList classId={classId} />
          </section>
          {/* 문의 */}
          <section className={styles.section} id="questions">
            <ClassRingDetailInquiryList classId={classId} />
          </section>
          {/* 추천 클래스 섹션 */}
          <section className={styles.section} id="recommend" style={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "column",
          }}>
            <div className={styles.recommendHeader}>
              <h2>같은 카테고리의 클래스링은 어때요</h2>
              {recommends.length > 0 ?
                (
                  <button className={styles.recommendMoreBtn}
                    onClick={() =>
                      navigate("/classList", {
                        state: {
                          category1: classDetail?.categoryId,
                          category2: classDetail?.subCategoryId,
                        }
                      })
                    }>
                    더보기
                  </button>
                ) : (<></>)}

            </div>
            <p className={styles.subText}>비슷한 주제의 클래스링</p>
            <div className={styles.recommendGrid}>
              {recommends.length === 0 ?
                (
                  <p className={styles.noneCoupon}>같은 카테고리의 클래스가 없습니다.</p>
                ) : (<></>)}
              {recommends.map((classInfo) => (
                <div className={styles.card}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexDirection: "column",
                  }}
                  onClick={() => {
                    navigate(`/class/classRingDetail/${classInfo.classId}`);
                    window.scrollTo({ top: 0, behavior: "auto" });
                  }}>
                  <div
                    className={styles.cardImage}
                    style={{
                      backgroundImage: `url(${url}/image?filename=${classInfo.imgName1})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {classLikes.some(like => like.classId === classInfo.classId) ? (
                      <GoHeartFill className={styles.likeIcon4} />
                    ) : (
                      <GoHeart className={styles.likeIcon3} />
                    )}
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.cardTags}>
                      <span className={`${styles.tag} ${styles.yellow}`} style={{
                        fontSize: "12px",
                      }}>{classInfo.category1}&gt;{classInfo.category2}</span>
                      <span className={`${styles.tag} ${styles.blue}`} style={{
                        fontSize: "12px",
                      }}>{classInfo.addr}</span>
                    </div>
                    <div className={styles.cardEtc}
                      style={{
                        flexDirection: "column"
                      }}>
                      <span className={styles.cardTitle}>{classInfo.name}</span>
                      <span className={styles.cardPrice}>{classInfo.price.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <aside className={styles.sidebar}>
          <div className={styles.cardBox}>
            <div className={styles.badges}>
              <span className={styles.badgeCategory}>{classDetail?.category1}&gt;{classDetail?.category2}</span>
              <span className={styles.badgeLocation}><CiLocationOn/>{classDetail?.addr}</span>
            </div>
            <h1 className={styles.title}>{classDetail?.name}</h1>
            <div className={styles.row}><CiCalendar className={styles.infoIcon} />
              <select className={styles.couponList}
                value={selectedCalendarId}
                onChange={(e) => setSelectedCalendarId(Number(e.target.value))}
              >
                {calendarList.map(calendar => {
                  const date = new Date(calendar.startDate);
                  const dayName = date.toLocaleDateString('ko-KR', { weekday: 'short' });
                  return (
                    <option
                      key={calendar.calendarId}
                      value={calendar.calendarId}
                    >
                      {calendar.startDate} ({dayName})
                    </option>
                  );
                })}
              </select>
            </div>
            <div className={styles.row}><CiClock1 className={styles.infoIcon} /><span>오전 10:00 ~ 오후 1:00</span></div>
            <div className={styles.row}>
              <GoPeople className={styles.infoIcon} />
              <span>
                {selectedCalendar?.registeredCount ?? '0'}명 참가 중 (최소 {classDetail?.recruitMin}명, 최대 {classDetail?.recruitMax === 0 ? "제한없음" : classDetail?.recruitMax + "명"})
              </span>
            </div>
            <div className={styles.row}><CiLocationOn className={styles.infoIcon} />
              <span>{classDetail?.addr} {classDetail?.detailAddr} {classDetail?.locName}</span>
            </div>
            <div className={styles.row}>
              {/* 쿠폰 */}
              <div className={styles.customDropdown}>
                <div
                  className={styles.dropdownHeader}
                  onClick={() => {
                    if (coupons.length > 0) setIsOpen(!isOpen);
                  }}
                >
                  {coupons.length === 0
                    ? "사용 가능한 쿠폰이 없습니다"
                    : selectedCoupon
                      ? selectedCoupon.couponName
                      : "사용 가능한 쿠폰을 선택하세요"}
                </div>

                {isOpen && coupons.length > 0 && (
                  <ul className={styles.dropdownList}>
                    {coupons?.map(c => {
                      const remaining = c.amount - c.usedCnt;
                      const isDownloaded = myCoupons.some(
                        mc => mc.classCouponId === c.classCouponId
                      );

                      return (
                        <li key={c.classCouponId} className={styles.dropdownItem}>
                          <span
                            className={
                              remaining === 0
                                ? styles.couponTextDisabled
                                : styles.couponText
                            }
                          >
                            [{remaining > 0 ? `${remaining}매` : '소진'}] {c.couponName}
                            {c.discountType === 'RT'
                              ? ` ${c.discount}%`
                              : ` ${c.discount.toLocaleString()}원`}
                          </span>

                          {/* 남은 쿠폰이 있을 때만 버튼 렌더링 */}
                          {remaining > 0 && (
                            <button
                              disabled={isDownloaded}
                              onClick={e => {
                                e.stopPropagation();
                                handleDownload(c.classCouponId);
                              }}
                              className={
                                isDownloaded
                                  ? styles.downloadBtnDisabled
                                  : styles.downloadBtn
                              }
                            >
                              {isDownloaded ? '완료' : '다운'}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

              </div>
            </div>
            <div className={styles.buttonGroup}>
              <button className={styles.outlineBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleHeart(classId);
                }}
              >
                {isLiked ? (
                  <>
                    <GoHeartFill className={styles.likeIcon2} />{" "}
                  </>
                ) : (
                  <>
                    <GoHeart className={styles.likeIcon} />{" "}
                  </>
                )}
              </button>
              <button className={styles.questionButton} onClick={toggleQuestionModal}>문의하기</button>
              {registeds.some(r => r.calendarId === selectedCalendarId) ? (
                <button className={styles.applyBtnDis} disabled>
                  신청 완료
                </button>
              ) : (
                <button
                  className={styles.applyBtn}
                  onClick={() => {
                    if (!user || !token) {
                      if (confirm("로그인이 필요한 서비스입니다. 로그인 페이지로 이동하시겠습니까?")) {
                        navigate("/userlogin");
                      }
                    } else {
                      navigate(`/user/classPayment/${classId}/${selectedCalendarId}`)
                    }
                  }
                  }
                >
                  신청하기
                </button>
              )}
            </div>
            <p className={styles.etc}>결제 취소는 수강 2일 전까지만 가능합니다.</p>
          </div>
        </aside>
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
                      문의 수업일 : {selectedCalendar?.startDate ?? "-"}<br />
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
      <Footer />
    </>
  );
}