import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { tokenAtom } from '../../../../atoms';
import { myAxios } from '../../../../config';
import { formatDateTime } from './dateFormat';
import Header from '../../../common/Header';
import Footer from '../../../../components/Footer';
import Sidebar from './Sidebar';
import styles from './MyCouponList.module.css';

export default function MyCouponList() {
  const token = useAtomValue(tokenAtom);
  const setToken = useSetAtom(tokenAtom);

  const [coupons, setCoupons] = useState([]);
  const [page, setPage] = useState(0);
  const [size] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token ) {
      setLoading(false);
      return;
    }

    const fetchCoupons = async () => {
      setLoading(true);
      try {
        const res = token && await myAxios(token, setToken).get(
          `/user/mypage/myCouponList?page=${page}&size=${size}`
        );
        const { content, totalPages: tp } = res.data;  // PageResponseDto 구조
        setCoupons(content);
        setTotalPages(tp);
      } catch (e) {
        console.error('쿠폰 가져오기 실패', e);
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, [token, page, size]);

  if (error)   return <p>쿠폰을 불러오는 중 오류가 발생했습니다.</p>;

  return (
    <>
      <Header />
      <main className={styles.couponContent}>
        <aside className={styles.sidebarArea}>
          <Sidebar />
        </aside>
        <section className={styles.couponList}>
          <h2 className={styles.title}>마이 쿠폰</h2>
          {coupons.length === 0 && <p className={styles.noneCoupon}>사용 가능한 쿠폰이 없습니다.</p>}

          {coupons.map((coupon) => (
            <div key={coupon.userCouponId} className={styles.couponBox}>
              <div className={styles.couponHeader}>
                {
                  coupon.discountType==='RT' ? <strong>[{coupon.discount}%] {coupon.couponName}</strong> 
                  : <strong>[{coupon.discount}원] {coupon.couponName}</strong>
                }
                
                <span
                  className={
                    coupon.status === '사용'
                      ? styles.usedBadge
                      : styles.notUsedBadge
                  }
                >
                  {coupon.status}
                </span>
              </div>
              <div className={styles.couponType}>{coupon.type}</div>
              <div className={styles.couponDate}>
                유효기간:{' '}
                {formatDateTime(coupon.validFrom)} ~{' '}
                {formatDateTime(coupon.validUntil)}
              </div>
            </div>
          ))}

          {/* 간단 페이지네이션 */}
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                disabled={page === 0}
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`${styles.pageBtn} ${page === i ? styles.pageBtnActive : ''}`}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}

              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                disabled={page + 1 === totalPages}
              >
                &gt;
              </button>
            </div>

        </section>
      </main>
      <Footer />
    </>
  );
}
