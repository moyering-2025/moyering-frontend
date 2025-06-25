import { useRef, useState } from 'react';
import './ClassRegisterPage.css';
import TabBasicInfo from './TabBasicInfo';
import TabDescription from './TabDescription';
import TabExtraInfo from './TabExtraInfo';
import TabFooter from './TabFooter';
import TabPortfolio from './TabPortfolio';
import TabSchedule from './TabSchedule';
import TabTransaction from './TabTransaction';
import axios from 'axios';
import { myAxios } from '../../../config';
import { tokenAtom, userAtom } from '../../../atoms';
import { useAtomValue } from 'jotai';
import React from 'react'; // 이 한 줄만 추가!
import { useNavigate } from 'react-router';

const tabs = [
  '기본정보',
  '클래스 일정',
  '클래스 설명',
  '클래스 부가정보',
  '거래 정보',
  '포트폴리오 검수',
];

const ClassRegisterPage = () => {
  const user = useAtomValue(userAtom);
  const navigate = useNavigate();
  console.log(user);
  const [classData, setClassData] = useState({
    basicInfo: {
      // hostId:user.hostId,
      category1: '',
      category2: '',
      name: '',
      locName: '',
      addr: '',
      detailAddr: '',
      longitude: '',
      latitude: ''
    },
    schedule: {
      recruitMax: '',
      recruitMin: '',
      dates: [],
      scheduleDetail: [{
        content: '',
        startTime: '',
        endTime: '',
      }]
    },
    description: {
      img1: null,
      img2: null,
      img3: null,
      img4: null,
      img5: null,
      detailDescription: ''
    },
    extraInfo: {
      material: '',
      incluision: '',
      preparation: '',
      keywords: '',
      coupons:[]
    },
    transaction: {
      caution: ''
    },
    classPortfolio: {
      portfolio: null
    }
  })
  const [activeTab, setActiveTab] = useState(0);
  // const [classData,setClassData] = useState({...});
  const validators = useRef([]);

  const registerValidator = (index, validateFn) => {
    validators.current[index] = validateFn;
  };

  const handleTabClick = async (nextTabIndex) => {
    // if (nextTabIndex === activeTab) return;

    // const validateCurrent = validators.current[activeTab];
    // if (validateCurrent) {
    //   const isValid = await validateCurrent();
    //   if (!isValid) {
    //     alert('현재 탭의 정보를 모두 입력해주세요.');
    //     return;
    //   }
    // }
    setActiveTab(nextTabIndex);
  };

  // const saveCurrentTab = async () => {
  //   const validator = validators.current[activeTab];
  //   if (validator) {
  //     const isValid = await validator();
  //     if (!isValid) return false;
  //   }

  //   await axios.post(`/host/classRegist/${activeTab}`, classData);//작성 내용만 저장
  // }

  // const submitAllData = async () => {
  //   for(const validator of validators.current){
  //     if(validator && !(await validator())){
  //       alert("입력되지 않은 항목이 있습니다!")
  //       return;
  //     }
  //   }

  //   await axios.post('/host/classRegist/submit',classData);//검수요청
  // }
  const token = useAtomValue(tokenAtom);
  console.log(token)
  const submit = () => {
    const cleanDates = [...new Set(
      (classData.schedule.dates || []).map(date =>
        new Date(date).toISOString().slice(0, 10)
      )
    )].sort((a, b) => new Date(a) - new Date(b));

    let reqData = {
      ...classData.basicInfo,
      ...classData.classPortfolio,
      ...classData.description,
      ...classData.extraInfo,
      ...classData.schedule,
      ...classData.transaction
    };

    let formData = new FormData();
    formData.append("hostId", user.hostId)
    formData.append("addr", reqData.addr)
    formData.append("category1", reqData.category1)
    formData.append("category2", reqData.category2)
    formData.append("caution", reqData.caution)
    formData.append("dates", cleanDates)
    formData.append("scheduleDetail", JSON.stringify(reqData.scheduleDetail))
    formData.append("detailDescription", reqData.detailDescription)
    if (reqData.img1) formData.append("img1", reqData.img1);
    if (reqData.img2) formData.append("img2", reqData.img2);
    if (reqData.img3) formData.append("img3", reqData.img3);
    if (reqData.img4) formData.append("img4", reqData.img4);
    if (reqData.img5) formData.append("img5", reqData.img5);
    formData.append("incluision", reqData.incluision)
    formData.append("keywords", reqData.keywords)
    formData.append("coupons", JSON.stringify(reqData.coupons));
    formData.append("latitude", reqData.latitude)
    formData.append("locName", reqData.locName)
    formData.append("longitude", reqData.longitude)
    formData.append("material", reqData.material)
    formData.append("name", reqData.name)
    formData.append("portfolio", reqData.portfolio)
    formData.append("preparation", reqData.preparation)
    formData.append("recruitMax", reqData.recruitMax)
    formData.append("recruitMin", reqData.recruitMin)

    // FormData 내용 확인
    for (let pair of formData.entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }

    console.log(reqData);
    myAxios(token).post('/host/classRegist/submit', formData)
      .then(res => {
        console.log(res);
        console.log(formData);
        let classId = res.data;
        navigate("/host/HostclassList");
      })
      .catch(err => {
        console.log(formData);
        console.log(token);
        console.log(err);
      })
  }

  const renderTabContent = () => {
    const props = { registerValidator };
    switch (activeTab) {
      case 0: return <TabBasicInfo classData={classData} setClassData={setClassData} registerValidator={registerValidator} />;
      case 1: return <TabSchedule classData={classData} setClassData={setClassData} registerValidator={registerValidator} />;
      case 2: return <TabDescription classData={classData} setClassData={setClassData} registerValidator={registerValidator} />;
      case 3: return <TabExtraInfo classData={classData} setClassData={setClassData} registerValidator={registerValidator} />;
      case 4: return <TabTransaction classData={classData} setClassData={setClassData} registerValidator={registerValidator} />;
      case 5: return <TabPortfolio classData={classData} setClassData={setClassData} registerValidator={registerValidator} />;
      default: return null;
    }
  };



  return (
    <div className="KHJ-register-page">
      <div className="KHJ-class-info-box">
        <h3>클래스 상세</h3>
        <div className="KHJ-info-grid">
          <div><div className="KHJ-label">클래스</div><div>-</div></div>
          <div><div className="KHJ-label">ID</div><div>1234</div></div>
          <div><div className="KHJ-label">상태</div><div className="KHJ-status current">현재</div></div>
          <div><div className="KHJ-label">검수상태</div><div className="KHJ-status current">현재</div></div>
        </div>
      </div>

      <div className="KHJ-tab-menu">
        {tabs.map((tab, index) => (
          <div
            key={index}
            className={`KHJ-tab-item ${activeTab === index ? 'active' : ''}`}
            onClick={() => handleTabClick(index)}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="KHJ-tab-content">{renderTabContent()}</div>
      <TabFooter activeTab={activeTab} onSubmit={submit} />
    </div>
  );
};

export default ClassRegisterPage;
