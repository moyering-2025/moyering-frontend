import React, { useEffect, useRef, useState, useMemo } from 'react';
import './MyFeed.css';
import heartOutline from './icons/heart-outline.png';
import heartFilled from './icons/heart-filled.png';
import moreIcon from './icons/more.png';
import Header from '../../common/Header';
import Sidebar from '../0myPage/common/Sidebar';
import { myAxios, url } from '../../../config';
import { useAtom, useAtomValue } from 'jotai';
import { tokenAtom, userAtom } from '../../../atoms';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LuMessageCircleMore } from "react-icons/lu";
import Footer from '../../common/Footer';

export default function MyFeed() {
  const [token, setToken] = useAtom(tokenAtom);
  const user = useAtomValue(userAtom);
  const [currentImage, setCurrentImage] = useState({});
  const [menuOpenId, setMenuOpenId] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const menuRef = useRef(null);
  const [likeCounts,setLikeCounts] = useState({})

  // 👉 좋아요한 feedId 리스트
  const { data: likedIds = [] } = useQuery({
    queryKey: ['myLikes', user.id, token],
    queryFn: async () => {
      if (!token) return [];
      const res = await myAxios(token, setToken).get("/user/socialing/likes");
      return res.data.filter(item => item.likedByUser).map(item => item.feedId);
    },
    enabled: !!token
  });

  // 👉 내 피드
  const { data: feedList = [] } = useQuery({
    queryKey: ['myFeeds', user.id, token],
    queryFn: async () => {
      if (!token) return [];
      const res = await myAxios(token, setToken).get("/socialing/feeds/myFeeds", {
        params: { userId: user.id }
      });
      // 초기 이미지 인덱스 설정
      const initIndices = {};
      res.data.feedList.forEach(feed => {
        initIndices[feed.feedId] = 0;
      });
      setCurrentImage(initIndices);
      return res.data.feedList;
    },
    enabled: !!token
  });

  useEffect(()=>{
    token&&myAxios(token,setToken).get(`/socialing/feeds/myFeedsLikeCount?userId=${user.id}`)
    .then(res=>{
      console.log("좋아요수")
      console.log(res.data);
      setLikeCounts(res.data);
    })
    .catch(err=>{
      console.log(err);
    })
  },[token])

  // 👉 좋아요 여부 Set
  const likedFeedIdSet = useMemo(() => new Set(likedIds), [likedIds]);

  // 👉 feeds에 likedByUser 적용
  const feedsWithLikeStatus = useMemo(() => {
    return feedList.map(feed => ({
      ...feed,
      likedByUser: likedFeedIdSet.has(Number(feed.feedId)),
      likeCount : likeCounts[feed.feedId] || 0,
    }));
  }, [feedList, likedFeedIdSet,likeCounts]);

  // 👉 좋아요 mutation
  const likeMutation = useMutation({
    mutationFn: (feedId) => myAxios(token, setToken).post(`/user/socialing/likes/${feedId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['myLikes', user.id, token]);
      queryClient.invalidateQueries(['myFeeds', user.id, token]);
    }
  });

  const toggleLike = (feed) => {
    if (!token) return alert("로그인이 필요합니다.");
    likeMutation.mutate(feed.feedId);
  };

  // 👉 스크랩 mutation
  const scrapMutation = useMutation({
    mutationFn: async (feed) => {
      if (!token) return;
      if (!feed.scrapped) {
        return myAxios(token, setToken).post(`/user/socialing/scrap`, null, { params: { feedId: feed.feedId } });
      } else {
        return myAxios(token, setToken).delete(`/user/socialing/scrap/${feed.feedId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myFeeds', user.id, token]);
    }
  });

  const toggleScrap = (feed) => {
    if (!token) return alert("로그인이 필요합니다.");
    scrapMutation.mutate(feed);
  };

  // 👉 삭제
  const handleDelete = async (feedId) => {
    try {
      await myAxios(token, setToken).delete(`/user/${feedId}`);
      alert("삭제 완료!");
      queryClient.invalidateQueries(['myFeeds', user.id, token]);
    } catch (e) {
      console.error(e);
      alert("삭제 실패");
    }
  };

  // 👉 공유
  const handleShare = (feed) => {
    if (navigator.share) {
      navigator.share({
        title: '게시물',
        text: '나의 게시물 공유',
        url: `${window.location.origin}/feed/${feed.feedId}`,
      }).catch(console.error);
    } else {
      alert("공유를 지원하지 않는 브라우저입니다.");
    }
  };

  // 👉 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpenId && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpenId]);

  return (
    <>
      <Header />
      <div className='KYM-myfeed-wrapper'>
        <div className='KYM-myfeed-sidebar'>
          <Sidebar />
        </div>
        <div className="KYM-myfeed-container">
          <h3 className="KYM-myfeed-title">나의 피드</h3>
          <div className="KYM-myfeed-grid">
            {feedsWithLikeStatus.map(feed => {
              const images = [feed.img1, feed.img2, feed.img3, feed.img4, feed.img5].filter(Boolean);
              const currentIdx = currentImage[feed.feedId] || 0;

              return (
                <div key={feed.feedId} className="KYM-myfeed-card">
                  <div className="KYM-myfeed-header">
                    <div className="KYM-myfeed-user-info">
                      <img src={user.profile ? `${url}/iupload/${user.proflie}` : '/profile.png'} alt='프로필' className="KYM-myfeed-avatar" />
                      {/* <img src={`${url}/iupload/${user.profile}`} alt='프로필' className="KYM-myfeed-avatar" /> */}
                      <span className="KYM-myfeed-nickname">{feed.writerId}</span>
                      {feed.writerBadgeImg &&
                        <img src={`/badge_${ed.writerBadgeImg}.png`} alt="대표 배지" className="KYM-myfeed-badge" />
                      }
                      <span className="KYM-myfeed-date">{feed.createdAt}</span>
                    </div>
                    <div className="KYM-post-wrapper">
                      <img
                        src={moreIcon}
                        alt="더보기"
                        className="KYM-more-icon"
                        onClick={() => setMenuOpenId(menuOpenId === feed.feedId ? null : feed.feedId)}
                      />
                      {menuOpenId === feed.feedId && (
                        <ul ref={menuRef} className="KYM-post-menu open">
                          {/* <li onClick={() => { handleDelete(feed.feedId); setMenuOpenId(null); }}>삭제하기</li>
                          <li onClick={() => { console.log(`신고: ${feed.feedId}`); setMenuOpenId(null); }}>신고하기</li> */}
                          <li onClick={() => { toggleScrap(feed); setMenuOpenId(null); }}>
                            {feed.scrapped ? '스크랩 해제' : '스크랩하기'}
                          </li>
                          <li onClick={() => { navigate(`/feed/${feed.feedId}`); setMenuOpenId(null); }}>게시물로 이동</li>
                          <li onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/feed/${feed.feedId}`);
                            alert("링크 복사됨");
                            setMenuOpenId(null);
                          }}>링크복사</li>
                          {/* <li onClick={() => { handleShare(feed); setMenuOpenId(null); }}>공유하기</li> */}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="KYM-myfeed-image-wrapper"
                    onClick={() => navigate(`/feed/${feed.feedId}`)}
                    style={{ cursor: "pointer" }}>
                    <img src={`${url}/iupload/${images[currentIdx]}`} alt="내 게시물" className="KYM-myfeed-image" />
                    {images.length > 1 && (
                      <>
                        <button className="KYM-image-nav left"
                          onClick={(e) => { e.stopPropagation(); setCurrentImage(prev => ({ ...prev, [feed.feedId]: (currentIdx - 1 + images.length) % images.length })); }}>‹</button>
                        <button className="KYM-image-nav right"
                          onClick={(e) => { e.stopPropagation(); setCurrentImage(prev => ({ ...prev, [feed.feedId]: (currentIdx + 1) % images.length })); }}>›</button>
                      </>
                    )}
                    <div className="KYM-image-dots">
                      {images.map((_, i) => (
                        <span key={i} className={i === currentIdx ? 'KYM-dot active' : 'KYM-dot'}>●</span>
                      ))}
                    </div>
                  </div>

                  <div className="KYM-myfeed-content">
                    <p>{feed.content}</p>
                    <div className="KYM-myfeed-hashtags">
                      {[feed.tag1, feed.tag2, feed.tag3, feed.tag4, feed.tag5]
                        .filter(Boolean)
                        .map((tag, i) => (
                          <span key={i} className="KYM-myfeed-hashtag">#{tag}</span>
                        ))}
                    </div>
                  </div>

                  <div className="KYM-myfeed-footer">
                    <button className={`KYM-myfeed-like-btn${feed.likedByUser ? ' active' : ''}`}
                      onClick={() => toggleLike(feed)}>
                      <img src={feed.likedByUser ? heartFilled : heartOutline} alt="좋아요" className="KYM-myfeed-icon" />
                      <span>{feed.likeCount}</span>
                    </button>
                    <button className="KYM-comment-button" onClick={() => navigate(`/feed/${feed.feedId}`)}>
                      <LuMessageCircleMore/>  {feed.commentsCount}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
}
