/* =========================================================
   ATHARV PREMIUM PORTFOLIO
   JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =====================================================
     LOADER
     ===================================================== */

  const loader = document.getElementById("loader");
  const loaderProgress = document.getElementById("loader-progress");
  const loaderPercent = document.getElementById("loader-percent");

  let loading = 0;

  const loaderInterval = setInterval(() => {

    loading += Math.floor(Math.random() * 7) + 3;

    if (loading >= 100) {
      loading = 100;
      clearInterval(loaderInterval);

      setTimeout(() => {
        loader.classList.add("hide");
      }, 350);
    }

    loaderProgress.style.width = `${loading}%`;
    loaderPercent.textContent = `${loading}%`;

  }, 60);


  /* =====================================================
     TYPING ANIMATION
     ===================================================== */

  const typingElement = document.getElementById("typing-text");

  const roles = [
    "Frontend Developer",
    "Computer Engineer",
    "Problem Solver",
    "UI Explorer",
    "Tech Enthusiast",
    "AI Explorer"
  ];

  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function typeRole() {

    const currentRole = roles[roleIndex];

    if (!deleting) {
      typingElement.textContent =
        currentRole.substring(0, charIndex + 1);

      charIndex++;

      if (charIndex === currentRole.length) {
        deleting = true;

        setTimeout(typeRole, 1700);
        return;
      }

    } else {

      typingElement.textContent =
        currentRole.substring(0, charIndex - 1);

      charIndex--;

      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
      }

    }

    setTimeout(
      typeRole,
      deleting ? 45 : 90
    );
  }

  typeRole();


  /* =====================================================
     PARTICLES
     ===================================================== */

  const particlesContainer =
    document.getElementById("particles");

  const particleCount =
    window.innerWidth < 700 ? 20 : 55;

  for (let i = 0; i < particleCount; i++) {

    const particle =
      document.createElement("div");

    particle.className = "particle";

    particle.style.left =
      `${Math.random() * 100}%`;

    particle.style.top =
      `${Math.random() * 100}%`;

    particle.style.animationDuration =
      `${8 + Math.random() * 15}s`;

    particle.style.animationDelay =
      `${Math.random() * 10}s`;

    particle.style.opacity =
      `${0.15 + Math.random() * 0.5}`;

    particlesContainer.appendChild(particle);
  }


  /* =====================================================
     CUSTOM CURSOR
     ===================================================== */

  const cursorDot =
    document.querySelector(".cursor-dot");

  const cursorRing =
    document.querySelector(".cursor-ring");

  const mouseGlow =
    document.querySelector(".mouse-glow");

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener("mousemove", (e) => {

    mouseX = e.clientX;
    mouseY = e.clientY;

    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;

    mouseGlow.style.left = `${mouseX}px`;
    mouseGlow.style.top = `${mouseY}px`;

  });

  function animateCursor() {

    ringX += (mouseX - ringX) * 0.13;
    ringY += (mouseY - ringY) * 0.13;

    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top = `${ringY}px`;

    requestAnimationFrame(animateCursor);
  }

  animateCursor();


  /* =====================================================
     CURSOR HOVER
     ===================================================== */

  document.querySelectorAll("a, button, .project-card, .skill-card")
    .forEach(element => {

      element.addEventListener("mouseenter", () => {
        cursorRing.classList.add("active");
      });

      element.addEventListener("mouseleave", () => {
        cursorRing.classList.remove("active");
      });

    });


  /* =====================================================
     MAGNETIC BUTTONS
     ===================================================== */

  document.querySelectorAll(".magnetic")
    .forEach(button => {

      button.addEventListener("mousemove", (e) => {

        const rect =
          button.getBoundingClientRect();

        const x =
          e.clientX - rect.left - rect.width / 2;

        const y =
          e.clientY - rect.top - rect.height / 2;

        button.style.transform =
          `translate(${x * 0.15}px, ${y * 0.15}px)`;

      });

      button.addEventListener("mouseleave", () => {
        button.style.transform = "";
      });

    });


  /* =====================================================
     3D TILT
     ===================================================== */

  document.querySelectorAll(".tilt-card")
    .forEach(card => {

      card.addEventListener("mousemove", (e) => {

        if (window.innerWidth < 900) return;

        const rect =
          card.getBoundingClientRect();

        const x =
          e.clientX - rect.left;

        const y =
          e.clientY - rect.top;

        const rotateY =
          ((x / rect.width) - 0.5) * 10;

        const rotateX =
          ((y / rect.height) - 0.5) * -10;

        card.style.transform =
          `perspective(1000px)
           rotateX(${rotateX}deg)
           rotateY(${rotateY}deg)
           translateY(-5px)`;

      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });

    });


  /* =====================================================
     SCROLL REVEAL
     ===================================================== */

  const revealElements =
    document.querySelectorAll(".reveal");

  const revealObserver =
    new IntersectionObserver(
      (entries, observer) => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {

            entry.target.classList.add("visible");

            observer.unobserve(entry.target);

          }

        });

      },
      {
        threshold: 0.12
      }
    );

  revealElements.forEach(element => {
    revealObserver.observe(element);
  });


  /* =====================================================
     STAT COUNTERS
     ===================================================== */

  const counters =
    document.querySelectorAll("[data-count]");

  const counterObserver =
    new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (!entry.isIntersecting) return;

          const counter =
            entry.target;

          const target =
            Number(counter.dataset.count);

          let current = 0;

          const duration = 1300;

          const start =
            performance.now();

          function updateCounter(now) {

            const progress =
              Math.min(
                (now - start) / duration,
                1
              );

            const eased =
              1 - Math.pow(1 - progress, 3);

            current =
              Math.floor(target * eased);

            counter.textContent =
              `${current}+`;

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            }

          }

          requestAnimationFrame(updateCounter);

          counterObserver.unobserve(counter);

        });

      },
      {
        threshold: 0.8
      }
    );

  counters.forEach(counter => {
    counterObserver.observe(counter);
  });


  /* =====================================================
     NAVBAR
     ===================================================== */

  const navbar =
    document.getElementById("navbar");

  const sections =
    document.querySelectorAll("section[id]");

  const navLinks =
    document.querySelectorAll(".nav-link");

  function updateNavbar() {

    if (window.scrollY > 80) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }

    let currentSection = "";

    sections.forEach(section => {

      const sectionTop =
        section.offsetTop - 200;

      if (window.scrollY >= sectionTop) {
        currentSection = section.id;
      }

    });

    navLinks.forEach(link => {

      link.classList.remove("active");

      if (
        link.getAttribute("href") ===
        `#${currentSection}`
      ) {
        link.classList.add("active");
      }

    });

  }

  window.addEventListener(
    "scroll",
    updateNavbar,
    { passive: true }
  );

  updateNavbar();


  /* =====================================================
     SCROLL PROGRESS
     ===================================================== */

  const progressBar =
    document.getElementById("progress-bar");

  function updateProgress() {

    const scrollTop =
      window.scrollY;

    const documentHeight =
      document.documentElement.scrollHeight -
      window.innerHeight;

    const percentage =
      documentHeight > 0
        ? (scrollTop / documentHeight) * 100
        : 0;

    progressBar.style.width =
      `${percentage}%`;

  }

  window.addEventListener(
    "scroll",
    updateProgress,
    { passive: true }
  );


  /* =====================================================
     MOBILE MENU
     ===================================================== */

  const menuToggle =
    document.getElementById("menu-toggle");

  const mobileMenu =
    document.getElementById("mobile-menu");

  menuToggle.addEventListener("click", () => {

    mobileMenu.classList.toggle("open");

  });

  mobileMenu.querySelectorAll("a")
    .forEach(link => {

      link.addEventListener("click", () => {
        mobileMenu.classList.remove("open");
      });

    });


  /* =====================================================
     DARK / LIGHT MODE
     ===================================================== */

  const themeToggle =
    document.getElementById("theme-toggle");

  const savedTheme =
    localStorage.getItem("atharv-theme");

  if (savedTheme === "light") {
    document.body.classList.add("light");
    themeToggle.textContent = "☾";
  }

  themeToggle.addEventListener("click", () => {

    document.body.classList.toggle("light");

    const isLight =
      document.body.classList.contains("light");

    themeToggle.textContent =
      isLight ? "☾" : "☼";

    localStorage.setItem(
      "atharv-theme",
      isLight ? "light" : "dark"
    );

  });


  /* =====================================================
     PROJECT MODAL
     ===================================================== */

  const modal =
    document.getElementById("project-modal");

  const modalTitle =
    document.getElementById("modal-title");

  const modalDescription =
    document.getElementById("modal-description");

  const modalTags =
    document.getElementById("modal-tags");

  const modalIcon =
    document.getElementById("modal-icon");

  const closeModal =
    document.querySelector(".modal-close");

  const modalBackdrop =
    document.querySelector(".modal-backdrop");

  const projectIcons = {
    "Weather Dashboard": "☁",
    "LUXE E-Commerce": "◈",
    "AI Image Generator": "✦",
    "Smart Todo": "✓",
    "Bus Management System": "▣",
    "Music Player": "♫"
  };

  document.querySelectorAll(".project-card")
    .forEach(card => {

      const button =
        card.querySelector(".view-project");

      button.addEventListener("click", () => {

        const title =
          card.dataset.title;

        const description =
          card.dataset.description;

        const technologies =
          card.dataset.tech.split(",");

        modalTitle.textContent =
          title;

        modalDescription.textContent =
          description;

        modalIcon.textContent =
          projectIcons[title] || "✦";

        modalTags.innerHTML = "";

        technologies.forEach(tech => {

          const tag =
            document.createElement("span");

          tag.textContent = tech;

          modalTags.appendChild(tag);

        });

        modal.classList.add("open");

        document.body.style.overflow =
          "hidden";

      });

    });

  function closeProjectModal() {

    modal.classList.remove("open");

    document.body.style.overflow = "";

  }

  closeModal.addEventListener(
    "click",
    closeProjectModal
  );

  modalBackdrop.addEventListener(
    "click",
    closeProjectModal
  );


  /* =====================================================
     ESCAPE KEY
     ===================================================== */

  document.addEventListener("keydown", e => {

    if (e.key === "Escape") {
      closeProjectModal();
      mobileMenu.classList.remove("open");
    }

  });


  /* =====================================================
     BACK TO TOP
     ===================================================== */

  const backTop =
    document.getElementById("back-top");

  window.addEventListener(
    "scroll",
    () => {

      if (window.scrollY > 600) {
        backTop.classList.add("show");
      } else {
        backTop.classList.remove("show");
      }

    },
    { passive: true }
  );

  backTop.addEventListener("click", () => {

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });


  /* =====================================================
     PARALLAX BACKGROUND
     ===================================================== */

  let ticking = false;

  window.addEventListener(
    "scroll",
    () => {

      if (!ticking) {

        requestAnimationFrame(() => {

          const y =
            window.scrollY;

          document.querySelectorAll(".aurora")
            .forEach((orb, index) => {

              const speed =
                (index + 1) * 0.015;

              orb.style.transform =
                `translateY(${y * speed}px)`;

            });

          ticking = false;

        });

        ticking = true;

      }

    },
    { passive: true }
  );


  /* =====================================================
     SMOOTH INTERNAL LINKS
     ===================================================== */

  document.querySelectorAll('a[href^="#"]')
    .forEach(link => {

      link.addEventListener("click", e => {

        const targetId =
          link.getAttribute("href");

        if (targetId === "#") return;

        const target =
          document.querySelector(targetId);

        if (!target) return;

        e.preventDefault();

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      });

    });


  /* =====================================================
     LAZY IMAGE SUPPORT
     ===================================================== */

  document.querySelectorAll("img")
    .forEach(img => {
      img.loading = "lazy";
    });


  /* =====================================================
     REDUCED MOTION
     ===================================================== */

  const reduceMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

  if (reduceMotion.matches) {

    document
      .querySelectorAll(".particle")
      .forEach(p => {
        p.style.animation = "none";
      });

  }

});
