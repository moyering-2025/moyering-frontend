import React, { useState , useEffect} from 'react';
import ClassCard from '../../components/ClassCard';
import styles from './ClassList.module.css';
import DatePicker from 'react-datepicker';
import Header from './Header';
import Footer from './Footer';
import { useNavigate ,useLocation  } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  classListAtom,
  currentPageAtom,
  totalPagesAtom,
  classFilterAtom,
  categoryListAtom,
} from '../../atom/classAtom';
import {fetchClassListAtom} from '../../hooks/common/fetchClassListAtom';
import { fetchCategoryListAtom } from '../../hooks/common/fetchCategoryListAtom';
import axios from 'axios';
import AutoLocationFilter from '../../components/AutoLocationFilter';
import { ko } from "date-fns/locale";

export default function ClassList() {
  const location = useLocation();
  const initCategory1 = location.state?.category1 || '';
  const initCategory2 = location.state?.category2 || '';
  const shouldUseLocationFilter = location.state?.useLocationFilter === true;
  const [selectedDate1, setSelectedDate1] = useState(null);
  const [selectedDate2, setSelectedDate2] = useState(null);
  const [selectedSido, setSelectedSido] = useState("");
  const [selectedCategory1, setSelectedCategory1] = useState(initCategory1);
  const [selectedCategory2, setSelectedCategory2] = useState(initCategory2);
  const [selectedPriceMin, setSelectedPriceMin] = useState('');
  const [selectedPriceMax, setSelectedPriceMax] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const navigate = useNavigate();

  const classList = useAtomValue(classListAtom);
  const totalPages = useAtomValue(totalPagesAtom);
  const currentPage = useAtomValue(currentPageAtom);

  const setCurrentPage = useSetAtom(currentPageAtom);
  const setFilter = useSetAtom(classFilterAtom);
  const fetchClassList = useSetAtom(fetchClassListAtom);
  //카테고리 끌고오기
  const categoryList = useAtomValue(categoryListAtom);
  const fetchCategories = useSetAtom(fetchCategoryListAtom);


  //처음에 클래스 끌고오기
  const filters = useAtomValue(classFilterAtom);
  console.log(categoryList);
  
  // useEffect로 최초 1회 호출
  useEffect(() => {
    fetchCategories();
  }, []);
  useEffect(() => {
    if (location.state?.reset) {
      // 모든 상태 초기화
      setSelectedSido('');
      setSelectedCategory1('');
      setSelectedCategory2('');
      setSelectedDate1(null);
      setSelectedDate2(null);
      setSelectedPriceMin('');
      setSelectedPriceMax('');
      setSelectedName('');
      setCurrentPage(1);
      setFilter({
        sido: '',
        category1: '',
        category2: '',
        startDate: null,
        endDate: null,
        priceMin: '',
        priceMax: '',
        name: '',
      });

      // AutoLocationFilter 실행 안 되게 막고
      fetchClassList();
      navigate(location.pathname, { replace: true }); // reset 플래그 제거
    }
  }, [location.state]);

  useEffect(() => {

    // 초기 진입 시 항상 fetchClassList 호출되도록 조건 제거
    setFilter((prev) => ({
      ...prev,
      category1: initCategory1,
      category2: initCategory2,
    }));
    setCurrentPage(1);
    fetchClassList();
  }, []);

  const firstCategoryList = Array.from(
    new Map(categoryList.map(item => [item.categoryId, item.categoryName])).entries()
  ).map(([id, name]) => ({ id, name }));

  const secondCategoryList = categoryList.filter(
    (item) => item.categoryId == selectedCategory1
  );



const handleSidoChange = (e) => {
  setSelectedSido(e.target.value);
};
const handleSearch = () => {
setCurrentPage(1); // 페이지 초기화

  setFilter((prev) => ({
    ...prev,
    sido: selectedSido,
    category1: selectedCategory1,
    category2: selectedCategory2,
    startDate: selectedDate1,
    endDate: selectedDate2,
    priceMin: selectedPriceMin,
    priceMax: selectedPriceMax,
    name: selectedName,
  }));

  fetchClassList(); // 필터 적용 후 새 목록 요청
};

const handlePageChange = (page) => {
  setCurrentPage(page);
  fetchClassList(); // 새 페이지로 서버 요청
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
//초기화
const handleReset = () => {
  setSelectedSido('');
  setSelectedCategory1('');
  setSelectedCategory2('');
  setSelectedDate1(null);
  setSelectedDate2(null);
  setSelectedPriceMin('');
  setSelectedPriceMax('');
  setSelectedName('');
  setCurrentPage(1);
  setFilter({
    sido: '',
    category1: '',
    category2: '',
    startDate: null,
    endDate: null,
    priceMin: '',
    priceMax: '',
    name:'',
  });
  fetchClassList();
};



  return (
    <>
    <Header/>
    {shouldUseLocationFilter && (
      <AutoLocationFilter
        setSelectedSido={setSelectedSido}
        setFilter={setFilter}
        fetchClassList={fetchClassList}
      />
    )}
    <main className={styles.page}>
      <h2 className={styles.sectionTitle}>클래스링</h2>
      <p className={styles.sectionSub}>모여링의 모든 원데이 클래스를 모아 모아~</p>
      <div className={styles.searchFormContainer}>
      
            <div className={styles.formGrid}>
              {/* 지역 */}
              <div className={styles.formGroup}>
                <label>지역</label>
                <select className={styles.datePickerInput} value={selectedSido} onChange={handleSidoChange}>
                  <option value="">전체</option>
                  <option value="서울특별시">서울</option>
                  <option value="부산">부산</option>
                  <option value="대구광역시">대구광역시</option>
                  <option value="인천광역시">인천광역시</option>
                  <option value="광주광역시">광주광역시</option>
                  <option value="대전광역시">대전광역시</option>
                  <option value="울산광역시">울산광역시</option>
                  <option value="세종특별자치시">세종특별자치시</option>
                  <option value="경기도">경기도</option>
                  <option value="강원특별자치도">강원특별자치도</option>
                  <option value="충청북도">충청북도</option>
                  <option value="충청남도">충청남도</option>
                  <option value="전라북도">전라북도</option>
                  <option value="전라남도">전라남도</option>
                  <option value="경상북도">경상북도</option>
                  <option value="경상남도">경상남도</option>
                  <option value="제주특별자치도">제주특별자치도</option>
                </select>
              </div>

              {/* 카테고리 */}
              <div className={`${styles.formGroup} ${styles.categoryGroup}`}>
                <label>카테고리</label>
                <div className={styles.range}>
                  <select
                    className={styles.datePickerInput}
                    value={selectedCategory1}
                    onChange={(e) => setSelectedCategory1(e.target.value)}
                  >
                    <option value="">1차 카테고리</option>
                    {firstCategoryList.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <select
                    className={styles.datePickerInput}
                    value={selectedCategory2}
                    onChange={(e) => setSelectedCategory2(e.target.value)}
                  >
                    <option value="">2차 카테고리</option>
                    {secondCategoryList.map((sub) => (
                      <option key={sub.subCategoryId} value={sub.subCategoryId}>
                        {sub.subCategoryName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* 제목 */}
              <div className={styles.formGroup}>
                <label>제목</label>
                <div className={styles.range}>
                  <input type="text" placeholder="제목" className={styles.datePickerInput}
                  value={selectedName}
                  onChange={(e) => setSelectedName(e.target.value)}/>   
                </div>
              </div>
              
      
              {/* 날짜 */}
              <div className={styles.formGroup}>
                <label>날짜</label>
                <div className={styles.range}>
                  <DatePicker
                    selected={selectedDate1}
                    onChange={(date) => setSelectedDate1(date)}
                    dateFormat="yyyy.MM.dd"
                    placeholderText="날짜"
                    className={styles.datePickerInput}
                    locale={ko}
                  />
                  <span>~</span>
                  <DatePicker
                    selected={selectedDate2}
                    onChange={(date) => setSelectedDate2(date)}
                    dateFormat="yyyy.MM.dd"
                    placeholderText="날짜"
                    className={styles.datePickerInput}
                    locale={ko}
                  />
                </div>
              </div>
              {/* 금액 */}
              <div className={styles.formGroup}>
                <label>금액</label>
                <div className={styles.range}>
                  <input type="number" placeholder="0원" className={styles.datePickerInput}
                  value={selectedPriceMin}
                  onChange={(e) => setSelectedPriceMin(e.target.value)}/>
                  <span>~</span>
                  <input type="number" placeholder="1,000,000원" className={styles.datePickerInput}
                  value={selectedPriceMax}
                  onChange={(e) => setSelectedPriceMax(e.target.value)}
                  />    
                </div>
              </div>      
      
              {/* 하단 버튼 */}
              <div className={styles.formGroup}>
                <label>&nbsp;</label>
                <button className={styles.resetBtn} onClick={handleReset}>초기화</button>
                <button className={styles.submitBtn} onClick={handleSearch}>검색하기</button>
              </div>
            </div>
          </div>

      <section className={styles.sectionBlock}>

        <div className={styles.cardList}>
          {classList.length === 0 ? (
            <p>조건에 맞는 클래스가 없습니다.</p>
          ) : (
            classList.map((classInfo, idx) => (
            <ClassCard
              key={classInfo.classId}
              classInfo={classInfo}
              onClick={() => navigate(`/class/classRingDetail/${classInfo.classId}`)}
            />
          )))}
        </div>
      </section>

      <div className={styles.pagination}>
        <button className={styles.pageBtn} onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>〈</button>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.pageBtnActive : ""}`}
            onClick={() => handlePageChange(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button className={styles.pageBtn}  onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>〉</button>
      </div>
    </main>
    <Footer/>
    </>
  );
}
