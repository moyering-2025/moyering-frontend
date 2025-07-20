import React from 'react';
import './LoginHeaders.css';
import { useNavigate } from 'react-router';

export default function LoginHeader() {
  const navigate = useNavigate();
  return (
    <header className="KHJ-join-header">
      <img
        src="/no-image_1.png"
        className="KHJ-join-logo"
        onClick={() => navigate('/')}
        alt="로고"
      />
      {/* <h1 className="KHJ-join-header-title">회원가입</h1> */}
    </header>
  );
}
