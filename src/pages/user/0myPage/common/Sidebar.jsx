import React from 'react';
import './Sidebar.css';
// import badgeIcon from './icons/badge.jpg';
// import avatarImg from '../icons/avatar.jpg'; // 기본 아바타 이미지
import { useNavigate } from "react-router";
import { tokenAtom, userAtom } from "../../../../atoms";
import { myAxios ,url } from "../../../../config";
import { useSetAtom, useAtomValue, useAtom } from "jotai";

// 더미 유저 데이터
const dummyUser = {
    username: '유저이름',
    avatarUrl: 'data:image/jpeg;base64,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', // 실제 파일 위치에 맞게 경로 조정
    stats: {
        posts: 0,
        followers: 0,
        following: 0
    }
};

// user prop 예시:
// { username: 'USER', avatarUrl: '...', stats: { posts:0, followers:0, following:0 } }
export default function Sidebar() {
    const navigate = useNavigate();
    const [token,setToken] = useAtom(tokenAtom);
    const user = useAtomValue(userAtom);
    return (
        <aside className="KYM-sidebar">
            {/* 회원정보 섹션 */}
            <section className="KYM-member-info">
                <h3>회원정보</h3>
                <div className="KYM-member-box">
                    <img
                        className="KYM-member-avatar"
                        src={`${url}/image?filename=${user?.profile}`}
                        alt="아바타"
                    />
                    <div className="KYM-member-text">
                        <div className="KYM-member-name-line">
                            <strong className="KYM-member-name">{user.username}</strong>
                            {/* <img className="KYM-member-badge" src={badgeIcon} alt="배지" /> */}
                        </div>
                        {/* <div className="KYM-member-stats">
                            <span>게시물 {user.stats.posts}</span>
                            <span>팔로워 {user.stats.followers}</span>
                            <span>팔로잉 {user.stats.following}</span>
                        </div> */}
                    </div>
                </div>
                <div className="KYM-member-actions">
                    <button className="KYM-btn KYM-primary" onClick={()=> navigate(`/user/mypage/mySchedule`)}>모여링 일정</button>
                    <button className="KYM-btn">로그아웃</button>
                </div>
            </section>

            {/* 마이메뉴 섹션 */}
            <section className="KYM-my-menu">
                <h3>마이메뉴</h3>
                <nav>
                    <ul>
                        <li><strong>클래스링</strong></li>
                        <li><a href="/user/mypage/MyClassRegistList">수강 클래스링</a></li>
                        <li><a href="/user/mypage/myReviewList">클래스 후기</a></li>
                        <li><a href="/user/mypage/myClassInquiry">클래스 문의내역</a></li>

                        <li><strong>게더링</strong></li>
                        <li><a href="/user/mypage/myGatheringingApplyList">지원한 게더링</a></li>
                        <li><a href="/user/mypage/myGatheringList">내가 개설한 게더링</a></li>
                        <li><a href="/user/mypage/myGatheringInquiryList">게더링 문의</a></li>

                        <li><strong>소셜링</strong></li>
                        <li><a href="/user/mypage/myFeed">작성한 피드</a></li>
                        <li><a href="/user/mypage/myScraps">스크랩 목록</a></li>
                        <li><a href="/user/mypage/follower">팔로우 목록</a></li>
                        <li><a href="/user/mypage/following">팔로잉 목록</a></li>

                        <li><strong></strong></li>
                        <li><a href="/user/mypage/myWishlist">찜목록</a></li>
                        <li><a href="/user/mypage/myCouponList">마이 쿠폰</a></li>
                        <li><a href="/user/mypage/myAlarmList">알림 내역</a></li>
                        <li><a href="/user/mypage/myProfile">내 정보 수정</a></li>
                    </ul>
                </nav>
            </section>
        </aside>
    );
}