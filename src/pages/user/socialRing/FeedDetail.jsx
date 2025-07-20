import React, { useEffect, useRef, useState } from 'react';
import './FeedDetail.css';
import moreIcon from './icons/more.png';
import { useParams } from 'react-router-dom';
import { myAxios, url } from '../../../config';
import ReportModal from './ReportModal';
import EmojiPicker from 'emoji-picker-react';
import { useAtom, useAtomValue } from 'jotai';
import { tokenAtom, userAtom } from '../../../atoms';
import Header from '../../common/Header';
import FollowButton from './FollowButton';
import { useQuery } from '@tanstack/react-query';
import share from './icons/share.png';
import { LuMessageCircleMore } from "react-icons/lu";
import heartOutline from './icons/heart-outline.png';
import heartFilled from './icons/heart-filled.png';
import { useNavigate } from 'react-router-dom';
import Footer from '../../common/Footer';

export default function FeedDetail() {
  // Jotai atom에서 토큰 읽어오기
  const [token, setToken] = useAtom(tokenAtom)
  const isLoggedIn = Boolean(token);

  const [commentText, setCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReplyPickerId, setShowReplyPickerId] = useState(null);
  const { feedId } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [scrapped, setScrapped] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showReplies, setShowReplies] = useState({});
  const [replyText, setReplyText] = useState('');
  const menuRef = useRef(null);
  const [currentImage, setCurrentImage] = useState(0);
  const user = useAtomValue(userAtom);

  const [feed, setFeed] = useState([]);
  const [comment, setComment] = useState([]);

  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const currentUser = useAtomValue(userAtom);
  const isMyFeed = feed.writerUserId === currentUser.id;
  const navigate = useNavigate();

  useEffect(() => {
    myAxios().get(`/socialing/feed?feedId=${feedId}`)
      .then(res => {
        console.log("▶ COMMENT =", JSON.stringify(res.data.comments, null, 2));
        const data = res.data;
        console.log(res.data)
        setFeed(data);
        setComment(data.comments);
        setLikes(data.likesCount || 0);
        // FeedDetail에선 likedByUser 불확실하니까 별도 체크
        if (token) {
          myAxios(token, setToken).get(`/user/socialing/likes`)
            .then(likesRes => {
              const likedIds = likesRes.data.filter(f => f.likedByUser).map(f => f.feedId);
              setLiked(likedIds.includes(Number(feedId)));
            });
        }
      })
      .catch(console.error);
  }, [feedId, token]);

  if (error) return <div className="KYM-detail-container">{error}</div>;
  if (!feed) return <div className="KYM-detail-container">피드가 없습니다.</div>;

  const {
    content,
    tag1, tag2, tag3, tag4, tag5,
    writerId, writerProfile, writerBadge,
    createdAt, likesCount, likedByUser, mine,
    comments = [], moreImg1List = []
  } = feed;
  const images = [feed.img1, feed.img2, feed.img3, feed.img4, feed.img5].filter(src => src);
  const tags = [tag1, tag2, tag3, tag4, tag5].filter(Boolean);
  const formatDate = s => new Date(s).toLocaleDateString();

  const toggleMenu = () => {
    console.log("더보기 클릭됨");
    setShowMenu(v => !v);
  };
  const openReport = () => { setShowMenu(false); setShowReport(true); };
  const closeReport = () => setShowReport(false);
  console.log("▶ mine :", mine);


  const onToggleReplies = (commentId, replies) => {
    setShowReplies(prev => {
      const newReplies = { ...prev, [commentId]: !prev[commentId] };

      const openAllChildren = (children) => {
        if (!children) return;
        children.forEach(child => {
          newReplies[child.commentId] = true;
          if (child.replies && child.replies.length > 0) {
            openAllChildren(child.replies); // 재귀 호출로 계속 내려감
          }
        });
      };

      if (replies && newReplies[commentId]) {
        openAllChildren(replies);
      }
      return newReplies;
    });
  };


  const postComment = async () => {
    if (!commentText.trim()) return;
    try {

      const api = myAxios(token, setToken);
      const res = await api.post(`/user/socialing/feed/comment`, {

        feedId: feedId,
        content: commentText,
        parentId: null   // 최상위 댓글
      });
      const newComment = res.data;   // 서버에서 반환된 방금 등록된 댓글

      // 2) comment 배열에 바로 추가
      setComment(prev => [...prev, newComment]);
      // 등록 후 새로고침 대신 comments만 갱신
      const { data } = await myAxios().get(`/socialing/feed?feedId=${feedId}`);
      setFeed(data);
      setCommentText('');
    } catch (e) {
      console.error(e);
      alert('댓글 등록에 실패했습니다.');
    }
  };

  const replysubmit = async () => {

    try {

      //  올바른 엔드포인트, 올바른 Body
      const payload = {

        content: replyText,        // 답글 내용
        parentId: replyingTo      // 최상위라면 null
      };

      // console.log("▶ 요청 보낼 URL:", `/user/socialing/feed/${feedId}/comment`);
      // console.log("▶ 요청 보낼 payload:", payload);

      // 4️⃣ 실제 POST 요청
      const res = await myAxios(token, setToken).post(
        "/user/socialing/feed/comment", {
        feedId: feedId,
        content: replyText,
        parentId: replyingTo
      }
      );
      // 답글 등록 후 다시 불러오기
      const { data } = await myAxios().get(`/socialing/feed?feedId=${feedId}`);
      setFeed(data);
      setComment(data.comments);
      setReplyText('');
      setReplyingTo(null);

      console.log("▶ 댓글 등록 성공:", res.status, res.data);

    } catch (err) {
      // 5️⃣ 에러도 꼭 찍기
      console.error("▶ 댓글 등록 에러:", err.response?.status, err.response?.data);
    }
  };

  const onReplyClick = (commentId) => {
    setReplyingTo(prev => (prev === commentId ? null : commentId));
    setReplyText('');
  };


  // 이모지 선택 핸들러
  const onEmojiClick = (emojiData, event) => {
    setCommentText(text => text + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // 1. 마운트 시 / feedId 변경 시 스크랩 여부 조회
  useEffect(() => {
    let mounted = true;
    token && myAxios(token, setToken).get(`user/socialing/scrap/${feedId}`)
      .then(res => {
        if (mounted) setScrapped(res.data);
      })
      .catch(err => {
        console.error("피드 상세 조회 실패:", err);
        alert("피드를 불러오지 못했습니다.");
        navigate(-1);
      });
    return () => { mounted = false; };
  }, [token, feedId]);

  // 2. 스크랩 토글 함수
  const handleScrapToggle = () => {
    if (loading) return;
    setLoading(true);
    try {
      if (scrapped) {
        myAxios(token, setToken).delete(`/user/socialing/scrap/${feedId}`);
        setScrapped(false);
      } else {
        myAxios(token, setToken).post(`/user/socialing/scrap`, null, { params: { feedId } });
        setScrapped(true);
      }
    } catch (err) {
      console.error('스크랩 에러', err);
    } finally {
      setLoading(false);
    }
  };
  const { data: likedIds = [] } = useQuery({
    queryKey: ['likes'],
    queryFn: async () => {
      if (!token) return [];
      const res = await myAxios(token, setToken).get(`/user/socialing/likes`);
      return res.data.filter(item => item.likedByUser).map(item => item.feedId);
    },
    enabled: !!token
  });

  // 좋아요 토글
  const toggleLike = async () => {
    if (!isLoggedIn) return alert("로그인 후 이용해주세요.");
    try {
      await myAxios(token, setToken).post(`/user/socialing/likes/${feedId}`);
      setLiked(!liked);
      setLikes(prev => liked ? prev - 1 : prev + 1);
    } catch (err) {
      console.error('좋아요 토글 실패:', err);
      alert("좋아요 처리에 실패했습니다.");
    }
  };
  console.log('writerProfile =', writerProfile, typeof writerProfile);
  const renderComment = (c, level = 0) => (

    <div key={c.commentId} className="KYM-comment-block" style={{ marginLeft: `${level * 20}px` }}>
      <img
        className="KYM-detail-avatar"
        src={writerProfile ? `${url}/iupload/${writerProfile}` : "/profile.png"}
        alt="프로필"
      />
      <div className="KYM-comment-body">
        <div className="KYM-comment-header">
          <span className="KYM-comment-author">{c.writerId}</span>
        </div>
        <p className="KYM-comment-text">
          {c.parentWriterId && (
            <span style={{ color: '#888', fontWeight: 'bold', fontSize:'14px' }}>
              @{c.parentWriterId}
            </span>
          )}{" "}
          {c.content}
        </p>
        <div className="KYM-comment-actions">
          <span className="KYM-comment-date">{formatDate(c.createAt)}</span>
          {c.replies && c.replies.length > 0 && (
            <button
              className="KYM-reply-toggle"
              onClick={() => onToggleReplies(c.commentId, c.replies)}
            >
              {showReplies[c.commentId] ? '답글 숨기기' : '답글 보기'}
            </button>
          )}
          {isLoggedIn && (
            <button
              className="KYM-reply-add"
              onClick={() => onReplyClick(c.commentId)}
            >
              답글 달기
            </button>
          )}
        </div>

        {replyingTo === c.commentId && (
          <div className="KYM-add-comment">
            <span
              className="KYM-input-emoji"
              onClick={() => {
                if (!isLoggedIn) return window.alert('로그인 후 이용해주세요.');
                setShowReplyPickerId(c.commentId);
              }}
            >
              😊
            </span>
            {showReplyPickerId === c.commentId && (
              <div className="emoji-picker-wrapper">
                <EmojiPicker
                  onEmojiClick={(emojiData) => {
                    setReplyText(text => text + emojiData.emoji);
                    setShowReplyPickerId(null);
                  }}
                  disableSearchBar={true}
                />
              </div>
            )}
            <input
              className="KYM-input-field"
              placeholder={isLoggedIn ? "답글 달기..." : "로그인 후 댓글 작성 가능"}
              disabled={!isLoggedIn}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  replysubmit();
                }
              }}
            />
            <button
              className="KYM-input-post"
              disabled={!isLoggedIn || !replyText.trim()}
              onClick={replysubmit}
            >
              게시
            </button>
          </div>
        )}

        {/* {showReplies[c.commentId] && c.replies?.map(r => renderComment(r, level + 1))} */}
        {showReplies[c.commentId] && (c.replies || []).map(r => renderComment(r, level + 1))}
      </div>
    </div>
  );

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: '게시물 제목',
        text: '게시물 설명',
        url: window.location.href,
      })
        .catch(console.error);
    } else {
      alert("이 브라우저에서는 공유를 지원하지 않습니다. 카카오톡으로 공유하려면 별도 버튼을 이용하세요.");
      // 또는 Kakao.Share.sendDefault(...) 호출
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await myAxios(token, setToken).delete(`/user/${feedId}`);
      alert("삭제 완료");
      navigate("/feeds"); // 또는 원하는 경로
    } catch (e) {
      console.error(e);
      alert("삭제 실패");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <>
      <Header />
      <div className="KYM-detail-container">
        <div className="KYM-detail-main">
          <div className="KYM-detail-image">
            {images.length > 0 && (
              <>
                <img
                  src={`${url}/iupload/${images[currentImage]}`}
                  alt={`feed-${currentImage}`}
                />

                {/* 좌/우 내비게이션 */}
                {images.length > 1 && (
                  <>
                    <button
                      className="KYM-image-nav left"
                      onClick={() =>
                        setCurrentImage(
                          (currentImage - 1 + images.length) % images.length
                        )
                      }
                    >&lt;</button>

                    <button
                      className="KYM-image-nav right"
                      onClick={() =>
                        setCurrentImage((currentImage + 1) % images.length)
                      }
                    >&gt;</button>

                    <div className="KYM-image-dots">
                      {images.map((_, i) => (
                        <span
                          key={i}
                          className={i === currentImage ? 'dot active' : 'dot'}
                        >●</span>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <div className="KYM-detail-side">
            {/* header */}
            <div className="KYM-detail-header">
              <div className="KYM-left-info">
                <img className="KYM-detail-avatar" src={writerProfile ? `${url}/iupload/${writerProfile}` : "/profile.png"} alt="" onClick={() => navigate(`/userFeed/${writerId}`)} style={{ cursor: "pointer" }} />
                <span className="KYM-detail-nickname" onClick={() => navigate(`/userFeed/${writerId}`)} style={{ cursor: "pointer" }}>{writerId}</span>
                {feed.writerBadge &&
                  <img src={`/badge_${feed.writerBadgeImg}.png`} alt="대표 배지" className="KYM-detail-badge-img" />
                }
                {!mine
                  ? <FollowButton
                    targetUserId={feed.writerUserId}
                    className="KYM-follow-btn"
                    style={{ marginLeft: '8px' }}
                  />
                  : <>
                    <button className="KYM-edit-btn" onClick={() => navigate(`/feed/${feed.feedId}/edit`)}>수정</button>
                    <button className="KYM-edit-btn" onClick={() => navigate(`/some/other/path`)}>수정2</button>
                  </>
                }
              </div>
              <div className="KYM-more-wrapper" ref={menuRef}>
                <img className="KYM-detail-more" src={moreIcon} onClick={toggleMenu} alt="more" />
                {showMenu && (
                  <ul className="KYM-detail-menu">
                    {isMyFeed && (
                      <>
                        <li onClick={() => navigate(`/user/feedEdit/${feed.feedId}`)}>수정하기</li>
                        <li onClick={handleDelete}>삭제하기</li>
                      </>
                    )}
                    {/* <li onClick={openReport}>신고하기</li> */}
                    {/* <li onClick={() => navigator.clipboard.writeText(window.location.href)}>링크복사</li> */}
                    <li onClick={() => { navigator.clipboard.writeText(window.location.href); alert("링크가 복사되었습니다"); setShowMenu(false); }}>링크복사</li>
                    <li>공유하기</li>
                    <li>DM 보내기</li>
                    <li
                      onClick={() => {
                        handleScrapToggle();
                        setShowMenu(false);
                      }}
                      style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }}
                    >
                      {scrapped ? '스크랩 해제' : '스크랩하기'}
                    </li>
                  </ul>
                )}
              </div>
            </div>

            {/* content */}
            <div className="KYM-detail-content">{content}</div>
            <div className="KYM-hashtags">
              {tags.map((t, i) => <span key={i} className="KYM-hashtag">#{t}</span>)}
            </div>
            <div className="KYM-detail-date">{formatDate(createdAt)}</div>

            {/* comments */}

            <div className="KYM-detail-comments">
              {comment.map(c => renderComment(c))}
              {console.log("▶ showReplies:", showReplies)}
            </div>

            {/* 액션 + stats */}
            <div className="KYM-actions">
              <button
                className={`KYM-action-icon ${liked ? 'liked' : ''}`}
                onClick={toggleLike}
              >
                <img src={liked ? heartFilled : heartOutline} alt="좋아요" />
                {/* {liked ? '❤️' : '🤍'} */}
              </button>
              <button className="KYM-action-icon"><LuMessageCircleMore /> </button>
              <img src={share} alt="공유" className="KYM-action-icon2" onClick={() => {
                handleShare(feed);
                setMenuOpenId(null);
              }} />
              {/* <button className="KYM-action-icon">{share}</button> */}
              <div className="KYM-action-spacer" />
              {/* <button className="KYM-action-icon">🔖</button> */}
            </div>
            <div className="KYM-like-info">
              <span className="KYM-like-count">좋아요 {likes}개</span>
              {/* <span className="KYM-detail-date">{formatDate(createdAt)}</span> */}
            </div>

            {/* 댓글 입력창 */}
            <div className="KYM-add-comment">
              <span
                className="KYM-input-emoji"
                onClick={() => {
                  if (!isLoggedIn) {
                    return window.alert('로그인 후 이용해주세요.');
                  }
                  setShowEmojiPicker(v => !v);
                }}
              >
                😊
              </span>
              {/* 이모지 픽커 */}
              {showEmojiPicker && (
                <div className="emoji-picker-wrapper">
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    disableSearchBar={true}
                    pickerStyle={{ width: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                  />
                </div>
              )}
              <input
                className="KYM-input-field"
                placeholder={isLoggedIn ? "댓글 달기..." : "로그인 후 댓글 작성 가능"}
                disabled={!isLoggedIn}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    postComment();
                  }
                }}
              />
              <button
                className="KYM-input-post"
                disabled={!isLoggedIn || !commentText.trim()}
                onClick={postComment}
              >
                게시
              </button>
            </div>
          </div>
        </div>

        <hr className="KYM-divider" />

        {/* 아래 썸네일 */}
        <div className="KYM-other-section">
          <p className="KYM-other-title">{writerId} 님의 게시글 더 보기</p>
          <div className="KYM-other-grid">
            {moreImg1List.map((src, i) =>
              <img
                key={i}
                src={`${url}/iupload/${src}`}
                className="KYM-thumb"
                alt=""
              />
            )}
          </div>
        </div>

        <ReportModal
          show={showReport}
          onClose={closeReport}
          onSubmit={({ reason, detail }) => { console.log(reason, detail); closeReport(); }}
        />
      </div >
      <Footer/>
    </>
  );
}
