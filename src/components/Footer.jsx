import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer-soy">
      <div className='logo'>
        <img src="../../public/no-image_1.png" alt="" />
      </div>
      <div className="footer-inner">
        <p>© 모여링 | 고객센터 </p>
        <p>주소: 서울시 모여구 클래스동 123</p>
        <p>Tel. 031-123-1234</p>
        <p>Email. admin@moyering.com</p>
        <p>ⓒ 2025 MOYERING ALL rights reserved</p>
      </div>
    </footer>
  );
}



export default Footer;
