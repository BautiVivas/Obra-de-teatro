/* =========================================================
   LA DISTANCIA ENTRE NOSOTROS — interacciones
   ========================================================= */
(() => {
    const body = document.body;
    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Preloader ---------- */
    const t0 = performance.now();
    const reveal = () => { body.classList.remove('loading'); body.classList.add('loaded'); };
    const finish = () => setTimeout(reveal, Math.max(0, 2300 - (performance.now() - t0)));
    if (document.readyState === 'complete') finish(); else addEventListener('load', finish);
    setTimeout(reveal, 5000); // por si alguna imagen tarda demasiado

    /* ---------- Título: letras separables + reflejo ---------- */
    const spread = document.querySelector('.hero-title .t-distancia');
    const word = spread.textContent.trim();
    spread.innerHTML = [...word]
        .map((ch, i) => `<span class="l"><span class="li" style="--i:${i}">${ch}</span></span>`)
        .join('');

    const reflection = document.querySelector('.hero-reflection');
    const mirror = document.createElement('div');
    mirror.className = 'hero-title';
    mirror.innerHTML = document.querySelector('.hero-title').innerHTML;
    reflection.appendChild(mirror);

    const letters = document.querySelectorAll('.t-distancia .l');
    const n = word.length;
    const mid = (n - 1) / 2;

    /* ---------- Revelado palabra por palabra ---------- */
    function splitWords(el) {
        const walk = node => {
            [...node.childNodes].forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    const frag = document.createDocumentFragment();
                    child.textContent.split(/(\s+)/).forEach(part => {
                        if (!part) return;
                        if (/^\s+$/.test(part)) {
                            frag.appendChild(document.createTextNode(part));
                        } else {
                            const s = document.createElement('span');
                            s.className = 'w';
                            s.textContent = part;
                            frag.appendChild(s);
                        }
                    });
                    child.replaceWith(frag);
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    walk(child);
                }
            });
        };
        walk(el);
        return [...el.querySelectorAll('.w')];
    }
    const wordEl = document.getElementById('wordReveal');
    const words = splitWords(wordEl);

    /* ---------- Scroll ---------- */
    const nav = document.getElementById('nav');
    const heroBg = document.querySelector('.hero-bg');
    const heroContent = document.querySelector('.hero-content');
    const eras = document.getElementById('eras');
    const past = eras.querySelector('.era-past');
    const present = eras.querySelector('.era-present');
    const divLines = eras.querySelectorAll('.era-divider span');
    let heroVisible = true;

    function update() {
        const vh = innerHeight;
        const y = scrollY;

        nav.classList.toggle('scrolled', y > 60);

        // Hero: parallax + las letras se separan ("la distancia")
        heroVisible = y < vh * 1.1;
        if (heroVisible) {
            const p = clamp(y / vh, 0, 1);
            heroBg.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
            heroContent.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
            heroContent.style.opacity = 1 - p * 1.25;
            const spreadPx = innerWidth * 0.07;
            letters.forEach((l, i) => {
                const k = (i % n) - mid;
                l.style.transform = `translate3d(${k * p * spreadPx}px, 0, 0)`;
            });
        }

        // Texto de la obra
        const r = wordEl.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) {
            const wp = clamp((vh * 0.85 - r.top) / (r.height * 0.85 + vh * 0.25), 0, 1);
            const total = words.length;
            words.forEach((w, i) => {
                const o = clamp(wp * (total + 4) - i, 0, 1);
                w.style.opacity = (0.12 + o * 0.88).toFixed(3);
            });
        }

        // Dos tiempos: las imágenes se alejan entre sí
        const er = eras.getBoundingClientRect();
        if (innerWidth > 760 && er.top < vh && er.bottom > 0) {
            const ep = clamp((vh - er.top) / (vh + er.height), 0, 1);
            const off = (ep - 0.3) * 110;
            past.style.transform = `translate3d(${-off}px, ${(0.5 - ep) * 50}px, 0)`;
            present.style.transform = `translate3d(${off}px, ${(ep - 0.5) * 50}px, 0)`;
            divLines.forEach(s => (s.style.transform = `scaleY(${clamp(ep * 1.8 - 0.2, 0, 1)})`));
        } else if (innerWidth <= 760) {
            past.style.transform = present.style.transform = '';
            divLines.forEach(s => (s.style.transform = ''));
        }
    }

    let ticking = false;
    const onScroll = () => {
        if (!ticking) {
            requestAnimationFrame(() => { update(); ticking = false; });
            ticking = true;
        }
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();

    /* ---------- Apariciones ---------- */
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    /* ---------- Afiche con inclinación 3D ---------- */
    const frame = document.getElementById('tilt');
    const card = frame.querySelector('.afiche-card');
    if (matchMedia('(hover: hover)').matches && !reduced) {
        frame.addEventListener('mousemove', e => {
            const b = card.getBoundingClientRect();
            const x = (e.clientX - b.left) / b.width;
            const yy = (e.clientY - b.top) / b.height;
            frame.classList.add('moving');
            card.style.transform = `rotateY(${(x - 0.5) * 16}deg) rotateX(${(0.5 - yy) * 16}deg)`;
            card.style.setProperty('--gx', `${x * 100}%`);
            card.style.setProperty('--gy', `${yy * 100}%`);
        });
        frame.addEventListener('mouseleave', () => {
            frame.classList.remove('moving');
            card.style.transform = '';
        });
    }

    /* ---------- Cursor ---------- */
    const cursor = document.getElementById('cursor');
    if (matchMedia('(hover: hover)').matches) {
        let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
        addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
        (function loop() {
            cx += (mx - cx) * 0.18;
            cy += (my - cy) * 0.18;
            cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
            requestAnimationFrame(loop);
        })();
        document.querySelectorAll('a, button, .era, .afiche-card').forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        });
    }

    /* ---------- Polvo flotando en la luz ---------- */
    const cv = document.getElementById('dust');
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, parts = [];
    function resize() {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        W = cv.offsetWidth; H = cv.offsetHeight;
        cv.width = W * dpr; cv.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.round((W * H) / 13000);
        parts = Array.from({ length: count }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.4 + 0.3,
            vx: (Math.random() - 0.5) * 0.15,
            vy: -Math.random() * 0.25 - 0.05,
            a: Math.random() * 0.5 + 0.15,
            t: Math.random() * Math.PI * 2,
        }));
    }
    function draw() {
        if (heroVisible) {
            ctx.clearRect(0, 0, W, H);
            for (const p of parts) {
                p.t += 0.01;
                p.x += p.vx + Math.sin(p.t) * 0.12;
                p.y += p.vy;
                if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
                if (p.x < -5) p.x = W + 5;
                if (p.x > W + 5) p.x = -5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(236, 222, 195, ${p.a * (0.6 + 0.4 * Math.sin(p.t * 3))})`;
                ctx.fill();
            }
        }
        requestAnimationFrame(draw);
    }
    if (!reduced) {
        resize();
        addEventListener('resize', resize);
        draw();
    }

    /* ---------- Cuenta regresiva ---------- */
    const target = new Date('2026-10-21T20:00:00-03:00').getTime();
    const cdEls = {};
    document.querySelectorAll('[data-cd]').forEach(el => (cdEls[el.dataset.cd] = el));
    const pad = v => String(v).padStart(2, '0');
    function tick() {
        let diff = Math.max(0, target - Date.now());
        const d = Math.floor(diff / 864e5); diff -= d * 864e5;
        const h = Math.floor(diff / 36e5); diff -= h * 36e5;
        const m = Math.floor(diff / 6e4); diff -= m * 6e4;
        const s = Math.floor(diff / 1e3);
        cdEls.d.textContent = pad(d);
        cdEls.h.textContent = pad(h);
        cdEls.m.textContent = pad(m);
        cdEls.s.textContent = pad(s);
    }
    tick();
    setInterval(tick, 1000);

    /* ---------- Agregar al calendario (.ics) ---------- */
    document.getElementById('addCal').addEventListener('click', () => {
        const ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//La Distancia Entre Nosotros//ES',
            'BEGIN:VEVENT',
            'UID:la-distancia-entre-nosotros-20261021',
            'DTSTAMP:20261009T000000Z',
            'DTSTART:20261021T230000Z',
            'DTEND:20261022T010000Z',
            'SUMMARY:La Distancia Entre Nosotros',
            'LOCATION:Centro Cultural Provincial',
            'DESCRIPTION:Adaptación teatral de la novela "El mar que nos trajo" de Griselda Gambaro.',
            'END:VEVENT',
            'END:VCALENDAR',
        ].join('\r\n');
        const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'la-distancia-entre-nosotros.ics';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
})();
