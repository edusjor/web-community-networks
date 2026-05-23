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

const servicesTabButtons = document.querySelectorAll("#servicesTabs .nav-link");
const servicesTabState = document.getElementById("servicesTabState");

function formatServicesTabState(tabButton) {
  const category = tabButton.getAttribute("data-category") || tabButton.textContent.trim();
  const count = tabButton.getAttribute("data-service-count");
  return count ? `${category} · ${count}` : category;
}

if (servicesTabButtons.length && servicesTabState) {
  const activeTab = document.querySelector("#servicesTabs .nav-link.active");
  if (activeTab) {
    servicesTabState.textContent = formatServicesTabState(activeTab);
  }

  servicesTabButtons.forEach((tabButton) => {
    tabButton.addEventListener("shown.bs.tab", () => {
      servicesTabState.textContent = formatServicesTabState(tabButton);
    });
  });
}

const contactForm = document.getElementById("contactForm");
const contactFormStatus = document.getElementById("contactFormStatus");

if (contactForm && contactFormStatus) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const requestBody = new FormData(contactForm);

    if (submitButton) {
      submitButton.disabled = true;
    }

    contactFormStatus.classList.remove("is-success", "is-error");
    contactFormStatus.textContent = "Enviando consulta...";

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: requestBody,
        headers: {
          Accept: "application/json"
        }
      });

      const responseText = await response.text();
      let payload = {};

      if (responseText) {
        try {
          payload = JSON.parse(responseText);
        } catch {
          payload = {};
        }
      }

      if (!response.ok || payload.ok !== true) {
        throw new Error(payload.message || "No se pudo enviar su consulta.");
      }

      contactForm.reset();
      contactFormStatus.classList.add("is-success");
      contactFormStatus.textContent = payload.message || "Consulta enviada correctamente.";
    } catch (error) {
      contactFormStatus.classList.add("is-error");
      contactFormStatus.textContent = error instanceof Error ? error.message : "Error al enviar el formulario.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

function setActiveLink() {
  const sections = [
    "inicio",
    "problemas",
    "servicios",
    "proceso",
    "direccion-estrategica-ti",
    "alianza-huawei",
    "soluciones-integradas",
    "afiliaciones",
    "certificaciones",
    "contacto",
    "siguenos",
    "huawei-beneficios",
    "huawei-servicios",
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

  gsap.utils.toArray([".section-head", ".problem-band", ".services-tab-content", ".process-line", ".section-cta", ".case-swiper", ".cert-grid", ".method-panel", ".about-band", ".contact-panel"]).forEach((el, idx) => {
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

  const counters = document.querySelectorAll(".hero-metrics [data-count]");
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
