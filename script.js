const year = document.getElementById("year");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

const navMain = document.getElementById("navMain");
const navLinks = document.querySelectorAll(".nav-link");

if (navMain && window.bootstrap) {
  const navCollapse = new window.bootstrap.Collapse(navMain, { toggle: false });
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 992) {
        navCollapse.hide();
      }
    });
  });
}

function setActiveLink() {
  const sections = [
    "inicio",
    "servicios",
    "afiliaciones",
    "certificaciones",
    "alianza-huawei",
    "contacto",
    "siguenos",
    "servicios-huawei",
    "propuesta",
    "contacto-huawei"
  ];
  const scrollY = window.scrollY + 120;

  sections.forEach((id) => {
    const section = document.getElementById(id);
    const link = document.querySelector(`.nav-link[href="#${id}"], .nav-link[href$="#${id}"]`);
    if (!section || !link) return;

    const top = section.offsetTop;
    const height = section.offsetHeight;
    const active = scrollY >= top && scrollY < top + height;
    link.classList.toggle("active", active);
  });
}

window.addEventListener("scroll", setActiveLink);
setActiveLink();

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);

  gsap.to(".hero-copy", {
    opacity: 1,
    y: 0,
    duration: 0.85,
    ease: "power3.out"
  });

  gsap.to(".hero-panel", {
    opacity: 1,
    y: 0,
    duration: 1,
    delay: 0.15,
    ease: "power3.out"
  });

  gsap.utils.toArray([".section-head", ".service-card", ".case-swiper", ".cert-grid", ".method-panel", ".about-band", ".contact-panel"]).forEach((el, idx) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.75,
      delay: idx % 4 === 0 ? 0.05 : 0,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%"
      }
    });
  });

  const counters = document.querySelectorAll("[data-count]");
  counters.forEach((counter) => {
    const target = Number(counter.getAttribute("data-count") || 0);
    const data = { value: 0 };

    gsap.to(data, {
      value: target,
      duration: 1.5,
      ease: "power1.out",
      scrollTrigger: {
        trigger: counter,
        start: "top 90%",
        once: true
      },
      onUpdate: () => {
        const rounded = Math.round(data.value);
        if (target === 99) {
          counter.textContent = `${rounded}.9`;
          return;
        }
        counter.textContent = `${rounded}+`;
      }
    });
  });
}

const caseSwiperEl = document.querySelector(".case-swiper");

if (window.Swiper && caseSwiperEl) {
  new Swiper(caseSwiperEl, {
    slidesPerView: 1,
    spaceBetween: 14,
    loop: false,
    speed: 700,
    autoplay: {
      delay: 2800,
      disableOnInteraction: false
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev"
    },
    breakpoints: {
      768: {
        slidesPerView: 2
      },
      1200: {
        slidesPerView: 2
      }
    }
  });
}
