import React, { useState, useEffect } from "react";
import styles from "./ClassRingReviewList.module.css";
import { FaStar } from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa";
import { myAxios } from "../../config";
import { useNavigate, useParams, useLocation } from "react-router";
import { url } from '../../config';
import { useSetAtom, useAtomValue } from "jotai";
import {
  allReviewListAtom,
} from '../../atom/classAtom';
export default function ClassRingReviewList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { classId } = useParams();
  const navigate = useNavigate();
  const setAllReviewListAtom = useSetAtom(allReviewListAtom);
  const reviews = useAtomValue(allReviewListAtom);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const className = params.get("className");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await myAxios().get(
          `/class/classRingReviewList/${classId}?page=${currentPage - 1}&size=5`
        );
        setAllReviewListAtom(res.data.content);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        console.error("리뷰 불러오기 실패", err);
      }
    };

    fetchReviews();
  }, [currentPage]);
  return (
    <div className={styles.container}>
      <div style={{ display: 'flex' }}>
        {/* <button onClick={() => navigate(-1)} className={styles.backBtn}>
        <FaArrowLeft style={{ marginRight: "6px" }} />
      </button> */}
      </div>

      <div className={styles.reviewList}>
        {reviews.map((r) => (
          <div key={r.reviewId} className={styles.reviewCard}>
            <div className={styles.reviewHeader}>
              <img src={`${url}/image?filename=${r?.profileName}`} alt="작성자 프로필 사진 " width="30" height="30" style={{ borderRadius: "50%" , width:"30px"}} />
              <strong>{r.studentName}</strong>
              <span className={styles.rating}>
                {[...Array(r.star)].map((_, i) => (
                  <FaStar key={i} color="#FFD700" />
                ))}
              </span>
              <span className={styles.date}>{r.reviewDate}</span>
            </div>
            <div className={styles.reviewContent}>{r.content}</div>
            {r.revRegCotnent && (
              <div className={styles.reviewReply}>
                <div className={styles.replyHeader}>
                  <div>
                    <img src={`${url}/image?filename=${reviews[0]?.hostProfileName}`} alt="작성자 프로필 사진 " width="30" height="30" style={{ borderRadius: "50%" , width:"30px"}} />
                    <strong>{r.hostName}</strong>
                  </div>
                  <span>{r.responseDate}</span>
                </div>
                <div>{r.revRegCotnent}</div>
              </div>
            )}
          </div>
        ))}
      </div>
      {reviews.length > 0 ?
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
        : <div className={styles.noneInq}>리뷰가 존재하지 않습니다.</div>
         }


    </div>
  );
} 
