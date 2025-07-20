import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer-soy">
      <div className='soysoy'> 
      <div className='logo'>
        <img src="../../public/no-image_1.png" alt="" />
      </div>
      <div className="footer-inner">
        <div className="footer-inner2">
        <span>© 모여링 | 고객센터 </span>
        <span>주소: 서울시 모여구 클래스동 123</span>
        </div>

        <div className="footer-inner2">
          <span>Tel. 031-123-1234</span>
          <span>Email. admin@moyering.com</span>
          <span>ⓒ 2025 MOYERING ALL rights reserved</span>
        </div>

      </div>
      </div>
      
    </footer>
  );
}

export default Footer;
