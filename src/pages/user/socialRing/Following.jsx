import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Following.css';
import searchIcon from './icons/search.png';
import { myAxios, url } from '../../../config';
import { useAtom } from 'jotai';
import { tokenAtom } from '../../../atoms';
import Header from '../../common/Header';
import Sidebar from '../0myPage/common/Sidebar';
import Footer from '../../common/Footer';

export default function FollowList() {
    const [followings, setFollowings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const [token, setToken] = useAtom(tokenAtom);
    const observer = useRef();
    const PER_PAGE = 5;

    // ⭐ followers API 호출 함수
    const loadFollowings = useCallback(async () => {
        if (!token || loading || !hasMore) return;

        setLoading(true);
        try {
            const res = await myAxios(token, setToken).get('/user/socialing/follow/followings', {
                params: {
                    page,
                    size: PER_PAGE,
                    search: searchTerm.trim()
                }
            });

            const data = res.data;
            console.log('fetched:', data);

            if (data.length < PER_PAGE) {
                setHasMore(false);
            }

            // page 0이면 초기화, 아니면 누적
            setFollowings(prev =>
                page === 0 ? data : [...prev, ...data]
            );

        } catch (err) {
            console.error('API 에러:', err);
        } finally {
            setLoading(false);
        }
    }, [token, page, searchTerm, hasMore]);

    // 🔥 page 변경될 때마다 load
    useEffect(() => {
        loadFollowings();
    }, [page, loadFollowings]);

    // 🔥 searchTerm 바뀌면 page를 0으로 초기화
    useEffect(() => {
        setPage(0);
        setHasMore(true);
        setFollowings([]);
    }, [searchTerm]);

    // 🔥 token 바뀌면 검색어 초기화
    useEffect(() => {
        setPage(0);
        setHasMore(true);
        setFollowings([]);
        setSearchTerm('');
    }, [token]);

    // 🔥 마지막 요소를 감시해서 페이지 증가
    const lastFollowingRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                console.log('마지막 요소 감지 -> 다음 페이지');
                setPage(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [hasMore, loading]);

    return (
        <>
            <Header />
            <div className="KYM-following-main">
                <Sidebar />
                <div className="KYM-following-container">
                    <h2 className="KYM-following-header">팔로잉 목록</h2>

                    <div className="KYM-following-controls">
                        <span className="KYM-following-count">
                            팔로잉 수: {followings.length}
                        </span>
                        <div className="KYM-following-search">
                            <input
                                type="text"
                                placeholder="팔로잉 검색"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <img src={searchIcon} alt="검색" />
                        </div>
                    </div>

                    {!loading && followings.length === 0 && (
                        <div className="KYM-no-following">팔로잉이 없습니다.</div>
                    )}

                    <ul className="KYM-following-list">
                        {followings.map((user, idx) => {
                            const isLast = idx === followings.length - 1;
                            return (
                                <li
                                    key={user.id}
                                    ref={isLast ? lastFollowingRef : null}
                                    className="KYM-following-item"
                                >
                                    <div className="KYM-following-user">
                                        <img
                                            src={user.profile ? `${url}/iupload/${user.profile}` : "/profile.png"}
                                            alt=""
                                            className="KYM-following-avatar"
                                        />
                                        <span className="KYM-following-nickname">{user.nickName}</span>
                                    </div>
                                    <button
                                        className="KYM-following-button"
                                        onClick={() => (window.location.href = `/userfeed/${user.nickName}`)}
                                    >
                                        피드로 가기 &gt;
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    {loading && <div className="loading">로딩 중...</div>}
                </div>
            </div>
            <Footer/>
        </>

    );
}
