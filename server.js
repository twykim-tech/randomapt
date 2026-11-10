const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3800;
const PUBLIC_DIR = path.join(__dirname, 'public');
const APT_IMG_MANIFEST_PATH = path.join(PUBLIC_DIR, 'images', 'apt', 'manifest.json');

let aptPhotoManifest = {};
try {
  if (fs.existsSync(APT_IMG_MANIFEST_PATH)) {
    aptPhotoManifest = JSON.parse(fs.readFileSync(APT_IMG_MANIFEST_PATH, 'utf-8'));
  }
} catch (_) {}

// 서울시 7대 주요 권역 (인스타그램 스토리 바 필터용 - 각 권역 실제 대장 아파트 전경 썸네일 적용)
const SEOUL_REGIONS = [
  {
    id: 'gangnam3',
    name: '강남·서초·송파',
    shortName: '강남3구',
    handle: 'gangnam_seocho_songpa',
    districts: ['강남구', '서초구', '송파구'],
    avatar: './images/apt/apt-onebailey-1.jpg',
    badgeColor: '#e11d48',
    desc: '대한민국 하이엔드 주거와 대단지 재건축·학군을 선도하는 핵심 권역'
  },
  {
    id: 'mayongseong',
    name: '용산·성동·마포',
    shortName: '마용성·한강',
    handle: 'yongsan_seongdong_mapo',
    districts: ['용산구', '성동구', '마포구'],
    avatar: './images/apt/apt-acro-seoul-forest-1.jpg',
    badgeColor: '#2563eb',
    desc: '한강변 파노라마 조망과 도심·여의도·강남 직주근접을 모두 갖춘 핵심 벨트'
  },
  {
    id: 'yeouido_mokdong',
    name: '영등포·양천·강서',
    shortName: '여의도·목동·마곡',
    handle: 'yeouido_mokdong_magok',
    districts: ['영등포구', '양천구', '강서구'],
    avatar: './images/apt/apt-yeouido-sibeom-1.jpg',
    badgeColor: '#059669',
    desc: '여의도 금융중심지 재건축, 목동 신시가지 명문학군, 마곡 첨단 R&D 대단지'
  },
  {
    id: 'gangdong_gwangjin',
    name: '강동·광진·동작',
    shortName: '강동·광진·동작',
    handle: 'gangdong_gwangjin_dongjak',
    districts: ['강동구', '광진구', '동작구'],
    avatar: './images/apt/apt-olympicpark-foreon-1.jpg',
    badgeColor: '#7c3aed',
    desc: '둔촌·고덕 초대형 신축 타운, 광장동 학군, 흑석·노량진 한강변 뉴타운'
  },
  {
    id: 'central',
    name: '종로·중구·서대문',
    shortName: '광화문·도심권',
    handle: 'jongno_junggu_seodaemun',
    districts: ['종로구', '중구', '서대문구'],
    avatar: './images/apt/apt-gyeonghuigung-xi-1.jpg',
    badgeColor: '#d97706',
    desc: 'CBD(광화문·시청·을지로) 도보 출퇴근이 가능한 도심 랜드마크 주거지'
  },
  {
    id: 'northeast',
    name: '노원·성북·동대문',
    shortName: '노원·성북·동대문',
    handle: 'nowon_seongbuk_ddm',
    districts: ['노원구', '성북구', '동대문구', '강북구', '중랑구', '도봉구'],
    avatar: './images/apt/apt-cheongnyangni-lottel65-1.jpg',
    badgeColor: '#0891b2',
    desc: '중계동 은행사거리 학군지, 청량리·이문·장위 뉴타운 신축 대단지 밀집 권역'
  },
  {
    id: 'northwest_south',
    name: '은평·관악·구로·금천',
    shortName: '서북·서남권',
    handle: 'eunpyeong_gwanak_guro',
    districts: ['은평구', '관악구', '구로구', '금천구'],
    avatar: './images/apt/apt-nokbeon-castle-1.jpg',
    badgeColor: '#4f46e5',
    desc: 'GTX-A 수혜 은평 뉴타운·수색증산, G밸리·강남 접근성이 뛰어난 실거주 대단지'
  }
];

// 서울시 대표 아파트 단지 큐레이션 DB (네이버 부동산 실제 단지 사진 매칭)
const SEOUL_APARTMENTS = [
  {
    id: 'apt-onebailey',
    complexNo: '142155',
    name: '래미안 원베일리 (Raemian One Bailey)',
    district: '서초구',
    dong: '반포동',
    regionId: 'gangnam3',
    handle: '서초구_반포동',
    builder: '삼성물산 (래미안)',
    builtYear: 2023,
    households: 2990,
    buildings: 23,
    maxFloor: 35,
    far: '299%',
    parking: '1.82대',
    areaTypes: '59㎡ · 84㎡ · 101㎡ · 116㎡ · 펜트',
    price84: '44억 ~ 52억',
    jeonse84: '17억 ~ 21억',
    subway: '9호선 신반포역 · 3/7/9호선 고속터미널역',
    school: '계성초 · 잠원초 · 신반포중 · 세화고',
    category: '한강뷰/랜드마크',
    tags: ['한강뷰/랜드마크', '반포대장', '스카이브릿지', '신축대단지', '삼성물산'],
    summary: '신반포3차·경남아파트를 통합 재건축한 반포 한강변의 상징적 랜드마크 단지. 한강 파노라마 조망이 가능한 스카이브릿지 커뮤니티와 호텔식 조식 서비스, 고터·신세계백화점 슬세권 입지를 자랑합니다.',
    images: [
      './images/apt/apt-onebailey-1.jpg',
      './images/apt/apt-onebailey-2.jpg',
      './images/apt/apt-onebailey-3.jpg'
    ],
    likesBase: 1840
  },
  {
    id: 'apt-acroriverpark',
    complexNo: '107613',
    name: '아크로리버파크 (Acro River Park)',
    district: '서초구',
    dong: '반포동',
    regionId: 'gangnam3',
    handle: '서초구_반포동',
    builder: 'DL이앤씨 (ACRO)',
    builtYear: 2016,
    households: 1612,
    buildings: 15,
    maxFloor: 38,
    far: '299%',
    parking: '1.80대',
    areaTypes: '59㎡ · 84㎡ · 112㎡ · 129㎡',
    price84: '40억 ~ 47억',
    jeonse84: '15억 ~ 18억',
    subway: '9호선 신반포역 도보 3분',
    school: '서울잠원초 · 신반포중 · 세화여고/세화고',
    category: '한강뷰/랜드마크',
    tags: ['한강뷰/랜드마크', '아리팍', '반포한강공원', '명문학군', '아크로'],
    summary: '대한민국 아파트 평당 1억 시대를 최초로 열었던 반포 한강변의 기념비적 단지. 단지에서 반포한강공원으로 직접 연결되는 보행 통로와 스카이라운지, 탄탄한 학군을 갖추고 있습니다.',
    images: [
      './images/apt/apt-acroriverpark-1.jpg',
      './images/apt/apt-acroriverpark-2.jpg',
      './images/apt/apt-acroriverpark-3.jpg'
    ],
    likesBase: 1620
  },
  {
    id: 'apt-apgujeong-hyundai',
    complexNo: '724',
    name: '압구정 현대아파트 (1·2차 / 신현대)',
    district: '강남구',
    dong: '압구정동',
    regionId: 'gangnam3',
    handle: '강남구_압구정동',
    builder: '현대건설',
    builtYear: 1976,
    households: 6335,
    buildings: 78,
    maxFloor: 15,
    far: '205%',
    parking: '1.10대',
    areaTypes: '108㎡ · 144㎡ · 171㎡ · 213㎡',
    price84: '48억 ~ 90억+ (대형평형 중심)',
    jeonse84: '11억 ~ 18억',
    subway: '3호선 압구정역 · 수인분당선 압구정로데오역',
    school: '압구정초 · 압구정중 · 압구정고',
    category: '재건축/정비사업',
    tags: ['재건축/정비사업', '압구정현대', '대한민국부촌', '한강변재건축', '신속통합기획'],
    summary: '대한민국 부촌의 대명사이자 서울 한강변 재건축의 최대어(압구정 2·3구역). 넓은 대지지분과 압도적인 한강 남단 파노라마 라인을 보유해 초고층 하이엔드 재건축이 추진되고 있습니다.',
    images: [
      './images/apt/apt-apgujeong-hyundai-1.jpg',
      './images/apt/apt-apgujeong-hyundai-2.jpg',
      './images/apt/apt-apgujeong-hyundai-3.jpg'
    ],
    likesBase: 2150
  },
  {
    id: 'apt-daechi-eunma',
    complexNo: '236',
    name: '대치 은마아파트',
    district: '강남구',
    dong: '대치동',
    regionId: 'gangnam3',
    handle: '강남구_대치동',
    builder: '한보주택',
    builtYear: 1979,
    households: 4424,
    buildings: 28,
    maxFloor: 14,
    far: '204%',
    parking: '0.70대',
    areaTypes: '101㎡(31평) · 115㎡(34평)',
    price84: '26억 ~ 30억',
    jeonse84: '7.5억 ~ 10억',
    subway: '3호선 대치역 · 학여울역 초역세권',
    school: '대치초 · 대청중 · 단대부고 · 숙명여고',
    category: '명문학군',
    tags: ['명문학군', '대치동학원가', '재건축/정비사업', '강남재건축상징', '초역세권'],
    summary: '대한민국 사교육 1번지 대치동 학원가 바로 맞은편에 위치한 4,424세대 대단지. 학령기 자녀를 둔 학부모 수요가 사계절 끊이지 않으며 정비계획 통과로 재건축 시계가 빨라진 상징적 단지입니다.',
    images: [
      './images/apt/apt-daechi-eunma-1.jpg',
      './images/apt/apt-daechi-eunma-2.jpg',
      './images/apt/apt-daechi-eunma-3.jpg'
    ],
    likesBase: 1490
  },
  {
    id: 'apt-jamsil-elietr',
    complexNo: '22627',
    name: '잠실 엘스 · 리센츠 · 트리지움 (엘리트)',
    district: '송파구',
    dong: '잠실동',
    regionId: 'gangnam3',
    handle: '송파구_잠실동',
    builder: '현대·삼성·대우·GS·롯데 컨소시엄',
    builtYear: 2008,
    households: 14937,
    buildings: 186,
    maxFloor: 33,
    far: '274%',
    parking: '1.25대',
    areaTypes: '59㎡ · 84㎡ · 119㎡',
    price84: '25억 ~ 28.5억',
    jeonse84: '11억 ~ 13억',
    subway: '2호선 잠실새내역 · 2/9호선 종합운동장역 · 잠실역',
    school: '잠일초 · 버들초 · 신천중 · 잠일고',
    category: '초역세권/직주근접',
    tags: ['초역세권/직주근접', '잠실엘리트', '한강공원인접', '대단지표준', '송파대장'],
    summary: '합계 약 1만 5천 세대에 달하는 송파구 잠실의 국민 대단지 삼총사. 단지 내 초·중·고 품은 아파트(초품아) 구조와 평지 입지, 한강공원·롯데월드타워·삼성동 MICE 개발 수혜를 동시에 누립니다.',
    images: [
      './images/apt/apt-jamsil-elietr-1.jpg',
      './images/apt/apt-jamsil-elietr-2.jpg',
      './images/apt/apt-jamsil-elietr-3.jpg'
    ],
    likesBase: 1730
  },
  {
    id: 'apt-heliocity',
    complexNo: '111515',
    name: '송파 헬리오시티 (Helio City)',
    district: '송파구',
    dong: '가락동',
    regionId: 'gangnam3',
    handle: '송파구_가락동',
    builder: 'HDC현대산업개발 · 현대건설 · 삼성물산',
    builtYear: 2018,
    households: 9510,
    buildings: 84,
    maxFloor: 35,
    far: '285%',
    parking: '1.36대',
    areaTypes: '39㎡ · 49㎡ · 59㎡ · 84㎡ · 110㎡ · 130㎡',
    price84: '22억 ~ 24.5억',
    jeonse84: '9.5억 ~ 11.5억',
    subway: '8호선 송파역 초역세권 (9호선 석촌역·3호선 가락시장역 인접)',
    school: '가락초 · 해누리초 · 해누리중',
    category: '하이엔드/신축',
    tags: ['하이엔드/신축', '9510세대', '미니신도시급', '수영장커뮤니티', '가락시영재건축'],
    summary: '단일 단지 기준 9,510세대로 조성된 매머드급 미니 신도시 단지. 길이 1km에 달하는 중앙 파크밴드 녹지축과 6레인 실내 수영장, 단지 내 초·중 이음학교까지 완비되어 있습니다.',
    images: [
      './images/apt/apt-heliocity-1.jpg',
      './images/apt/apt-heliocity-2.jpg',
      './images/apt/apt-heliocity-3.jpg'
    ],
    likesBase: 1580
  },
  {
    id: 'apt-nineone-hannam',
    complexNo: '130505',
    name: '나인원 한남 (NINE ONE HANNAM)',
    district: '용산구',
    dong: '한남동',
    regionId: 'mayongseong',
    handle: '용산구_한남동',
    builder: '롯데건설',
    builtYear: 2019,
    households: 341,
    buildings: 9,
    maxFloor: 9,
    far: '149%',
    parking: '4.67대',
    areaTypes: '206㎡(75평) · 244㎡(89평) · 듀플렉스 · 펜트',
    price84: '120억 ~ 220억 (대형 하이엔드)',
    jeonse84: '60억 ~ 90억',
    subway: '경의중앙선 한남역 · 6호선 한강진역',
    school: '한남초 · 서울용산국제학교 인접',
    category: '하이엔드/신축',
    tags: ['하이엔드/신축', '나인원한남', '게이티드커뮤니티', '프라이빗', '배산임수'],
    summary: '남산과 한강을 등지고 바라보는 배산임수 명당에 자리한 대한민국 최고가 하이엔드 레지던스. 세대당 4.67대의 압도적 주차 공간과 1km 외곽 산책로, 갤러리아 고메이494 상가를 품고 있습니다.',
    images: [
      './images/apt/apt-nineone-hannam-1.jpg',
      './images/apt/apt-nineone-hannam-2.jpg',
      './images/apt/apt-nineone-hannam-3.jpg'
    ],
    likesBase: 2040
  },
  {
    id: 'apt-acro-seoul-forest',
    complexNo: '118738',
    name: '아크로 서울포레스트 (Acro Seoul Forest)',
    district: '성동구',
    dong: '성수동1가',
    regionId: 'mayongseong',
    handle: '성동구_성수동',
    builder: 'DL이앤씨 (ACRO)',
    builtYear: 2020,
    households: 280,
    buildings: 2,
    maxFloor: 49,
    far: '599%',
    parking: '2.67대',
    areaTypes: '91㎡ · 159㎡ · 198㎡ · 264㎡ 펜트',
    price84: '55억 ~ 145억 (중대형 기준)',
    jeonse84: '28억 ~ 55억',
    subway: '수인분당선 서울숲역 직결 · 2호선 뚝섬역',
    school: '경일초 · 경일중 · 성수고',
    category: '한강뷰/랜드마크',
    tags: ['한강뷰/랜드마크', '서울숲뷰', '성수동하이엔드', '3면파노라마창', '초고층주상복합'],
    summary: '서울숲의 사계절 녹지와 한강 파노라마 뷰를 동시에 내려다보는 성수동 초고층 하이엔드 주상복합. 기둥을 외곽으로 배치한 무주(無柱) 특화 설계와 3.3m 천장고로 개방감을 극대화했습니다.',
    images: [
      './images/apt/apt-acro-seoul-forest-1.jpg',
      './images/apt/apt-acro-seoul-forest-2.jpg',
      './images/apt/apt-acro-seoul-forest-3.jpg'
    ],
    likesBase: 1920
  },
  {
    id: 'apt-trimage',
    complexNo: '108405',
    name: '성수 트리마제 (Trimage)',
    district: '성동구',
    dong: '성수동1가',
    regionId: 'mayongseong',
    handle: '성동구_성수동',
    builder: '두산에너빌리티',
    builtYear: 2017,
    households: 688,
    buildings: 4,
    maxFloor: 47,
    far: '399%',
    parking: '1.66대',
    areaTypes: '25㎡ · 69㎡ · 84㎡ · 136㎡ · 152㎡',
    price84: '36억 ~ 42억',
    jeonse84: '16억 ~ 20억',
    subway: '수인분당선 서울숲역 도보 7분',
    school: '경일초 · 경일중',
    category: '한강뷰/랜드마크',
    tags: ['한강뷰/랜드마크', '성수트리마제', '호텔식컨시어지', '영구한강조망', '강변북로직결'],
    summary: '한강 바로 앞에 맞닿아 막힘없는 영구 한강뷰를 선사하는 성수동의 아이코닉 단지. 소형 스튜디오 타입부터 대형 펜트하우스까지 다양한 평면과 호텔식 조식·컨시어지 서비스로 유명합니다.',
    images: [
      './images/apt/apt-trimage-1.jpg',
      './images/apt/apt-trimage-2.jpg',
      './images/apt/apt-trimage-3.jpg'
    ],
    likesBase: 1510
  },
  {
    id: 'apt-marp-raemian-prugio',
    complexNo: '104917',
    name: '마포 래미안 푸르지오 (마래푸)',
    district: '마포구',
    dong: '아현동',
    regionId: 'mayongseong',
    handle: '마포구_아현동',
    builder: '삼성물산 · 대우건설',
    builtYear: 2014,
    households: 3885,
    buildings: 51,
    maxFloor: 30,
    far: '241%',
    parking: '1.14대',
    areaTypes: '59㎡ · 84㎡ · 114㎡ · 145㎡',
    price84: '19.5억 ~ 21.8억',
    jeonse84: '9.5억 ~ 11억',
    subway: '2호선 아현역 · 5호선 애오개역 더블역세권',
    school: '한서초 · 아현초 · 아현중',
    category: '초역세권/직주근접',
    tags: ['초역세권/직주근접', '마래푸', '마용성대장', '광화문여의도직주근접', '3885세대'],
    summary: '마포·아현 뉴타운의 전성기를 이끈 3,885세대 초대형 랜드마크 단지. 광화문·시청(CBD)과 여의도(YBD)를 모두 15분 내로 오갈 수 있는 최고의 직주근접 입지와 리조트급 조경을 갖추고 있습니다.',
    images: [
      './images/apt/apt-marp-raemian-prugio-1.jpg',
      './images/apt/apt-marp-raemian-prugio-2.jpg',
      './images/apt/apt-marp-raemian-prugio-3.jpg'
    ],
    likesBase: 1640
  },
  {
    id: 'apt-mapo-prestige-xi',
    complexNo: '121608',
    name: '마포 프레스티지 자이 (마프자)',
    district: '마포구',
    dong: '염리동',
    regionId: 'mayongseong',
    handle: '마포구_염리동',
    builder: 'GS건설 (Xi)',
    builtYear: 2021,
    households: 1694,
    buildings: 18,
    maxFloor: 27,
    far: '249%',
    parking: '1.22대',
    areaTypes: '59㎡ · 84㎡ · 114㎡',
    price84: '21.5억 ~ 23.8억',
    jeonse84: '10.5억 ~ 12억',
    subway: '2호선 이대역 · 6호선 대흥역 역세권',
    school: '한서초 · 숭문중 · 숭문고 (대흥동 학원가)',
    category: '하이엔드/신축',
    tags: ['하이엔드/신축', '마프자', '대흥동학원가', '실내수영장', '경의선숲길인접'],
    summary: '마포구 내에서도 손꼽히는 대흥역 학원가와 경의선숲길 공원을 동시에 누리는 신축 대단지. 마포구 아파트 중 보기 드문 단지 내 실내 수영장과 고급 커뮤니티 시설로 실거주 선호도가 매우 높습니다.',
    images: [
      './images/apt/apt-mapo-prestige-xi-1.jpg',
      './images/apt/apt-mapo-prestige-xi-2.jpg',
      './images/apt/apt-mapo-prestige-xi-3.jpg'
    ],
    likesBase: 1320
  },
  {
    id: 'apt-ichon-hangang-mansion',
    complexNo: '503',
    name: '이촌 한강맨션',
    district: '용산구',
    dong: '이촌동',
    regionId: 'mayongseong',
    handle: '용산구_이촌동',
    builder: '대한주택공사 (GS건설 시공사 선정)',
    builtYear: 1971,
    households: 660,
    buildings: 24,
    maxFloor: 5,
    far: '101%',
    parking: '1.20대',
    areaTypes: '89㎡ · 105㎡ · 122㎡ · 168㎡',
    price84: '40억 ~ 55억',
    jeonse84: '8억 ~ 12억',
    subway: '4호선 · 경의중앙선 이촌역 초역세권',
    school: '신용산초 · 용강중 · 중경고',
    category: '재건축/정비사업',
    tags: ['재건축/정비사업', '용적률101%', '동부이촌동', '대지지분최강', '한강변재건축'],
    summary: '1971년 준공된 5층 저층 단지로 용적률이 단 101%에 불과해 서울 한강변에서도 독보적인 대지지분을 자랑하는 동부이촌동의 보석. 이촌한강공원과 신용산초 학군을 동시에 품고 있습니다.',
    images: [
      './images/apt/apt-ichon-hangang-mansion-1.jpg',
      './images/apt/apt-ichon-hangang-mansion-2.jpg',
      './images/apt/apt-ichon-hangang-mansion-3.jpg'
    ],
    likesBase: 1180
  },
  {
    id: 'apt-yeouido-sibeom',
    complexNo: '749',
    name: '여의도 시범아파트',
    district: '영등포구',
    dong: '여의도동',
    regionId: 'yeouido_mokdong',
    handle: '영등포구_여의도동',
    builder: '서울시 (현대건설 시공사 선정)',
    builtYear: 1971,
    households: 1584,
    buildings: 24,
    maxFloor: 13,
    far: '158%',
    parking: '0.80대',
    areaTypes: '60㎡ · 79㎡ · 118㎡ · 156㎡',
    price84: '25억 ~ 38억',
    jeonse84: '6.5억 ~ 10억',
    subway: '5호선 여의나루역 · 9호선 샛강역/여의도역',
    school: '여의도초 · 여의도중 · 여의도고/여의도여고',
    category: '재건축/정비사업',
    tags: ['재건축/정비사업', '여의도시범', '최고65층계획', '여의도한강공원', '금융중심지'],
    summary: '1971년 국내 최초의 단지형 고층 엘리베이터 아파트로 지어진 한국 주거사의 산증인. 여의도 한강공원 바로 앞에 위치하며 최고 65층 규모의 초고층 복합 재건축이 추진되고 있습니다.',
    images: [
      './images/apt/apt-yeouido-sibeom-1.jpg',
      './images/apt/apt-yeouido-sibeom-2.jpg',
      './images/apt/apt-yeouido-sibeom-3.jpg'
    ],
    likesBase: 1410
  },
  {
    id: 'apt-mokdong-7',
    complexNo: '659',
    name: '목동 신시가지 아파트 7단지',
    district: '양천구',
    dong: '목동',
    regionId: 'yeouido_mokdong',
    handle: '양천구_목동',
    builder: '서울시 주택건립본부',
    builtYear: 1986,
    households: 2550,
    buildings: 34,
    maxFloor: 15,
    far: '124%',
    parking: '0.80대',
    areaTypes: '66㎡(20평) · 89㎡(27평) · 115㎡(35평)',
    price84: '22억 ~ 26억',
    jeonse84: '7.5억 ~ 9.5억',
    subway: '5호선 목동역 · 오목교역 초역세권',
    school: '서정초 · 목운초 · 목운중 · 진명여고',
    category: '명문학군',
    tags: ['명문학군', '목동대장', '용적률124%', '목동역초역세권', '재건축/정비사업'],
    summary: '목동 1~14단지(총 2만 6천 세대) 중에서도 5호선 목동역·오목교역과 현대백화점, 중심 학원가를 모두 낀 대장 단지. 124%의 낮은 용적률과 최고 수준 학군으로 실거주와 투자를 동시에 만족시킵니다.',
    images: [
      './images/apt/apt-mokdong-7-1.jpg',
      './images/apt/apt-mokdong-7-2.jpg',
      './images/apt/apt-mokdong-7-3.jpg'
    ],
    likesBase: 1550
  },
  {
    id: 'apt-magok-mvalley7',
    complexNo: '107477',
    name: '마곡 엠밸리 7단지',
    district: '강서구',
    dong: '마곡동',
    regionId: 'yeouido_mokdong',
    handle: '강서구_마곡동',
    builder: 'SH 서울주택도시공사 (태영·대보)',
    builtYear: 2014,
    households: 1004,
    buildings: 16,
    maxFloor: 15,
    far: '198%',
    parking: '1.31대',
    areaTypes: '59㎡ · 84㎡ · 114㎡',
    price84: '15.5억 ~ 17.5억',
    jeonse84: '7.5억 ~ 8.8억',
    subway: '9호선 · 공항철도 마곡나루역 초역세권 (5호선 마곡역 인접)',
    school: '공항초 · 마곡중 · 마곡하늬중',
    category: '숲세권/대단지',
    tags: ['숲세권/대단지', '서울식물원', '마곡나루역급행', 'LG사이언스파크', '마곡대장'],
    summary: '여의도공원 2.2배 규모의 서울식물원 호수공원을 내 집 정원처럼 누리는 마곡지구 대장 단지. 9호선 급행 및 공항철도 환승역인 마곡나루역과 LG사이언스파크 첨단업무단지가 도보권입니다.',
    images: [
      './images/apt/apt-magok-mvalley7-1.jpg',
      './images/apt/apt-magok-mvalley7-2.jpg',
      './images/apt/apt-magok-mvalley7-3.jpg'
    ],
    likesBase: 1120
  },
  {
    id: 'apt-olympicpark-foreon',
    complexNo: '155817',
    name: '올림픽파크 포레온 (구 둔촌주공)',
    district: '강동구',
    dong: '둔촌동',
    regionId: 'gangdong_gwangjin',
    handle: '강동구_둔촌동',
    builder: '현대건설 · HDC현대산업개발 · 대우건설 · 롯데건설',
    builtYear: 2024,
    households: 12032,
    buildings: 85,
    maxFloor: 35,
    far: '273%',
    parking: '1.48대',
    areaTypes: '49㎡ · 59㎡ · 84㎡ · 95㎡ · 109㎡ · 134㎡',
    price84: '23억 ~ 26.5억',
    jeonse84: '10억 ~ 12억',
    subway: '5호선 둔촌동역 · 9호선 둔촌오륜역(급행)',
    school: '둔촌초 · 위례초 · 동북중 · 동북고 · 보성고',
    category: '하이엔드/신축',
    tags: ['하이엔드/신축', '12032세대', '단군이후최대재건축', '올림픽공원숲세권', '9호선급행'],
    summary: '단군 이래 최대 재건축으로 불리는 12,032세대 국내 최대 규모 신축 아파트. 올림픽공원과 맞닿은 쾌적한 숲세권 환경에 5호선과 9호선 급행 더블역세권, 스카이라운지 커뮤니티를 갖췄습니다.',
    images: [
      './images/apt/apt-olympicpark-foreon-1.jpg',
      './images/apt/apt-olympicpark-foreon-2.jpg',
      './images/apt/apt-olympicpark-foreon-3.jpg'
    ],
    likesBase: 2280
  },
  {
    id: 'apt-godeok-gracium',
    complexNo: '113907',
    name: '고덕 그라시움 (Godeok Gracium)',
    district: '강동구',
    dong: '고덕동',
    regionId: 'gangdong_gwangjin',
    handle: '강동구_고덕동',
    builder: '대우건설 · 현대건설 · SK에코플랜트',
    builtYear: 2019,
    households: 4932,
    buildings: 53,
    maxFloor: 35,
    far: '249%',
    parking: '1.36대',
    areaTypes: '59㎡ · 73㎡ · 84㎡ · 97㎡ · 113㎡',
    price84: '18.5억 ~ 20.5억',
    jeonse84: '8.5억 ~ 10억',
    subway: '5호선 상일동역 · 고덕역 (9호선 연장 예정)',
    school: '강덕초 · 고덕초 · 고덕중 · 한영외고/배재고 인접',
    category: '숲세권/대단지',
    tags: ['숲세권/대단지', '고덕대장', '4932세대', '초품아', '9호선연장수혜'],
    summary: '고덕 지구 신축 브랜드 타운의 핵심 대장주인 4,932세대 대단지. 사계절 테마 정원과 실내 수영장, 단지 주변 명일근린공원·동명근린공원으로 둘러싸여 아이 키우기 좋은 주거 환경으로 꼽힙니다.',
    images: [
      './images/apt/apt-godeok-gracium-1.jpg',
      './images/apt/apt-godeok-gracium-2.jpg',
      './images/apt/apt-godeok-gracium-3.jpg'
    ],
    likesBase: 1290
  },
  {
    id: 'apt-gwangjang-walkerhill',
    complexNo: '70',
    name: '광장동 워커힐아파트',
    district: '광진구',
    dong: '광장동',
    regionId: 'gangdong_gwangjin',
    handle: '광진구_광장동',
    builder: '선경종합건설 (SK)',
    builtYear: 1978,
    households: 576,
    buildings: 14,
    maxFloor: 13,
    far: '108%',
    parking: '1.50대',
    areaTypes: '186㎡(56평) · 212㎡(64평) · 226㎡(67평) · 254㎡(77평)',
    price84: '32억 ~ 45억 (대형평형 구성)',
    jeonse84: '11억 ~ 15억',
    subway: '5호선 광나루역',
    school: '양진초 · 양진중 · 광남고 학군 인접',
    category: '숲세권/대단지',
    tags: ['숲세권/대단지', '아차산숲세권', '용적률108%', '한강조망', '광장동전통부촌'],
    summary: '아차산 자락의 울창한 숲과 한강 조망을 동시에 품은 강북 전통의 대형평형 부촌 단지. 전 세대가 50~70평대 대형으로만 구성되어 있으며 용적률 108%로 세대당 대지지분이 압도적입니다.',
    images: [
      './images/apt/apt-gwangjang-walkerhill-1.jpg',
      './images/apt/apt-gwangjang-walkerhill-2.jpg',
      './images/apt/apt-gwangjang-walkerhill-3.jpg'
    ],
    likesBase: 990
  },
  {
    id: 'apt-heukseok-acroriverheim',
    complexNo: '113292',
    name: '흑석 아크로리버하임',
    district: '동작구',
    dong: '흑석동',
    regionId: 'gangdong_gwangjin',
    handle: '동작구_흑석동',
    builder: 'DL이앤씨 (ACRO)',
    builtYear: 2018,
    households: 1073,
    buildings: 20,
    maxFloor: 28,
    far: '245%',
    parking: '1.25대',
    areaTypes: '59㎡ · 72㎡ · 84㎡ · 115㎡',
    price84: '25억 ~ 28.5억',
    jeonse84: '11억 ~ 13억',
    subway: '9호선 흑석역 초역세권 (여의도·반포·강남 직결)',
    school: '흑석초 · 중앙사대부속초 · 중앙사대부중',
    category: '한강뷰/랜드마크',
    tags: ['한강뷰/랜드마크', '흑석뉴타운대장', '9호선흑석역', '준강남', '아크로브랜드'],
    summary: '흑석뉴타운 한강변 최전선에 위치해 반포와 여의도를 10분대로 잇는 동작구 대장 단지. 9호선 흑석역 초역세권 평지 입지와 한강대교·여의도 불꽃축제가 보이는 파노라마 조망으로 유명합니다.',
    images: [
      './images/apt/apt-heukseok-acroriverheim-1.jpg',
      './images/apt/apt-heukseok-acroriverheim-2.jpg',
      './images/apt/apt-heukseok-acroriverheim-3.jpg'
    ],
    likesBase: 1460
  },
  {
    id: 'apt-gyeonghuigung-xi',
    complexNo: '109379',
    name: '경희궁 자이 (Gyeonghuigung Xi 1~4단지)',
    district: '종로구',
    dong: '홍파동 · 평동',
    regionId: 'central',
    handle: '종로구_홍파동',
    builder: 'GS건설 (Xi)',
    builtYear: 2017,
    households: 2533,
    buildings: 30,
    maxFloor: 21,
    far: '248%',
    parking: '1.28대',
    areaTypes: '33㎡ · 45㎡ · 59㎡ · 84㎡ · 101㎡ · 116㎡ · 138㎡',
    price84: '21.5억 ~ 24.5억',
    jeonse84: '10.5억 ~ 12.5억',
    subway: '5호선 서대문역 · 3호선 독립문역 초역세권',
    school: '독립문초 · 매동초 · 창덕여중 · 이화여고',
    category: '초역세권/직주근접',
    tags: ['초역세권/직주근접', '광화문도보출퇴근', '한양도성성곽길', '강북대장', '경희궁자이'],
    summary: '광화문·시청·종로 업무지구를 도보로 출퇴근할 수 있는 사대문 안 최대 규모 신축 브랜드 단지. 한양도성 성곽길과 경희궁, 강북삼성병원을 끼고 있어 전문직·고위직 실거주 수요가 두텁습니다.',
    images: [
      './images/apt/apt-gyeonghuigung-xi-1.jpg',
      './images/apt/apt-gyeonghuigung-xi-2.jpg',
      './images/apt/apt-gyeonghuigung-xi-3.jpg'
    ],
    likesBase: 1610
  },
  {
    id: 'apt-namsan-town',
    complexNo: '3833',
    name: '신당 남산타운 아파트',
    district: '중구',
    dong: '신당동',
    regionId: 'central',
    handle: '중구_신당동',
    builder: '현대건설 · 동아건설',
    builtYear: 2002,
    households: 5150,
    buildings: 42,
    maxFloor: 18,
    far: '227%',
    parking: '1.05대',
    areaTypes: '59㎡(26평) · 84㎡(32평) · 114㎡(42평)',
    price84: '13.5억 ~ 15.2억',
    jeonse84: '6.8억 ~ 7.8억',
    subway: '6호선 버티고개역 · 3/6호선 약수역 초역세권',
    school: '서울방송고 인접 · 장충초 · 금호초',
    category: '숲세권/대단지',
    tags: ['숲세권/대단지', '남산자락산책로', '5150세대', '약수역3호선', '강남광화문15분'],
    summary: '남산 둘레길과 직접 연결된 5,150세대 도심 속 숲세권 매머드 단지. 3호선 약수역과 6호선 버티고개역을 통해 압구정·신사동과 광화문·을지로를 모두 10분대에 주파하는 알짜 입지입니다.',
    images: [
      './images/apt/apt-namsan-town-1.jpg',
      './images/apt/apt-namsan-town-2.jpg',
      './images/apt/apt-namsan-town-3.jpg'
    ],
    likesBase: 1080
  },
  {
    id: 'apt-dmc-parkview-xi',
    complexNo: '108064',
    name: 'DMC 파크뷰자이 (1~5단지)',
    district: '서대문구',
    dong: '남가좌동',
    regionId: 'central',
    handle: '서대문구_남가좌동',
    builder: 'GS건설 · SK에코플랜트 · 현대산업개발',
    builtYear: 2015,
    households: 4300,
    buildings: 59,
    maxFloor: 33,
    far: '234%',
    parking: '1.21대',
    areaTypes: '59㎡ · 84㎡ · 120㎡ · 152㎡',
    price84: '13.2억 ~ 15.0억',
    jeonse84: '7.0억 ~ 8.2억',
    subway: '경의중앙선 가좌역 · 6호선 증산역',
    school: '가재울초 · 가재울중 · 가재울고 (초·중·고 품은 단지)',
    category: '숲세권/대단지',
    tags: ['숲세권/대단지', '가재울뉴타운대장', '4300세대', '상암DMC직주근접', '수영장커뮤니티'],
    summary: '가재울뉴타운을 대표하는 4,300세대 랜드마크 대단지. 단지 안에 초·중·고가 모두 자리하고 홍제천·불광천 수변 산책로와 상암 DMC·홍대·광화문 접근성이 뛰어납니다.',
    images: [
      './images/apt/apt-dmc-parkview-xi-1.jpg',
      './images/apt/apt-dmc-parkview-xi-2.jpg',
      './images/apt/apt-dmc-parkview-xi-3.jpg'
    ],
    likesBase: 1140
  },
  {
    id: 'apt-cheongnyangni-lottel65',
    complexNo: '127331',
    name: '청량리역 롯데캐슬 SKY-L65',
    district: '동대문구',
    dong: '전농동',
    regionId: 'northeast',
    handle: '동대문구_청량리',
    builder: '롯데건설',
    builtYear: 2023,
    households: 1425,
    buildings: 4,
    maxFloor: 65,
    far: '962%',
    parking: '1.32대',
    areaTypes: '84㎡ · 102㎡ · 177㎡ 펜트',
    price84: '16.5억 ~ 19.2억',
    jeonse84: '8.5억 ~ 10억',
    subway: '1호선 · 경의중앙선 · 수인분당선 · KTX · GTX-B/C 청량리역 초역세권',
    school: '전동초 · 전농중 · 해성여고',
    category: '초역세권/직주근접',
    tags: ['초역세권/직주근접', '최고65층', '청량리스카이라인', 'GTX환승거점', '백화점슬세권'],
    summary: '동북권 스카이라인을 바꾼 최고 65층 높이의 초고층 주상복합 랜드마크. 1호선·수인분당선·KTX에 향후 GTX-B·C노선까지 집중되는 청량리역과 롯데백화점·롯데마트를 단지 바로 앞에서 이용합니다.',
    images: [
      './images/apt/apt-cheongnyangni-lottel65-1.jpg',
      './images/apt/apt-cheongnyangni-lottel65-2.jpg',
      './images/apt/apt-cheongnyangni-lottel65-3.jpg'
    ],
    likesBase: 1420
  },
  {
    id: 'apt-junggye-cheonggu3',
    complexNo: '249',
    name: '중계 청구3차 · 건영3차 아파트',
    district: '노원구',
    dong: '중계동',
    regionId: 'northeast',
    handle: '노원구_중계동',
    builder: '청구 · 건영',
    builtYear: 1996,
    households: 1410,
    buildings: 15,
    maxFloor: 15,
    far: '226%',
    parking: '1.00대',
    areaTypes: '84㎡(33평) 단일 평형 구성',
    price84: '11.2억 ~ 12.6억',
    jeonse84: '6.2억 ~ 7.2억',
    subway: '7호선 중계역 · 하계역 (동북선 경전철 은행사거리역 예정)',
    school: '을지초 · 을지중 · 청원고 · 대진고 (은행사거리 학원가)',
    category: '명문학군',
    tags: ['명문학군', '은행사거리학원가', '을지초을지중', '33평단일구성', '동북선호재'],
    summary: '강북 최고의 교육 특구인 중계동 은행사거리 학원가 핵심 입지에 자리한 학군 대장 단지. 전 세대가 선호도 높은 전용 84㎡(33평) 단일 평형으로 구성되어 있으며 을지초·을지중 배정으로 유명합니다.',
    images: [
      './images/apt/apt-junggye-cheonggu3-1.jpg',
      './images/apt/apt-junggye-cheonggu3-2.jpg',
      './images/apt/apt-junggye-cheonggu3-3.jpg'
    ],
    likesBase: 1090
  },
  {
    id: 'apt-gireum-raemian-centerpiece',
    complexNo: '111330',
    name: '래미안 길음 센터피스',
    district: '성북구',
    dong: '길음동',
    regionId: 'northeast',
    handle: '성북구_길음동',
    builder: '삼성물산 (래미안)',
    builtYear: 2019,
    households: 2352,
    buildings: 24,
    maxFloor: 39,
    far: '296%',
    parking: '1.22대',
    areaTypes: '59㎡ · 84㎡ · 109㎡',
    price84: '13.5억 ~ 15.2억',
    jeonse84: '7.2억 ~ 8.3억',
    subway: '4호선 미아사거리역 초역세권',
    school: '서울영훈초(사립) · 개운초 · 성신여중 · 대일외고 인접',
    category: '초역세권/직주근접',
    tags: ['초역세권/직주근접', '길음뉴타운대장', '미아사거리역평지', '현대백화점슬세권', '2352세대'],
    summary: '길음뉴타운 내에서도 귀한 평지 입지에 4호선 미아사거리역 초역세권과 현대백화점·이마트 상권을 동시에 누리는 성북구 대장주. 세련된 커튼월룩 외관과 풍부한 커뮤니티를 갖췄습니다.',
    images: [
      './images/apt/apt-gireum-raemian-centerpiece-1.jpg',
      './images/apt/apt-gireum-raemian-centerpiece-2.jpg',
      './images/apt/apt-gireum-raemian-centerpiece-3.jpg'
    ],
    likesBase: 1150
  },
  {
    id: 'apt-nokbeon-castle',
    complexNo: '119275',
    name: '녹번역 e편한세상 캐슬',
    district: '은평구',
    dong: '응암동',
    regionId: 'northwest_south',
    handle: '은평구_녹번역',
    builder: 'DL이앤씨 · 롯데건설',
    builtYear: 2020,
    households: 2569,
    buildings: 32,
    maxFloor: 23,
    far: '234%',
    parking: '1.23대',
    areaTypes: '44㎡ · 59㎡ · 84㎡ · 99㎡ · 114㎡',
    price84: '12.5억 ~ 14.0억',
    jeonse84: '6.8억 ~ 7.8억',
    subway: '3호선 녹번역 초역세권 (연신내 GTX-A 2정거장)',
    school: '서울은평초(단지내 초품아) · 영락중',
    category: '숲세권/대단지',
    tags: ['숲세권/대단지', '3호선녹번역', '백련산숲세권', '살구나무보존조경', '초품아'],
    summary: '3호선 녹번역 초역세권으로 광화문까지 15분, 압구정까지 30분대에 닿는 은평구 대표 신축 대단지. 백련산 숲세권과 수령 200년 된 살구나무를 보존한 아름다운 생태 조경으로 유명합니다.',
    images: [
      './images/apt/apt-nokbeon-castle-1.jpg',
      './images/apt/apt-nokbeon-castle-2.jpg',
      './images/apt/apt-nokbeon-castle-3.jpg'
    ],
    likesBase: 1060
  },
  {
    id: 'apt-sindorim-daelim4',
    complexNo: '3356',
    name: '신도림 동아 · 대림4차 아파트 (신도림역세권)',
    district: '구로구',
    dong: '신도림동',
    regionId: 'northwest_south',
    handle: '구로구_신도림동',
    builder: '대림산업 · 동아건설',
    builtYear: 2000,
    households: 3691,
    buildings: 37,
    maxFloor: 25,
    far: '269%',
    parking: '1.25대',
    areaTypes: '59㎡ · 84㎡ · 114㎡ · 148㎡',
    price84: '12.5억 ~ 14.2억',
    jeonse84: '6.8억 ~ 7.8억',
    subway: '1호선 · 2호선 · GTX-B(예정) 신도림역 초역세권',
    school: '신도림초 · 신도림중 · 신도림고',
    category: '초역세권/직주근접',
    tags: ['초역세권/직주근접', '2호선신도림역', '디큐브시티현대백화점', '신도림학군', '안양천산책로'],
    summary: '2호선·1호선 더블 역세권 신도림역과 직결에 가까운 입지로 강남·여의도·가산디지털단지를 모두 빠르게 연결하는 서남권 주거 중심지. 신도림초·중 학군과 안양천·도림천 수변공원을 끼고 있습니다.',
    images: [
      './images/apt/apt-sindorim-daelim4-1.jpg',
      './images/apt/apt-sindorim-daelim4-2.jpg',
      './images/apt/apt-sindorim-daelim4-3.jpg'
    ],
    likesBase: 980
  },
  {
    id: 'apt-olympic-family-town',
    complexNo: '610',
    name: '문정 올림픽훼밀리타운',
    district: '송파구',
    dong: '문정동',
    regionId: 'gangnam3',
    handle: '송파구_문정동',
    builder: '현대건설 · 극동 · 동아 · 대림 등',
    builtYear: 1988,
    households: 4494,
    buildings: 56,
    maxFloor: 15,
    far: '194%',
    parking: '1.15대',
    areaTypes: '84㎡(31평) · 112㎡(40평) · 136㎡(49평) · 158㎡(56평) · 192㎡(68평)',
    price84: '20억 ~ 23억',
    jeonse84: '8.0억 ~ 9.8억',
    subway: '3호선 · 8호선 가락시장역 초역세권 (수서 SRT 인접)',
    school: '가원초 · 가원중 · 문정고',
    category: '재건축/정비사업',
    tags: ['재건축/정비사업', '88올림픽유산', '4494세대대단지', '가락시장역더블역세권', '수서역세권인접'],
    summary: '88 서울올림픽 당시 건립된 4,494세대 매머드급 단지로, 올림픽선수기자촌·아시아선수촌과 함께 올림픽 3대장 재건축으로 꼽힙니다. 3·8호선 가락시장역 초역세권과 탄천 수변 산책로를 끼고 있습니다.',
    images: [
      './images/apt/apt-olympic-family-town-1.jpg',
      './images/apt/apt-olympic-family-town-2.jpg',
      './images/apt/apt-olympic-family-town-3.jpg'
    ],
    likesBase: 1240
  },
  {
    id: 'apt-dogok-rexle',
    complexNo: '11698',
    name: '도곡 렉슬 (Dogok Rexle)',
    district: '강남구',
    dong: '도곡동',
    regionId: 'gangnam3',
    handle: '강남구_도곡동',
    builder: '현대건설 · GS건설 · 쌍용건설',
    builtYear: 2006,
    households: 3002,
    buildings: 34,
    maxFloor: 25,
    far: '270%',
    parking: '1.70대',
    areaTypes: '59㎡ · 84㎡ · 114㎡ · 134㎡ · 168㎡',
    price84: '31억 ~ 34.5억',
    jeonse84: '13.5억 ~ 16억',
    subway: '수인분당선 한티역 · 3호선/수인분당선 도곡역 초역세권',
    school: '대도초 · 숙명여중/숙명여고 · 중대부고 · 단대부고',
    category: '명문학군',
    tags: ['명문학군', '대도초배정', '한티역초역세권', '대치동학원가도보', '3002세대'],
    summary: '강남 8학군의 정점인 대도초·숙명여중고·단대부고·중대부고와 대치동 학원가를 도보로 누리는 3,002세대 대단지. 한티역 롯데백화점과 도곡역 더블 역세권이 맞닿아 있습니다.',
    images: [
      './images/apt/apt-dogok-rexle-1.jpg',
      './images/apt/apt-dogok-rexle-2.jpg',
      './images/apt/apt-dogok-rexle-3.jpg'
    ],
    likesBase: 1680
  }
];

// 아파트 별 네이버 부동산 단지 고유 URL / 네이버 지도 / 호갱노노 URL 생성 헬퍼
function enrichApartmentUrls(apt) {
  const manifestEntry = aptPhotoManifest[apt.id];
  const complexNo = apt.complexNo || (manifestEntry && manifestEntry.complexNo) || null;
  const images = (manifestEntry && manifestEntry.images && manifestEntry.images.length > 0)
    ? manifestEntry.images
    : apt.images;

  const query = encodeURIComponent(`서울 ${apt.district} ${apt.dong} ${apt.name.split('(')[0].trim()}`);
  const shortQuery = encodeURIComponent(apt.name.split('(')[0].trim());
  const naverLandDirect = complexNo
    ? `https://fin.land.naver.com/complexes/${complexNo}`
    : `https://new.land.naver.com/search?sk=${shortQuery}`;

  return {
    ...apt,
    complexNo,
    images,
    avatar: images && images[0] ? images[0] : './images/apt/apt-onebailey-1.jpg',
    link: naverLandDirect,
    naverLandUrl: naverLandDirect,
    naverMapUrl: `https://map.naver.com/p/search/${query}`,
    kakaoMapUrl: `https://map.kakao.com/?q=${query}`,
    hogangnonoUrl: `https://hogangnono.com/search?q=${shortQuery}`,
    pubDate: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 18)).toISOString()
  };
}

// 실시간 네이버 부동산 단지 첫번째 사진 & 고유번호 자동 추출 함수 (새 관심단지 추가 시 활용)
async function fetchNaverComplexPhotoByQuery(queryText) {
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
  const url = `https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=${encodeURIComponent(queryText)}`;
  const res = await fetch(url, { headers: { 'User-Agent': ua } });
  const html = await res.text();

  const complexMatch = html.match(/https:\/\/fin\.land\.naver\.com\/complexes\/(\d+)/);
  const complexNo = complexMatch ? complexMatch[1] : null;
  const photos = [];

  const wrapIdx = html.indexOf('class="land_correct_wrap"');
  if (wrapIdx !== -1) {
    const landSection = html.slice(wrapIdx, wrapIdx + 35000);
    const thumbGroupEnd = landSection.indexOf('class="title_group"');
    const thumbGroupHtml = thumbGroupEnd !== -1 ? landSection.slice(0, thumbGroupEnd) : landSection.slice(0, 5000);
    const tgMatches = [...thumbGroupHtml.matchAll(/https?:\/\/search\.pstatic\.net\/common\/\?src=([^"'\s&<>]+)/gi)];
    for (const m of tgMatches) {
      const rawUrl = decodeURIComponent(m[1]);
      if (rawUrl.includes('landthumb-phinf.pstatic.net')) {
        photos.push(`https://search.pstatic.net/common/?src=${encodeURIComponent(rawUrl)}&type=sc960_832`);
      }
    }
  }

  if (photos.length === 0) {
    const imgUrl = `https://search.naver.com/search.naver?where=image&sm=tab_jum&query=${encodeURIComponent(queryText + ' 아파트 외관 전경')}`;
    const resImg = await fetch(imgUrl, { headers: { 'User-Agent': ua } });
    const htmlImg = await resImg.text();
    const matches = [...htmlImg.matchAll(/https?:\/\/search\.pstatic\.net\/common\/\?src=([^"'\s&<>\\]+)/gi)]
      .map(m => decodeURIComponent(m[1]))
      .filter(u => /^https?:\/\//i.test(u) && !u.includes('blogpfthumb') && !u.includes('profile'));
    for (const u of matches.slice(0, 3)) {
      photos.push(`https://search.pstatic.net/common/?src=${encodeURIComponent(u)}&type=sc960_832`);
    }
  }

  return {
    complexNo,
    images: [...new Set(photos)].slice(0, 3)
  };
}

// 서울 아파트·부동산 필수 플랫폼 디렉토리
const APT_PLATFORMS = [
  {
    id: 'plat-hogangnono',
    name: '호갱노노 (Hogangnono)',
    handle: '@hogangnono',
    url: 'https://hogangnono.com',
    category: '실거래·입지·학군 분석',
    region: '필수 앱 1위',
    description: '아파트 실거래가 추이, 3D 일조량 시뮬레이션, 초등학교 배정 학군, 학원가 분포, 입주민 생생 이야기까지 제공하는 국민 아파트 분석 플랫폼.',
    coverImage: './images/apt/apt-onebailey-1.jpg',
    tags: ['실거래가', '일조량3D', '학군지도', '입주민리뷰']
  },
  {
    id: 'plat-naverland',
    name: '네이버페이 부동산 (Naver Land)',
    handle: '@naver_land',
    url: 'https://new.land.naver.com',
    category: '실시간 매물·평면도',
    region: '국내 최대 매물DB',
    description: '서울 전 단지 실시간 매매·전세·월세 호가 매물과 평형별 정밀 평면도, 관리비, 세대수, 단지 내 거리뷰를 확인할 수 있는 필수 포털.',
    coverImage: './images/apt/apt-acro-seoul-forest-1.jpg',
    tags: ['실시간매물', '평면도', '호가비교', '단지정보']
  },
  {
    id: 'plat-asil',
    name: '아실 (아파트실거래가 ASIL)',
    handle: '@asil_kr',
    url: 'https://asil.kr',
    category: '실거래 비교·빅데이터',
    region: '데이터 분석',
    description: '서울 자치구별 최고가/최저가 비교, 여러 단지 실거래 그래프 동시 비교, 입주 물량 및 미분양 통계를 한눈에 보여주는 전문 사이트.',
    coverImage: './images/apt/apt-trimage-1.jpg',
    tags: ['단지비교', '입주물량', '최고가조회', '갭투자분석']
  },
  {
    id: 'plat-molit',
    name: '국토교통부 실거래가 공개시스템',
    handle: '@rt_molit_go_kr',
    url: 'https://rt.molit.go.kr',
    category: '정부 공식 실거래 원장',
    region: '공공 공식 데이터',
    description: '대한민국 모든 아파트 매매·전월세 및 분양권·입주권 실거래 신고 내역과 등기 여부를 가장 정확하게 조회하는 정부 공식 포털.',
    coverImage: './images/apt/apt-apgujeong-hyundai-1.jpg',
    tags: ['국토부공식', '등기여부확인', '실거래신고', '계약일조회']
  },
  {
    id: 'plat-seoulland',
    name: '서울부동산정보광장',
    handle: '@land_seoul_go_kr',
    url: 'https://land.seoul.go.kr',
    category: '서울시 공식 거래량 통계',
    region: '서울특별시 운영',
    description: '서울시 25개 자치구별 월별 아파트 매매 거래량, 전월세 거래 건수, 토지거래허가구역 현황을 실시간으로 집계하는 서울시 공식 플랫폼.',
    coverImage: './images/apt/apt-heliocity-1.jpg',
    tags: ['서울거래량', '자치구통계', '토지거래허가', '서울시공식']
  },
  {
    id: 'plat-cleanup',
    name: '서울시 정비사업 정보몽땅',
    handle: '@cleanup_seoul',
    url: 'https://cleanup.seoul.go.kr',
    category: '재건축·재개발 추진현황',
    region: '서울시 정비사업',
    description: '서울 시내 재건축·재개발 조합 설립, 사업시행인가, 관리처분인가 등 정비사업 단계별 진행 현황과 공고문을 투명하게 공개하는 시스템.',
    coverImage: './images/apt/apt-yeouido-sibeom-1.jpg',
    tags: ['재건축단계', '재개발조합', '신속통합기획', '정비구역']
  },
  {
    id: 'plat-applyhome',
    name: '한국부동산원 청약홈 (ApplyHome)',
    handle: '@applyhome_co_kr',
    url: 'https://www.applyhome.co.kr',
    category: '신축 분양·무순위 청약',
    region: '공식 청약 포털',
    description: '서울 강남3구 분양가상한제 로또 청약부터 무순위 줍줍 공고, 청약 가점 계산, 당첨자 조회까지 진행하는 대한민국 공식 아파트 청약 포털.',
    coverImage: './images/apt/apt-olympicpark-foreon-1.jpg',
    tags: ['아파트청약', '입주자모집공고', '무순위줍줍', '청약가점']
  },
  {
    id: 'plat-ziin',
    name: '부동산지인 (Ziin)',
    handle: '@aptgin_com',
    url: 'https://aptgin.com',
    category: '시장강도·수요입주 빅데이터',
    region: '빅데이터 지표',
    description: '지역별 시장강도, 전출입 인구 이동, 미분양 추이, 다차원 아파트 가격 지수를 시각화하여 매수·매도 타이밍 분석을 돕는 플랫폼.',
    coverImage: './images/apt/apt-marp-raemian-prugio-1.jpg',
    tags: ['시장강도', '인구전출입', '수요물량', '빅데이터']
  },
  {
    id: 'plat-richgo',
    name: '리치고 (Richgo)',
    handle: '@richgo_ai',
    url: 'https://m.richgo.ai',
    category: 'AI 시세예측·호재지도',
    region: 'AI 프롭테크',
    description: 'GTX 노선도, 지하철 연장선, 학군 성취도, 재건축 사업성 점수를 지도 위에 직관적으로 겹쳐 볼 수 있는 AI 부동산 분석 서비스.',
    coverImage: './images/apt/apt-cheongnyangni-lottel65-1.jpg',
    tags: ['교통호재지도', 'GTX노선', '재건축사업성', 'AI시세']
  },
  {
    id: 'plat-kbland',
    name: 'KB부동산 (KB Land)',
    handle: '@kbland_kr',
    url: 'https://kbland.kr',
    category: 'KB시세·주간동향·대출한도',
    region: '금융권 표준시세',
    description: '은행 주택담보대출의 기준이 되는 KB아파트시세와 주간 매매·전세 가격 증감률, 매수우위지수를 제공하는 금융권 대표 부동산 플랫폼.',
    coverImage: './images/apt/apt-gyeonghuigung-xi-1.jpg',
    tags: ['KB시세', '주담대한도', '매수우위지수', '주간시황']
  }
];

let cachedNews = {
  items: [],
  lastFetched: 0
};

const NEWS_CACHE_TTL = 15 * 60 * 1000;

function decodeHtmlEntities(str = '') {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function extractTagContent(xml, tagName) {
  const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? decodeHtmlEntities(match[1]).replace(/<[^>]+>/g, '').trim() : '';
}

async function fetchLiveSeoulAptNews() {
  const now = Date.now();
  if (cachedNews.items.length > 0 && now - cachedNews.lastFetched < NEWS_CACHE_TTL) {
    return cachedNews.items;
  }

  try {
    const rssUrl = 'https://news.google.com/rss/search?q=' + encodeURIComponent('서울 아파트 실거래 OR 재건축 OR 분양') + '&hl=ko&gl=KR&ceid=KR:ko';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    const newsItems = [];
    let match;
    while ((match = itemRegex.exec(xml)) !== null && newsItems.length < 6) {
      const block = match[1];
      const title = extractTagContent(block, 'title');
      const link = extractTagContent(block, 'link');
      const source = extractTagContent(block, 'source') || '부동산 뉴스';
      const pubDate = extractTagContent(block, 'pubDate');
      if (title && link) {
        newsItems.push({ title, link, source, pubDate });
      }
    }

    if (newsItems.length > 0) {
      cachedNews = { items: newsItems, lastFetched: now };
      return newsItems;
    }
  } catch (_) {}

  return [
    {
      title: '서울 한강변 및 강남3구 주요 대단지 실거래가 및 신고가 흐름 집중 조명',
      link: 'https://land.seoul.go.kr',
      source: '서울부동산정보광장'
    },
    {
      title: '압구정·여의도·목동 신속통합기획 재건축 단지별 정비계획 추진 현황',
      link: 'https://cleanup.seoul.go.kr',
      source: '정비사업 정보몽땅'
    },
    {
      title: '마용성 및 초역세권 대단지 전세가율·실거주 수요 변화 리포트',
      link: 'https://rt.molit.go.kr',
      source: '국토부 실거래가 시스템'
    },
    {
      title: '서울 주요 뉴타운 신축 대단지 입주장 및 청약 경쟁률 분석',
      link: 'https://www.applyhome.co.kr',
      source: '한국부동산원 청약홈'
    }
  ];
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getAllEnrichedApartments() {
  return SEOUL_APARTMENTS.map(enrichApartmentUrls);
}

// 정적 스냅샷 파일 생성 (GitHub Pages 및 오프라인 호환용)
function writeStaticDataSnapshots() {
  try {
    const dataDir = path.join(PUBLIC_DIR, 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const enriched = getAllEnrichedApartments();
    const regionStats = {};
    SEOUL_REGIONS.forEach(r => {
      regionStats[r.id] = {
        count: enriched.filter(a => a.regionId === r.id).length,
        name: r.name
      };
    });

    fs.writeFileSync(
      path.join(dataDir, 'apartments.json'),
      JSON.stringify({
        total: enriched.length,
        lastUpdated: Date.now(),
        regions: SEOUL_REGIONS,
        regionStats,
        items: enriched
      }, null, 2),
      'utf-8'
    );

    fs.writeFileSync(
      path.join(dataDir, 'sites.json'),
      JSON.stringify({
        total: APT_PLATFORMS.length,
        sites: APT_PLATFORMS
      }, null, 2),
      'utf-8'
    );
  } catch (_) {}
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = reqUrl.pathname;

    // API: 서울 아파트 피드 목록 조회
    if (pathname === '/api/apartments' && req.method === 'GET') {
      const shuffle = reqUrl.searchParams.get('shuffle') !== 'false';
      const category = reqUrl.searchParams.get('category') || 'all';
      const region = reqUrl.searchParams.get('region') || 'all';
      const q = (reqUrl.searchParams.get('q') || '').trim().toLowerCase();

      const allItems = getAllEnrichedApartments();
      const regionStats = {};
      SEOUL_REGIONS.forEach(r => {
        regionStats[r.id] = {
          count: allItems.filter(a => a.regionId === r.id).length,
          name: r.name
        };
      });

      let items = [...allItems];
      if (category && category !== 'all') {
        items = items.filter(item => item.category === category);
      }
      if (region && region !== 'all') {
        items = items.filter(item => item.regionId === region);
      }
      if (q) {
        items = items.filter(item =>
          item.name.toLowerCase().includes(q) ||
          item.district.toLowerCase().includes(q) ||
          item.dong.toLowerCase().includes(q) ||
          item.builder.toLowerCase().includes(q) ||
          item.subway.toLowerCase().includes(q) ||
          item.school.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.tags.some(t => t.toLowerCase().includes(q))
        );
      }

      if (shuffle) {
        items = shuffleArray(items);
      } else {
        items.sort((a, b) => b.households - a.households);
      }

      const liveNews = await fetchLiveSeoulAptNews();

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        total: items.length,
        lastUpdated: Date.now(),
        regions: SEOUL_REGIONS,
        regionStats,
        news: liveNews,
        items
      }));
      return;
    }

    // API: 새 단지 등록 시 네이버 부동산 단지 사진 및 고유번호 실시간 조회
    if (pathname === '/api/naver-apt-photo' && req.method === 'GET') {
      const q = (reqUrl.searchParams.get('q') || '').trim();
      if (!q) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Missing query' }));
        return;
      }
      const data = await fetchNaverComplexPhotoByQuery(q);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
      return;
    }

    // API: 부동산 플랫폼 디렉토리
    if (pathname === '/api/sites' && req.method === 'GET') {
      const shuffled = shuffleArray(APT_PLATFORMS);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        total: shuffled.length,
        randomPick: shuffled[0],
        sites: shuffled
      }));
      return;
    }

    // 정적 파일 서빙
    let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, indexContent) => {
            if (err2) {
              res.writeHead(404);
              res.end('Not Found');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
              res.end(indexContent);
            }
          });
        } else {
          res.writeHead(500);
          res.end('Server Error');
        }
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(content);
    });
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

writeStaticDataSnapshots();

server.listen(PORT, () => {
  console.log(`\n🏢 RANDOM.APT SEOUL (서울시 랜덤 아파트 피드 & 룰렛 탐색기) 서버 실행 중!`);
  console.log(`👉 http://localhost:${PORT}\n`);
});
