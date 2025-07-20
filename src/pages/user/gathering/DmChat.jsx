import React, { useState, useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import './GatheringChat.css';
import { BsArrowUpCircleFill } from "react-icons/bs";
import { HiOutlineMenu } from "react-icons/hi";
import Header from "../../common/Header";
import Footer from "../../../components/Footer";
import { myAxios, url } from '../../../config';
import { useAtom } from 'jotai';
import { tokenAtom, userAtom } from '../../../atoms';
import { useSearchParams } from 'react-router';
import { useNavigate } from 'react-router-dom';

export default function Chat() {
  const [activeTab, setActiveTab] = useState('DM');
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [token, setToken] = useAtom(tokenAtom);
  const user = useAtom(userAtom)[0];
  const stompClient = useRef(null);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef(null);
  const [isNewMessage, setIsNewMessage] = useState(false);
  const [messageOffset, setMessageOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesContainerRef = useRef(null);
  const navigate = useNavigate();


  // ✅ 앱 시작 시 WebSocket 연결만 해두기
  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws");
    const client = Stomp.over(socket);

    client.connect({}, () => {
      console.log("✅ WebSocket connected (global)");
      setConnected(true);
      if (selectedRoom) {
        subscribeRoom(client, selectedRoom);
      }
    }, (err) => {
      console.error("❌ WebSocket error:", err);
      setTimeout(() => connect(), 5000);
    });

    stompClient.current = client;
    return () => {
      console.log("🔌 disconnecting...");
      client.disconnect();
    };
  }, []);

  const [params] = useSearchParams();
  const receiverIdFromUrl = params.get('receiverId');

  useEffect(() => {
    if (receiverIdFromUrl) {
      setSelectedOpponent({
        id: parseInt(receiverIdFromUrl),
        nickname: "알 수 없음",
        profile: null
      });
    }
  }, [receiverIdFromUrl]);
  //여기까지
  // ✅ 채팅방 목록 불러오기
  useEffect(() => {
    token && myAxios(token, setToken).get(`/user/dm/rooms`)
      .then(res => setChatRooms(res.data), console.log("🔥 chatRooms loaded:", chatRooms))
      .catch(err => console.error("방 목록 불러오기 오류:", err));
  }, [token]);

  useEffect(() => {
    console.log("🔥 chatRooms loaded:", chatRooms);
  }, [chatRooms]);

  useEffect(() => {
    console.log("🔥 selectedRoom:", selectedRoom);
  }, [selectedRoom]);

  // ✅ 방 선택 시: subscribe + 메시지 로딩
  useEffect(() => {
    if (selectedRoom && stompClient.current && stompClient.current.connected) {
      console.log("🛠 subscribing to /topic/dmRoom:", selectedRoom);


      // opponent 정보 셋팅
      const opponent = chatRooms.find(r => r.roomId === selectedRoom);
      if (opponent) {
        setSelectedOpponent({
          id: opponent.user1Id === user.id ? opponent.user2Id : opponent.user1Id,
          nickname: opponent.user1Id === user.id ? opponent.user2Nickname : opponent.user1Nickname,
          profile: opponent.user1Id === user.id ? opponent.user2Profile : opponent.user1Profile
        });
      }

      // 채팅방 메시지 불러오기
      token && myAxios(token, setToken).get(`/dm-test/recent?roomId=${selectedRoom}&count=20`)
        .then(res => {
          setMessages(res.data.reverse().map(msg => ({
            sender: msg.senderId === user.id ? "나" : selectedOpponent?.nickname,
            text: msg.content,
            type: msg.senderId === user.id ? 'my-message' : 'message',
            time: msg.sendAt,
            isRead: msg.isRead
          })));
          setMessageOffset(20); // ⭐⭐⭐ 여기 추가 (최초 로딩 후 offset = 20)
          setHasMoreMessages(true);
        })
        .catch(err => console.error("메시지 불러오기 오류:", err));

      // ✅ subscribe
      stompClient.current.subscribe(`/topic/dmRoom:${selectedRoom}`, (msg) => {
        console.log("📩 받은 메시지 RAW:", msg.body);

        if (msg.body === "readUpdated") {
          console.log("👀 읽음 상태 변경, 메시지 직접 갱신");
          setMessages(prev =>
            prev.map(m =>
              m.type === 'my-message' ? { ...m, isRead: true } : m
            )
          );
          return;
        }

        let received;
        try {
          received = JSON.parse(msg.body);
          console.log("✅ JSON 메시지:", received);
        } catch (e) {
          console.error("JSON parse 실패:", e, msg.body);
          return;
        }

        if (received.senderId !== user.id) {
          if (selectedRoom === received.roomId) {
            myAxios(token, setToken).post(`/user/dm/mark-read`, null, {
              params: { roomId: selectedRoom, userId: user.id }
            }).then(() => console.log("✅ 실시간 읽음 처리 완료"))
              .catch(err => console.error("읽음 처리 오류:", err));
          }

          setMessages(prev => [...prev, {
            sender: selectedOpponent?.nickname,
            text: received.content,
            type: 'message',
            time: received.sendAt,
            isRead: received.isRead
          }]);
          setIsNewMessage(true);
        }
      });


      // ✅ 읽음 처리 API 호출
      token && myAxios(token, setToken).post(`/user/dm/mark-read`, null, {
        params: {
          roomId: selectedRoom,
          userId: user.id
        }
      })
        .then(() => console.log("✅ 읽음 처리 완료"))
        .catch(err => console.error("읽음 처리 오류:", err));
    }
  }, [selectedRoom, connected]);

  // ✅ 메시지 전송
  const sendMessage = () => {
    if (!message.trim()) return;

    if (!selectedOpponent?.id) {
      alert("상대방을 먼저 선택하세요.");
      return;
    }

    console.log("🛠 SEND", {
      senderId: user.id,
      receiverId: selectedOpponent?.id,
      roomId: selectedRoom,
      content: message
    });

    if (stompClient.current && stompClient.current.connected) {
      stompClient.current.send("/app/dm.send", {}, JSON.stringify({
        senderId: user.id,
        receiverId: selectedOpponent?.id,
        roomId: selectedRoom,
        content: message
      }));

      setMessages(prev => [...prev, { text: message, type: 'my-message', time: new Date().toISOString() }]);
      setIsNewMessage(true)
      setMessage('');
    } else {
      alert("WebSocket 연결이 아직 준비되지 않았습니다.");
    }
  };

  useEffect(() => {
    if (isNewMessage && bottomRef.current) {
      const container = document.querySelector('.GatheringChat_chat-messages_osk');
      container.scrollTop = container.scrollHeight;
      setIsNewMessage(false);
    }
  }, [messages]);

  const loadMoreMessages = useCallback(async () => {
    try {
      const start = messageOffset;
      const count = 20;

      console.log("🚀 loadMore start=", start, "count=", count);

      const res = await myAxios(token, setToken).get(
        `/dm-test/recent?roomId=${selectedRoom}&start=${start}&count=${count}`
      );

      const newMessages = res.data.reverse().map(msg => {
        console.log("🔥 msg:", msg);  // 여기서 isRead 나오는지 확인
        console.log("🔥 msg.sendAt =", msg.sendAt);
        return {
          sender: msg.senderId === user.id ? "나" : selectedOpponent?.nickname,
          text: msg.content,
          type: msg.senderId === user.id ? 'my-message' : 'message',
          time: msg.sendAt,
          isRead: msg.isRead
        };
      });

      console.log("📦 newMessages:", newMessages);

      if (newMessages.length === 0) {
        setHasMoreMessages(false);
      } else {
        const container = messagesContainerRef.current;
        const oldScrollHeight = container.scrollHeight;
        const oldScrollTop = container.scrollTop;

        setMessages(prev => [...newMessages, ...prev]);
        setMessageOffset(prev => prev + count);

        setTimeout(() => {
          const container = messagesContainerRef.current;
          const newScrollHeight = container.scrollHeight;
          const adjustTop = newScrollHeight - (oldScrollHeight - oldScrollTop);
          console.log("🪄 adjust scrollTop:", adjustTop);
          container.scrollTop = adjustTop;
        }, 50);
      }
    } catch (err) {
      console.error("이전 메시지 불러오기 오류:", err);
    }
  }, [token, selectedRoom, messageOffset, user.id, setToken]);

  const handleScroll = useCallback((e) => {
    if (e.target.scrollTop === 0 && hasMoreMessages) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, loadMoreMessages]);

  useEffect(() => {
    setMessageOffset(0);
    setHasMoreMessages(true);
  }, [selectedRoom]);

  const loadMessages = useCallback(async () => {
    try {
      const res = await myAxios(token, setToken).get(`/dm-test/recent?roomId=${selectedRoom}&count=20`);
      setMessages(res.data.reverse().map(msg => ({
        sender: msg.senderId === user.id ? "나" : selectedOpponent?.nickname,
        text: msg.content,
        type: msg.senderId === user.id ? 'my-message' : 'message',
        time: msg.sendAt,
        isRead: msg.isRead
      })));
      console.log("🪄 최신 메시지 불러옴", res.data);
    } catch (err) {
      console.error("메시지 불러오기 오류:", err);
    }
  }, [token, selectedRoom, user.id, setToken]);

  return (
    <div>
      <Header />
      <div className="GatheringChat_chat-app_osk">
        <div className="GatheringChat_main-content_osk">
          <aside className="GatheringChat_sidebar_osk">
            <div className="GatheringChat_chat-tabs_osk">
              <button
                className={`GatheringChat_tab_osk ${activeTab === '게더링' ? 'GatheringChat_active_osk' : ''}`}
                onClick={() => {
                  setActiveTab('게더링');
                  navigate('/user/chat2');
                }}
              >
                게더링
              </button>
              <button className={`GatheringChat_tab_osk ${activeTab === 'DM' ? 'GatheringChat_active_osk' : ''}`} onClick={() => setActiveTab('DM')}>DM</button>
            </div>
            <div className="GatheringChat_chat-room-list_osk">
              {chatRooms.map(room => (
                <div key={room.roomId}
                  className={`GatheringChat_chat-room-item_osk ${selectedRoom === room.roomId ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedRoom(room.roomId);
                    setSelectedOpponent({
                      id: room.user1Id === user.id ? room.user2Id : room.user1Id,
                      nickname: room.user1Id === user.id ? room.user2Nickname : room.user1Nickname,
                      profile: room.user1Id === user.id ? room.user2Profile : room.user1Profile
                    });
                  }}
                >
                  <img src={room.opponentProfile
                    ? `${url}/iupload/${room.opponentProfile}`
                    : '/profile.png'} alt="상대 프로필" className="GatheringChat_room-avatar_osk" />
                  <div className="GatheringChat_room-info_osk">
                    <div className="GatheringChat_room-name_osk">{room.opponentNickname}</div>
                    <div className="GatheringChat_room-last-message_osk">{room.lastMessage}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <main className="GatheringChat_chat-area_osk">
            <div className="GatheringChat_chat-header_osk">
              {selectedRoom ? (
                <>
                  {/* <img src={selectedOpponent?.profile || '/default-profile.png'} alt="상대 프로필" style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }} /> */}
                  <h2>{selectedOpponent?.nickname}</h2>
                </>
              ) : <h2>채팅방을 선택해주세요</h2>}
              {/* <button className="GatheringChat_menu-btn_osk"><HiOutlineMenu /></button> */}
            </div>

            <div className="GatheringChat_chat-messages_osk" onScroll={handleScroll} ref={messagesContainerRef}>
              {messages.map((msg, idx) => {
                // 현재 메시지의 날짜
                const currentDate = new Date(msg.time).toDateString();

                // 이전 메시지의 날짜 (없으면 null)
                const prevDate = idx > 0 ? new Date(messages[idx - 1].time).toDateString() : null;

                // 날짜가 다르면 Divider 출력
                const showDateDivider = currentDate !== prevDate;

                return (
                  <React.Fragment key={idx}>
                    {showDateDivider && (
                      <div className="GatheringChat_date-divider_osk">
                        <span className="GatheringChat_date-text_osk">
                          {new Date(msg.time).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    )}

                    {msg.type === 'message' && (
                      <div className="GatheringChat_user-message_osk">
                        <div className="GatheringChat_message-avatar_osk"></div>
                        <div className="GatheringChat_message-content_osk">
                          <div className="GatheringChat_sender-name_osk">{msg.sender}</div>
                          <div className="GatheringChat_message-text_osk">{msg.text}</div>
                          <div className="GatheringChat_message-time_osk">
                            {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    )}
                    {msg.type === 'my-message' && (
                      <div className="GatheringChat_my-message-container_osk">
                        <div className="GatheringChat_my-message-bubble_osk">
                          {msg.text}
                          <div className="GatheringChat_message-time_osk">
                            {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {msg.isRead && ' ✓'}
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="GatheringChat_chat-input-container_osk">
              <div className="GatheringChat_input-wrapper_osk">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="메시지를 입력하세요"
                  className="GatheringChat_message-input_osk"
                />
                <BsArrowUpCircleFill size={22} onClick={sendMessage} style={{ cursor: 'pointer' }} />
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}