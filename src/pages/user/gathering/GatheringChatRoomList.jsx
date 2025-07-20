import React, { useState, useEffect, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import { userAtom, tokenAtom } from "../../../atoms";
import './GatheringChat.css';
import { BsPaperclip, BsArrowUpCircleFill } from "react-icons/bs";
import { HiOutlineMenu } from "react-icons/hi";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "../../common/Header";
import Footer from "../../../components/Footer";
import { useNavigate } from "react-router-dom";
import { url, myAxios } from "../../../config";
import GatheringChatRoom from "./GatheringChatRoom";
import { IoFilter } from "react-icons/io5";
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem, } from 'reactstrap';

export default function GatheringChatRoomList() {
  const user = useAtomValue(userAtom);
  const [token, setToken] = useAtom(tokenAtom)
  const userId = user.id;
  const navigate = useNavigate();

  const [availableRooms, setAvailableRooms] = useState([]);
  const [disableRooms, setDisableRooms] = useState([]);
  const [activeTab, setActiveTab] = useState('개더링');
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('전체');

  const toggle = () => setFilterOpen((prevState) => !prevState);
  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
    setFilterOpen(false);
    console.log('선택된 필터:', filter);
  };
  const getFilteredChatRooms = () => {
    switch (selectedFilter) {
      case '활성화':
        return availableRooms;
      case '비활성화':
        return disableRooms;
      case '전체':
      default:
        return [...availableRooms, ...disableRooms];
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (!token) return;

    const loadChatRooms = async () => {
      try {
        const response = await myAxios(token, setToken).get('/user/messageRoomList');
        if (response.data) {
          // 활성화된 채팅방 리스트
          if (response.data.availableMessageRoomList) {
            setAvailableRooms(response.data.availableMessageRoomList);
          }
          // 비활성화된 채팅방 리스트
          if (response.data.disableMessageRoomList) {
            setDisableRooms(response.data.disableMessageRoomList);
          }
        }
      } catch (error) {
        console.error('채팅방 리스트 로드 실패:', error);
      }
    };
    loadChatRooms();
  }, [token, setToken]);

  const handleRoomClick = (gatheringId) => {
    setSelectedRoomId(gatheringId);
  };

  // 필터된 채팅방 리스트 가져오기
  const filteredChatRooms = getFilteredChatRooms();
  const selectedRoom = filteredChatRooms.find(room => room.gatheringId === selectedRoomId);

  return (
    <div>
      <Header />
      <div className="GatheringChat_chat-app_osk">
        <div className="GatheringChat_main-content_osk">
          <aside className="GatheringChat_sidebar_osk">
            <div className="GatheringChat_chat-tabs_osk">
              <button
                className={`GatheringChat_tab_osk ${activeTab === '게더링' ? 'GatheringChat_active_osk' : ''}`}
                onClick={() => setActiveTab('게더링')}
              >
                게더링
              </button>
              <button
                className={`GatheringChat_tab_osk ${activeTab === 'DM' ? 'GatheringChat_active_osk' : ''}`}
                onClick={() => {
                  setActiveTab('DM');
                  navigate('/user/chat');
                }}
              >
              DM
            </button>
            {activeTab === '게더링' && (
              <Dropdown
                isOpen={filterOpen}
                toggle={toggle}
                direction={"down"}
                className="GatheringChat_filter-dropdown_osk"
              >
                <DropdownToggle
                  tag="button"
                  className="GatheringChat_filter-toggle_osk"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <IoFilter size={20} color="#666" />
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem header>필터 옵션</DropdownItem>
                  <DropdownItem
                    onClick={() => handleFilterSelect('전체')}
                    className={selectedFilter === '전체' ? 'active' : ''}
                  >
                    전체
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => handleFilterSelect('활성화')}
                    className={selectedFilter === '활성화' ? 'active' : ''}
                  >
                    활성화
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => handleFilterSelect('비활성화')}
                    className={selectedFilter === '비활성화' ? 'active' : ''}
                  >
                    비활성화
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            )}
        </div>

        <div className="GatheringChat_chat-room-list_osk">
          {filteredChatRooms.map(room => (
            <div
              key={`room-${room.gatheringId}`}
              className={`GatheringChat_chat-room-item_osk ${selectedRoomId === room.gatheringId ? ' GatheringChat_chat-room-selected-item_osk' : ''}`}
              onClick={() => handleRoomClick(room.gatheringId)}
            >
              <div className="GatheringChat_room-avatar_osk">
                {room.thumbnailFileName && (
                  <img
                    src={`${url}/image?filename=${room.thumbnailFileName}`}
                    alt={room.gatheringTitle}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                )}
              </div>
              <div className="GatheringChat_room-info_osk">
                <div className="GatheringChat_room-name_osk">{room.gatheringTitle}</div>
                <div className="GatheringChat_room-last-message_osk">
                  모임일: {room.meetingDate}
                </div>
                {/* 상태 표시 추가 (선택사항) */}
                <div className="GatheringChat_room-status_osk">
                  <span className={`status-badge ${availableRooms.includes(room) ? 'active' : 'inactive'}`}>
                    {availableRooms.includes(room) ? '활성화' : '비활성화'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      {selectedRoomId ? (
        <GatheringChatRoom
          gatheringId={selectedRoomId}
          roomTitle={selectedRoom?.gatheringTitle || '채팅방'}
          roomStatus={availableRooms.includes(selectedRoom) ? '활성화' : '비활성화'}
          ownerUserId={selectedRoom?.organizerUserId || null}
        />
      ) : (
        <main className="GatheringChat_chat-area_osk">
          <div className="GatheringChat_chat-header_osk">
            <h2>채팅방을 선택해주세요</h2>
          </div>
        </main>
      )}
    </div>
      </div >
    <Footer />
    </div >
  );
}