import React from 'react';
import './Headers.css';
import { useNavigate } from 'react-router';


export default function Header() {
  const navigate = useNavigate();
  return (
    <header className="KHJ-host-header">
      <h1 className="KHJ-host-header-title">호스트 마이 페이지</h1>
      <img src='/no-image_1.png' className="KHJ-host-logo" onClick={() => navigate('/')}></img>
    </header>
  );
}
