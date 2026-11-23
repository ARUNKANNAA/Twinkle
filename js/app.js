/**
 * TWINKLE Official Website Application Script
 * Brand: Arun Hobbies
 * Manages Navigation, Themes, Gallery, Manual Search, FAQs, Order Logic, and UI Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initPageRouter();
  initTheme();
  initHeroInteractions();
  initSimulatorControls();
  init3DControls();
  initManualNavigationAndSearch();
  initFaqAccordionAndSearch();
  initTroubleshootingWizard();
  initProductGallery();
  initOrderAndCheckout();
  initScrollAnimations();
  initClipboardButtons();
  initBreathingWidget();

  // Section parameter for direct testing / viewing
  const urlParams = new URLSearchParams(window.location.search);
  const isolate = urlParams.get('isolate');
  if (isolate) {
    document.querySelectorAll('section').forEach(s => {
      if (s.id !== isolate) s.style.display = 'none';
    });
  }
});

/* ══════════════════════════════════════════════════
   1. NAVBAR & MOBILE DRAWER
   ══════════════════════════════════════════════════ */
function initNavbar() {
  const navbar = document.getElementById('mainNavbar');
  const mobileToggle = document.getElementById('mobileNavToggle');
  const mobileDrawer = document.getElementById('mobileNavDrawer');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

  // Sticky navbar shadow on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile drawer toggle
  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close mobile nav on link click
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }
}

/* ══════════════════════════════════════════════════
   APPLE-STYLE MULTI-PAGE ROUTER
   ══════════════════════════════════════════════════ */
function initPageRouter() {
  const pages = document.querySelectorAll('.app-page');
  const allNavLinks = document.querySelectorAll('[data-page]');
  const subnavIndicator = document.getElementById('subnavIndicator');

  function getPageFromHash() {
    const raw = window.location.hash.replace('#', '').toLowerCase();
    if (!raw) return 'overview';
    if (['overview', 'home', 'features'].includes(raw)) return 'overview';
    if (['special', 'health', 'wellness', 'whats-special'].includes(raw)) return 'special';
    if (['design', 'experience'].includes(raw)) return 'design';
    if (['manual'].includes(raw)) return 'manual';
    if (['support'].includes(raw)) return 'support';
    if (['buy', 'store'].includes(raw)) return 'buy';
    return 'overview';
  }

  function updateIndicator(activeTab) {
    if (!activeTab || !subnavIndicator) return;
    const parent = activeTab.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    subnavIndicator.style.width = `${tabRect.width}px`;
    subnavIndicator.style.left = `${tabRect.left - parentRect.left}px`;
  }

  function showPage(pageId, shouldScroll = true) {
    let targetPage = document.getElementById(`page-${pageId}`);
    if (!targetPage) {
      pageId = 'overview';
      targetPage = document.getElementById('page-overview');
    }

    // Switch active page with fade animation
    pages.forEach(p => {
      p.classList.remove('active');
    });
    targetPage.classList.add('active');

    // Update active nav links across top nav, subnav, mobile drawer, and mobile tab bar
    allNavLinks.forEach(link => {
      const linkPage = link.getAttribute('data-page');
      if (linkPage === pageId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update Apple subnav pill indicator position
    const activeSubnavTab = document.querySelector(`.subnav-tab[data-page="${pageId}"]`);
    if (activeSubnavTab) {
      setTimeout(() => updateIndicator(activeSubnavTab), 30);
    }

    // Scroll to top smoothly if requested
    if (shouldScroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Trigger Three.js resize and simulator refresh when entering Design & 3D page
    if (pageId === 'design' || pageId === 'overview') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 60);
    }
  }

  // Intercept all clicks on links with data-page or internal page hashes
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-page], a[href^="#"]');
    if (!link) return;

    // Check if it's an internal manual anchor link (like #man-start, #man-touch, etc.)
    const href = link.getAttribute('href');
    if (href && href.startsWith('#man-')) {
      return;
    }

    const pageAttr = link.getAttribute('data-page');
    let targetPage = pageAttr;

    if (!targetPage && href) {
      const hash = href.replace('#', '').toLowerCase();
      if (['overview', 'home', 'features'].includes(hash)) targetPage = 'overview';
      else if (['special', 'health', 'wellness', 'whats-special'].includes(hash)) targetPage = 'special';
      else if (['design', 'experience'].includes(hash)) targetPage = 'design';
      else if (['manual'].includes(hash)) targetPage = 'manual';
      else if (['support'].includes(hash)) targetPage = 'support';
      else if (['buy', 'store'].includes(hash)) targetPage = 'buy';
    }

    if (targetPage) {
      e.preventDefault();
      history.pushState(null, '', `#${targetPage}`);
      showPage(targetPage, true);

      // Close mobile drawer if open
      const mobileDrawer = document.getElementById('mobileNavDrawer');
      const mobileToggle = document.getElementById('mobileNavToggle');
      if (mobileDrawer && mobileDrawer.classList.contains('open')) {
        mobileDrawer.classList.remove('open');
        if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    }
  });

  // Handle browser back/forward buttons
  window.addEventListener('popstate', () => {
    showPage(getPageFromHash(), false);
  });

  // Initial load
  const initialPage = getPageFromHash();
  showPage(initialPage, false);

  // Recalculate indicator on window resize
  window.addEventListener('resize', () => {
    const curPage = getPageFromHash();
    const activeSubnavTab = document.querySelector(`.subnav-tab[data-page="${curPage}"]`);
    if (activeSubnavTab) {
      updateIndicator(activeSubnavTab);
    }
  });
}

/* ══════════════════════════════════════════════════
   2. DARK / LIGHT THEME TOGGLE
   ══════════════════════════════════════════════════ */
function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;

  // Retrieve saved theme or default to Apple-inspired minimal light
  const urlTheme = new URLSearchParams(window.location.search).get('theme');
  const savedTheme = urlTheme || localStorage.getItem('twinkle-theme') || 'light';
  root.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('twinkle-theme', next);
      updateThemeIcon(next);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggle) return;
    themeToggle.innerHTML = theme === 'dark'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`);
  }
}

/* ══════════════════════════════════════════════════
   3. HERO INTERACTIONS
   ══════════════════════════════════════════════════ */
function initHeroInteractions() {
  const heroMoodBtns = document.querySelectorAll('.hero-mood-pill');

  heroMoodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = btn.getAttribute('data-mood');
      heroMoodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const setExpr = (sim) => {
        if (!sim) return;
        if (mood === 'HAPPY') sim.setExpression('HAPPY', 3500);
        else if (mood === 'SPIRAL') sim.setExpression('SPIRAL', 3500);
        else if (mood === 'SLEEP') sim.setExpression('SLEEP');
        else sim.setExpression('NORMAL');
      };

      setExpr(window.twinkleHeroSimulator);
      setExpr(window.twinkleSimulator);
    });
  });
}

/* ══════════════════════════════════════════════════
   4. SIMULATOR CONTROLS & GESTURE BUTTONS
   ══════════════════════════════════════════════════ */
function initSimulatorControls() {
  const modeTabs = document.querySelectorAll('.screen-tab-btn');
  const simTapBtn = document.getElementById('simTapBtn');
  const simDblBtn = document.getElementById('simDblBtn');
  const simHoldBtn = document.getElementById('simHoldBtn');

  // Mode tabs click
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.getAttribute('data-mode');
      modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      if (window.twinkleSimulator) {
        window.twinkleSimulator.setMode(mode);
      }
    });
  });

  // Listen to simulator internal mode changes
  window.addEventListener('twinkle-mode-change', (e) => {
    const mode = e.detail.mode;
    modeTabs.forEach(tab => {
      if (tab.getAttribute('data-mode') === mode) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  });

  // Gesture test buttons
  if (simTapBtn) {
    simTapBtn.addEventListener('click', () => {
      showGestureFeedback('Single Tap (Happy / Jump / Next)');
      if (window.twinkleSimulator) window.twinkleSimulator.handleTap();
    });
  }

  if (simDblBtn) {
    simDblBtn.addEventListener('click', () => {
      showGestureFeedback('Double Tap (Spiral / Back)');
      if (window.twinkleSimulator) window.twinkleSimulator.handleDoubleTap();
    });
  }

  if (simHoldBtn) {
    simHoldBtn.addEventListener('click', () => {
      showGestureFeedback('Long Press / Hold (Menu / Select)');
      if (window.twinkleSimulator) window.twinkleSimulator.handleLongPress();
    });
  }

  function showGestureFeedback(text) {
    const feedbackElem = document.getElementById('simGestureToast');
    if (feedbackElem) {
      feedbackElem.textContent = text;
      feedbackElem.classList.add('show');
      clearTimeout(window.toastTimer);
      window.toastTimer = setTimeout(() => {
        feedbackElem.classList.remove('show');
      }, 1500);
    }
  }
}

/* ══════════════════════════════════════════════════
   5. 3D VIEWER CONTROLS
   ══════════════════════════════════════════════════ */
function init3DControls() {
  const colorDots = document.querySelectorAll('.color-dot');
  const rotateBtn = document.getElementById('btn3DRotate');
  const wireBtn = document.getElementById('btn3DWireframe');
  const resetBtn = document.getElementById('btn3DReset');

  colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
      colorDots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      const hex = parseInt(dot.getAttribute('data-color'), 16);
      if (window.twinkle3D) {
        window.twinkle3D.setColor(hex);
      }
    });
  });

  if (rotateBtn) {
    rotateBtn.addEventListener('click', () => {
      if (window.twinkle3D) {
        const rotating = window.twinkle3D.toggleAutoRotate();
        rotateBtn.classList.toggle('active', rotating);
      }
    });
  }

  if (wireBtn) {
    wireBtn.addEventListener('click', () => {
      if (window.twinkle3D) {
        const wire = window.twinkle3D.toggleWireframe();
        wireBtn.classList.toggle('active', wire);
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (window.twinkle3D) {
        window.twinkle3D.resetView();
      }
    });
  }
}

/* ══════════════════════════════════════════════════
   6. USER MANUAL SIDEBAR & LIVE SEARCH
   ══════════════════════════════════════════════════ */
function initManualNavigationAndSearch() {
  const manualNavLinks = document.querySelectorAll('.manual-nav-link');
  const manualSections = document.querySelectorAll('.manual-article');
  const manualSearchInput = document.getElementById('manualSearchInput');
  const manualSearchCount = document.getElementById('manualSearchCount');
  const manualDrawerBtn = document.getElementById('manualDrawerBtn');
  const manualSidebar = document.getElementById('manualSidebar');

  // Mobile sidebar toggle
  if (manualDrawerBtn && manualSidebar) {
    manualDrawerBtn.addEventListener('click', () => {
      const open = manualSidebar.classList.toggle('open');
      manualDrawerBtn.setAttribute('aria-expanded', open);
    });
  }

  // Smooth scroll and active state in manual
  manualNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetElem = document.querySelector(targetId);
      if (targetElem) {
        const offset = 80;
        const elemPos = targetElem.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: elemPos, behavior: 'smooth' });

        manualNavLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Close mobile sidebar if open
        if (manualSidebar) manualSidebar.classList.remove('open');
      }
    });
  });

  // Highlight active link on manual scroll
  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY + 100;
    manualSections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');
      if (scrollPos >= top && scrollPos < top + height) {
        manualNavLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });

  // Instant Manual Search Filter
  if (manualSearchInput) {
    manualSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      let matchCount = 0;

      manualSections.forEach(section => {
        const title = section.querySelector('h3, h4')?.textContent.toLowerCase() || '';
        const body = section.textContent.toLowerCase();
        const sectionId = section.getAttribute('id');
        const correspondingLink = document.querySelector(`.manual-nav-link[href="#${sectionId}"]`);

        if (query === '' || title.includes(query) || body.includes(query)) {
          section.style.display = '';
          if (correspondingLink) correspondingLink.style.display = '';
          matchCount++;
        } else {
          section.style.display = 'none';
          if (correspondingLink) correspondingLink.style.display = 'none';
        }
      });

      if (manualSearchCount) {
        manualSearchCount.textContent = query
          ? `${matchCount} chapter${matchCount === 1 ? '' : 's'} matching "${query}"`
          : '';
      }
    });
  }
}

/* ══════════════════════════════════════════════════
   7. FAQS ACCORDION & SEARCH FILTER
   ══════════════════════════════════════════════════ */
function initFaqAccordionAndSearch() {
  const faqItems = document.querySelectorAll('.faq-item');
  const faqFilterPills = document.querySelectorAll('.faq-pill');
  const faqSearchInput = document.getElementById('faqSearchInput');

  // Accordion click toggle
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');
        // Close others in same group
        faqItems.forEach(i => i.classList.remove('active'));
        if (!isOpen) {
          item.classList.add('active');
        }
      });
    }
  });

  // Category filter pills
  faqFilterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      faqFilterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const category = pill.getAttribute('data-cat');
      filterFaqs();
    });
  });

  // Search input filter
  if (faqSearchInput) {
    faqSearchInput.addEventListener('input', () => {
      filterFaqs();
    });
  }

  function filterFaqs() {
    const activePill = document.querySelector('.faq-pill.active');
    const category = activePill ? activePill.getAttribute('data-cat') : 'all';
    const query = faqSearchInput ? faqSearchInput.value.toLowerCase().trim() : '';

    faqItems.forEach(item => {
      const itemCat = item.getAttribute('data-category');
      const question = item.querySelector('.faq-question')?.textContent.toLowerCase() || '';
      const answer = item.querySelector('.faq-answer')?.textContent.toLowerCase() || '';

      const matchesCat = (category === 'all' || itemCat === category);
      const matchesQuery = (query === '' || question.includes(query) || answer.includes(query));

      if (matchesCat && matchesQuery) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }
}

/* ══════════════════════════════════════════════════
   8. TROUBLESHOOTING ASSISTANT
   ══════════════════════════════════════════════════ */
function initTroubleshootingWizard() {
  const selector = document.getElementById('troubleSelect');
  const solutionCard = document.getElementById('troubleSolutionCard');
  const solutionTitle = document.getElementById('troubleSolutionTitle');
  const solutionBody = document.getElementById('troubleSolutionBody');

  const troubleshootingData = {
    wifi: {
      title: "Wi-Fi 'Twinkle-Setup' Hotspot Not Appearing",
      body: `
        <ol class="step-guide">
          <li><strong>Confirm Power:</strong> Check that Twinkle's screen is turned on. If the screen is off, gently tap the top touch sensor to wake it.</li>
          <li><strong>Check Wi-Fi Setup Mode:</strong> When Twinkle cannot connect to a saved network or is booting for the first time, it broadcasts <code>Twinkle-Setup</code> for 90 seconds. If 90 seconds elapsed, hold the top sensor to open the Menu, navigate to Wi-Fi Setup, and select it to reopen the hotspot.</li>
          <li><strong>Network Connection:</strong> Ensure your phone or laptop connects to <code>Twinkle-Setup</code> with no internet check warnings dismissed.</li>
        </ol>
      `
    },
    time: {
      title: "Clock Not Synchronizing or Displaying Incorrect Time",
      body: `
        <ol class="step-guide">
          <li><strong>Wi-Fi Internet Access:</strong> Verify that the Wi-Fi network Twinkle is connected to has active internet connectivity so it can sync the time online.</li>
          <li><strong>Timezone Offset:</strong> Twinkle is factory calibrated for IST (UTC +5:30) with automatic daylight sync. Once connected to internet, the clock updates in under 3 seconds.</li>
          <li><strong>Reboot Sync:</strong> Power cycle Twinkle or tap the sensor to trigger a fresh time check.</li>
        </ol>
      `
    },
    touch: {
      title: "Touch Sensor Sensitivity or Gestures Not Triggering",
      body: `
        <ol class="step-guide">
          <li><strong>Finger Contact:</strong> The touch sensor is located at the top of Twinkle's head. Use a flat finger contact rather than a fingernail.</li>
          <li><strong>Single vs Double Tap:</strong> For double-tap (spiral eyes or back), ensure the two taps occur within 300ms of each other.</li>
          <li><strong>Long Press:</strong> For holding to open menus, keep your finger pressed firmly for 800ms until the menu activates.</li>
        </ol>
      `
    },
    screen: {
      title: "Screen Blank / Sleep Mode",
      body: `
        <ol class="step-guide">
          <li><strong>Smart Power Sleep:</strong> Twinkle enters energy-saving sleep after 60 seconds of idle time. Simply single-tap anywhere on the top sensor to instantly awaken it!</li>
          <li><strong>USB Power:</strong> Ensure your USB cable is securely plugged into an active USB port or adapter.</li>
        </ol>
      `
    }
  };

  if (selector && solutionCard) {
    selector.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val && troubleshootingData[val]) {
        solutionTitle.textContent = troubleshootingData[val].title;
        solutionBody.innerHTML = troubleshootingData[val].body;
        solutionCard.style.display = 'block';
      } else {
        solutionCard.style.display = 'none';
      }
    });
  }
}

/* ══════════════════════════════════════════════════
   9. PRODUCT GALLERY & LIGHTBOX
   ══════════════════════════════════════════════════ */
function initProductGallery() {
  const mainImage = document.getElementById('galleryMainImg');
  const mainVideo = document.getElementById('galleryMainVideo');
  const thumbs = document.querySelectorAll('.gallery-thumb');
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');

      const isVideo = thumb.getAttribute('data-type') === 'video';
      if (isVideo) {
        if (mainImage) mainImage.style.display = 'none';
        if (mainVideo) {
          mainVideo.style.display = 'block';
          mainVideo.currentTime = 0;
          mainVideo.play().catch(() => {});
        }
      } else {
        if (mainVideo) {
          mainVideo.pause();
          mainVideo.style.display = 'none';
        }
        if (mainImage) {
          mainImage.style.display = 'block';
          const src = thumb.getAttribute('data-full');
          const alt = thumb.getAttribute('alt');
          mainImage.src = src;
          mainImage.alt = alt;
        }
      }
    });
  });

  if (mainImage && lightboxModal && lightboxImg) {
    mainImage.addEventListener('click', () => {
      if (mainImage.style.display !== 'none') {
        lightboxImg.src = mainImage.src;
        lightboxModal.classList.add('open');
      }
    });
  }

  if (lightboxClose && lightboxModal) {
    lightboxClose.addEventListener('click', () => {
      lightboxModal.classList.remove('open');
    });
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        lightboxModal.classList.remove('open');
      }
    });
  }
}

/* ══════════════════════════════════════════════════
   10. ORDER & CHECKOUT SYSTEM
   ══════════════════════════════════════════════════ */
function initOrderAndCheckout() {
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const qtyInput = document.getElementById('qtyInput');
  const priceDisplay = document.getElementById('totalPriceDisplay');
  const btnBuyWhatsApp = document.getElementById('btnBuyWhatsApp');
  const btnQuickInquiry = document.getElementById('btnQuickInquiry');
  const orderModal = document.getElementById('orderModal');
  const orderModalClose = document.getElementById('orderModalClose');
  const orderForm = document.getElementById('orderForm');
  const orderModalQty = document.getElementById('orderModalQty');
  const orderModalTotal = document.getElementById('orderModalTotal');

  const UNIT_PRICE = 1499; // Launch Price in INR

  function updatePrice() {
    let qty = parseInt(qtyInput.value) || 1;
    if (qty < 1) qty = 1;
    if (qty > 10) qty = 10;
    qtyInput.value = qty;
    const total = qty * UNIT_PRICE;
    if (priceDisplay) {
      priceDisplay.textContent = `₹${total.toLocaleString('en-IN')}`;
    }
  }

  function openOrderModal() {
    const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;
    const total = qty * UNIT_PRICE;
    if (orderModalQty) orderModalQty.textContent = qty;
    if (orderModalTotal) orderModalTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
    if (orderModal) {
      orderModal.classList.add('open');
      const firstInput = document.getElementById('orderFullName');
      if (firstInput) setTimeout(() => firstInput.focus(), 80);
    }
  }

  function closeOrderModal() {
    if (orderModal) {
      orderModal.classList.remove('open');
    }
  }

  if (qtyMinus && qtyPlus && qtyInput) {
    qtyMinus.addEventListener('click', () => {
      let qty = parseInt(qtyInput.value) || 1;
      if (qty > 1) {
        qtyInput.value = qty - 1;
        updatePrice();
      }
    });

    qtyPlus.addEventListener('click', () => {
      let qty = parseInt(qtyInput.value) || 1;
      if (qty < 10) {
        qtyInput.value = qty + 1;
        updatePrice();
      }
    });

    qtyInput.addEventListener('change', updatePrice);
  }

  // Open WhatsApp Order Modal on button click
  if (btnBuyWhatsApp) {
    btnBuyWhatsApp.addEventListener('click', (e) => {
      e.preventDefault();
      openOrderModal();
    });
  }

  if (btnQuickInquiry) {
    btnQuickInquiry.addEventListener('click', (e) => {
      e.preventDefault();
      openOrderModal();
    });
  }

  if (orderModalClose) {
    orderModalClose.addEventListener('click', closeOrderModal);
  }

  if (orderModal) {
    orderModal.addEventListener('click', (e) => {
      if (e.target === orderModal) closeOrderModal();
    });
  }

  // Handle Order Submission with Full Name, Phone, Address, and Pincode
  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fullName = (document.getElementById('orderFullName') ? document.getElementById('orderFullName').value : '').trim();
      const phone = (document.getElementById('orderPhone') ? document.getElementById('orderPhone').value : '').trim();
      const address = (document.getElementById('orderAddress') ? document.getElementById('orderAddress').value : '').trim();
      const pincode = (document.getElementById('orderPincode') ? document.getElementById('orderPincode').value : '').trim();
      const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;
      const total = qty * UNIT_PRICE;

      const orderMessage = `Hello Arun Hobbies! 🤖\n\nI want to order Twinkle — The Little Desktop Companion!\n\n📦 ORDER DETAILS:\n• Edition: Pure White Edition with Smart NFC\n• Quantity: ${qty} Unit(s)\n• Total Amount: ₹${total.toLocaleString('en-IN')}\n\n📍 DELIVERY & CUSTOMER DETAILS:\n• Full Name: ${fullName}\n• Phone Number: ${phone}\n• Delivery Address: ${address}\n• Pincode: ${pincode}\n\n🎁 IN THE BOX:\n• 1× Twinkle Desktop Companion\n• 1× Official Purchase Bill & Invoice (5% off next order)\n• 1× Quick-Start QR Card for digital user manual\n• 1× Arun Hobbies Official Contact & Support Card\n\n✅ Terms & Policy Accepted: Handcrafted QA bench-verified. Strict No-Return & No-Refund policy once ordered. Continuous uncut unboxing video will be recorded for courier transit replacement.\n\nPlease share your payment QR / bank details to confirm my order. Thank you!`;

      const whatsappUrl = `https://wa.me/918072522040?text=${encodeURIComponent(orderMessage)}`;
      window.open(whatsappUrl, '_blank');
      closeOrderModal();
    });
  }
}

/* ══════════════════════════════════════════════════
   11. SCROLL REVEAL ANIMATIONS
   ══════════════════════════════════════════════════ */
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.fade-up, .feature-card, .spec-card');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => observer.observe(el));
  } else {
    animatedElements.forEach(el => el.classList.add('visible'));
  }
}

/* ══════════════════════════════════════════════════
   12. COPY TO CLIPBOARD BUTTONS
   ══════════════════════════════════════════════════ */
function initClipboardButtons() {
  const copyButtons = document.querySelectorAll('.btn-copy');

  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-clipboard');
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          const originalText = btn.innerHTML;
          btn.innerHTML = `✓ Copied!`;
          btn.classList.add('copied');
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('copied');
          }, 1800);
        });
      }
    });
  });
}

/* ══════════════════════════════════════════════════
   13. INTERACTIVE BREATHING WIDGET (HEALTH PAGE)
   ══════════════════════════════════════════════════ */
function initBreathingWidget() {
  const textGuide = document.getElementById('breatheTextGuide');
  if (!textGuide) return;

  function cycle() {
    textGuide.textContent = "Breathe In (4s)";
    setTimeout(() => {
      if (textGuide) textGuide.textContent = "Breathe Out (6s)";
    }, 4000);
  }

  cycle();
  setInterval(cycle, 10000);
}
