import React, { useEffect, useState } from 'react';
import './UserLogin.css';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useNavigate, useSearchParams } from 'react-router';
import { tokenAtom, userAtom, fcmTokenAtom } from '../../atoms';
import axios from 'axios';
import { myAxios, url } from './../../config';

const Login = () => {
  const [login, setLogin] = useState({ username: '', password: '' })
  const setUser = useSetAtom(userAtom);
  const setToken = useSetAtom(tokenAtom)
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const fcmToken = useAtomValue(fcmTokenAtom);
  const edit = (e) => {
    setLogin({ ...login, [e.target.name]: e.target.value });
  }
  const handleLogin = (e) => {
    e.preventDefault();
    let formData = new FormData();
    formData.append("username", login.username);
    formData.append("password", login.password);
    formData.append("fcmToken", fcmToken);
    myAxios().post("login", formData)
      .then(res => {
        console.log(res);
        setToken(res.headers.authorization);
        const user = res.data;
        setUser({ ...user });
        navigate("/")
      })
      .catch(err => {
        console.log(err);
      })
    // 실제 로그인 처리 로직은 여기에 추가
  };

  

  return (
    <div className="KHJ-login-container">
      <div className="KHJ-login-box">
        <img src="/logo.png" alt="로고" className="KHJ-login-logo" />
        <h2>로그인</h2>
        <form onSubmit={handleLogin} className="KHJ-login-form">
          <label>아이디</label>
          <input
            type="text"
            placeholder="아이디"
            name="username"
            value={login.username}
            onChange={edit}
          />
          <label>비밀번호</label>
          <input
            type="password"
            placeholder="비밀번호"
            name="password"
            value={login.password}
            onChange={edit}
          />
          <button type="submit" className="KHJ-login-btn">로그인</button>
        </form>
        <a href={`${url}/oauth2/authorization/kakao`} className="KHJ-kakao-btn" >
          <img src="/kakao.png" alt="카카오" className="KHJ-kakao-icon" />
          카카오로 시작하기
        </a>
      </div>
    </div>
  );
};

export default Login;