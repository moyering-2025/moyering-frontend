// src/components/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import React from 'react'; 
import { myAxios } from './../../config';
import { tokenAtom, userAtom } from './../../atoms';
import { useSetAtom } from 'jotai';

const Login = () => {
 const navigate = useNavigate();
 const [formData, setFormData] = useState({
   username: '',
   password: ''
 });
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);
 const setToken = useSetAtom(tokenAtom);
 const setUser = useSetAtom(userAtom);

 const handleInputChange = (e) => {
   const { name, value } = e.target;
   setFormData(prev => ({
     ...prev,
     [name]: value
   }));
 };

 const handleSubmit = async (e) => {
   e.preventDefault();
   setLoading(true);
   setError('');

   const params = new FormData();
   params.append('username', formData.username);
   params.append('password', formData.password);

   myAxios(null,setToken).post("/login", params)
    .then(res=> {
      console.log(res)
      setUser(res.data)
     // 역할별 페이지 이동
     if (res.data.userType === 'ROLE_MG') {
       navigate('/admin/dashboard');
     } else {
       navigate('/'); // 일반 사용자는 메인 페이지로
     }      
    })
    .catch(err => {
      console.log(err)
    })
 };

 return (
   <div className="login-containerHY">
     <div className="login-boxHY">
       <div className="logo-sectionHY">
         <div className="logoHY">
           <img src="/logo_managerLogin_2.png" alt="모여링 로고" className="logo-imageHY" />
         </div>
       </div>

       {/* 로그인 폼 */}
       <form onSubmit={handleSubmit} className="login-formHY">
         {error && <div className="error-message" style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
         
         <div className="input-groupHY">
           <label htmlFor="username" className="input-labelHY">아이디</label>
           <input
             type="text"
             id="username"
             name="username"
             onChange={handleInputChange}
             placeholder="관리자 아이디"
             className="input-fieldHY"
             required
           />
         </div>

         <div className="input-groupHY">
           <label htmlFor="password" className="input-labelHY">비밀번호</label>
           <input
             type="password"
             id="password"
             name="password"
             onChange={handleInputChange}
             placeholder="비밀번호"
             className="input-fieldHY"
             required
           />
         </div>

         <button 
           type="submit" 
           className="login-buttonHY"
          //  disabled={loading}
         >
           {/* {loading ? '로그인 중...' : '로그인'} */}
           로그인
         </button>
       </form>
     </div>
   </div>
 );
};

export default Login;