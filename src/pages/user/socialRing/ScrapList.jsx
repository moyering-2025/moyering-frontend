import React, { useEffect, useState } from 'react';
import './ScrapList.css';
import badgeIcon from './icons/badge.jpg';
import heartOutline from './icons/heart-outline.png';
import heartFilled from './icons/heart-filled.png';
import commentIcon from './icons/comment.svg';
import Footer from '../../common/Footer';



export default function ScrapList() {
  const [scraps, setScraps] = useState([]);

  useEffect(() => {
    // 실제 API 연동 전에는 더미 데이터로 세팅
    setScraps();
  }, []);

  const toggleLike = id => {
    setScraps(scraps.map(s =>
      s.id === id
        ? { ...s, liked: !s.liked, likeCount: s.liked ? s.likeCount - 1 : s.likeCount + 1 }
        : s
    ));
  };

  return (
    <>
    <div className="KYM-scraplist-container">
      <h2 className="KYM-scraplist-header">📑 스크랩 목록</h2>
      <div className="KYM-scraplist-grid">
        {scraps.map(post => (
          <div key={post.id} className="KYM-scrap-card">
            <div className="KYM-scrap-header">
              <div className="KYM-scrap-user">
                <div className="KYM-scrap-avatar" />
                <span className="KYM-scrap-nickname">{post.author}</span>
                <img src={badgeIcon} alt="배지" className="KYM-scrap-badge"/>
                <span className="KYM-scrap-date">{post.date}</span>
              </div>
            </div>
            <img src={post.imageUrl} alt="" className="KYM-scrap-image" />
            <p className="KYM-scrap-content">{post.content}</p>
            <div className="KYM-scrap-hashtags">
              {post.hashtags.map(tag => (
                <span key={tag} className="KYM-scrap-tag">{tag}</span>
              ))}
            </div>
            <div className="KYM-scrap-footer">
              <button
                className={`KYM-like-btn${post.liked ? ' active' : ''}`}
                onClick={() => toggleLike(post.id)}
              >
                <img
                  src={post.liked ? heartFilled : heartOutline}
                  alt="좋아요"
                  className="KYM-icon"
                />
                <span>{post.likeCount}</span>
              </button>
              <button className="KYM-comment-btn">
                <img src={commentIcon} alt="댓글" className="KYM-icon"/>
                <span>{post.commentCount}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    <Footer/>
    </>
  );
}
