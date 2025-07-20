import React, { useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { registerServiceWorker, firebaseReqPermission } from "./firebaseconfig";
import UserLogin from './pages/common/UserLogin';
import UserJoin from './pages/common/UserJoin';
import UserJoinCategory from './pages/common/UserJoinCategory';
import UserJoinSuccess from './pages/common/UserJoinSuccess';
import ClassCalendar from './pages/host/ClassCalendar';
import ClassDetail from './pages/host/ClassDetail/ClassDetail';
import ClassRegisterPage from './pages/host/ClassRegist/ClassRegisterPage';
import ClassReview from './pages/host/ClassReview';
import ClassSettlement from './pages/host/ClassSettlement';
import DashboardLayout from './pages/host/DashboardLayout';
import HostClassList from './pages/host/HostClassList';
import HostIntroPage from './pages/host/HostIntroPage';
import HostProfile from './pages/host/HostProfile';
import HostRegist from "./pages/host/HostRegist.jsx"

import Inquiry from './pages/host/Inquiry';
import MainContent from './pages/host/MainContent';
import SettlementInfo from './pages/host/SettlementInfo';
import StudentSearch from './pages/host/StudentSearch';
import './App.css';
import FeedDetail from './pages/user/socialRing/FeedDetail';

import UserFeed from './pages/user/socialRing/UserFeed';
import Test2 from './pages/user/socialRing/Test2.jsx';
import MyScrapList from './pages/user/socialRing/MyScrapList.jsx';
import NoticeList from './pages/common/NoticeList';
import NoticeDetail from './pages/common/NoticeDetail';
import DmChat from './pages/user/gathering/DmChat.jsx';

// 관리자 페이지
import BannerCreateModal from "./pages/admin/BannerCreateModal";
import BannerManagement from "./pages/admin/BannerManagement";
// import CategoryManagement from "./pages/admin/CategoryManagement";
import ClassManagement from "./pages/admin/ClassManagement";
import ClassManagementDetail from "./pages/admin/ClassManagementDetail";
import Dashboard from "./pages/admin/Dashboard";
import Login from "./pages/admin/Login";
import MemberManagement from "./pages/admin/MemberManagement";
import NoticeCreate from "./pages/admin/NoticeCreate";
import NoticeEdit from "./pages/admin/NoticeEdit"
import CouponManagement from './pages/admin/CouponManagement.jsx';
import BadgeAndScore from './pages/admin/BadgeAndScore.jsx';
import FeedCreate from './pages/user/socialRing/FeedCreate.jsx';
import NoticeManagement from "./pages/admin/NoticeManagement";
import PaymentManagement from "./pages/admin/PaymentManagement";
// import ReportManagement from "./pages/admin/ReportManagement";
import TwoFactorAuth from "./pages/admin/TwoFactorAuth";
import SettlementManagement  from "./pages/admin/SettlementManagement"; 
// import SettlementModal  from "./pages/admin/SettlementModal.jsx"; 




import FeedEdit from './pages/user/socialRing/FeedEdit.jsx';
import MyFeed from './pages/user/socialRing/MyFeed.jsx';
import ScrapList from './pages/user/socialRing/ScrapList.jsx';
import Follower from './pages/user/socialRing/Follower.jsx';
import Following from './pages/user/socialRing/Following.jsx'
import HostFeedPage from './pages/user/socialRing/HostFeedPage.jsx';
import HostFeedCreate from './pages/user/socialRing/FeedHostCreate.jsx';


import ClassList from "./pages/common/ClassList.jsx";
import ClassRingDetail from "./pages/common/ClassRingDetail.jsx";

import Main from "./pages/common/Main.jsx";
import ClassInquiry from "./pages/user/0myPage/classRing/ClassInquiry.jsx";
import MyClassRegistList from "./pages/user/0myPage/classRing/MyClassRegistList.jsx";
import ReviewList from "./pages/user/0myPage/classRing/ReviewList.jsx";
import MyCouponList from "./pages/user/0myPage/common/MyCouponList.jsx";
import MySchedule from "./pages/user/0myPage/common/MySchedule.jsx";
import MyWishlist from "./pages/user/0myPage/common/MyWishlist.jsx";
import ClassPayment from "./pages/user/classRing/ClassPayment.jsx";

//게더링
import GatheringDetail from "./pages/common/GatheringDetail";
import GatheringWrite from "./pages/user/gathering/GatheringWrite";
import GatheringModify from "./pages/user/gathering/GatheringModify";

import MyGatheringList from "./pages/user/0myPage/gathering/MyGatheringList";
import MyGatheringApplyList from "./pages/user/0myPage/gathering/MyGatheringApplyList";
import MyAlarmList from "./pages/user/0myPage/common/MyAlarmList.jsx";
import MyGatherInquiryList from "./pages/user/0myPage/gathering/MyGatherInquiryList.jsx";
import GatheringChat from './pages/user/gathering/GatheringChatRoomList.jsx';
import GatheringList from './pages/common/GatheringList.jsx';
import ClassRingReviewList from './pages/common/ClassRingReviewList.jsx';

import Token from './components/Token';
import { useSetAtom, useAtom } from 'jotai'
import { fcmTokenAtom, alarmsAtom } from './atoms'
import ClassUpdatePage from './pages/host/ClassUpdate/ClassUpdatePage.jsx';
import PaymentSuccess from './pages/user/classRing/PaymentSuccess.jsx';
import MyProfilePage from './pages/user/0myPage/common/MyProfilePage.jsx';
import FindId from './pages/common/FindId.jsx';
import FindPassword from './pages/common/FindPassword.jsx';
import ResetPassword from './pages/common/ResetPassword.jsx';
import HostFeedDetail from './pages/user/socialRing/HostFeedDetail.jsx';
import MainSearch from './pages/common/MinSearch.jsx';
import HostFeedEdit from './pages/user/socialRing/HostFeedEdit.jsx';
import PaymentResult from './pages/user/classRing/PaymentResult.jsx';

function App() {
  const [alarm, setAlarm] = useState({});
  const setFcmToken = useSetAtom(fcmTokenAtom);
  const [alarms, setAlarms] = useAtom(alarmsAtom);

  useEffect(() => {
    registerServiceWorker();
    navigator.serviceWorker.ready.then(() => {
      firebaseReqPermission(setFcmToken, setAlarm);
    })
  }, [])

  useEffect(() => {
    JSON.stringify(alarm) !== "{}" && setAlarms([alarm, ...alarms]);
  }, [alarm]);

  return (
    <Router>
      <Routes>
        {/* 공통 /~~~으로 시작 */}
        <Route path="/" element={<Main />} />
        <Route path="/mainSearch" element={<MainSearch />}/>
        <Route path="/classList" element={<ClassList />} />
        <Route path="/gatheringList" element={<GatheringList />} />
        <Route path="/class/classRingDetail/:classId" element={<ClassRingDetail />} />
        <Route path="/gatheringDetail/:gatheringId" element={<GatheringDetail />} />

        <Route path="/userFeed/:nickname" element={<UserFeed />} />
        <Route path="/feed/:feedId" element={<FeedDetail />} />
        <Route path="/token" element={<Token />} />
        <Route path="/findId" element={<FindId />} />
        <Route path="/findPassword" element={<FindPassword />} />
        <Route path="/resetPassword" element={<ResetPassword />} />
        {/* <Route path="/sidebar" element={<Sidebar />} /> */}
        <Route path="/feeds" element={<Test2 />} />
        <Route path="/hostFeeds" element={<HostFeedPage />} />
        <Route path="/host/createFeed" element={<HostFeedCreate />} />
        <Route path="/hostFeed/:feedId" element={<HostFeedDetail />} />
        <Route path="/host/feedEdit/:feedId" element={<HostFeedEdit />} />


        <Route path="/scrapList" element={<ScrapList />} />

        <Route path="/join" element={<UserJoin />} />
        <Route path="/joinCategory" element={<UserJoinCategory />} />
        <Route path="/joinSuccess" element={<UserJoinSuccess />} />
        <Route path="/userlogin" element={<UserLogin />} />
        <Route path="/classRingReviewList/:hostId" element={<ClassRingReviewList />} />
        <Route path="/noticeList" element={<NoticeList />} />
        <Route path="/notice/:noticeId" element={<NoticeDetail />} />

        {/* 로그인한 유저 /user/~~~ */}
        <Route path="/user/classPayment/:classId/:selectedCalendarId" element={<ClassPayment />} />
        <Route path="/user/gatheringWrite" element={<GatheringWrite />} />
        <Route path="/user/gatheringModify/:gatheringId" element={<GatheringModify />} />
        <Route path="/user/logout" />
        <Route path="/user/chat" element={<DmChat />} />
        <Route path="/user/chat2" element={<GatheringChat />} />
        <Route path="/user/feedCreate" element={<FeedCreate />} />
        <Route path="/user/feedEdit/:feedId" element={<FeedEdit />} />
        <Route path="/user/payment-success" element={<PaymentSuccess />} />
        <Route path="/user/payment/payment-result" element={<PaymentResult />} />

        {/* 유저의 마이페이지 /user/mypage/~~~~ */}
        <Route path="/user/mypage/mySchedule" element={<MySchedule />} />
        <Route path="/user/mypage/myReviewList" element={<ReviewList />} />
        <Route path="/user/mypage/myClassInquiry" element={<ClassInquiry />} />
        <Route path="/user/mypage/myCouponList" element={<MyCouponList />} />
        <Route path="/user/mypage/myWishlist" element={<MyWishlist />} />
        <Route exact path="/user/mypage/myGatheringList" element={<MyGatheringList />}></Route>
        <Route exact path="/user/mypage/myGatheringingApplyList" element={<MyGatheringApplyList />}></Route>
        <Route exact path="/user/mypage/myGatheringInquiryList" element={<MyGatherInquiryList />}></Route>
        <Route path="/user/mypage/myAlarmList" element={<MyAlarmList />} />
        <Route path="/user/mypage/follower" element={<Follower />} />
        <Route path="/user/mypage/following" element={<Following />} />
        <Route path="/user/mypage/myFeed" element={<MyFeed />} />
        <Route path="/user/mypage/myProfile" element={<MyProfilePage />} />
        <Route path="/user/mypage/myScraps" element={<MyScrapList />} />



        {/* 강사 /host/~~~~~ */}
        <Route path="/host/intro" element={<HostIntroPage />} />
        <Route path="/host/regist" element={<HostRegist />} />
        {/* <Route path="/host/regist" element={<HostRegist/>}/>  */}
        <Route element={<DashboardLayout />}>
          <Route path="/host/hostMyPage/" element={<MainContent />} />
          <Route path="/host/profile" element={<HostProfile />} />
          <Route path="/host/classRegist" element={<ClassRegisterPage />} />
          <Route path="/host/HostclassList" element={<HostClassList />} />
          <Route path="/host/students" element={<StudentSearch />} />
          <Route path="/host/settlementInfo" element={<SettlementInfo />} />
          <Route path="/host/inquiry" element={<Inquiry />} />
          <Route path="/host/calendar" element={<ClassCalendar />} />
          <Route path="/host/detail/:classId/:calendarId" element={<ClassDetail />} />
          <Route path="/host/classReview" element={<ClassReview />} />
          <Route path="/host/classSettlement" element={<ClassSettlement />} />
          <Route path="/host/classUpdate/:classId/:calendarId" element={<ClassUpdatePage />} />
        </Route>

        {/* 1차 로그인 화면  */}
        {/* 공통 /~~~으로 시작 */}

        {/* 로그인한 유저 /user/~~~ */}

        {/* 유저의 마이페이지 /user/mypage/~~~~ */}
        <Route path="/user/mypage/mySchedule" element={<MySchedule />} />
        <Route path="/user/mypage/reviewList" element={<ReviewList />} />
        <Route path="/user/mypage/classInquiry" element={<ClassInquiry />} />
        <Route path="/user/mypage/myCouponList" element={<MyCouponList />} />
        <Route path="/user/mypage/myClassRegistList" element={<MyClassRegistList />} />
        <Route path="/user/mypage/myWishlist" element={<MyWishlist />} />

        {/* 관리자(/admin) */}
        <Route path="/admin" element={<Login />} />                         {/* 1차 로그인 화면  */}
        <Route path="/admin/verify" element={<TwoFactorAuth />} />          {/* 2차 로그인 화면 (인증번호 입력) */}
        <Route path="/admin/dashboard" element={<Dashboard />} />        {/* 대시보드 페이지 */}
        <Route path="/admin/member" element={<MemberManagement />} />   {/* 회원 관리 페이지 */}
        <Route path="/admin/class" element={<ClassManagement />} />   {/* 클래스 관리 페이지 */}
        <Route path="/admin/class/:classId" element={<ClassManagementDetail />} />   {/* 클래스 관리 상세 페이지 */}
        <Route path="/admin/notice" element={<NoticeManagement />} />    {/* 공지사항 관리 페이지  */}
        <Route path="/admin/notice/create" element={<NoticeCreate />} />     {/* 공지사항 생성 모달  */}
        <Route path="/admin/notice/edit/:noticeId" element={<NoticeEdit />} />     {/* 공지사항 수정 페이지  */}
        <Route path="/admin/coupon" element={<CouponManagement />} />     {/* 쿠폰 관리 페이지  */}
        {/* <Route path="/admin/report" element={<ReportManagement />} />       신고관리 페이지  */}
        <Route path="/admin/banner" element={<BannerManagement />} />    {/* 배너관리 페이지  */}
        <Route path="/admin/banner/create" element={<BannerCreateModal />} />  {/* 배너등록 모달  */}
        <Route path="/admin/badge" element={<BadgeAndScore />} />    {/* 배지, 활동점수 관리 페이지  */}
        <Route path="/admin/payment" element={<PaymentManagement />} />     {/* 결제관리 페이지  */}
        <Route path="/admin/settlement" element={<SettlementManagement />} />          {/* 정산 관리 페이지  */}

        {/* <Route path="/admin/category" element={<CategoryManagement />} />    카테고리 관리 페이지  */}
      </Routes>
    </Router>
  );
}

export default App;