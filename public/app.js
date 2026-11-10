(() => {
  // State Management
  const state = {
    allApartments: [],
    displayedApartments: [],
    sites: [],
    regions: [],
    regionStats: {},
    news: [],
    activeView: 'feed', // 'feed' | 'explore' | 'sites' | 'saved' | 'liked'
    activeCategory: 'all',
    activeRegion: 'all',
    rouletteRegion: 'all',
    searchQuery: '',
    sortMode: 'random', // 'random' | 'households' | 'newest'
    pageSize: 8,
    currentPage: 1,
    likedMap: JSON.parse(localStorage.getItem('randomapt_liked') || '{}'),
    savedMap: JSON.parse(localStorage.getItem('randomapt_saved') || '{}'),
    customApartments: JSON.parse(localStorage.getItem('randomapt_custom') || '[]'),
    memos: JSON.parse(localStorage.getItem('randomapt_memos') || '{}'),
    carouselIndexMap: {},
    activeModalApt: null,
    spotlightApt: null
  };

  // DOM Elements
  const el = {
    storiesBar: document.getElementById('storiesBar'),
    feedStream: document.getElementById('feedStream'),
    exploreGrid: document.getElementById('exploreGrid'),
    sitesDirectory: document.getElementById('sitesDirectory'),
    feedSkeleton: document.getElementById('feedSkeleton'),
    infiniteScrollTrigger: document.getElementById('infiniteScrollTrigger'),
    loadMoreRandomBtn: document.getElementById('loadMoreRandomBtn'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    categoryChips: document.getElementById('categoryChips'),
    sortModeBtn: document.getElementById('sortModeBtn'),
    topShuffleBtn: document.getElementById('topShuffleBtn'),
    sidebarShuffleBtn: document.getElementById('sidebarShuffleBtn'),
    sidebarRouletteBtn: document.getElementById('sidebarRouletteBtn'),
    mobileShuffleBtn: document.getElementById('mobileShuffleBtn'),
    mobileRouletteBtn: document.getElementById('mobileRouletteBtn'),
    mobBottomRouletteBtn: document.getElementById('mobBottomRouletteBtn'),
    savedCountBadge: document.getElementById('savedCountBadge'),
    likedCountBadge: document.getElementById('likedCountBadge'),
    viewStatusBanner: document.getElementById('viewStatusBanner'),
    viewStatusTitle: document.getElementById('viewStatusTitle'),
    viewStatusDesc: document.getElementById('viewStatusDesc'),
    backToAllFeedBtn: document.getElementById('backToAllFeedBtn'),
    spotlightBody: document.getElementById('spotlightBody'),
    rerollSpotlightBtn: document.getElementById('rerollSpotlightBtn'),
    regionList: document.getElementById('regionList'),
    resetRegionFilterBtn: document.getElementById('resetRegionFilterBtn'),
    newsBriefList: document.getElementById('newsBriefList'),
    refreshNewsBtn: document.getElementById('refreshNewsBtn'),
    miniSitesList: document.getElementById('miniSitesList'),
    viewAllSitesBtn: document.getElementById('viewAllSitesBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    themeLabel: document.getElementById('themeLabel'),
    brandHomeBtn: document.getElementById('brandHomeBtn'),
    // Modals
    postDetailModal: document.getElementById('postDetailModal'),
    closeDetailModalBtn: document.getElementById('closeDetailModalBtn'),
    modalMediaContainer: document.getElementById('modalMediaContainer'),
    modalInfoContainer: document.getElementById('modalInfoContainer'),
    aptRouletteModal: document.getElementById('aptRouletteModal'),
    closeRouletteModalBtn: document.getElementById('closeRouletteModalBtn'),
    rouletteRegionSelector: document.getElementById('rouletteRegionSelector'),
    rouletteStage: document.getElementById('rouletteStage'),
    spinAgainBtn: document.getElementById('spinAgainBtn'),
    rouletteNaverLandLink: document.getElementById('rouletteNaverLandLink'),
    addCustomModal: document.getElementById('addCustomModal'),
    openAddModalBtn: document.getElementById('openAddModalBtn'),
    closeAddModalBtn: document.getElementById('closeAddModalBtn'),
    cancelAddModalBtn: document.getElementById('cancelAddModalBtn'),
    addCustomForm: document.getElementById('addCustomForm'),
    toastContainer: document.getElementById('toastContainer')
  };

  // Utility Functions
  function showToast(message) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    el.toastContainer.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 250);
    }, 2400);
  }

  function escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function saveStorage() {
    localStorage.setItem('randomapt_liked', JSON.stringify(state.likedMap));
    localStorage.setItem('randomapt_saved', JSON.stringify(state.savedMap));
    localStorage.setItem('randomapt_custom', JSON.stringify(state.customApartments));
    localStorage.setItem('randomapt_memos', JSON.stringify(state.memos));
    updateBadges();
  }

  function updateBadges() {
    el.savedCountBadge.textContent = Object.keys(state.savedMap).length;
    el.likedCountBadge.textContent = Object.keys(state.likedMap).length;
  }

  window.handleImgError = function (imgEl) {
    imgEl.onerror = null;
    imgEl.src = './images/apt/apt-onebailey-1.jpg';
  };

  // Fetch Initial Data (Live Node Server API with Static Fallback)
  async function loadInitialData() {
    el.feedSkeleton.classList.remove('hidden');
    try {
      let aptData, sitesData;
      try {
        const [aptRes, sitesRes] = await Promise.all([
          fetch('./api/apartments?shuffle=true'),
          fetch('./api/sites')
        ]);
        if (!aptRes.ok || !sitesRes.ok) throw new Error('Static fallback');
        aptData = await aptRes.json();
        sitesData = await sitesRes.json();
      } catch (_) {
        const [aptRes, sitesRes] = await Promise.all([
          fetch('./data/apartments.json'),
          fetch('./data/sites.json')
        ]);
        aptData = await aptRes.json();
        sitesData = await sitesRes.json();
        if (aptData.items) aptData.items = shuffleArray(aptData.items);
      }

      state.regions = aptData.regions || [];
      state.regionStats = aptData.regionStats || {};
      state.news = aptData.news || [
        { title: '서울 주요 대단지 실거래가 및 신고가 흐름 분석', link: 'https://land.seoul.go.kr', source: '서울부동산정보광장' },
        { title: '압구정·여의도·목동 신속통합기획 재건축 추진 현황', link: 'https://cleanup.seoul.go.kr', source: '정비사업 정보몽땅' },
        { title: '서울 아파트 매매·전세 실거래 공식 조회 시스템', link: 'https://rt.molit.go.kr', source: '국토교통부' }
      ];
      state.sites = sitesData.sites || [];

      const merged = [...state.customApartments, ...(aptData.items || [])];
      state.allApartments = merged;

      renderStoriesBar();
      renderRegionStatus();
      renderSpotlightApartment();
      renderNewsBrief();
      renderMiniSites();
      applyFiltersAndRender(true);
    } catch (err) {
      showToast('아파트 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      el.feedSkeleton.classList.add('hidden');
    }
  }

  // Render Stories Bar (Seoul 7 Regions)
  function renderStoriesBar() {
    const storyItems = [
      { id: 'all', label: '서울 전체', icon: '🏙️', isRegion: true },
      { id: 'roulette', label: '단지 뽑기', icon: '🎯', isRoulette: true },
      ...state.regions.map(r => ({
        id: r.id,
        label: r.shortName || r.name,
        avatar: r.avatar,
        isRegion: true
      }))
    ];

    el.storiesBar.innerHTML = storyItems.map(item => {
      const isActive = item.isRegion && state.activeRegion === item.id;
      const inner = item.avatar
        ? `<img class="story-avatar" src="${escapeHtml(item.avatar)}" alt="${escapeHtml(item.label)}" />`
        : `<div class="story-avatar">${item.icon}</div>`;
      return `
        <button class="story-item ${isActive ? 'active' : ''}" data-region-id="${escapeHtml(item.id)}" data-roulette="${!!item.isRoulette}">
          <div class="story-ring">${inner}</div>
          <span class="story-label">${escapeHtml(item.label)}</span>
        </button>
      `;
    }).join('');

    el.storiesBar.querySelectorAll('.story-item').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.roulette === 'true') {
          openRouletteModal();
          return;
        }
        state.activeRegion = btn.dataset.regionId;
        if (state.activeView === 'sites') setActiveView('feed');
        renderStoriesBar();
        renderRegionStatus();
        applyFiltersAndRender(true);
      });
    });
  }

  // Filter & Sort Apartments
  function getFilteredApartments() {
    let list = [...state.allApartments];

    if (state.activeView === 'saved') {
      list = Object.values(state.savedMap);
    } else if (state.activeView === 'liked') {
      list = Object.values(state.likedMap);
    }

    if (state.activeCategory !== 'all') {
      list = list.filter(a => a.category === state.activeCategory);
    }

    if (state.activeRegion !== 'all') {
      list = list.filter(a => a.regionId === state.activeRegion);
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(a =>
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.district && a.district.toLowerCase().includes(q)) ||
        (a.dong && a.dong.toLowerCase().includes(q)) ||
        (a.builder && a.builder.toLowerCase().includes(q)) ||
        (a.subway && a.subway.toLowerCase().includes(q)) ||
        (a.school && a.school.toLowerCase().includes(q)) ||
        (a.summary && a.summary.toLowerCase().includes(q)) ||
        (a.tags && a.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (state.sortMode === 'random') {
      list = shuffleArray(list);
    } else if (state.sortMode === 'households') {
      list.sort((a, b) => (b.households || 0) - (a.households || 0));
    } else if (state.sortMode === 'newest') {
      list.sort((a, b) => (b.builtYear || 0) - (a.builtYear || 0));
    }

    return list;
  }

  function applyFiltersAndRender(resetPage = true) {
    if (resetPage) {
      state.currentPage = 1;
      state.displayedApartments = getFilteredApartments();
    }

    el.feedStream.classList.add('hidden');
    el.exploreGrid.classList.add('hidden');
    el.sitesDirectory.classList.add('hidden');
    el.infiniteScrollTrigger.classList.add('hidden');
    el.viewStatusBanner.classList.add('hidden');

    if (state.activeView === 'sites') {
      el.viewStatusBanner.classList.remove('hidden');
      el.viewStatusTitle.textContent = '🌐 서울 아파트 실거래 · 호가 · 입지 분석 필수 플랫폼';
      el.viewStatusDesc.textContent = '임장 전후 반드시 확인해야 할 부동산 데이터 플랫폼 및 공공 포털 디렉토리입니다.';
      el.sitesDirectory.classList.remove('hidden');
      renderSitesDirectory();
      return;
    }

    if (state.activeView === 'saved') {
      el.viewStatusBanner.classList.remove('hidden');
      el.viewStatusTitle.textContent = '🔖 내 관심 단지 보드 (북마크)';
      el.viewStatusDesc.textContent = `총 ${state.displayedApartments.length}개의 서울 아파트 단지가 저장되어 있습니다.`;
    } else if (state.activeView === 'liked') {
      el.viewStatusBanner.classList.remove('hidden');
      el.viewStatusTitle.textContent = '❤️ 하트한 서울 아파트';
      el.viewStatusDesc.textContent = `총 ${state.displayedApartments.length}개의 아파트 단지에 하트를 눌렀습니다.`;
    }

    const sliceCount = state.currentPage * state.pageSize;
    const visibleItems = state.displayedApartments.slice(0, sliceCount);

    if (state.activeView === 'explore') {
      el.exploreGrid.classList.remove('hidden');
      renderExploreGrid(visibleItems);
    } else {
      el.feedStream.classList.remove('hidden');
      renderFeedCards(visibleItems);
    }

    if (state.displayedApartments.length > 0) {
      el.infiniteScrollTrigger.classList.remove('hidden');
    }
  }

  function getRegionAvatar(regionId) {
    const found = state.regions.find(r => r.id === regionId);
    return found ? found.avatar : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=200&q=80';
  }

  // Render Instagram Apartment Feed Cards
  function renderFeedCards(apartments) {
    if (apartments.length === 0) {
      el.feedStream.innerHTML = `
        <div class="insta-card" style="padding: 48px 24px; text-align: center;">
          <p style="font-size: 2.2rem; margin-bottom: 10px;">🏢</p>
          <h3 style="margin-bottom: 6px;">조건에 맞는 서울 아파트 단지가 없습니다</h3>
          <p style="color: var(--text-secondary); font-size: 0.88rem; margin-bottom: 16px;">다른 권역이나 테마를 선택하거나 전체 서울 단지로 초기화해보세요.</p>
          <button class="btn-primary" id="emptyResetBtn">서울 전체 단지 보기</button>
        </div>
      `;
      const resetBtn = document.getElementById('emptyResetBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', resetAllFilters);
      }
      return;
    }

    el.feedStream.innerHTML = apartments.map(apt => buildCardHtml(apt)).join('');
    bindCardEvents(el.feedStream);
  }

  function buildCardHtml(apt) {
    const isLiked = !!state.likedMap[apt.id];
    const isSaved = !!state.savedMap[apt.id];
    const likesTotal = (apt.likesBase || 500) + (isLiked ? 1 : 0);
    const images = apt.images && apt.images.length ? apt.images : [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1080&q=80'
    ];
    const multi = images.length > 1;
    const currentSlide = state.carouselIndexMap[apt.id] || 0;
    const avatar = apt.avatar || getRegionAvatar(apt.regionId);

    return `
      <article class="insta-card" data-apt-id="${escapeHtml(apt.id)}">
        <header class="card-header">
          <div class="card-author-wrap" data-filter-region="${escapeHtml(apt.regionId)}">
            <div class="card-avatar-ring">
              <img class="card-avatar" src="${escapeHtml(avatar)}" alt="${escapeHtml(apt.district)}" />
            </div>
            <div class="card-author-meta">
              <div class="card-handle-row">
                <span class="card-handle">@${escapeHtml(apt.handle || `${apt.district}_${apt.dong}`)}</span>
                <span class="verified-badge" title="서울 주요 아파트 단지">✔</span>
              </div>
              <div class="card-submeta">
                <span>${escapeHtml(apt.builder || '브랜드 단지')}</span>
                <span>•</span>
                <span>${escapeHtml(apt.builtYear)}년 준공</span>
                <span>•</span>
                <span>${Number(apt.households || 0).toLocaleString()}세대</span>
              </div>
            </div>
          </div>
          <div class="card-header-right">
            <span class="category-badge">${escapeHtml(apt.category)}</span>
            <a class="visit-origin-pill" href="${escapeHtml(apt.naverLandUrl || apt.link)}" target="_blank" rel="noopener noreferrer" title="네이버 부동산 시세·매물 열기">매물·시세 ↗</a>
          </div>
        </header>

        <div class="card-media-wrap" data-apt-id="${escapeHtml(apt.id)}">
          <div class="media-top-left-badge">
            <span>📍 서울 ${escapeHtml(apt.district)} ${escapeHtml(apt.dong)}</span>
          </div>
          <div class="media-price-badge">
            💰 84㎡ 기준 ${escapeHtml(apt.price84 || '시세 문의')}
          </div>
          <div class="carousel-track" style="transform: translateX(-${currentSlide * 100}%);">
            ${images.map((imgUrl, idx) => `
              <div class="carousel-slide">
                <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(apt.name)} - ${idx + 1}" loading="lazy" onerror="handleImgError(this)" />
              </div>
            `).join('')}
          </div>
          ${multi ? `
            <button class="carousel-btn prev" data-dir="-1" aria-label="이전 사진">❮</button>
            <button class="carousel-btn next" data-dir="1" aria-label="다음 사진">❯</button>
            <div class="carousel-counter">${currentSlide + 1} / ${images.length}</div>
            <div class="carousel-dots">
              ${images.map((_, i) => `<span class="carousel-dot ${i === currentSlide ? 'active' : ''}"></span>`).join('')}
            </div>
          ` : ''}
          <div class="heart-burst">❤️</div>
        </div>

        <div class="card-actions">
          <div class="card-actions-left">
            <button class="act-btn like-btn ${isLiked ? 'liked' : ''}" title="관심 하트 (사진 더블클릭 가능)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            <button class="act-btn detail-btn" title="상세 스펙 및 임장 노트">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            </button>
            <button class="act-btn share-btn" title="단지 정보 링크 복사">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <button class="act-btn save-btn ${isSaved ? 'saved' : ''}" title="관심 단지 보드에 저장">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>

        <div class="card-body">
          <div class="likes-row">
            <span class="likes-count">관심 공감 <span class="likes-num">${likesTotal.toLocaleString()}</span>명</span>
            <span style="font-size:0.76rem; color:var(--text-muted);">전세 참고: ${escapeHtml(apt.jeonse84 || '-')}</span>
          </div>

          <div class="apt-title-row">
            <h3 class="apt-main-name">${escapeHtml(apt.name)}</h3>
          </div>

          <!-- 핵심 단지 스펙 요약 그리드 -->
          <div class="apt-spec-grid">
            <div class="spec-item">
              <span class="spec-label">💰 84㎡ 매매 시세/실거래</span>
              <span class="spec-value highlight-price">${escapeHtml(apt.price84 || '-')}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">🏢 단지 규모 · 최고층</span>
              <span class="spec-value">${Number(apt.households || 0).toLocaleString()}세대 · ${apt.buildings || '-'}개동 · 최고 ${apt.maxFloor || '-'}층</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">🚇 인접 지하철역</span>
              <span class="spec-value" title="${escapeHtml(apt.subway || '')}">${escapeHtml(apt.subway || '-')}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">🏫 배정 초등학교 · 학군</span>
              <span class="spec-value" title="${escapeHtml(apt.school || '')}">${escapeHtml(apt.school || '-')}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">📐 용적률 · 세대당 주차</span>
              <span class="spec-value">용적률 ${escapeHtml(apt.far || '-')} · 주차 ${escapeHtml(apt.parking || '-')}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">🏠 주요 평형 구성</span>
              <span class="spec-value" title="${escapeHtml(apt.areaTypes || '')}">${escapeHtml(apt.areaTypes || '59㎡ · 84㎡ · 대형')}</span>
            </div>
          </div>

          <!-- 부동산 포털 바로가기 버튼 바 -->
          <div class="portal-quick-bar">
            <a class="portal-chip" href="${escapeHtml(apt.naverLandUrl || apt.link)}" target="_blank" rel="noopener noreferrer">🏠 네이버부동산</a>
            <a class="portal-chip" href="${escapeHtml(apt.naverMapUrl || '#')}" target="_blank" rel="noopener noreferrer">🗺️ 네이버지도</a>
            <a class="portal-chip" href="${escapeHtml(apt.kakaoMapUrl || '#')}" target="_blank" rel="noopener noreferrer">📍 카카오맵 로드뷰</a>
            <a class="portal-chip" href="${escapeHtml(apt.hogangnonoUrl || 'https://hogangnono.com')}" target="_blank" rel="noopener noreferrer">📊 호갱노노 실거래</a>
          </div>

          <p class="card-summary">${escapeHtml(apt.summary)}</p>

          <div class="card-tags">
            ${(apt.tags || []).map(tag => `<button class="tag-link" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag.replace(/\s+/g, ''))}</button>`).join('')}
          </div>

          ${state.memos[apt.id] ? `<div style="font-size:0.81rem; color:#34d399; margin-bottom:8px; padding:6px 10px; background:var(--bg-elevated); border-radius:8px;">📝 내 임장 노트: ${escapeHtml(state.memos[apt.id])}</div>` : ''}

          <div class="card-footer-meta">
            <span>📍 서울특별시 ${escapeHtml(apt.district)} ${escapeHtml(apt.dong)}</span>
            <button class="open-detail-link">상세 분석 모달 · 임장 메모 작성</button>
          </div>
        </div>
      </article>
    `;
  }

  function bindCardEvents(container) {
    container.querySelectorAll('.insta-card').forEach(card => {
      const aptId = card.dataset.aptId;
      const apt = state.allApartments.find(a => a.id === aptId) || state.savedMap[aptId] || state.likedMap[aptId];
      if (!apt) return;

      // Filter by region when clicking header author wrap
      const authorWrap = card.querySelector('.card-author-wrap');
      if (authorWrap) {
        authorWrap.addEventListener('click', () => {
          state.activeRegion = apt.regionId || 'all';
          renderStoriesBar();
          renderRegionStatus();
          applyFiltersAndRender(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }

      // Carousel navigation
      const mediaWrap = card.querySelector('.card-media-wrap');
      const track = card.querySelector('.carousel-track');
      const counter = card.querySelector('.carousel-counter');
      const dots = card.querySelectorAll('.carousel-dot');
      const totalSlides = (apt.images && apt.images.length) || 1;

      card.querySelectorAll('.carousel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const dir = parseInt(btn.dataset.dir, 10);
          const cur = state.carouselIndexMap[aptId] || 0;
          const next = (cur + dir + totalSlides) % totalSlides;
          state.carouselIndexMap[aptId] = next;
          track.style.transform = `translateX(-${next * 100}%)`;
          if (counter) counter.textContent = `${next + 1} / ${totalSlides}`;
          dots.forEach((d, idx) => d.classList.toggle('active', idx === next));
        });
      });

      // Double click photo to Like
      if (mediaWrap) {
        mediaWrap.addEventListener('dblclick', () => {
          const burst = mediaWrap.querySelector('.heart-burst');
          if (burst) {
            burst.classList.remove('animate');
            void burst.offsetWidth;
            burst.classList.add('animate');
          }
          if (!state.likedMap[aptId]) {
            toggleLike(apt, card);
          }
        });
      }

      const likeBtn = card.querySelector('.like-btn');
      if (likeBtn) likeBtn.addEventListener('click', () => toggleLike(apt, card));

      const saveBtn = card.querySelector('.save-btn');
      if (saveBtn) saveBtn.addEventListener('click', () => toggleSave(apt, card));

      const shareBtn = card.querySelector('.share-btn');
      if (shareBtn) {
        shareBtn.addEventListener('click', () => {
          navigator.clipboard?.writeText(apt.naverLandUrl || apt.link);
          showToast(`'${apt.name}' 네이버 부동산 링크가 복사되었습니다!`);
        });
      }

      const summaryEl = card.querySelector('.card-summary');
      if (summaryEl) {
        summaryEl.addEventListener('click', () => summaryEl.classList.toggle('expanded'));
      }

      const detailTriggers = [
        card.querySelector('.detail-btn'),
        card.querySelector('.apt-main-name'),
        card.querySelector('.open-detail-link')
      ];
      detailTriggers.forEach(t => {
        if (t) t.addEventListener('click', () => openDetailModal(apt));
      });

      card.querySelectorAll('.tag-link').forEach(tagBtn => {
        tagBtn.addEventListener('click', () => {
          const tag = tagBtn.dataset.tag;
          state.searchQuery = tag;
          el.searchInput.value = tag;
          el.clearSearchBtn.classList.remove('hidden');
          applyFiltersAndRender(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
    });
  }

  function toggleLike(apt, cardEl) {
    const id = apt.id;
    const isLiked = !!state.likedMap[id];
    if (isLiked) {
      delete state.likedMap[id];
    } else {
      state.likedMap[id] = apt;
    }
    saveStorage();

    if (cardEl) {
      const btn = cardEl.querySelector('.like-btn');
      const numEl = cardEl.querySelector('.likes-num');
      btn.classList.toggle('liked', !isLiked);
      const count = (apt.likesBase || 500) + (!isLiked ? 1 : 0);
      if (numEl) numEl.textContent = count.toLocaleString();
    }
  }

  function toggleSave(apt, cardEl) {
    const id = apt.id;
    const isSaved = !!state.savedMap[id];
    if (isSaved) {
      delete state.savedMap[id];
      showToast('관심 단지 보드에서 제거되었습니다.');
    } else {
      state.savedMap[id] = apt;
      showToast(`🔖 '${apt.name}' 단지가 관심 보드에 저장되었습니다!`);
    }
    saveStorage();

    if (cardEl) {
      const btn = cardEl.querySelector('.save-btn');
      btn.classList.toggle('saved', !isSaved);
    }
  }

  // Render Explore 3-Column Grid
  function renderExploreGrid(apartments) {
    el.exploreGrid.innerHTML = apartments.map(apt => {
      const thumb = (apt.images && apt.images[0]) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';
      return `
        <div class="explore-tile" data-apt-id="${escapeHtml(apt.id)}">
          <img src="${escapeHtml(thumb)}" alt="${escapeHtml(apt.name)}" loading="lazy" onerror="handleImgError(this)" />
          <span class="explore-multi-icon">${escapeHtml(apt.district)}</span>
          <div class="explore-overlay">
            <span class="explore-tile-source">84㎡ ${escapeHtml(apt.price84 || '-')}</span>
            <p class="explore-tile-title">${escapeHtml(apt.name)}</p>
          </div>
        </div>
      `;
    }).join('');

    el.exploreGrid.querySelectorAll('.explore-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const apt = state.allApartments.find(a => a.id === tile.dataset.aptId);
        if (apt) openDetailModal(apt);
      });
    });
  }

  // Render Real Estate Platforms Directory
  function renderSitesDirectory() {
    el.sitesDirectory.innerHTML = state.sites.map(site => `
      <div class="site-dir-card">
        <div class="site-dir-thumb">
          <img src="${escapeHtml(site.coverImage)}" alt="${escapeHtml(site.name)}" loading="lazy" />
          <span class="site-dir-region">${escapeHtml(site.region)}</span>
        </div>
        <div class="site-dir-body">
          <span class="site-dir-cat">${escapeHtml(site.category)}</span>
          <h3 class="site-dir-title">${escapeHtml(site.name)}</h3>
          <p class="site-dir-desc">${escapeHtml(site.description)}</p>
          <div class="card-tags" style="margin-bottom:12px;">
            ${(site.tags || []).map(t => `<span class="category-badge">#${escapeHtml(t)}</span>`).join('')}
          </div>
          <div class="site-dir-footer">
            <a class="site-visit-btn" href="${escapeHtml(site.url)}" target="_blank" rel="noopener noreferrer">플랫폼 바로가기 ↗</a>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Right Sidebar Spotlight Apartment & Region Status
  function renderSpotlightApartment() {
    if (!state.allApartments.length) return;
    const randomApt = state.allApartments[Math.floor(Math.random() * state.allApartments.length)];
    state.spotlightApt = randomApt;
    const thumb = (randomApt.images && randomApt.images[0]) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';

    el.spotlightBody.innerHTML = `
      <img class="spotlight-img" id="spotlightThumb" src="${escapeHtml(thumb)}" alt="${escapeHtml(randomApt.name)}" />
      <div class="spotlight-name">${escapeHtml(randomApt.name)}</div>
      <div class="spotlight-meta">📍 ${escapeHtml(randomApt.district)} ${escapeHtml(randomApt.dong)} · 84㎡ ${escapeHtml(randomApt.price84)}</div>
      <p class="spotlight-desc">${escapeHtml(randomApt.summary)}</p>
      <div class="spotlight-btn-row">
        <button class="spotlight-sub-btn" id="spotlightDetailBtn">단지 스펙 보기</button>
        <a class="spotlight-visit-link" href="${escapeHtml(randomApt.naverLandUrl || randomApt.link)}" target="_blank" rel="noopener noreferrer">네이버부동산 ↗</a>
      </div>
    `;

    document.getElementById('spotlightThumb')?.addEventListener('click', () => openDetailModal(randomApt));
    document.getElementById('spotlightDetailBtn')?.addEventListener('click', () => openDetailModal(randomApt));
  }

  function renderRegionStatus() {
    el.regionList.innerHTML = state.regions.map(r => {
      const count = state.allApartments.filter(a => a.regionId === r.id).length;
      const isSelected = state.activeRegion === r.id;
      return `
        <li class="rss-source-item" data-region-click="${escapeHtml(r.id)}" style="${isSelected ? 'background: var(--bg-elevated); font-weight:700;' : ''}">
          <span class="rss-source-name" style="${isSelected ? 'color: var(--price-emerald);' : ''}">📍 ${escapeHtml(r.name)}</span>
          <span class="rss-source-count">${count}개 단지</span>
        </li>
      `;
    }).join('');

    el.regionList.querySelectorAll('[data-region-click]').forEach(li => {
      li.addEventListener('click', () => {
        state.activeRegion = li.dataset.regionClick;
        if (state.activeView === 'sites') setActiveView('feed');
        renderStoriesBar();
        renderRegionStatus();
        applyFiltersAndRender(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function renderNewsBrief() {
    el.newsBriefList.innerHTML = (state.news || []).slice(0, 4).map(n => `
      <a class="news-item-link" href="${escapeHtml(n.link)}" target="_blank" rel="noopener noreferrer">
        <div class="news-item-title">${escapeHtml(n.title)}</div>
        <div class="news-item-source">${escapeHtml(n.source || '부동산 뉴스')}</div>
      </a>
    `).join('');
  }

  function renderMiniSites() {
    const picks = state.sites.slice(0, 5);
    el.miniSitesList.innerHTML = picks.map(s => `
      <div class="mini-site-row">
        <div class="mini-site-info">
          <span class="mini-site-title">${escapeHtml(s.name)}</span>
          <span class="mini-site-cat">${escapeHtml(s.category)}</span>
        </div>
        <a class="mini-site-go" href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">열기 ↗</a>
      </div>
    `).join('');
  }

  // Detail Modal
  function openDetailModal(apt) {
    state.activeModalApt = apt;
    let modalSlide = 0;
    const images = apt.images && apt.images.length ? apt.images : [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1080&q=80'
    ];

    function updateModalMedia() {
      el.modalMediaContainer.innerHTML = `
        <img src="${escapeHtml(images[modalSlide])}" alt="${escapeHtml(apt.name)}" onerror="handleImgError(this)" />
        ${images.length > 1 ? `
          <button class="carousel-btn prev" id="modalPrevSlide">❮</button>
          <button class="carousel-btn next" id="modalNextSlide">❯</button>
          <div class="carousel-counter">${modalSlide + 1} / ${images.length}</div>
        ` : ''}
      `;
      document.getElementById('modalPrevSlide')?.addEventListener('click', () => {
        modalSlide = (modalSlide - 1 + images.length) % images.length;
        updateModalMedia();
      });
      document.getElementById('modalNextSlide')?.addEventListener('click', () => {
        modalSlide = (modalSlide + 1) % images.length;
        updateModalMedia();
      });
    }

    updateModalMedia();

    const currentMemo = state.memos[apt.id] || '';
    const avatar = apt.avatar || getRegionAvatar(apt.regionId);

    el.modalInfoContainer.innerHTML = `
      <div class="card-header" style="border-bottom: 1px solid var(--border-color);">
        <div class="card-author-wrap">
          <div class="card-avatar-ring">
            <img class="card-avatar" src="${escapeHtml(avatar)}" alt="${escapeHtml(apt.district)}" />
          </div>
          <div class="card-author-meta">
            <span class="card-handle">@${escapeHtml(apt.handle || `${apt.district}_${apt.dong}`)}</span>
            <span class="card-submeta">${escapeHtml(apt.builder)} · ${apt.builtYear}년 준공</span>
          </div>
        </div>
        <span class="category-badge">${escapeHtml(apt.category)}</span>
      </div>
      <div class="modal-info-scroll">
        <h3 style="font-size: 1.18rem; margin-bottom: 10px; line-height: 1.4;">${escapeHtml(apt.name)}</h3>
        <div class="apt-spec-grid" style="margin-bottom: 14px;">
          <div class="spec-item">
            <span class="spec-label">💰 84㎡ 매매 시세</span>
            <span class="spec-value highlight-price">${escapeHtml(apt.price84 || '-')}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">🔑 84㎡ 전세 시세</span>
            <span class="spec-value">${escapeHtml(apt.jeonse84 || '-')}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">🏢 총 세대수 · 동수</span>
            <span class="spec-value">${Number(apt.households || 0).toLocaleString()}세대 · ${apt.buildings || '-'}개동 (최고 ${apt.maxFloor || '-'}층)</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">📐 용적률 · 주차</span>
            <span class="spec-value">용적률 ${escapeHtml(apt.far || '-')} · ${escapeHtml(apt.parking || '-')}</span>
          </div>
          <div class="spec-item" style="grid-column: span 2;">
            <span class="spec-label">🚇 지하철 · 교통</span>
            <span class="spec-value">${escapeHtml(apt.subway || '-')}</span>
          </div>
          <div class="spec-item" style="grid-column: span 2;">
            <span class="spec-label">🏫 배정 초등학교 · 학군</span>
            <span class="spec-value">${escapeHtml(apt.school || '-')}</span>
          </div>
        </div>

        <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 14px; line-height: 1.65;">${escapeHtml(apt.summary)}</p>

        <div class="portal-quick-bar" style="margin-bottom: 14px;">
          <a class="portal-chip" href="${escapeHtml(apt.naverLandUrl || apt.link)}" target="_blank" rel="noopener noreferrer">🏠 네이버부동산</a>
          <a class="portal-chip" href="${escapeHtml(apt.naverMapUrl || '#')}" target="_blank" rel="noopener noreferrer">🗺️ 네이버지도</a>
          <a class="portal-chip" href="${escapeHtml(apt.kakaoMapUrl || '#')}" target="_blank" rel="noopener noreferrer">📍 카카오맵</a>
          <a class="portal-chip" href="${escapeHtml(apt.hogangnonoUrl || 'https://hogangnono.com')}" target="_blank" rel="noopener noreferrer">📊 호갱노노</a>
        </div>

        <div style="padding: 12px; border-radius: 12px; background: var(--bg-elevated); font-size: 0.84rem;">
          <strong>📝 내 임장 노트 & 체크리스트</strong>
          <p id="savedMemoDisplay" style="margin-top: 4px; color: var(--text-secondary);">${currentMemo ? escapeHtml(currentMemo) : '이 단지의 동별 로얄동, 언덕 여부, 주변 상권, 호가 분위기를 기록해보세요.'}</p>
        </div>
      </div>
      <div class="modal-info-footer">
        <div class="memo-input-row">
          <input type="text" id="modalMemoInput" value="${escapeHtml(currentMemo)}" placeholder="이 아파트 단지에 대한 임장 메모 남기기..." />
          <button class="btn-secondary" id="saveMemoBtn">노트 저장</button>
        </div>
        <a class="spotlight-visit-link" href="${escapeHtml(apt.naverLandUrl || apt.link)}" target="_blank" rel="noopener noreferrer" style="padding: 11px;">네이버 부동산에서 평면도 · 실시간 매물 보기 ↗</a>
      </div>
    `;

    document.getElementById('saveMemoBtn').addEventListener('click', () => {
      const val = document.getElementById('modalMemoInput').value.trim();
      if (val) {
        state.memos[apt.id] = val;
        document.getElementById('savedMemoDisplay').textContent = val;
        showToast('📝 임장 노트가 저장되었습니다.');
      } else {
        delete state.memos[apt.id];
        document.getElementById('savedMemoDisplay').textContent = '임장 메모가 삭제되었습니다.';
      }
      saveStorage();
      applyFiltersAndRender(false);
    });

    el.postDetailModal.classList.remove('hidden');
  }

  // Random Seoul Apartment Roulette Modal
  function openRouletteModal() {
    if (!state.allApartments.length) return;
    el.aptRouletteModal.classList.remove('hidden');
    spinRouletteApartment();
  }

  function spinRouletteApartment() {
    let pool = [...state.allApartments];
    if (state.rouletteRegion !== 'all') {
      const regional = pool.filter(a => a.regionId === state.rouletteRegion);
      if (regional.length > 0) pool = regional;
    }

    const apt = pool[Math.floor(Math.random() * pool.length)];
    const cover = (apt.images && apt.images[0]) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80';

    el.rouletteStage.innerHTML = `
      <img class="roulette-cover" src="${escapeHtml(cover)}" alt="${escapeHtml(apt.name)}" />
      <div class="roulette-content">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:0.8rem; color:var(--price-emerald); font-weight:700;">📍 서울특별시 ${escapeHtml(apt.district)} ${escapeHtml(apt.dong)} · ${escapeHtml(apt.category)}</span>
          <span style="font-size:0.78rem; color:var(--text-muted);">${apt.builtYear}년 · ${Number(apt.households || 0).toLocaleString()}세대</span>
        </div>
        <h3 style="font-size:1.25rem; margin-bottom:8px;">${escapeHtml(apt.name)}</h3>
        <div class="apt-spec-grid" style="margin-bottom:10px;">
          <div class="spec-item">
            <span class="spec-label">💰 84㎡ 매매 시세</span>
            <span class="spec-value highlight-price">${escapeHtml(apt.price84)}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">🚇 인접 지하철역</span>
            <span class="spec-value">${escapeHtml(apt.subway)}</span>
          </div>
          <div class="spec-item" style="grid-column: span 2;">
            <span class="spec-label">🏫 배정 초등학교 · 학군</span>
            <span class="spec-value">${escapeHtml(apt.school)}</span>
          </div>
        </div>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:12px;">${escapeHtml(apt.summary)}</p>
        <div class="portal-quick-bar" style="margin-bottom:0;">
          <a class="portal-chip" href="${escapeHtml(apt.naverMapUrl || '#')}" target="_blank" rel="noopener noreferrer">🗺️ 네이버 지도에서 위치 확인</a>
          <a class="portal-chip" href="${escapeHtml(apt.hogangnonoUrl || 'https://hogangnono.com')}" target="_blank" rel="noopener noreferrer">📊 호갱노노 분석</a>
          <button class="portal-chip" id="rouletteBookmarkBtn" style="cursor:pointer;">🔖 관심단지로 저장</button>
        </div>
      </div>
    `;

    el.rouletteNaverLandLink.href = apt.naverLandUrl || apt.link;
    document.getElementById('rouletteBookmarkBtn')?.addEventListener('click', () => {
      state.savedMap[apt.id] = apt;
      saveStorage();
      showToast(`🔖 '${apt.name}' 단지가 관심 단지 보드에 저장되었습니다!`);
    });
  }

  // Navigation & View Switching
  function setActiveView(viewName) {
    state.activeView = viewName;
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === viewName);
    });
    applyFiltersAndRender(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function triggerRandomShuffle() {
    state.sortMode = 'random';
    el.sortModeBtn.dataset.mode = 'random';
    el.sortModeBtn.innerHTML = '<span>🎲 랜덤순</span>';
    if (state.activeView === 'sites') setActiveView('feed');
    applyFiltersAndRender(true);
    renderSpotlightApartment();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('🎲 서울 아파트 피드를 무작위로 새롭게 섞었습니다!');
  }

  function resetAllFilters() {
    state.activeCategory = 'all';
    state.activeRegion = 'all';
    state.searchQuery = '';
    el.searchInput.value = '';
    el.clearSearchBtn.classList.add('hidden');
    syncCategoryChips();
    renderStoriesBar();
    renderRegionStatus();
    setActiveView('feed');
  }

  function syncCategoryChips() {
    el.categoryChips.querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('active', c.dataset.category === state.activeCategory);
    });
  }

  // Event Listeners
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => setActiveView(btn.dataset.nav));
  });

  el.brandHomeBtn.addEventListener('click', resetAllFilters);
  el.resetRegionFilterBtn.addEventListener('click', resetAllFilters);

  [el.topShuffleBtn, el.sidebarShuffleBtn, el.mobileShuffleBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', triggerRandomShuffle);
  });

  [el.sidebarRouletteBtn, el.mobileRouletteBtn, el.mobBottomRouletteBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', openRouletteModal);
  });

  el.rouletteRegionSelector.querySelectorAll('.r-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      state.rouletteRegion = chip.dataset.rregion;
      el.rouletteRegionSelector.querySelectorAll('.r-chip').forEach(c => {
        c.classList.toggle('active', c.dataset.rregion === state.rouletteRegion);
      });
      spinRouletteApartment();
    });
  });

  el.spinAgainBtn.addEventListener('click', spinRouletteApartment);
  el.rerollSpotlightBtn.addEventListener('click', renderSpotlightApartment);
  el.viewAllSitesBtn.addEventListener('click', () => setActiveView('sites'));
  el.backToAllFeedBtn.addEventListener('click', () => setActiveView('feed'));

  el.refreshNewsBtn.addEventListener('click', () => {
    showToast('서울 아파트·부동산 최신 뉴스를 새로고침합니다...');
    loadInitialData();
  });

  el.sortModeBtn.addEventListener('click', () => {
    const modes = ['random', 'households', 'newest'];
    const labels = {
      random: '<span>🎲 랜덤순</span>',
      households: '<span>🏢 세대수순</span>',
      newest: '<span>✨ 신축순</span>'
    };
    const nextIdx = (modes.indexOf(state.sortMode) + 1) % modes.length;
    state.sortMode = modes[nextIdx];
    el.sortModeBtn.innerHTML = labels[state.sortMode];
    applyFiltersAndRender(true);
  });

  el.categoryChips.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      state.activeCategory = chip.dataset.category;
      syncCategoryChips();
      if (state.activeView === 'sites') setActiveView('feed');
      else applyFiltersAndRender(true);
    });
  });

  el.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    el.clearSearchBtn.classList.toggle('hidden', !state.searchQuery);
    applyFiltersAndRender(true);
  });

  el.clearSearchBtn.addEventListener('click', () => {
    state.searchQuery = '';
    el.searchInput.value = '';
    el.clearSearchBtn.classList.add('hidden');
    applyFiltersAndRender(true);
  });

  // Infinite Scroll / Endless Random Wave
  el.loadMoreRandomBtn.addEventListener('click', () => {
    if (state.currentPage * state.pageSize < state.displayedApartments.length) {
      state.currentPage++;
      applyFiltersAndRender(false);
    } else {
      const moreWave = shuffleArray(getFilteredApartments());
      state.displayedApartments = [...state.displayedApartments, ...moreWave];
      state.currentPage++;
      applyFiltersAndRender(false);
      showToast('🎲 새로운 서울 랜덤 아파트 피드를 추가로 불러왔습니다.');
    }
  });

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && state.activeView !== 'sites' && state.displayedApartments.length > 0) {
      if (state.currentPage * state.pageSize < state.displayedApartments.length) {
        state.currentPage++;
        applyFiltersAndRender(false);
      }
    }
  }, { rootMargin: '300px' });
  observer.observe(el.infiniteScrollTrigger);

  // Close Modals
  el.closeDetailModalBtn.addEventListener('click', () => el.postDetailModal.classList.add('hidden'));
  el.closeRouletteModalBtn.addEventListener('click', () => el.aptRouletteModal.classList.add('hidden'));
  el.openAddModalBtn.addEventListener('click', () => el.addCustomModal.classList.remove('hidden'));
  el.closeAddModalBtn.addEventListener('click', () => el.addCustomModal.classList.add('hidden'));
  el.cancelAddModalBtn.addEventListener('click', () => el.addCustomModal.classList.add('hidden'));

  [el.postDetailModal, el.aptRouletteModal, el.addCustomModal].forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.add('hidden');
    });
  });

  // Add Custom Apartment Form
  el.addCustomForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('customName').value.trim();
    const distInput = document.getElementById('customDistrict').value.trim();
    const parts = distInput.split(/\s+/);
    const district = parts[0] || '서울시';
    const dong = parts[1] || '관심동';
    const regionId = document.getElementById('customRegion').value;
    const category = document.getElementById('customCategory').value;
    const price84 = document.getElementById('customPrice').value.trim() || '시세 확인';
    const specs = document.getElementById('customSpecs').value.trim() || '1,000세대 · 2020년';
    const subway = document.getElementById('customSubway').value.trim() || '역세권 확인';
    const school = document.getElementById('customSchool').value.trim() || '인근 초·중·고 학군';
    const imgInput = document.getElementById('customImage').value.trim();
    const summary = document.getElementById('customSummary').value.trim() || '직접 등록한 서울 관심 아파트 단지입니다.';

    const householdsMatch = specs.match(/(\d[\d,]*)\s*세대/);
    const yearMatch = specs.match(/(19\d\d|20\d\d)/);
    const q = encodeURIComponent(`서울 ${district} ${dong} ${name}`);
    const shortQ = encodeURIComponent(name);

    let resolvedImages = imgInput ? [imgInput] : [];
    let resolvedComplexNo = null;

    if (!imgInput) {
      try {
        showToast('네이버 부동산에서 단지 대표 사진을 가져오는 중...');
        const naverRes = await fetch(`./api/naver-apt-photo?q=${encodeURIComponent(`${dong} ${name}`)}`);
        if (naverRes.ok) {
          const naverData = await naverRes.json();
          if (naverData.images && naverData.images.length > 0) {
            resolvedImages = naverData.images;
          }
          if (naverData.complexNo) {
            resolvedComplexNo = naverData.complexNo;
          }
        }
      } catch (_) {}
    }

    if (resolvedImages.length === 0) {
      resolvedImages = ['./images/apt/apt-onebailey-1.jpg'];
    }

    const naverLandDirect = resolvedComplexNo
      ? `https://fin.land.naver.com/complexes/${resolvedComplexNo}`
      : `https://new.land.naver.com/search?sk=${shortQ}`;

    const newApt = {
      id: `custom-apt-${Date.now()}`,
      complexNo: resolvedComplexNo,
      name,
      district,
      dong,
      regionId,
      handle: `${district}_${dong}`,
      builder: '내 관심 단지',
      builtYear: yearMatch ? Number(yearMatch[1]) : 2022,
      households: householdsMatch ? Number(householdsMatch[1].replace(/,/g, '')) : 1000,
      buildings: 12,
      maxFloor: 30,
      far: '-',
      parking: '1.3대',
      areaTypes: '59㎡ · 84㎡',
      price84,
      jeonse84: '-',
      subway,
      school,
      category,
      tags: [category, district, dong, '내관심단지'],
      summary,
      avatar: resolvedImages[0],
      images: resolvedImages,
      link: naverLandDirect,
      naverLandUrl: naverLandDirect,
      naverMapUrl: `https://map.naver.com/p/search/${q}`,
      kakaoMapUrl: `https://map.kakao.com/?q=${q}`,
      hogangnonoUrl: `https://hogangnono.com/search?q=${shortQ}`,
      likesBase: 1
    };

    state.customApartments.unshift(newApt);
    state.allApartments.unshift(newApt);
    saveStorage();
    el.addCustomForm.reset();
    el.addCustomModal.classList.add('hidden');
    setActiveView('feed');
    showToast(`🏢 '${name}' 단지가 네이버 부동산 사진과 함께 등록되었습니다!`);
  });

  // Theme Toggle
  el.themeToggleBtn.addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    el.themeIcon.textContent = next === 'dark' ? '🌙' : '☀️';
    el.themeLabel.textContent = next === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환';
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    if (e.key === 'Escape') {
      el.postDetailModal.classList.add('hidden');
      el.aptRouletteModal.classList.add('hidden');
      el.addCustomModal.classList.add('hidden');
    } else if (e.key === 'r' || e.key === 'R') {
      triggerRandomShuffle();
    } else if (e.key === 's' || e.key === 'S') {
      openRouletteModal();
    } else if (e.key === 'g' || e.key === 'G') {
      setActiveView(state.activeView === 'explore' ? 'feed' : 'explore');
    }
  });

  // Init
  updateBadges();
  loadInitialData();
})();
