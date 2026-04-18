/* =========================================================================
   NOVA — site JS
   - 3D project carousel
   - Pointer-tracked card glow
   - Minor UX polish
   ========================================================================= */

(() => {
  // ---------- 3D CAROUSEL ----------
  const projects = [
    {
      cat: 'SaaS · full build',
      title: 'Outfield — field-ops platform',
      desc: 'Designed and shipped v1 in 7 weeks. 4× MRR in Q1 post-launch.',
      url: 'outfield.app',
      viz: `
        <div class="pslide__chrome"><i></i><i></i><i></i><span>outfield.app/dashboard</span></div>
        <div class="viz viz--01">
          <div class="orb"></div>
          <div class="chart">
            <div>ACTIVE DEPLOYMENTS · Q1 2026</div>
            <svg viewBox="0 0 300 140" preserveAspectRatio="none">
              <polyline points="0,110 30,80 60,88 90,50 120,60 150,30 180,45 210,18 240,28 270,8 300,20"/>
              <circle cx="270" cy="8" r="4" fill="#36E2FF"/>
            </svg>
            <div style="display:flex;justify-content:space-between;color:#5A5C6E;font-size:10px;">
              <span>jan</span><span>feb</span><span>mar</span><span>apr</span><span>may</span><span>jun</span>
            </div>
          </div>
        </div>
      `,
    },
    {
      cat: 'Website Design & Dev',
      title: 'Hexbrew — D2C coffee brand',
      desc: '4.8s → 0.7s load. Conversion doubled on the first month live.',
      url: 'hexbrew.co',
      viz: `
        <div class="pslide__chrome"><i></i><i></i><i></i><span>hexbrew.co</span></div>
        <div class="viz viz--02">
          <div class="cards">
            <div>SINGLE ORIGIN<br/>€18</div>
            <div>HOUSE BLEND<br/>€14</div>
            <div>DECAF<br/>€16</div>
          </div>
        </div>
      `,
    },
    {
      cat: 'SEO · content systems',
      title: 'Northline — B2B tooling',
      desc: '318% organic growth in 9 months across 1,400 programmatic pages.',
      url: 'northline.tools',
      viz: `
        <div class="pslide__chrome"><i></i><i></i><i></i><span>northline.tools/seo</span></div>
        <div class="viz viz--03">
          <div class="terminal">
            <em>$</em> <b>nova audit --target=northline.tools</b><br/>
            <em>›</em> crawled <b>14,218</b> urls · <b>0 errors</b><br/>
            <em>›</em> core web vitals: <b>all green</b><br/>
            <em>›</em> backlinks: <b>+4,812</b> (ytd)<br/>
            <em>›</em> ranked keywords: <b>18,403</b> ↑<br/>
            <em>›</em> organic sessions: <b>+318%</b> <span style="color:#FF3DA5">◆</span><br/>
            <em>$</em> <b>_</b>
          </div>
        </div>
      `,
    },
    {
      cat: 'POS · hospitality',
      title: 'Meridian — offline-first POS',
      desc: 'Works on flaky Wi-Fi. Sub-80ms tap-to-receipt across 42 venues.',
      url: 'meridian-hospitality.com',
      viz: `
        <div class="pslide__chrome"><i></i><i></i><i></i><span>pos.meridian-hospitality.com</span></div>
        <div class="viz viz--04">
          <div class="ring-back"></div>
          <div class="device"></div>
        </div>
      `,
    },
    {
      cat: 'Digital marketing',
      title: 'Cirrus Fintech — paid + lifecycle',
      desc: '6.2× ROAS across Meta + Google. Creative refresh every 14 days.',
      url: 'cirrus-fintech.eu',
      viz: `
        <div class="pslide__chrome"><i></i><i></i><i></i><span>dashboard.cirrus-fintech.eu</span></div>
        <div class="viz viz--05">
          <div class="map">
            ATTRIBUTION MAP · 30D
            <div class="dot" style="left:28%;top:38%"></div>
            <div class="dot" style="left:68%;top:58%"></div>
            <div class="dot" style="left:48%;top:68%;background:#36E2FF;box-shadow:0 0 12px #36E2FF"></div>
            <div class="dot" style="left:80%;top:30%;background:#8B5BFF;box-shadow:0 0 12px #8B5BFF;width:14px;height:14px"></div>
            <div class="dot" style="left:20%;top:72%;background:#FF3DA5;box-shadow:0 0 12px #FF3DA5"></div>
          </div>
        </div>
      `,
    },
  ];

  const stage = document.getElementById('crcStage');
  const rail = document.getElementById('crcRail');
  const idxEl = document.getElementById('crcIdx');
  const totalEl = document.getElementById('crcTotal');
  const prevBtn = document.getElementById('crcPrev');
  const nextBtn = document.getElementById('crcNext');
  let idx = 0;

  if (stage && rail) {
    totalEl.textContent = String(projects.length).padStart(2, '0');

    projects.forEach((p, i) => {
      const el = document.createElement('article');
      el.className = 'pslide';
      el.dataset.i = i;
      el.innerHTML = `
        <div class="pslide__viz">${p.viz}</div>
        <div class="pslide__foot">
          <div class="pslide__meta">
            <span class="pslide__cat">${p.cat}</span>
            <span class="pslide__title">${p.title}</span>
            <span class="pslide__desc">${p.desc}</span>
          </div>
          <a href="#" class="pslide__preview"><span>${p.url}</span><span>↗</span></a>
        </div>
      `;
      stage.appendChild(el);

      const t = document.createElement('div');
      t.className = 'thumb' + (i === 0 ? ' is-active' : '');
      t.addEventListener('click', () => go(i));
      rail.appendChild(t);
    });

    const slides = [...stage.querySelectorAll('.pslide')];

    const layout = () => {
      slides.forEach((s, i) => {
        const d = i - idx;
        const absd = Math.abs(d);
        const sign = Math.sign(d);
        const tx = d * 220;            // sideways
        const tz = -absd * 220;        // depth
        const ry = -sign * Math.min(absd, 2) * 28; // rotation
        const op = absd > 2 ? 0 : 1 - absd * 0.25;
        const scale = 1 - absd * 0.04;
        s.style.transform = `translate3d(${tx}px, 0, ${tz}px) rotateY(${ry}deg) scale(${scale})`;
        s.style.opacity = op;
        s.style.zIndex = 100 - absd;
        s.style.pointerEvents = absd === 0 ? 'auto' : 'none';
        s.style.filter = absd === 0 ? 'none' : `brightness(${1 - absd * 0.1})`;
      });
      idxEl.textContent = String(idx + 1).padStart(2, '0');
      rail.querySelectorAll('.thumb').forEach((t, i) => t.classList.toggle('is-active', i === idx));
    };

    const go = (i) => {
      idx = (i + projects.length) % projects.length;
      layout();
    };

    prevBtn.addEventListener('click', () => go(idx - 1));
    nextBtn.addEventListener('click', () => go(idx + 1));

    // Drag / swipe
    let sx = null;
    stage.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    stage.addEventListener('pointerup', (e) => {
      if (sx == null) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
      sx = null;
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') go(idx + 1);
      else if (e.key === 'ArrowLeft') go(idx - 1);
    });

    // Autoplay (paused on hover)
    let timer = setInterval(() => go(idx + 1), 5500);
    stage.addEventListener('pointerenter', () => clearInterval(timer));
    stage.addEventListener('pointerleave', () => { timer = setInterval(() => go(idx + 1), 5500); });

    layout();
  }

  // ---------- pointer glow on about cards & service cards ----------
  document.querySelectorAll('.wcard, .svc').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', `${e.clientX - r.left}px`);
      c.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  // ---------- form id rotator ----------
  const fid = document.getElementById('formId');
  if (fid) {
    fid.textContent = String(Math.floor(800 + Math.random() * 199)).padStart(4, '0');
  }
})();
