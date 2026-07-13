/* ==========================================================================
   AL RAMZ MEP DESIGN - JAVASCRIPT
   Core Interactions, Preloader, Active Menu States, Scroll Reveals, & Filtering
   ========================================================================== */

// Immediately check if preloader has already run in this session to prevent visual flash
(function() {
  if (sessionStorage.getItem('preloaderHasRun')) {
    const preloader = document.getElementById('preloader');
    const appContainer = document.getElementById('app-container');
    if (preloader) {
      preloader.style.display = 'none';
    }
    if (appContainer) {
      appContainer.classList.remove('hidden');
      appContainer.style.opacity = '1';
      appContainer.style.transition = 'none';
    }
  }
})();

document.addEventListener('DOMContentLoaded', () => {

  // 1. PRELOADER & APP INITIALIZATION
  const preloader = document.getElementById('preloader');
  const appContainer = document.getElementById('app-container');
  const minimumLoadTime = 2000; // Minimum exposure duration in ms
  const startTime = Date.now();
  const preloaderHasRun = sessionStorage.getItem('preloaderHasRun');

  // Create Interactive Blueprint Canvas
  let canvas, ctx, animationFrameId;
  let mouse = { x: null, y: null };
  let ripples = [];
  
  const handleResize = () => {
    if (canvas && preloader) {
      canvas.width = preloader.offsetWidth;
      canvas.height = preloader.offsetHeight;
    }
  };

  if (preloader && !preloaderHasRun) {
    canvas = document.createElement('canvas');
    canvas.id = 'preloader-canvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    
    preloader.insertBefore(canvas, preloader.firstChild);
    
    // Ensure content container stays on top
    const content = preloader.querySelector('.preloader-content');
    if (content) {
      content.style.position = 'relative';
      content.style.zIndex = '10';
    }
    
    ctx = canvas.getContext('2d');
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Mouse interaction on the whole preloader area
    preloader.addEventListener('mousemove', (e) => {
      const rect = preloader.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    
    preloader.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });
    
    preloader.addEventListener('click', (e) => {
      const rect = preloader.getBoundingClientRect();
      ripples.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        radius: 0,
        maxRadius: 180,
        opacity: 0.7,
        speed: 3
      });
    });

    // Drawing/animation loop
    const drawPreloaderCanvas = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const content = preloader.querySelector('.preloader-content');
      
      // Draw background blueprint grid (faint navy blue)
      const gridSize = 60;
      ctx.strokeStyle = 'rgba(27, 42, 65, 0.015)';
      ctx.lineWidth = 0.5;
      
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Active hover draftsman lines
      if (mouse.x !== null && mouse.y !== null) {
        // Horizontal & vertical fine crosshair tracking lines
        ctx.strokeStyle = 'rgba(27, 42, 65, 0.015)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(mouse.x, 0);
        ctx.lineTo(mouse.x, canvas.height);
        ctx.moveTo(0, mouse.y);
        ctx.lineTo(canvas.width, mouse.y);
        ctx.stroke();
        
        // Concentric target compass rings around cursor
        ctx.strokeStyle = 'rgba(27, 42, 65, 0.12)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 25, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(27, 42, 65, 0.06)';
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 50, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); // Reset
        
        // Numerical readout text
        ctx.fillStyle = 'rgba(27, 42, 65, 0.18)';
        ctx.font = '9px monospace';
        ctx.fillText(`X:${Math.round(mouse.x)} Y:${Math.round(mouse.y)}`, mouse.x + 12, mouse.y - 12);
        
        // Dynamic vector line connecting the mouse to the center logo
        if (content) {
          const logoRect = content.getBoundingClientRect();
          const logoCenterX = logoRect.left + logoRect.width / 2;
          const logoCenterY = logoRect.top + logoRect.height / 2;
          
          const dx = mouse.x - logoCenterX;
          const dy = mouse.y - logoCenterY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 400) {
            const opacity = 0.08 * (1 - dist / 400);
            ctx.strokeStyle = `rgba(27, 42, 65, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(logoCenterX, logoCenterY);
            ctx.stroke();
            
            // Distance tag along line center
            ctx.fillStyle = `rgba(27, 42, 65, ${0.2 * (1 - dist / 400)})`;
            ctx.fillText(`d:${Math.round(dist)}px`, mouse.x - dx / 2 + 8, mouse.y - dy / 2 - 8);
          }
        }
      }
      
      // Draw clicks/ripples as architectural circular expansions
      ctx.setLineDash([3, 3]);
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        ctx.strokeStyle = `rgba(27, 42, 65, ${r.opacity * 0.45})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        r.radius += r.speed;
        r.opacity -= 0.015;
        
        if (r.opacity <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
        }
      }
      ctx.setLineDash([]);
      
      animationFrameId = requestAnimationFrame(drawPreloaderCanvas);
    };
    
    // Start loop
    drawPreloaderCanvas();
  }

  // 1.1 GLOBAL BLUEPRINT CANVAS BACKGROUND
  const initGlobalBlueprintCanvas = () => {
    const globalCanvas = document.createElement('canvas');
    globalCanvas.id = 'global-blueprint-canvas';
    Object.assign(globalCanvas.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '-1'
    });
    document.body.appendChild(globalCanvas);

    const gCtx = globalCanvas.getContext('2d');
    let gAnimationFrameId;
    let gMouse = { x: null, y: null };
    let gRipples = [];

    const resizeGlobalCanvas = () => {
      globalCanvas.width = window.innerWidth;
      globalCanvas.height = window.innerHeight;
    };
    resizeGlobalCanvas();
    window.addEventListener('resize', resizeGlobalCanvas);

    // Track mouse coordinates globally and check if over a dark image card
    let gIsOverDarkCard = false;
    window.addEventListener('mousemove', (e) => {
      gMouse.x = e.clientX;
      gMouse.y = e.clientY;
      
      const hoveredEl = document.elementFromPoint(e.clientX, e.clientY);
      if (hoveredEl) {
        const closestDark = hoveredEl.closest('.hero-banner-card, .blueprint-card');
        gIsOverDarkCard = !!closestDark;
      } else {
        gIsOverDarkCard = false;
      }
    });

    window.addEventListener('mouseleave', () => {
      gMouse.x = null;
      gMouse.y = null;
      gIsOverDarkCard = false;
    });

    // Expand concentric architectural circles on click anywhere on the page
    window.addEventListener('click', (e) => {
      // Ignore clicks on links/buttons to avoid visual clutter during navigation, but allow on general space
      gRipples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 180,
        opacity: 0.7,
        speed: 3,
        isWhite: gIsOverDarkCard
      });
    });

    const drawGlobalCanvas = () => {
      if (!gCtx || !globalCanvas) return;
      gCtx.clearRect(0, 0, globalCanvas.width, globalCanvas.height);

      // Draw subtle grid (gold grid matching preloader grid)
      const gridSize = 60;
      gCtx.strokeStyle = 'rgba(27, 42, 65, 0.015)';
      gCtx.lineWidth = 0.5;

      for (let x = 0; x < globalCanvas.width; x += gridSize) {
        gCtx.beginPath();
        gCtx.moveTo(x, 0);
        gCtx.lineTo(x, globalCanvas.height);
        gCtx.stroke();
      }

      for (let y = 0; y < globalCanvas.height; y += gridSize) {
        gCtx.beginPath();
        gCtx.moveTo(0, y);
        gCtx.lineTo(globalCanvas.width, y);
        gCtx.stroke();
      }

      // Draw active hover draftsman crosshairs
      if (gMouse.x !== null && gMouse.y !== null) {
        // Choose colors based on hover target contrast
        const crosshairColor = gIsOverDarkCard ? 'rgba(255, 255, 255, 0.08)' : 'rgba(27, 42, 65, 0.012)';
        const solidRingColor = gIsOverDarkCard ? 'rgba(255, 255, 255, 0.28)' : 'rgba(27, 42, 65, 0.12)';
        const dashedRingColor = gIsOverDarkCard ? 'rgba(255, 255, 255, 0.14)' : 'rgba(27, 42, 65, 0.06)';
        const textColor = gIsOverDarkCard ? 'rgba(255, 255, 255, 0.45)' : 'rgba(27, 42, 65, 0.18)';

        // Horizontal & vertical fine crosshair tracking lines
        gCtx.strokeStyle = crosshairColor;
        gCtx.lineWidth = 0.5;
        gCtx.beginPath();
        gCtx.moveTo(gMouse.x, 0);
        gCtx.lineTo(gMouse.x, globalCanvas.height);
        gCtx.moveTo(0, gMouse.y);
        gCtx.lineTo(globalCanvas.width, gMouse.y);
        gCtx.stroke();

        // Concentric target compass rings around cursor
        gCtx.strokeStyle = solidRingColor;
        gCtx.lineWidth = 0.8;
        gCtx.beginPath();
        gCtx.arc(gMouse.x, gMouse.y, 25, 0, Math.PI * 2);
        gCtx.stroke();

        gCtx.strokeStyle = dashedRingColor;
        gCtx.setLineDash([3, 4]);
        gCtx.beginPath();
        gCtx.arc(gMouse.x, gMouse.y, 50, 0, Math.PI * 2);
        gCtx.stroke();
        gCtx.setLineDash([]); // Reset

        // Numerical coordinate readout text
        gCtx.fillStyle = textColor;
        gCtx.font = '9px monospace';
        gCtx.fillText(`X:${Math.round(gMouse.x)} Y:${Math.round(gMouse.y)}`, gMouse.x + 12, gMouse.y - 12);
      }

      // Draw click blueprint ripples
      gCtx.setLineDash([3, 3]);
      for (let i = gRipples.length - 1; i >= 0; i--) {
        const r = gRipples[i];
        const rippleColor = r.isWhite ? `rgba(255, 255, 255, ${r.opacity * 0.35})` : `rgba(27, 42, 65, ${r.opacity * 0.45})`;
        gCtx.strokeStyle = rippleColor;
        gCtx.lineWidth = 1;
        gCtx.beginPath();
        gCtx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        gCtx.stroke();

        r.radius += r.speed;
        r.opacity -= 0.015;

        if (r.opacity <= 0 || r.radius >= r.maxRadius) {
          gRipples.splice(i, 1);
        }
      }
      gCtx.setLineDash([]);

      gAnimationFrameId = requestAnimationFrame(drawGlobalCanvas);
    };

    drawGlobalCanvas();
  };

  window.addEventListener('load', () => {
    if (preloader && !preloaderHasRun) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minimumLoadTime - elapsed);

      setTimeout(() => {
        // Fade out preloader
        preloader.style.opacity = '0';
        
        // Reveal app container content
        if (appContainer) {
          appContainer.classList.remove('hidden');
        }
        
        setTimeout(() => {
          preloader.style.display = 'none';
          
          // Stop preloader canvas loop and clean up resize event
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }
          window.removeEventListener('resize', handleResize);
          
          // Start Global Blueprint Canvas Loop
          initGlobalBlueprintCanvas();
          
          // Trigger reveal animations for items in the initial viewport
          triggerInitialReveals();

          // Mark preloader as run in session storage
          sessionStorage.setItem('preloaderHasRun', 'true');
        }, 800); // Wait for fade-out transition to complete
      }, remaining);
    } else {
      // Preloader is not present or has already run in this session
      if (preloader) {
        preloader.style.display = 'none';
      }
      if (appContainer) {
        appContainer.classList.remove('hidden');
        appContainer.style.opacity = '1';
        appContainer.style.transition = 'none';
      }
      
      // Start Global Blueprint Canvas Loop
      initGlobalBlueprintCanvas();
      
      // Trigger reveal animations for items in the initial viewport
      triggerInitialReveals();
    }
  });


  // 2. STICKY NAVBAR & DYNAMIC ACTIVE NAV STATE
  const header = document.querySelector('.header');
  const navLinks = document.querySelectorAll('.nav-link');
  const currentPath = window.location.pathname;

  // Toggle header styling on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Activate navigation indicators based on file path location
  navLinks.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    
    // Check if current path matches navigation target
    if (currentPath.endsWith(href) || 
       (href === 'index.html' && (currentPath.endsWith('/') || currentPath.endsWith('index.html') || currentPath === ''))) {
      link.classList.add('active');
    }
  });


  // 3. MOBILE MENU OVERLAY NAVIGATION
  const menuToggle = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (menuToggle && mobileNav) {
    const toggleMobileNav = () => {
      menuToggle.classList.toggle('open');
      mobileNav.classList.toggle('open');
      
      // Prevent body scrolling when mobile nav is open
      if (mobileNav.classList.contains('open')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    menuToggle.addEventListener('click', toggleMobileNav);

    // Close nav when mobile link is clicked
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }


  // 4. SCROLL ENTRANCE REVEAL (INTERSECTION OBSERVER)
  const revealItems = document.querySelectorAll('.reveal-item');

  if (revealItems.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target); // Reveal only once
        }
      });
    }, {
      threshold: 0.1, // Trigger when 10% of the element enters viewport
      rootMargin: '0px 0px -30px 0px'
    });

    revealItems.forEach(item => {
      revealObserver.observe(item);
    });
  }

  // Force reveal items in initial hero viewport on page load
  const triggerInitialReveals = () => {
    const initialReveals = document.querySelectorAll('.hero .reveal-item, .services-section .reveal-item, .portfolio-section .reveal-item, .contact-section .reveal-item');
    initialReveals.forEach(item => {
      item.classList.add('revealed');
    });
  };


  // 5. PROJECTS PORTFOLIO FILTER GRID
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  if (filterButtons.length > 0 && projectCards.length > 0) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active filter button
        filterButtons.forEach(button => button.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');

        projectCards.forEach(card => {
          const category = card.getAttribute('data-category');

          if (filterValue === 'all' || category === filterValue) {
            card.classList.remove('fade-out');
            // Re-trigger visual fade-in
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'scale(1)';
            }, 50);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
              card.classList.add('fade-out');
            }, 300);
          }
        });
      });
    });
  }


  // 6. CONTACT FORM SUBMISSION HANDLING
  const contactForm = document.getElementById('contact-form');
  const formFeedback = document.getElementById('form-feedback');

  if (contactForm && formFeedback) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Get values from the updated contact form
      const firstName = document.getElementById('first-name').value.trim();
      const lastName = document.getElementById('last-name').value.trim();
      const email = document.getElementById('email-address').value.trim();
      const countryCode = document.getElementById('country-code') ? document.getElementById('country-code').value : '';
      const phoneNumber = document.getElementById('phone-number') ? document.getElementById('phone-number').value.trim() : '';
      const serviceRequired = document.getElementById('service-required').value;
      const projectDetails = document.getElementById('project-details').value.trim();

      // Provide visual feedback
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending Inquiry...';
      formFeedback.className = 'form-feedback';
      formFeedback.textContent = '';

      // Simulate network request
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;

        formFeedback.classList.add('success');
        formFeedback.innerHTML = `<strong>Thank you, ${firstName} ${lastName}!</strong> Your ${serviceRequired ? serviceRequired.replace(/-/g, ' ') : 'project'} inquiry has been successfully received. We will contact you at <strong>${email}</strong> within 24 hours.`;

        // Clear Form fields
        contactForm.reset();
      }, 1500);
    });
  }

  // 6. STATISTICS COUNT UP ANIMATION (SCROLL-TRIGGERED)
  const statNumbers = document.querySelectorAll('.stat-number');
  if (statNumbers.length > 0) {
    const countUp = (element) => {
      const target = +element.getAttribute('data-target');
      const suffix = element.getAttribute('data-suffix') || '';
      const duration = 1500; // total duration of animation in ms
      const stepTime = 30; // interval step in ms
      const totalSteps = duration / stepTime;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        const currentVal = Math.floor((target / totalSteps) * currentStep);
        element.textContent = currentVal + suffix;

        if (currentStep >= totalSteps) {
          element.textContent = target + suffix;
          clearInterval(timer);
        }
      }, stepTime);
    };

    const statsObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const numbers = entry.target.querySelectorAll('.stat-number');
          numbers.forEach(num => countUp(num));
          observer.unobserve(entry.target); // trigger only once
        }
      });
    }, {
      threshold: 0.15
    });

    const statsGrid = document.querySelector('.stats-grid-container');
    if (statsGrid) {
      statsObserver.observe(statsGrid);
    }
  }

  // 7. SERVICES PAGE POP-UP MODAL
  const serviceRows = document.querySelectorAll('.service-row');
  
  if (serviceRows.length > 0) {
    // Dynamically build and inject the premium modal if not already present
    let modal = document.getElementById('service-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'service-modal';
      modal.className = 'service-modal-overlay';
      modal.innerHTML = `
        <div class="service-modal-card">
          <button class="service-modal-close" id="service-modal-close" aria-label="Close modal">&times;</button>
          <div class="service-modal-body">
            <div class="service-modal-icon">✉️</div>
            <h3 class="service-modal-title" id="service-modal-title">Interested in HVAC Design?</h3>
            <p class="service-modal-text">Let us know about your project! Our expert engineering teams in both UAE and India are ready to help you out.</p>
            <div class="service-modal-actions">
              <a href="contact.html" id="service-modal-link" class="btn-cta-rect modal-btn-contact">Contact Us</a>
              <button class="btn-secondary-modal" id="service-modal-btn-close">Close</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const modalTitle = document.getElementById('service-modal-title');
    const modalLink = document.getElementById('service-modal-link');
    const closeBtn = document.getElementById('service-modal-close');
    const cancelBtn = document.getElementById('service-modal-btn-close');

    const openModal = (serviceName, serviceId) => {
      modalTitle.textContent = `Interested in ${serviceName}?`;
      modalLink.href = `contact.html?service=${serviceId}`;
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    };

    serviceRows.forEach(row => {
      row.addEventListener('click', () => {
        const titleEl = row.querySelector('.service-row-content h3');
        const serviceName = titleEl ? titleEl.textContent : 'this service';
        const serviceId = row.id || '';
        openModal(serviceName, serviceId);
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // 8. AUTO-SELECT SERVICE OPTION ON CONTACT PAGE
  const serviceSelect = document.getElementById('service-required');
  if (serviceSelect) {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');
    if (serviceParam) {
      if (serviceParam === 'water-supply' || serviceParam === 'drainage') {
        serviceSelect.value = 'water';
      } else if (serviceParam === 'fire-fighting') {
        serviceSelect.value = 'firefighting';
      } else {
        serviceSelect.value = serviceParam;
      }
    }
  }

  // 9. NATIVE SMOOTH SCROLL for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

  // 10. PREMIUM CUSTOM CURSOR (physics trailing via requestAnimationFrame)
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');

  if (cursorDot && cursorRing && window.innerWidth > 992) {
    let mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      cursorDot.style.left = mx + 'px';
      cursorDot.style.top = my + 'px';
    });

    (function cursorLoop() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      cursorRing.style.left = rx + 'px';
      cursorRing.style.top = ry + 'px';
      requestAnimationFrame(cursorLoop);
    })();

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('a, button, .btn, .project-slide, .service-row, .filter-btn, .logo, .menu-toggle, .stat-card')) {
        document.body.classList.add('cursor-hovering');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('a, button, .btn, .project-slide, .service-row, .filter-btn, .logo, .menu-toggle, .stat-card')) {
        document.body.classList.remove('cursor-hovering');
      }
    });
  }

  // 11. GSAP SCROLL-TRIGGERED ANIMATIONS
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Stagger reveal for section headings
    gsap.utils.toArray('.about-tagline, .selected-work-header .section-tag').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        opacity: 0, y: 20, duration: 0.6, ease: 'power2.out'
      });
    });

    gsap.utils.toArray('.about-title, .selected-work-header h2').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        opacity: 0, y: 35, duration: 0.8, ease: 'power3.out', delay: 0.1
      });
    });

    // Stagger stat cards
    const statCards = gsap.utils.toArray('.stat-card');
    if (statCards.length) {
      gsap.from(statCards, {
        scrollTrigger: { trigger: statCards[0], start: 'top 85%', once: true },
        opacity: 0, y: 40, scale: 0.95,
        duration: 0.6, stagger: 0.12, ease: 'power2.out'
      });
    }

    // NOTE: Project accordion slides are handled by the reveal-item IntersectionObserver above
    // to avoid opacity conflicts — we only add a subtle scale entrance via CSS

    // About image parallax
    const aboutImg = document.querySelector('.about-main-img');
    if (aboutImg) {
      gsap.to(aboutImg, {
        scrollTrigger: { trigger: aboutImg, scrub: 1.5 },
        y: -40, ease: 'none'
      });
    }

    // Hero title character split animation
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
      const words = heroTitle.innerHTML.split(/(<br\s*\/?>)/gi);
      heroTitle.innerHTML = words.map(w =>
        w.match(/<br/i) ? w : `<span class="gsap-word" style="display:inline-block; overflow:hidden"><span class="gsap-word-inner" style="display:inline-block">${w}</span></span>`
      ).join('');
      gsap.from('.gsap-word-inner', {
        y: '100%', opacity: 0, duration: 0.9,
        stagger: 0.15, ease: 'power4.out', delay: 0.2
      });
    }

    // Hero desc fade + blur
    const heroDesc = document.querySelector('.hero-desc');
    const heroBtn = document.querySelector('.split-btn-group');
    if (heroDesc) {
      gsap.from([heroDesc, heroBtn].filter(Boolean), {
        opacity: 0, y: 25, filter: 'blur(6px)',
        duration: 0.8, stagger: 0.12, ease: 'power2.out', delay: 0.7
      });
    }

    // Footer links fade-up stagger
    gsap.utils.toArray('.footer-links-col').forEach((col, i) => {
      gsap.from(col, {
        scrollTrigger: { trigger: col, start: 'top 92%', once: true },
        opacity: 0, y: 30, duration: 0.5, ease: 'power2.out', delay: i * 0.08
      });
    });

    // Service rows
    gsap.utils.toArray('.service-row').forEach((row, i) => {
      gsap.from(row, {
        scrollTrigger: { trigger: row, start: 'top 90%', once: true },
        opacity: 0, x: -30, duration: 0.5, ease: 'power2.out', delay: i * 0.05
      });
    });
  }

  // 12. LIGHTWEIGHT 3D TILT (only for card-like elements, disabled on mobile)
  if (window.innerWidth > 992) {
    document.querySelectorAll('.stat-card, .about-image-wrapper').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        el.style.transform = `perspective(800px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) scale(1.02)`;
        el.style.transition = 'transform 0.1s ease';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        el.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      });
    });
  }

  // 13. MAGNETIC EFFECT (subtle, smooth)
  if (window.innerWidth > 992) {
    document.querySelectorAll('.split-btn-arrow, .logo-img').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.25}px, ${dy * 0.25}px)`;
        el.style.transition = 'transform 0.1s ease';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0,0)';
        el.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      });
    });
  }
});

