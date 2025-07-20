import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';
import { useSetAtom } from 'jotai';
import { tokenAtom, userAtom } from '../../atoms';
import { useAtomValue } from 'jotai';


// React Icons 추가
import { 
  MdDashboard, 
  MdPeople, 
  MdSchool, 
  MdPayment, 
  MdAccountBalance,  
  MdLocalOffer, 
  MdEmojiEvents, 
  MdImage, 
  MdBarChart, 
  MdReport, 
  MdAnnouncement 
} from 'react-icons/md';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useSetAtom(userAtom);
  const setToken = useSetAtom(tokenAtom);
  const user = useAtomValue(userAtom); // 사용자 정보 가져오기 

  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: <MdDashboard />, path: '/admin/dashboard' },
    { id: 'member', label: '회원관리', icon: <MdPeople />, path: '/admin/member' },
    { id: 'class', label: '클래스 관리', icon: <MdSchool />, path: '/admin/class' },
    { id: 'payment', label: '결제 관리', icon: <MdPayment />, path: '/admin/payment' },
    { id: 'settlement', label: '정산내역 관리', icon: <MdAccountBalance />, path: '/admin/settlement' },
    { id: 'coupon', label: '쿠폰 관리', icon: <MdLocalOffer />, path: '/admin/coupon' },
    { id: 'badge', label: '배지 관리', icon: <MdEmojiEvents />, path: '/admin/badge' },
    { id: 'banner', label: '배너 관리', icon: <MdImage />, path: '/admin/banner' },
    // { id: 'statistics', label: '통계 리포트', icon: <MdBarChart />, path: '/admin/statistics' },
    // { id: 'report', label: '신고 관리', icon: <MdReport />, path: '/admin/report' },
    { id: 'notice', label: '공지사항 관리', icon: <MdAnnouncement />, path: '/admin/notice' },
  ];

  const handleMenuClick = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = '/admin';
  };

  return (
    <div className="admin-layoutHY">
      {/* 사이드바 */}
      <aside className="sidebarHY">
        <div className="sidebar-headerHY">
   
        </div>
        <nav className="sidebar-navHY">
          <ul className="menu-listHY">
            {menuItems.map((item) => (
              <li key={item.id} className="menu-itemHY">
                <button
                  className={`menu-linkHY ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => handleMenuClick(item.path)}
                >
                  <span className="menu-iconHY">{item.icon}</span>
                  <span className="menu-labelHY">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* 헤더 */}
      <header className="headerHY">
        <div className="header-leftHY">
          <div className="header-logoHY">
            <img 
              src="/no-image_1.png" 
              alt="모여링 로고" 
              className="header-logo-iconHY"
              onClick={() => navigate('/admin/dashboard')}
              style={{ cursor: 'pointer' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>
        <div className="header-rightHY">
          <span className="admin-nameHY">
            {/* username있으면 username 표시, 없으면 '관리자' */}
            {user?.username || '관리자'}  
          </span>
          <button className="logout-btnHY" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="main-contentHY">
        <main className="page-contentHY">{children}</main>
      </div>
    </div>
  );
};

export default Layout;