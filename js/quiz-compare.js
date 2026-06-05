// ═══════════════════════════════════════════════════════════════
// EV Charger Quiz — "What charger should I get?"
// ═══════════════════════════════════════════════════════════════

const QUIZ = {
  questions: [
    {q: "Where will you charge most often?", opt: [
      {t:"Home — in my garage or driveway", v:"home"},
      {t:"Workplace or office parking", v:"work"},
      {t:"Apartment/condo — shared parking", v:"multi"},
    ]},
    {q: "What type of EV do you have (or plan to buy)?", opt: [
      {t:"Tesla (Model 3/Y/S/X/Cybertruck)", v:"tesla"},
      {t:"Non-Tesla EV (Ford, Hyundai, Chevy, etc.)", v:"j1772"},
      {t:"Plug-in hybrid (PHEV)", v:"phev"},
      {t:"Not sure yet", v:"unsure"},
    ]},
    {q: "How fast do you need to charge?", opt: [
      {t:"Overnight is fine — 25-35 mi/hr (Level 2)", v:"l2"},
      {t:"Pretty fast — need 40-60 mi/hr", v:"l2fast"},
      {t:"Super fast — 150+ mi/hr (DC fast)", v:"dc"},
    ]},
    {q: "What's your budget for the charger + installation?", opt: [
      {t:"Under $1,000 total", v:"budget"},
      {t:"$1,000 - $2,500 (typical)", v:"mid"},
      {t:"$3,000+ (want the best)", v:"premium"},
    ]},
  ],

  results: {
    home_tesla_l2_mid: {
      badge: "🏆 Best Pick",
      title: "Tesla Wall Connector + NEMA 14-50",
      desc: "Perfect setup for a Tesla owner with a garage. The Wall Connector gives you 44 mi/hr and looks clean on the wall. Optional: hardwire for a faster 60A circuit.",
      cta: "Find Tesla Installers →",
      ctaLink: "/evcharger/states/"
    },
    home_j1772_l2_mid: {
      badge: "🏆 Best Pick",
      title: "ChargePoint Home Flex or Emporia",
      desc: "Great for non-Tesla EVs. The ChargePoint Home Flex gives you 37 mi/hr with a 50A circuit. Emporia is a budget-friendly alternative with solid app features.",
      cta: "Find Installers →",
      ctaLink: "/evcharger/states/"
    },
    home_tesla_l2fast_premium: {
      badge: "⚡ Maximum Speed",
      title: "Tesla Wall Connector (Hardwired 60A)",
      desc: "The fastest home charging setup. 60A hardwired installation delivers 44 mi/hr. Professional installation required — worth it for the speed.",
      cta: "Find Tesla-Certified Installers →",
      ctaLink: "/evcharger/states/"
    },
    home_j1772_l2fast_premium: {
      badge: "⚡ Maximum Speed",
      title: "ChargePoint Home Flex (Hardwired)",
      desc: "The fastest non-Tesla home charging. Hardwired installation supports up to 50A continuous charging. Premium build quality and excellent app.",
      cta: "Find Installers →",
      ctaLink: "/evcharger/states/"
    },
    home_unsure_l2_budget: {
      badge: "💡 Smart Start",
      title: "NEMA 14-50 Outlet + Mobile Charger",
      desc: "The most flexible starting point. Install a 14-50 outlet (same as RV/range outlets) and use the mobile charger that came with your EV. Upgrade later.",
      cta: "Find Electricians →",
      ctaLink: "/evcharger/states/"
    },
    multi_j1772_l2_mid: {
      badge: "🏢 Multi-Unit Solution",
      title: "ChargePoint + Property Management",
      desc: "For apartments and condos, ChargePoint's multi-unit solutions allow billing back to residents. Work with your property manager to install shared chargers.",
      cta: "Find Commercial Installers →",
      ctaLink: "/evcharger/states/"
    },
    work_any_l2_mid: {
      badge: "🏢 Workplace Solution",
      title: "Level 2 Workplace Charging",
      desc: "Dual-port Level 2 stations (ChargePoint or JuiceBox) are ideal for workplace charging. Employees can charge during work hours. 30% federal tax credit applies.",
      cta: "Find Commercial Installers →",
      ctaLink: "/evcharger/states/"
    },
    home_phev_l2_budget: {
      badge: "💡 Cost-Effective",
      title: "Level 1 + NEMA 5-15 Outlet",
      desc: "PHEVs have smaller batteries. A standard 120V outlet may be enough for overnight charging. If not, a basic 16A Level 2 charger is affordable.",
      cta: "Find Electricians →",
      ctaLink: "/evcharger/states/"
    },
    home_tesla_dc_premium: {
      badge: "⚡ Ultimate Speed",
      title: "Tesla Wall Connector + Supercharger Access",
      desc: "For home, the Wall Connector is best. For road trips, Tesla's Supercharger network handles fast charging. No need for home DC fast charging.",
      cta: "Find Installers →",
      ctaLink: "/evcharger/states/"
    },
  },

  getResultKey(answers) {
    const a = answers;
    const loc = a[0] || 'home';
    const car = a[1] || 'unsure';
    const speed = a[2] || 'l2';
    const budget = a[3] || 'mid';
    const key = `${loc}_${car}_${speed}_${budget}`;

    if (this.results[key]) return this.results[key];
    // Fallbacks
    if (loc === 'home' && car === 'tesla') return this.results.home_tesla_l2_mid;
    if (loc === 'home' && car === 'j1772') return this.results.home_j1772_l2_mid;
    if (loc === 'home') return this.results.home_unsure_l2_budget;
    if (loc === 'multi') return this.results.multi_j1772_l2_mid;
    return this.results.home_unsure_l2_budget;
  },

  currentQuestion: 0,
  answers: [],

  start(containerId) {
    this.currentQuestion = 0;
    this.answers = [];
    const el = document.getElementById(containerId);
    if (!el) return;
    this.render(el);
  },

  render(el) {
    if (this.currentQuestion >= this.questions.length) {
      this.showResult(el);
      return;
    }
    const q = this.questions[this.currentQuestion];
    const pct = (this.currentQuestion / this.questions.length) * 100;
    let opts = '';
    q.opt.forEach((o, i) => {
      opts += `<button class="quiz-option" onclick="QUIZ.select(${i})">${o.t}</button>`;
    });
    el.innerHTML = `
      <div class="quiz-progress"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
      <div class="quiz-question">${q.q}</div>
      ${opts}`;
  },

  select(idx) {
    const q = this.questions[this.currentQuestion];
    this.answers.push(q.opt[idx].v);
    this.currentQuestion++;
    const el = document.getElementById('quizContainer');
    if (el) this.render(el);
  },

  showResult(el) {
    const result = this.getResultKey(this.answers);
    el.innerHTML = `
      <div class="quiz-result">
        <div class="quiz-result-card">
          <div class="quiz-badge">${result.badge}</div>
          <h2>${result.title}</h2>
          <p>${result.desc}</p>
          <a href="${result.ctaLink}" class="cta-primary" style="display:inline-block">${result.cta}</a>
        </div>
        <div style="text-align:center;margin-top:20px">
          <button onclick="QUIZ.start('quizContainer')" style="background:none;border:1px solid var(--border-card);border-radius:8px;padding:10px 20px;color:var(--text-secondary);cursor:pointer;font-family:inherit">🔄 Take quiz again</button>
        </div>
      </div>`;
  }
};

// ═══════════════════════════════════════════════════════════════
// Comparison Tool
// ═══════════════════════════════════════════════════════════════
const COMPARE = {
  chargers: [
    {name:"Tesla Wall Connector",img:"/evcharger/img/brands/tesla.svg",price:"$475",power:"48A (60A circuit)",speed:"44 mi/hr",connector:"Tesla NACS",warranty:"4 years",features:"WiFi, Load Management, Power Sharing"},
    {name:"ChargePoint Home Flex",img:"/evcharger/img/brands/chargepoint.svg",price:"$699",power:"50A (hardwire) / 40A (plug)",speed:"37 mi/hr",connector:"J1772",warranty:"3 years",features:"WiFi, App control, Energy tracking"},
    {name:"Emporia EV Charger",img:"/evcharger/img/brands/emporia.svg",price:"$399",power:"48A (hardwire) / 40A (plug)",speed:"40 mi/hr",connector:"J1772",warranty:"3 years",features:"WiFi, Energy monitoring, Solar integration"},
    {name:"JuiceBox 40",img:"/evcharger/img/brands/juicebox.svg",price:"$599",power:"40A (plug)",speed:"32 mi/hr",connector:"J1772",warranty:"3 years",features:"WiFi, App, Smart charging, Voice control"},
    {name:"Grizzl-E Classic",img:"/evcharger/img/brands/grizzl-e.svg",price:"$399",power:"40A (plug)",speed:"32 mi/hr",connector:"J1772",warranty:"3 years",features:"Weatherproof, No app, Simple, Tough"},
    {name:"Wallbox Pulsar Plus",img:"/evcharger/img/brands/wallbox.svg",price:"$649",power:"48A (hardwire) / 40A (plug)",speed:"40 mi/hr",connector:"J1772",warranty:"3 years",features:"WiFi/Bluetooth, Power Boost, Compact"},
    {name:"Ford Charge Station Pro",img:"/evcharger/img/brands/ford.svg",price:"$1,310",power:"80A (hardwire)",speed:"62 mi/hr",connector:"J1772 (can do NACS)",warranty:"3 years",features:"80A charging, Home backup ready, WiFi"},
    {name:"Lectron V-Box",img:"/evcharger/img/brands/lectron.svg",price:"$299",power:"40A (plug)",speed:"32 mi/hr",connector:"J1772",warranty:"2 years",features:"Budget pick, Portable, Simple"},
  ],

  rows: [
    {label:"Price", key:"price"},
    {label:"Power", key:"power"},
    {label:"Speed", key:"speed"},
    {label:"Connector Type", key:"connector"},
    {label:"Warranty", key:"warranty"},
    {label:"Features", key:"features"},
  ],

  selected: [0, 1],

  setSlot(slot, idx) {
    this.selected[slot] = parseInt(idx);
    this.render(document.getElementById('compareContainer'));
  },

  render(el) {
    if (!el) return;
    const a = this.chargers[this.selected[0]];
    const b = this.chargers[this.selected[1]];

    const pickerOpts = (sel) =>
      this.chargers.map((c, i) =>
        `<option value="${i}"${i === sel ? ' selected' : ''}>${c.name} (${c.price})</option>`
      ).join('');

    const headerHtml = `
      <div class="compare-pick-area">
        <div><select onchange="COMPARE.setSlot(0, this.value)" style="padding:12px 16px;border:1px solid var(--border-card);border-radius:8px;background:var(--bg-section);color:var(--text-primary);min-width:200px;font-family:inherit">${pickerOpts(this.selected[0])}</select></div>
        <div><select onchange="COMPARE.setSlot(1, this.value)" style="padding:12px 16px;border:1px solid var(--border-card);border-radius:8px;background:var(--bg-section);color:var(--text-primary);min-width:200px;font-family:inherit">${pickerOpts(this.selected[1])}</select></div>
      </div>`;

    const cell = (val, highlight) =>
      `<div class="compare-cell${highlight ? ' highlight' : ''}">${val}</div>`;

    let gridHtml = `<div class="compare-wrapper"><div class="compare-grid">`;
    // Header row
    gridHtml += `<div class="compare-label"></div>`;
    gridHtml += `<div class="compare-header"><img src="${a.img}" alt="${a.name}" onerror="this.style.display='none'"><br>${a.name}</div>`;
    gridHtml += `<div class="compare-header"><img src="${b.img}" alt="${b.name}" onerror="this.style.display='none'"><br>${b.name}</div>`;

    for (const row of this.rows) {
      const va = a[row.key];
      const vb = b[row.key];
      const isBetter = row.key === 'price'
        ? parseInt(va.replace(/[^0-9]/g,'')) < parseInt(vb.replace(/[^0-9]/g,''))
        : row.key === 'speed' || row.key === 'power'
          ? parseInt(va.replace(/[^0-9]/g,'')) > parseInt(vb.replace(/[^0-9]/g,''))
          : false;
      gridHtml += `<div class="compare-label">${row.label}</div>`;
      gridHtml += cell(va, row.key === 'price' ? parseInt(va.replace(/[^0-9]/g,'')) < parseInt(vb.replace(/[^0-9]/g,'')) : isBetter);
      gridHtml += cell(vb, row.key === 'price' ? parseInt(vb.replace(/[^0-9]/g,'')) < parseInt(va.replace(/[^0-9]/g,'')) : !isBetter);
    }

    gridHtml += `</div></div>`;

    el.innerHTML = `
      <div style="max-width:900px;margin:0 auto">
        <div style="text-align:center;margin-bottom:24px">
          <h2 style="font-size:1.3rem">Compare EV Chargers Side-by-Side</h2>
          <p style="color:var(--text-secondary);font-size:0.9rem">Pick two chargers to compare specs, price, and features</p>
        </div>
        ${headerHtml}
        ${gridHtml}
      </div>`;
  }
};
