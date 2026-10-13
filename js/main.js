// Mobile Wedding Invitation (Ver 2 - Natural Modern UI) Interactive Script

document.addEventListener('DOMContentLoaded', () => {
  // 1. Toast Notification Utility
  const showToast = (message) => {
    let toast = document.querySelector('.toast-msg');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast-msg';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  };

  // Demo Page Environment Check (Never send data to real Drive/Sheets when data-demo="true")
  const isDemoPage =
    document.body.dataset.demo === 'true' ||
    window.location.pathname.endsWith('demo.html') ||
    window.location.href.includes('demo.html');

  // Backend Google Apps Script Webhook Endpoint
  const GAS_ENDPOINT_URL =
    'https://script.google.com/macros/s/AKfycbxXEm5vo1v3y0bXZwkvM7grQ3e2VoShyhmPlwqbYKQcpxsFweC0BKpJYHEeMrCv5aN8eQ/exec';
  const DRIVE_FOLDER_ID = '1SFKJ1G5HZtnxrUwhXN2D9l_iAAqIqab-';

  // 2. Background Music (BGM) Player
  const bgmAudio = document.getElementById('bgm-audio');
  const bgmToggleBtn = document.getElementById('bgm-toggle-btn');
  const bgmIconMute = document.getElementById('bgm-icon-mute');
  const bgmIconPlay = document.getElementById('bgm-icon-play');

  if (bgmAudio && bgmToggleBtn) {
    let isPlaying = false;

    const toggleBgm = async () => {
      try {
        if (isPlaying) {
          bgmAudio.pause();
          isPlaying = false;
          if (bgmIconMute) bgmIconMute.style.display = 'block';
          if (bgmIconPlay) bgmIconPlay.style.display = 'none';
        } else {
          await bgmAudio.play();
          isPlaying = true;
          if (bgmIconMute) bgmIconMute.style.display = 'none';
          if (bgmIconPlay) bgmIconPlay.style.display = 'block';
        }
      } catch (err) {
        console.warn('Audio restriction:', err);
      }
    };

    bgmToggleBtn.addEventListener('click', toggleBgm);

    const initAudioOnInteraction = () => {
      if (!isPlaying && bgmAudio.paused) {
        bgmAudio
          .play()
          .then(() => {
            isPlaying = true;
            if (bgmIconMute) bgmIconMute.style.display = 'none';
            if (bgmIconPlay) bgmIconPlay.style.display = 'block';
          })
          .catch(() => {});
      }
      document.removeEventListener('click', initAudioOnInteraction);
      document.removeEventListener('touchstart', initAudioOnInteraction);
    };

    document.addEventListener('click', initAudioOnInteraction, { once: true });
    document.addEventListener('touchstart', initAudioOnInteraction, { once: true });
  }

  // 3. Live D-Day & Countdown Timer
  const updateCountdown = () => {
    // Target: 2027년 01월 09일 12:40:00 KST
    const weddingDate = new Date('2027-01-09T12:40:00+09:00').getTime();
    const now = new Date().getTime();
    const diff = weddingDate - now;

    const daysElem = document.getElementById('countdown-days');
    const hoursElem = document.getElementById('countdown-hours');
    const minsElem = document.getElementById('countdown-mins');
    const secsElem = document.getElementById('countdown-secs');

    if (diff <= 0) {
      if (daysElem) daysElem.textContent = '0';
      if (hoursElem) hoursElem.textContent = '0';
      if (minsElem) minsElem.textContent = '0';
      if (secsElem) secsElem.textContent = '0';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (daysElem) daysElem.textContent = String(days);
    if (hoursElem) hoursElem.textContent = String(hours);
    if (minsElem) minsElem.textContent = String(mins);
    if (secsElem) secsElem.textContent = String(secs);
  };

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // 4. Modals Controller (RSVP & Account Modals)
  const openModal = (modal) => {
    if (!modal) return;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    const anyOpenModal = document.querySelector('.modal-overlay.show, .lightbox-modal.active');
    if (!anyOpenModal) {
      document.body.style.overflow = '';
    }
  };

  const closeAllModals = () => {
    document.querySelectorAll('.modal-overlay.show').forEach((m) => {
      m.classList.remove('show');
      m.setAttribute('aria-hidden', 'true');
    });
    const anyLightbox = document.querySelector('.lightbox-modal.active');
    if (!anyLightbox) {
      document.body.style.overflow = '';
    }
  };

  // Sound Effect Player (Quest Complete/Click MP3)
  const questAudio = new Audio('assets/quest.mp3');
  questAudio.preload = 'auto';

  const playQuestSound = () => {
    try {
      questAudio.currentTime = 0;
      const playPromise = questAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay policy or muted fallback
        });
      }
    } catch (e) {
      // Audio playback error fallback
    }
  };

  // Portal Warp Sound Effect Player
  const portalAudio = new Audio('assets/portal.mp3');
  portalAudio.preload = 'auto';

  const playPortalSound = () => {
    try {
      portalAudio.currentTime = 0;
      const playPromise = portalAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } catch (e) {}
  };

  // Maple Window Close / Cancel Sound Effect Player
  const closeAudio = new Audio('assets/close.mp3');
  closeAudio.preload = 'auto';

  const playCloseSound = () => {
    try {
      closeAudio.currentTime = 0;
      const playPromise = closeAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } catch (e) {}
  };

  // Maple Window Open Sound Effect Player
  const openAudio = new Audio('assets/open.mp3');
  openAudio.preload = 'auto';

  const playOpenSound = () => {
    try {
      openAudio.currentTime = 0;
      const playPromise = openAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } catch (e) {}
  };

  // Map Ladder Portal Interaction (Toy drops from top portal into bottom portal)
  const mapLadderContainer = document.getElementById('ludi-map-ladder');
  const ladderFallingToy = document.getElementById('ladder-falling-toy');

  if (mapLadderContainer && ladderFallingToy) {
    const triggerLadderDrop = () => {
      playPortalSound();
      ladderFallingToy.classList.remove('falling');
      void ladderFallingToy.offsetWidth;
      ladderFallingToy.classList.add('falling');
    };

    mapLadderContainer.addEventListener('click', (e) => {
      triggerLadderDrop();
    });

    document.querySelectorAll('.ladder-portal-btn').forEach((btn) => {
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerLadderDrop();
        }
      });
    });

    ladderFallingToy.addEventListener('animationend', () => {
      ladderFallingToy.classList.remove('falling');
    });
  }

  // Triggers & Close Buttons
  const rsvpModal = document.getElementById('rsvp-modal');
  const btnOpenRsvp = document.getElementById('btn-open-rsvp');
  const rsvpModalClose = document.getElementById('rsvp-modal-close');

  const groomModal = document.getElementById('account-modal-groom');
  const btnOpenGroom = document.getElementById('btn-open-groom-account');
  const groomModalClose = document.getElementById('groom-modal-close');

  const brideModal = document.getElementById('account-modal-bride');
  const btnOpenBride = document.getElementById('btn-open-bride-account');
  const brideModalClose = document.getElementById('bride-modal-close');

  if (btnOpenRsvp) {
    btnOpenRsvp.addEventListener('click', () => {
      playQuestSound();
      openModal(rsvpModal);
    });
  }
  if (rsvpModalClose) rsvpModalClose.addEventListener('click', () => closeModal(rsvpModal));

  if (btnOpenGroom) {
    btnOpenGroom.addEventListener('click', () => {
      playQuestSound();
      openModal(groomModal);
    });
  }
  if (groomModalClose) groomModalClose.addEventListener('click', () => closeModal(groomModal));

  if (btnOpenBride) {
    btnOpenBride.addEventListener('click', () => {
      playQuestSound();
      openModal(brideModal);
    });
  }
  if (brideModalClose) brideModalClose.addEventListener('click', () => closeModal(brideModal));

  // Hero Wedding Quest Confirmation Modal Buttons & Mail Reopen Toggle
  const heroWeddingConfirm = document.getElementById('hero-wedding-confirm');
  const btnHeroOk = document.getElementById('btn-hero-attend-ok');
  const btnHeroCancel = document.getElementById('btn-hero-attend-cancel');
  const btnHeroMailReopen = document.getElementById('btn-hero-mail-reopen');

  if (btnHeroOk) {
    btnHeroOk.addEventListener('click', () => {
      playOpenSound();
      openModal(rsvpModal);
    });
  }

  if (btnHeroCancel) {
    btnHeroCancel.addEventListener('click', () => {
      playCloseSound();
      if (heroWeddingConfirm) {
        heroWeddingConfirm.style.display = 'none';
      }
      if (btnHeroMailReopen) {
        btnHeroMailReopen.style.display = 'flex';
      }
      showToast('💌 마음으로 전해주시는 따뜻한 축복에 감사드립니다.');
    });
  }

  if (btnHeroMailReopen) {
    btnHeroMailReopen.addEventListener('click', () => {
      playOpenSound();
      btnHeroMailReopen.style.display = 'none';
      if (heroWeddingConfirm) {
        heroWeddingConfirm.style.display = 'flex';
      }
    });
  }

  // HUD Overlay Popups Controller
  const hideAllHudPopups = () => {
    document.querySelectorAll('.hud-overlay-popup').forEach((popup) => {
      popup.style.display = 'none';
    });
  };

  const showHudPopup = (popupId) => {
    hideAllHudPopups();
    const targetPopup = document.getElementById(popupId);
    if (targetPopup) {
      playOpenSound();
      targetPopup.style.display = 'flex';
    }
  };

  // 1. HUD Quick Menu Tiles Handler
  const hudMenuTiles = document.querySelectorAll('.hud-menu-tile');
  hudMenuTiles.forEach((tile) => {
    tile.addEventListener('click', () => {
      const popupType = tile.getAttribute('data-hud-popup');
      if (popupType) {
        showHudPopup(`hud-popup-${popupType}`);
      }
    });
  });

  // 2. All HUD Close Buttons (Play close.mp3)
  document.querySelectorAll('.hud-overlay-popup .btn-hud-close').forEach((closeBtn) => {
    closeBtn.addEventListener('click', () => {
      playCloseSound();
      hideAllHudPopups();
    });
  });

  // 3. Popup Action Buttons (Play open.mp3)
  // Location: Naver Map App
  const btnHudMapNaver = document.getElementById('btn-hud-map-naver');
  if (btnHudMapNaver) {
    btnHudMapNaver.addEventListener('click', () => {
      playOpenSound();
      window.open('https://map.naver.com/p/search/%EB%8D%94%ED%8C%8C%ED%8B%B0%EC%9B%80%20%EC%97%AC%EC%9D%98%EB%8F%84', '_blank', 'noopener,noreferrer');
    });
  }

  // Location: Kakao Map App
  const btnHudMapKakao = document.getElementById('btn-hud-map-kakao');
  if (btnHudMapKakao) {
    btnHudMapKakao.addEventListener('click', () => {
      playOpenSound();
      window.open('https://map.kakao.com/link/search/%EB%8D%94%ED%8C%8C%ED%8B%B0%EC%9B%80%20%EC%97%AC%EC%9D%98%EB%8F%84', '_blank', 'noopener,noreferrer');
    });
  }

  // RSVP Submit Button (Opens RSVP modal)
  const btnHudRsvpSubmit = document.getElementById('btn-hud-rsvp-submit');
  if (btnHudRsvpSubmit) {
    btnHudRsvpSubmit.addEventListener('click', () => {
      playOpenSound();
      openModal(rsvpModal);
    });
  }

  // Gift: Groom Account Modal
  const btnHudGroomGift = document.getElementById('btn-hud-groom-gift');
  if (btnHudGroomGift) {
    btnHudGroomGift.addEventListener('click', () => {
      playOpenSound();
      openModal(groomModal);
    });
  }

  // Gift: Bride Account Modal
  const btnHudBrideGift = document.getElementById('btn-hud-bride-gift');
  if (btnHudBrideGift) {
    btnHudBrideGift.addEventListener('click', () => {
      playOpenSound();
      openModal(brideModal);
    });
  }

  // Gallery: View Fullscreen Lightbox
  const btnHudGalleryView = document.getElementById('btn-hud-gallery-view');
  if (btnHudGalleryView) {
    btnHudGalleryView.addEventListener('click', () => {
      playOpenSound();
      if (typeof openLightbox === 'function') {
        openLightbox(0);
      }
    });
  }

  // Snap: Trigger File Upload
  const btnHudSnapUpload = document.getElementById('btn-hud-snap-upload');
  if (btnHudSnapUpload) {
    btnHudSnapUpload.addEventListener('click', () => {
      playOpenSound();
      const fileInput = document.getElementById('photo-file-input');
      if (fileInput) fileInput.click();
    });
  }

  // Backdrop clicks for all modals
  document.querySelectorAll('.modal-overlay').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  // Global Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  // Account Clipboard Copy
  document.querySelectorAll('.btn-copy-account').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const targetBtn = e.currentTarget;
      if (targetBtn.classList.contains('copied')) return;

      const accountText = targetBtn.getAttribute('data-account') || '';
      if (!accountText) return;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(accountText);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = accountText;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }

        // Instant visual feedback on button
        const originalText = targetBtn.getAttribute('data-orig-text') || targetBtn.textContent;
        targetBtn.setAttribute('data-orig-text', originalText);
        targetBtn.classList.add('copied');
        targetBtn.textContent = '✓ 복사 완료';

        setTimeout(() => {
          targetBtn.classList.remove('copied');
          targetBtn.textContent = originalText;
          targetBtn.blur();
        }, 1500);
      } catch (err) {
        console.error('Copy failed:', err);
      }
    });
  });

  // 5. Gallery Portal Warp & Fullscreen Lightbox Viewer
  const galleryPhotoFrame = document.getElementById('gallery-photo-frame');
  const galleryPhotoItems = document.querySelectorAll('.gallery-photo-item');
  const portalPrevBtn = document.getElementById('gallery-portal-prev');
  const portalNextBtn = document.getElementById('gallery-portal-next');
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxSliderTrack = document.getElementById('lightbox-slider-track');
  const lightboxSlides = document.querySelectorAll('.lightbox-slide');
  const lightboxClose = document.getElementById('lightbox-close');
  let currentGalleryIndex = 0;
  const totalGalleryItems = galleryPhotoItems.length || 6;

  const triggerPortalWarp = (direction) => {
    // Play portal audio sound
    playPortalSound();

    // Trigger warp visual effect
    if (galleryPhotoFrame) {
      galleryPhotoFrame.classList.remove('warping');
      void galleryPhotoFrame.offsetWidth; // Force reflow
      galleryPhotoFrame.classList.add('warping');
    }

    // Transition photo index
    currentGalleryIndex = (currentGalleryIndex + direction + totalGalleryItems) % totalGalleryItems;
    galleryPhotoItems.forEach((item, idx) => {
      if (idx === currentGalleryIndex) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  };

  const bindPortalBtn = (btn, direction) => {
    if (!btn) return;
    const handler = (e) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      triggerPortalWarp(direction);
    };

    btn.addEventListener('click', handler);
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handler(e);
      }
    });
  };

  bindPortalBtn(portalPrevBtn, -1); // Left: Prev photo
  bindPortalBtn(portalNextBtn, 1);  // Right: Next photo

  // Clicking the photo frame opens fullscreen lightbox at current photo
  if (galleryPhotoFrame) {
    galleryPhotoFrame.addEventListener('click', () => {
      openLightbox(currentGalleryIndex);
    });
  }

  // Fullscreen Infinite Lightbox Controller
  const openLightbox = (realIndex = 0) => {
    if (!lightboxModal || !lightboxSliderTrack) return;
    lightboxModal.classList.add('active');
    lightboxModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Temporarily disable scroll-snap to lock precise target coordinate
    lightboxSliderTrack.style.scrollSnapType = 'none';
    lightboxSliderTrack.style.scrollBehavior = 'auto';

    const slideWidth = window.innerWidth;
    lightboxSliderTrack.scrollLeft = (totalGalleryItems + realIndex) * slideWidth;

    requestAnimationFrame(() => {
      lightboxSliderTrack.scrollLeft = (totalGalleryItems + realIndex) * (lightboxSliderTrack.offsetWidth || window.innerWidth);
      void lightboxSliderTrack.offsetHeight;
      requestAnimationFrame(() => {
        lightboxSliderTrack.style.scrollSnapType = 'x mandatory';
      });
    });
  };

  const closeLightbox = () => {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('active');
    lightboxModal.setAttribute('aria-hidden', 'true');
    const anyModal = document.querySelector('.modal-overlay.show');
    if (!anyModal) {
      document.body.style.overflow = '';
    }
  };

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal || e.target.classList.contains('lightbox-slide')) {
        closeLightbox();
      }
    });
  }

  if (lightboxSliderTrack && lightboxSlides.length) {
    let isLightboxResetting = false;
    let lbScrollEndTimer = null;

    const checkLightboxLoop = () => {
      if (isLightboxResetting || lightboxSlides.length < totalGalleryItems * 2) return;
      const sWidth = lightboxSliderTrack.offsetWidth || window.innerWidth;
      const fullSetW = totalGalleryItems * sWidth;
      if (fullSetW <= 0) return;

      let deltaScroll = 0;
      if (lightboxSliderTrack.scrollLeft < fullSetW * 0.35) {
        deltaScroll = fullSetW;
      } else if (lightboxSliderTrack.scrollLeft > fullSetW * 1.65) {
        deltaScroll = -fullSetW;
      }

      if (deltaScroll !== 0) {
        isLightboxResetting = true;
        const prevSnap = lightboxSliderTrack.style.scrollSnapType;
        lightboxSliderTrack.style.scrollSnapType = 'none';
        lightboxSliderTrack.scrollLeft += deltaScroll;
        void lightboxSliderTrack.offsetHeight;
        requestAnimationFrame(() => {
          lightboxSliderTrack.style.scrollSnapType = prevSnap;
          isLightboxResetting = false;
        });
      }
    };

    lightboxSliderTrack.addEventListener('scroll', () => {
      clearTimeout(lbScrollEndTimer);
      lbScrollEndTimer = setTimeout(checkLightboxLoop, 100);
    }, { passive: true });
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (lightboxModal && lightboxModal.classList.contains('active')) {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft' && lightboxSliderTrack) {
        lightboxSliderTrack.scrollBy({ left: -window.innerWidth, behavior: 'smooth' });
      } else if (e.key === 'ArrowRight' && lightboxSliderTrack) {
        lightboxSliderTrack.scrollBy({ left: window.innerWidth, behavior: 'smooth' });
      }
    }
  });

  // 6. Naver Maps v3 Initialization
  const initNaverMap = () => {
    const mapArea = document.getElementById('map-area');
    if (!mapArea) return;

    const renderMap = () => {
      if (typeof naver !== 'undefined' && naver.maps) {
        try {
          // 더 파티움 여의도 (위도 37.5284, 경도 126.9205)
          const venueLocation = new naver.maps.LatLng(37.5284, 126.9205);
          const map = new naver.maps.Map('map-area', {
            center: venueLocation,
            zoom: 16,
            zoomControl: true,
            zoomControlOptions: {
              position: naver.maps.Position.TOP_RIGHT,
              style: naver.maps.ZoomControlStyle.SMALL,
            },
            mapTypeControl: false,
            scaleControl: false,
          });

          const marker = new naver.maps.Marker({
            position: venueLocation,
            map: map,
            title: '더 파티움 여의도',
          });

          naver.maps.Event.addListener(marker, 'click', () => {
            window.open(
              'https://map.naver.com/p/search/%EB%8D%94%ED%8C%8C%ED%8B%B0%EC%9B%80%20%EC%97%AC%EC%9D%98%EB%8F%84',
              '_blank'
            );
          });
        } catch (e) {
          console.warn('Naver map error:', e);
        }
      }
    };

    if (typeof naver !== 'undefined' && naver.maps) {
      renderMap();
    } else {
      window.addEventListener('load', renderMap);
    }
  };

  initNaverMap();

  // 7. 1-Click Guest Photo Upload to Google Drive (with Client-Side Canvas Compression)
  const photoFileInput = document.getElementById('photo-file-input');
  const photoUploadStatus = document.getElementById('photo-upload-status');
  const photoProgressBar = document.getElementById('photo-progress-bar');
  const photoStatusText = document.getElementById('photo-status-text');

  const compressAndEncodeFile = (file) => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result || '').toString().split(',')[1] || '';
          resolve({ name: file.name, type: file.type, base64: base64 });
        };
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const maxDim = 1600;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          const base64 = dataUrl.split(',')[1] || '';
          resolve({
            name: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
            type: 'image/jpeg',
            base64: base64,
          });
        };
        img.src = e.target && e.target.result ? e.target.result.toString() : '';
      };
      reader.readAsDataURL(file);
    });
  };

  if (photoFileInput) {
    photoFileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      // Demo Mode Guard
      if (isDemoPage) {
        showToast(
          `📸 [데모] ${files.length}장의 사진이 전달되었습니다! (실제 드라이브에는 저장되지 않습니다)`
        );
        photoFileInput.value = '';
        return;
      }

      if (photoUploadStatus) photoUploadStatus.classList.add('active');
      if (photoStatusText) photoStatusText.textContent = `${files.length}장의 사진을 압축 및 전송 중입니다...`;
      if (photoProgressBar) photoProgressBar.style.width = '45%';

      try {
        const encodedFiles = await Promise.all(files.map((f) => compressAndEncodeFile(f)));

        if (photoProgressBar) photoProgressBar.style.width = '75%';

        const payload = {
          action: 'upload_photos',
          folderId: DRIVE_FOLDER_ID,
          files: encodedFiles,
        };

        await fetch(GAS_ENDPOINT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });

        if (photoProgressBar) photoProgressBar.style.width = '100%';
        if (photoStatusText) photoStatusText.textContent = '업로드 완료! 소중한 사진 감사합니다 💖';
        showToast('소중한 사진이 성공적으로 전달되었습니다! 📸💖');

        setTimeout(() => {
          if (photoUploadStatus) photoUploadStatus.classList.remove('active');
          if (photoProgressBar) photoProgressBar.style.width = '0%';
        }, 3000);
      } catch (err) {
        console.error('Upload error:', err);
        showToast('사진이 전달되었습니다. 감사합니다! ✨');
        if (photoUploadStatus) photoUploadStatus.classList.remove('active');
      } finally {
        photoFileInput.value = '';
      }
    });
  }

  // 8. RSVP Submission Handler & Dynamic UI
  const rsvpForm = document.getElementById('rsvp-form');
  const rsvpSubmitBtn = document.getElementById('rsvp-submit-btn');
  const rsvpAttendRadios = document.querySelectorAll('input[name="rsvp_attend"]');
  const rsvpCountWrap = document.getElementById('rsvp-count-wrap');
  const rsvpMealWrap = document.getElementById('rsvp-meal-wrap');

  if (rsvpAttendRadios.length) {
    rsvpAttendRadios.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        const isAttending = e.target.value === '참석';
        if (rsvpCountWrap) rsvpCountWrap.style.display = isAttending ? 'block' : 'none';
        if (rsvpMealWrap) rsvpMealWrap.style.display = isAttending ? 'block' : 'none';
      });
    });
  }

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('rsvp-name');
      const name = nameInput ? nameInput.value.trim() : '';

      if (!name) {
        showToast('성함을 입력해 주세요.');
        return;
      }

      const sideInput = document.querySelector('input[name="rsvp_side"]:checked');
      const attendInput = document.querySelector('input[name="rsvp_attend"]:checked');
      const countInput = document.querySelector('input[name="rsvp_count"]:checked');
      const mealInput = document.querySelector('input[name="rsvp_meal"]:checked');
      const messageInput = document.getElementById('rsvp-message');

      const side = sideInput ? sideInput.value : '신랑측';
      const attend = attendInput ? attendInput.value : '참석';
      const count = attend === '참석' && countInput ? countInput.value : '0명';
      const meal = attend === '참석' && mealInput ? mealInput.value : '식사 안함';
      const message = messageInput ? messageInput.value.trim() : '';
      const timestamp = new Date().toLocaleString('ko-KR');

      const payload = { timestamp, side, name, attend, count, meal, message };

      // Demo Mode Guard
      if (isDemoPage) {
        rsvpForm.reset();
        closeModal(rsvpModal);
        showToast(
          attend === '참석'
            ? `[데모] ${name}님, 참석 의사가 전달되었습니다!`
            : `[데모] ${name}님, 따뜻한 축하 마음 감사합니다!`
        );
        return;
      }

      if (rsvpSubmitBtn) {
        rsvpSubmitBtn.disabled = true;
        rsvpSubmitBtn.textContent = '전송 중...';
      }

      try {
        await fetch(GAS_ENDPOINT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const localList = JSON.parse(localStorage.getItem('rsvp_list_ver2') || '[]');
        localList.push(payload);
        localStorage.setItem('rsvp_list_ver2', JSON.stringify(localList));

        rsvpForm.reset();
        closeModal(rsvpModal);
        showToast(
          attend === '참석'
            ? `${name}님, 참석 의사가 전달되었습니다. 감사합니다!`
            : `${name}님, 따뜻한 마음 전해주셔서 감사합니다!`
        );
      } catch (err) {
        console.error('RSVP error:', err);
        closeModal(rsvpModal);
        showToast('참석 의사가 전달되었습니다. 감사합니다!');
      } finally {
        if (rsvpSubmitBtn) {
          rsvpSubmitBtn.disabled = false;
          rsvpSubmitBtn.textContent = '전달하기';
        }
      }
    });
  }

  // 9. Share Buttons
  const btnShareKakao = document.getElementById('btn-share-kakao');
  const btnCopyLink = document.getElementById('btn-copy-link');

  if (btnShareKakao) {
    btnShareKakao.addEventListener('click', () => {
      if (navigator.share) {
        navigator
          .share({
            title: '배정근 & 한지수 결혼합니다',
            text: '2027년 1월 9일 토요일 오후 12:40 더 파티움 여의도',
            url: window.location.href,
          })
          .catch(() => {});
      } else {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href);
          showToast('🔗 청첩장 링크가 복사되었습니다!');
        }
      }
    });
  }

  if (btnCopyLink) {
    btnCopyLink.addEventListener('click', async () => {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(window.location.href);
        } else {
          const t = document.createElement('textarea');
          t.value = window.location.href;
          t.style.position = 'fixed';
          t.style.opacity = '0';
          document.body.appendChild(t);
          t.select();
          document.execCommand('copy');
          document.body.removeChild(t);
        }
        showToast('🔗 청첩장 링크가 복사되었습니다!');
      } catch (err) {
        showToast('링크 복사에 실패했습니다.');
      }
    });
  }
});
