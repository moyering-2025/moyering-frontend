import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Follower.css';
import searchIcon from './icons/search.png';
import { myAxios, url } from '../../../config';
import { useAtom } from 'jotai';
import { tokenAtom } from '../../../atoms';
import Header from '../../common/Header';
import Sidebar from '../0myPage/common/Sidebar';
import Footer from '../../common/Footer';

export default function Follower() {
    const [followers, setFollowers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const [token, setToken] = useAtom(tokenAtom);
    const observer = useRef();
    const PER_PAGE = 5;

    // ⭐ followers API 호출 함수
    const loadFollowers = useCallback(async () => {
        if (!token || loading || !hasMore) return;

        setLoading(true);
        try {
            const res = await myAxios(token, setToken).get('/user/socialing/follow/followers', {
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
            setFollowers(prev =>
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
        loadFollowers();
    }, [page, loadFollowers]);

    // 🔥 searchTerm 바뀌면 page를 0으로 초기화
    useEffect(() => {
        setPage(0);
        setHasMore(true);
        setFollowers([]);
    }, [searchTerm]);

    // 🔥 token 바뀌면 검색어 초기화
    useEffect(() => {
        setPage(0);
        setHasMore(true);
        setFollowers([]);
        setSearchTerm('');
    }, [token]);

    // 🔥 마지막 요소를 감시해서 페이지 증가
    const lastFollowerRef = useCallback(node => {
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
            <div className="KYM-follower-main">
                <Sidebar />
                <div className="KYM-follower-container">
                    <h2 className="KYM-follower-header">팔로워 목록</h2>

                    <div className="KYM-follower-controls">
                        <span className="KYM-follower-count">
                            팔로워 수: {followers.length}
                        </span>
                        <div className="KYM-follower-search">
                            <input
                                type="text"
                                placeholder="팔로워 검색"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <img src={searchIcon} alt="검색" />
                        </div>
                    </div>

                    {!loading && followers.length === 0 && (
                        <div className="KYM-no-followers">팔로워가 없습니다.</div>
                    )}

                    <ul className="KYM-follower-list">
                        {followers.map((user, idx) => {
                            const isLast = idx === followers.length - 1;
                            return (
                                <li
                                    key={user.id}
                                    ref={isLast ? lastFollowerRef : null}
                                    className="KYM-follower-item"
                                >
                                    <div className="KYM-follower-user">
                                        <img
                                            src={user.profile ? `${url}/iupload/${user.profile}` : "/profile.png"}
                                            alt=""
                                            className="KYM-follower-avatar"
                                        />
                                        <span className="KYM-follower-nickname">{user.nickName}</span>
                                    </div>
                                    <button
                                        className="KYM-follower-button"
                                        onClick={() =>
                                            (window.location.href = `/userfeed/${user.nickName}`)
                                        }
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
