import React, { useState, useEffect, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import { userAtom, tokenAtom } from "../../../atoms";
import { CiSearch, CiLocationOn, CiHashtag } from "react-icons/ci";
import { FiUpload } from "react-icons/fi";
import { GoPeople } from "react-icons/go";
import { SlPicture } from "react-icons/sl";
import { HiOutlineInformationCircle } from "react-icons/hi";
import { Editor } from "@toast-ui/editor";
import { url, myAxios } from "../../../config";
import getLatLngFromAddress from '../../../hooks/common/getLatLngFromAddress'
const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
import DaumPostcode from "react-daum-postcode";
import "bootstrap/dist/css/bootstrap.min.css";
import "@toast-ui/editor/dist/toastui-editor.css";
import Header from "../../common/Header";
import Footer from "../../../components/Footer";
import { useNavigate } from "react-router-dom";
import "./GatheringWrite.css";

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

// 현재 시간에서 3시간 후의 datetime-local 형식 반환
const getMinDeadlineDateTime = () => {
  const now = new Date();
  now.setHours(now.getHours() + 3);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// 특정 날짜의 23:59를 datetime-local 형식으로 반환
const getMaxDeadlineDateTime = (meetingDate) => {
  if (!meetingDate) return "";
  return `${meetingDate}T23:59`;
};

const validateDateTime = (formData) => {
  const errors = {};
  if (formData.meetingDate && formData.meetingDate < getTodayString()) {
    errors.meetingDate = "";
    // errors.meetingDate = "모임 날짜는 오늘 이후여야 합니다.";
  }

  if (formData.startTime && formData.endTime) {
    if (formData.startTime >= formData.endTime) {
      errors.timeRange = "";
      // errors.timeRange = "종료 시간은 시작 시간보다 늦어야 합니다.";
    }
  }


  for (const key in errors) {
    if (!errors[key]) {
      delete errors[key];
    }
  }

  return errors;
};

export default function GatheringWrite() {
  const user = useAtomValue(userAtom);    
  const [token,setToken] = useAtom(tokenAtom)
  const userId = user.id;
  const navigate = useNavigate();

  // 새로 추가된 이미지 업로드 관련 상태들
  const [fileName, setFileName] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(""); // 새로 추가
  const [errors, setErrors] = useState({});
  const editorRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("initial");
  const [coordLat,setCoordLat] = useState('');
  const [coordLng,setCoordLng] = useState('');

  // 입력용 formData 상태 (사용자 입력을 받는 용도)
  const [formData, setFormData] = useState({
    title: "",
    startTime: "",
    endTime: "",
    category: "",
    subCategory: "",
    address: "",
    detailAddress: "",
    meetingDate: "",
    minAttendees: 2,
    maxAttendees: "",
    deadlineDateTime: "",
    content: "",
    preparation: "",
    locName: "",
    tags: [], // 문자열 배열로 변경
    intrOnln: "", // 한 줄 소개
    latitude:0,
    longitude:0,
  });

  const [tagInput, setTagInput] = useState("");

useEffect(() => {
  // 주소가 없으면 실행하지 않음
  if (!formData.address) return;

  console.log("지오코딩 시작 - 주소:", formData.address);
  getLatLngFromAddress(formData.address)
    .then(coords => {
      if (coords) {
        console.log("지오코딩 성공:");
        console.log("위도:", coords.lat);
        console.log("경도:", coords.lng);
        
        // 로컬 상태 업데이트 (화면 표시용)
        setCoordLat(coords.lat);
        setCoordLng(coords.lng);
        setFormData(prev => ({
          ...prev,
          latitude: coords.lat,   // formData.latitude에 직접 저장
          longitude: coords.lng   // formData.longitude에 직접 저장
        }));
      }
    })
    .catch(err => {
      console.error("좌표변환 실패:", err);
      // 에러 발생시 좌표 초기화
      setCoordLat('');
      setCoordLng('');
      setFormData(prev => ({
        ...prev,
        latitude: 0,
        longitude: 0
      }));
    });
}, [formData.address]);

  const handleFileUpload = (file) => {
    const maxSize = 100 * 1024 * 1024; // 100MB로 변경
    if (file.size > maxSize) {
      alert("파일 크기는 100MB를 초과할 수 없습니다.");
      setUploadStatus("error");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      setUploadStatus("error");
      return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
      const imageUrl = e.target.result;
      // 새로운 미리보기 상태 설정
      setPreviewUrl(imageUrl);
      setFileName(file.name);
      setUploadStatus("success");
    };
    reader.readAsDataURL(file);
    setThumbnail(file);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // 드래그 앤 드롭 핸들러 함수들
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // 업로드 존 클래스 결정 함수
  const getUploadZoneClass = () => {
    let baseClass = "GatheringWrite_upload-zone_osk";
    if (isDragOver) baseClass += " GatheringWrite_upload-zone-dragover_osk";
    if (uploadStatus === "success")
      baseClass += " GatheringWrite_upload-zone-success_osk";
    return baseClass;
  };

  // 태그 입력 처리 (Enter 또는 쉼표로 태그 추가)
  const handleTagInput = (e) => {
    const value = e.target.value;

    if (e.key === "Enter" || value.includes(",")) {
      e.preventDefault();

      // 쉼표로 분리하고 공백 제거
      const newTags = value
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0 && !formData.tags.includes(tag));

      if (newTags.length > 0) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, ...newTags],
        }));
        setTagInput("");
      }
    } else {
      setTagInput(value);
    }
  };

  const handleTagDelete = (tagToDelete) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToDelete),
    }));
  };

  // 수정된 handleInputChange 함수
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [name]: value,
      };

      // 실시간 유효성 검증
      const validationErrors = validateDateTime(newFormData);
      setErrors((prevErrors) => ({
        ...prevErrors,
        ...validationErrors,
      }));

      return newFormData;
    });
  };

  // 방법 실시간 검증하되 경고만 표시
  const handleNumberInput = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);

    // 빈 문자열은 허용
    if (value === "") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      return;
    }

    // 한글 체크
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    if (koreanRegex.test(value)) {
      return;
    }

    if (name === "minAttendees") {
      if (numValue < 2) {
        setErrors((prev) => ({
          ...prev,
          minAttendees: "최소 인원은 2명 이상이어야 합니다",
        }));
      } else if (
        formData.maxAttendees &&
        numValue > parseInt(formData.maxAttendees)
      ) {
        setErrors((prev) => ({
          ...prev,
          minAttendees: "최소 인원은 최대 인원보다 클 수 없습니다",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          minAttendees: "",
        }));
      }
    }

    // 최대 인원 검증
    if (name === "maxAttendees") {
      if (formData.minAttendees && numValue < parseInt(formData.minAttendees)) {
        setErrors((prev) => ({
          ...prev,
          maxAttendees: "최대 인원은 최소 인원보다 작을 수 없습니다",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          maxAttendees: "",
        }));
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePostcodeComplete = (data) => {
    let fullAddress = data.address;
    let extraAddress = "";

    if (data.addressType === "R") {
      if (data.bname !== "") {
        extraAddress += data.bname;
      }
      if (data.buildingName !== "") {
        extraAddress +=
          extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
      }
      fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
    }

    // locName 추출: 주소에서 시/도 + 구/군/시 부분만 추출
    const addressParts = data.address.split(" ");
    let locName = "";

    if (addressParts.length >= 2) {
      // 첫 번째와 두 번째 요소를 조합 (예: "서울 강남구")
      locName = `${addressParts[0]} ${addressParts[1]}`;
    } else if (addressParts.length === 1) {
      // 주소가 한 단어만 있는 경우
      locName = addressParts[0];
    }

    // 주소 상태 업데이트
    setFormData((prev) => ({
      ...prev,
      address: fullAddress,
      locName: locName, // locName 필드 추가
    }));

    setIsPostcodeOpen(false);
  };

  // 주소 검색 창 열기
  const openPostcode = () => {
    setIsPostcodeOpen(true);
  };

  // 1차 카테고리 데이터 가져오기
  useEffect(() => {
    myAxios().get(`/category`)
      .then((res) => {
        console.log("1차 카테고리 API 응답:", res);
        const categoryArray = res.data.category;
        setCategory(categoryArray);
      })
      .catch((err) => {
        console.log("1차 카테고리 못 불러옴:", err);
      });
  }, []);

  // 2차 카테고리 데이터 가져오기
  useEffect(() => {
    if (formData.category && formData.category !== "") {
      myAxios().get(`/subCategory/${formData.category}`)
        .then((res) => {
          console.log("2차 카테고리 API 응답:", res);
          const categoryArray = res.data.subCategory.map((item) => ({
            subCategoryId: item.subCategoryId,
            subCategoryName: item.subCategoryName,
          }));
          setSubCategory(categoryArray);
        })
        .catch((err) => {
          console.log("2차 카테고리 API 오류:", err);
        });
    } else {
      // 1차 카테고리가 선택되지 않으면 2차 카테고리 초기화
      setSubCategory([]);
      setFormData((prev) => ({
        ...prev,
        subCategory: "",
      }));
    }
  }, [formData.category]);

  // DOM이 완전히 렌더링된 후 에디터 초기화
  useEffect(() => {
    const initEditor = () => {
      if (editorRef.current && !editor) {
        try {
          const editorInstance = new Editor({
            el: editorRef.current,
            height: "400px",
            initialEditType: "wysiwyg",
            placeholder: "모임에 대한 상세한 설명을 작성해주세요",
            hideModeSwitch: true,
            previewStyle: "vertical",
            initialValue: "", // 초기값 비우기
            // 툴바 설정
            toolbarItems: [
              ["heading", "bold", "italic", "strike"],
              ["hr", "quote"],
              ["ul", "ol"],
              ["table", "link"],
              ["image"],
            ],
            // 에디터 테마 설정 추가
            theme: "default",
            // 이미지 업로드 기능
            hooks: {
              addImageBlobHook: (blob, callback) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const imageUrl = e.target.result;
                  const altText = blob.name || "Uploaded image";
                  callback(imageUrl, altText);
                };
                reader.readAsDataURL(blob);
              },
            },
            events: {
              change: () => {
                const content = editorInstance.getHTML();
                setFormData((prev) => ({
                  ...prev,
                  content: content,
                }));
              },
              // 에디터가 완전히 로드된 후 실행
              load: () => {
                console.log("Editor 초기화 완료");
              },
            },
          });
          setEditor(editorInstance);
        } catch (error) {
          console.error("TOAST UI Editor 초기화 실패:", error);
        }
      }
    };

    const timer = setTimeout(initEditor, 100);

    return () => {
      clearTimeout(timer);
      if (editor) {
        try {
          editor.destroy();
        } catch (error) {
          console.error("Editor cleanup 에러:", error);
        }
        setEditor(null);
      }
    };
  }, []);
 const submit = async (e) => {
  e.preventDefault();
  
  // 필수 필드 검증
  if (
    !formData.title ||
    !formData.meetingDate ||
    !formData.startTime ||
    !formData.endTime ||
    !formData.category ||
    !formData.subCategory ||
    !formData.address ||
    !formData.content ||
    !thumbnail
  ) {
    alert("필수 항목을 모두 입력해주세요.");
    return;
  }

  //  좌표 검증 추가
  if (!formData.latitude || !formData.longitude || 
      formData.latitude === 0 || formData.longitude === 0) {
    alert("주소의 좌표 변환에 실패했습니다. 주소를 다시 선택해주세요.");
    return;
  }

  // 유효성 검증
  const validationErrors = validateDateTime(formData);
  if (Object.keys(validationErrors).length > 0) {
    const firstError = Object.values(validationErrors)[0];
    alert(firstError);
    return;
  }

  // FormData 객체 생성
  const formDataToSend = new FormData();

  // 파일 추가
  formDataToSend.append("thumbnail", thumbnail);
  formDataToSend.append("userId", user?.id); 
  formDataToSend.append("title", formData.title);
  formDataToSend.append("meetingDate", formData.meetingDate);
  formDataToSend.append("startTime", formData.startTime);
  formDataToSend.append("endTime", formData.endTime);

  // 카테고리 정보
  formDataToSend.append("categoryId", parseInt(formData.category));
  formDataToSend.append("subCategoryId", parseInt(formData.subCategory));

  // 주소 정보
  formDataToSend.append("address", formData.address);
  formDataToSend.append("detailAddress", formData.detailAddress || "");
  formDataToSend.append("locName", formData.locName || "");
  
  //  좌표 정보 - formData에서 직접 가져옴
  formDataToSend.append("latitude", formData.latitude);
  formDataToSend.append("longitude", formData.longitude);

  // 인원수 정보
  formDataToSend.append("minAttendees", parseInt(formData.minAttendees) || 2);
  if (formData.maxAttendees && formData.maxAttendees.toString().trim() !== "") {
    const maxPeople = parseInt(formData.maxAttendees);
    if (!isNaN(maxPeople) && maxPeople > 0) {
      formDataToSend.append("maxAttendees", maxPeople);
    }
  }
  
  formDataToSend.append(
    "applyDeadline",
    formData.deadlineDateTime.replace("T", " ") + ":00"
  );

  // 모임 내용 및 준비물
  formDataToSend.append("gatheringContent", formData.content);
  formDataToSend.append("preparationItems", formData.preparation || "");
  formDataToSend.append("intrOnln", formData.intrOnln || "");
  formDataToSend.append("status", "모집중");
  formDataToSend.append("canceled", "false");
  
  // tags 처리
  const tagsToSend = formData.tags && formData.tags.length > 0 ? formData.tags : [];
  formDataToSend.append("tags", JSON.stringify(tagsToSend));

  //  FormData 내용 확인 (디버깅용)
  console.log("=== FormData 내용 ===");
  for (let [key, value] of formDataToSend.entries()) {
    console.log(`${key}:`, value);
  }
  
  //  좌표값 특별 확인
  console.log("최종 좌표값:");
  console.log("latitude:", formData.latitude);
  console.log("longitude:", formData.longitude);

  // axios 요청
  try {
    console.log("모임 등록 요청 시작...");
    const response = await myAxios(token).post(`/user/writeGathering`, formDataToSend);
    console.log("모임 등록 성공:", response);

    const gatheringId = response.data;
    if (gatheringId) {
      console.log("새로 생성된 모임 ID:", gatheringId);
      // alert("모임이 성공적으로 등록되었습니다!");
      navigate(`/gatheringDetail/${gatheringId}`);
    } else {
      console.error("gatheringId를 받지 못했습니다:", response.data);
      alert("모임 등록은 완료되었지만 페이지 이동에 문제가 있습니다.");
    }
  } catch (err) {
    console.error("모임 등록 실패:", err);

    if (err.response) {
      console.error("응답 상태:", err.response.status);
      console.error("응답 데이터:", err.response.data);

      // 상태 코드별 에러 메시지
      switch (err.response.status) {
        case 400:
          alert("입력한 정보에 오류가 있습니다. 다시 확인해주세요.");
          break;
        case 401:
          alert("로그인이 필요합니다.");
          navigate("/userlogin");
          break;
        case 413:
          alert("파일 크기가 너무 큽니다. 더 작은 파일을 선택해주세요.");
          break;
        case 500:
          alert("서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
          break;
        default:
          alert("모임 등록 중 오류가 발생했습니다.");
      }
    } else if (err.request) {
      console.error("요청이 전송되었지만 응답이 없음:", err.request);
      alert("서버에 연결할 수 없습니다. 네트워크를 확인해주세요.");
    } else {
      console.error("요청 설정 오류:", err.message);
      alert("요청 처리 중 오류가 발생했습니다.");
    }
  }
};

  return (
    <div>
      <Header />
      <form
        className="GatheringWrite_gathering-write-container_osk"
        onSubmit={submit}
      >
        <div className="GatheringWrite_content-wrapper_osk">
          <div>
            {/* 기본 정보 */}
            <div className="GatheringWrite_section_osk">
              <div className="GatheringWrite_section-header_osk">
                <span className="GatheringWrite_section-icon_osk">
                  <HiOutlineInformationCircle />
                </span>
                <span className="GatheringWrite_section-title_osk">
                  기본 정보
                </span>
              </div>
              <div className="GatheringWrite_form-group_osk">
                <label className="GatheringWrite_field-label_osk">
                  <span className="GatheringWrite_section-icon_osk">
                    <SlPicture />
                  </span>
                  대표 이미지{" "}
                  <span className="GatheringWrite_required_osk">*</span>
                </label>

                {/* 업로드 존 - 이미지가 이 div 내부에 완전히 배치됩니다 */}
                <div
                  className={getUploadZoneClass()}
                  onClick={() =>
                    document
                      .getElementById("GatheringWrite_thumbnail_osk")
                      .click()
                  }
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {uploadStatus === "success" ? (
                    // 업로드 성공 시: 이미지가 업로드 존 전체를 채움
                    <div className="GatheringWrite_preview-container_osk">
                      <img
                        src={previewUrl}
                        alt="업로드된 이미지"
                        className="GatheringWrite_preview-image_osk"
                      />
                      {/* 파일명 표시 */}
                      <div className="GatheringWrite_file-name_osk">
                        {fileName}
                      </div>
                    </div>
                  ) : (
                    // 기본 상태: 업로드 대기 UI
                    <>
                      <div className="GatheringWrite_upload-icon_osk">
                        <FiUpload />
                      </div>
                      <div className="GatheringWrite_upload-text_osk">
                        이미지를 드래그하거나 클릭하여 업로드하세요
                      </div>
                      <div className="GatheringWrite_upload-info_osk">
                        권장 크기: 1200 x 630px, 최대 100MB
                      </div>
                    </>
                  )}
                </div>

                {/* 숨겨진 파일 입력 */}
                <input
                  type="file"
                  name="GatheringWrite_thumbnail_osk"
                  id="GatheringWrite_thumbnail_osk"
                  style={{ display: "none" }}
                  onChange={handleFileInputChange}
                  accept="image/*"
                  required
                />
              </div>
              <div className="GatheringWrite_form-group_osk">
                <label className="GatheringWrite_field-label_osk">
                  모임 이름{" "}
                  <span className="GatheringWrite_required_osk">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="모임 이름을 입력해주세요"
                  className="GatheringWrite_custom-input_osk"
                  required
                />
              </div>

              <div className="GatheringWrite_row_osk">
                <div className="GatheringWrite_col-md-6_osk">
                  <div className="GatheringWrite_form-group_osk">
                    <label className="GatheringWrite_field-label_osk">
                      모임 날짜{" "}
                      <span className="GatheringWrite_required_osk">*</span>
                      {errors.meetingDate && (
                        <span
                          style={{
                            color: "red",
                            fontSize: "12px",
                            marginLeft: "8px",
                          }}
                        >
                          {errors.meetingDate}
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={formData.meetingDate}
                      onChange={handleInputChange}
                      className="GatheringWrite_custom-input_osk GatheringWrite_date-input-container_osk"
                      name="meetingDate"
                      required
                      min={getTodayString()} // 오늘 이전 날짜 선택 불가
                      placeholder="모임 날짜 입력"
                    />
                  </div>
                </div>
                <div className="GatheringWrite_col-md-6_osk">
                  <div className="GatheringWrite_form-group_osk">
                    <label className="GatheringWrite_field-label_osk">
                      모임 시간{" "}
                      <span className="GatheringWrite_required_osk">*</span>
                      {errors.timeRange && (
                        <span
                          style={{
                            color: "red",
                            fontSize: "12px",
                            marginLeft: "8px",
                          }}
                        >
                          {errors.timeRange}
                        </span>
                      )}
                    </label>
                    <div className="GatheringWrite_time-input-group_osk">
                      <input
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        placeholder="시작 시간 입력"
                        className="GatheringWrite_custom-input_osk GatheringWrite_time-input_osk"
                        required
                      />
                      <span className="GatheringWrite_time-separator_osk">
                        ~
                      </span>
                      <input
                        type="time"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        placeholder="종료 시간 입력"
                        className="GatheringWrite_custom-input_osk GatheringWrite_time-input_osk"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="GatheringWrite_row_osk">
                {/* 1차 카테고리 */}
                <div className="GatheringWrite_col-md-6_osk">
                  <div className="GatheringWrite_form-group_osk">
                    <label className="GatheringWrite_field-label_osk">
                      1차 카테고리{" "}
                      <span className="GatheringWrite_required_osk">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="GatheringWrite_custom-input_osk"
                    >
                      <option value="">1차 카테고리를 선택해주세요</option>
                      {Array.isArray(category) &&
                        category.map((category) => (
                          <option
                            key={category.categoryId}
                            value={category.categoryId.toString()}
                          >
                            {category.categoryName}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="GatheringWrite_col-md-6_osk">
                  <div className="GatheringWrite_form-group_osk">
                    <label className="GatheringWrite_field-label_osk">
                      2차 카테고리{" "}
                      <span className="GatheringWrite_required_osk">*</span>
                    </label>
                    <select
                      name="subCategory"
                      value={formData.subCategory}
                      onChange={handleInputChange}
                      className="GatheringWrite_custom-input_osk"
                      disabled={!formData.category} // 1차 카테고리가 선택되지 않으면 비활성화
                      required
                    >
                      <option value="">2차 카테고리를 선택해주세요</option>
                      {Array.isArray(subCategory) &&
                        subCategory // category가 아닌 subCategory 사용
                          .filter(
                            (item) => item.subCategoryId && item.subCategoryName
                          ) // 유효한 데이터만 필터링
                          .map((item) => (
                            <option
                              key={item.subCategoryId}
                              value={item.subCategoryId.toString()}
                            >
                              {item.subCategoryName}
                            </option>
                          ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 모임 장소 */}
            <div className="GatheringWrite_section_osk=">
              <div className="GatheringWrite_section-header_osk">
                <span className="GatheringWrite_section-icon_osk">
                  <CiLocationOn />
                </span>
                <span className="GatheringWrite_section-title_osk">
                  모임 장소
                  <span className="GatheringWrite_required_osk">*</span>
                </span>
              </div>

              <div className="GatheringWrite_form-group_osk">
                <div className="GatheringWrite_location-section_osk">
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    onClick={openPostcode}
                    placeholder="주소를 입력해주세요"
                    className="GatheringWrite_custom-input_osk"
                    readOnly
                    required
                  />
                  <button
                    type="button"
                    onClick={openPostcode}
                    className="GatheringWrite_address-search-btn_osk"
                  >
                    <CiSearch size={16} />
                  </button>
                </div>
              </div>

              <div className="GatheringWrite_form-group_osk">
                <input
                  type="text"
                  name="detailAddress"
                  value={formData.detailAddress}
                  onChange={handleInputChange}
                  placeholder="상세 주소를 입력해주세요"
                  className="GatheringWrite_custom-input_osk"
                  required
                />
              </div>
            </div>

            {/* 참여 정보 */}
            <div className="GatheringWrite_section_osk">
              <div className="GatheringWrite_section-header_osk">
                <span className="GatheringWrite_section-icon_osk">
                  <GoPeople />
                </span>
                <span className="GatheringWrite_section-title_osk">
                  참여 정보
                </span>
              </div>

              <div className="GatheringWrite_row_osk">
                {/* 최소 인원 입력 부분 */}
                <div className="GatheringWrite_col-md-6_osk">
                  <div className="GatheringWrite_form-group_osk">
                    <label className="GatheringWrite_field-label_osk">
                      최소 인원{" "}
                      <span className="GatheringWrite_required_osk">*</span>
                      {errors.minAttendees && (
                        <span
                          style={{
                            color: "red",
                            fontSize: "12px",
                            marginLeft: "8px",
                          }}
                        >
                          {errors.minAttendees}
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      name="minAttendees"
                      value={formData.minAttendees}
                      onChange={handleNumberInput}
                      placeholder="최소 인원 (2 이상)"
                      className="GatheringWrite_custom-input_osk"
                      required
                    />
                  </div>
                </div>
                {/* 최대 인원 입력 부분 */}
                <div className="GatheringWrite_col-md-6_osk">
                  <div className="GatheringWrite_form-group_osk">
                    <label className="GatheringWrite_field-label_osk">
                      최대 인원{" "}
                      {errors.maxAttendees && (
                        <span
                          style={{
                            color: "red",
                            fontSize: "12px",
                            marginLeft: "8px",
                          }}
                        >
                          {errors.maxAttendees}
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      name="maxAttendees"
                      value={formData.maxAttendees}
                      onChange={handleNumberInput}
                      placeholder="최대 인원 (2 이상)"
                      className="GatheringWrite_custom-input_osk"
                    />
                  </div>
                </div>
              </div>

              <div className="GatheringWrite_form-group_osk">
                <label className="GatheringWrite_field-label_osk">
                  신청 마감일{" "}
                  <span className="GatheringWrite_required_osk">*</span>
                  {errors.deadlineDateTime && (
                    <span
                      style={{
                        color: "red",
                        fontSize: "12px",
                        marginLeft: "8px",
                      }}
                    >
                      {errors.deadlineDateTime}
                    </span>
                  )}
                </label>
                <input
                  type="datetime-local"
                  name="deadlineDateTime"
                  value={formData.deadlineDateTime}
                  onChange={handleInputChange}
                  className="GatheringWrite_custom-input_osk"
                  min={getMinDeadlineDateTime()} // 현재 + 3시간 이후만 선택 가능
                  max={getMaxDeadlineDateTime(formData.meetingDate)} // 모임 날짜까지만 선택 가능
                  required
                />
              </div>
            </div>

            {/* 모임 상세 정보 */}
            <div className="GatheringWrite_section_osk">
              <div className="GatheringWrite_section-header_osk">
                <span className="GatheringWrite_section-icon_osk">
                  <HiOutlineInformationCircle />
                </span>
                <span className="GatheringWrite_section-title_osk">
                  모임 상세 정보
                </span>
              </div>

              <div className="GatheringWrite_form-group_osk">
                <label className="GatheringWrite_field-label_osk">
                  모임 소개{" "}
                  <span className="GatheringWrite_required_osk">*</span>
                </label>
                <div className="toast-editor-container">
                  <div ref={editorRef} id="toast-editor"></div>
                </div>
                <div className="GatheringWrite_text-counter_osk">
                  <span></span>
                  <span>{(formData.content || "").length}/60000</span>
                </div>
              </div>
            </div>

            {/* 준비물 */}
            <div className="GatheringWrite_section_osk">
              <div className="GatheringWrite_form-group_osk">
                <label className="GatheringWrite_field-label_osk">준비물</label>
                <textarea
                  name="preparation"
                  value={formData.preparation}
                  onChange={handleInputChange}
                  placeholder="준비물을 입력해 주세요"
                  rows="4"
                  className="GatheringWrite_custom-textarea-simple_osk"
                />
              </div>
            </div>

            {/* 태그 */}
            <div className="GatheringWrite_section_osk">
              <div className="GatheringWrite_form-group_osk">
                <label className="GatheringWrite_field-label_osk">태그</label>
                <div className="GatheringWrite_tag-input-group_osk">
                  <input
                    type="text"
                    name="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInput}
                    placeholder="태그를 입력하고 Enter 또는 쉼표 사용하여 등록하세요"
                    className="GatheringWrite_custom-input_osk GatheringWrite_tag-input_osk"
                  />
                  {/* <CiHashtag className="GatheringWrite_tag-add-btn_osk" /> */}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="GatheringWrite_span-tag_osk"
                    data-skill="tag"
                  >
                    {tag}
                    <button
                      className="GatheringWrite_delete-tag-btn_osk"
                      onClick={() => handleTagDelete(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="GatheringWrite_section_osk">
              <div className="GatheringWrite_form-group_osk">
                <label className="GatheringWrite_field-label_osk">
                  한 줄 소개
                </label>
                <input
                  type="text"
                  name="intrOnln"
                  value={formData.intrOnln}
                  onChange={handleInputChange}
                  placeholder="모임에 관련한 한 줄 소개글을 입력해주세요"
                  className="GatheringWrite_custom-input_osk"
                />
              </div>
            </div>

            <div className="GatheringWrite_button-group_osk">
              <input
                type="submit"
                className="GatheringWrite_submit-btn_osk"
                value="모임 등록"
              />
            </div>
          </div>
        </div>
        {/* 우편번호 검색 모달 */}
        {isPostcodeOpen && (
          <div className="postcode-modal">
            <div className="postcode-modal-content">
              <div className="postcode-modal-header">
                <h3>주소 검색</h3>
                <button
                  className="postcode-close-btn"
                  onClick={() => setIsPostcodeOpen(false)}
                >
                  ×
                </button>
              </div>
              <DaumPostcode
                onComplete={handlePostcodeComplete}
                autoClose={false}
                defaultQuery=""
                style={{ width: "100%" }}
              />
            </div>
          </div>
        )}
      </form>
    <Footer />
    </div>
  );
}