// ═══════════════════════════════════════════════════════════════
// ZIP Code + Radius Search — Client-side (v2)
// ═══════════════════════════════════════════════════════════════
// Uses zip_prefix_state.json to intelligently load installer data
// for the most relevant states first, then expands outward.
// ═══════════════════════════════════════════════════════════════

const ZIP_SEARCH = {
  zipCoords: null,
  installers: {},
  loadedStates: new Set(),
  dataPath: null,
  _dataPathComputed: null,

  // Data files are at /data/ on all environments (site serves from root)
  getDataPath() {
    return '/data/';
  },
  zipToState: null,       // prefix → state map (lazy-loaded)
  statePrefixes: null,    // state → [prefixes] reverse map (built from zipToState)

  // ── Distance helpers ──────────────────────────────────────────

  haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2
            + Math.cos(lat1*Math.PI/180)
            * Math.cos(lat2*Math.PI/180)
            * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  milesToKm(miles) { return miles * 1.60934; },
  kmToMiles(km) { return km / 1.60934; },

  // ── Data loaders ──────────────────────────────────────────────

  async loadZipCoords() {
    if (this.zipCoords) return;
    const cached = sessionStorage.getItem('zip_coords');
    if (cached) {
      this.zipCoords = JSON.parse(cached);
      return;
    }
    const res = await fetch(this.getDataPath() + 'zip_coords.json');
    if (!res.ok) throw new Error('Failed to load ZIP coordinate data');
    this.zipCoords = await res.json();
    try { sessionStorage.setItem('zip_coords', JSON.stringify(this.zipCoords)); } catch (e) { /* quota exceeded */ }
  },

  async loadInstallersForState(state) {
    if (this.loadedStates.has(state)) return;
    const res = await fetch(this.getDataPath() + 'installers/' + state + '.json');
    if (!res.ok) {
      // State file not found — register as empty so we don't retry
      this.installers[state] = [];
      this.loadedStates.add(state);
      return;
    }
    this.installers[state] = await res.json();
    this.loadedStates.add(state);
  },

  // ── State guessing (uses 3-digit ZIP prefix → state map) ──────

  async guessStateForZip(zip) {
    if (!this.zipToState) {
      const res = await fetch(this.getDataPath() + 'zip_prefix_state.json');
      if (!res.ok) throw new Error('Failed to load ZIP prefix → state map');
      this.zipToState = await res.json();
    }
    if (!zip || zip.length < 3) return null;
    const prefix = zip.substring(0, 3);
    // Try 3-digit prefix first, then fall back to 2-digit
    return this.zipToState[prefix] || this.zipToState[prefix.substring(0, 2)] || null;
  },

  // ── Build reverse map (state → its ZIP prefixes) ──────────────

  async ensureStatePrefixes() {
    if (this.statePrefixes) return;
    if (!this.zipToState) {
      const res = await fetch(this.getDataPath() + 'zip_prefix_state.json');
      if (!res.ok) throw new Error('Failed to load ZIP prefix → state map');
      this.zipToState = await res.json();
    }
    this.statePrefixes = {};
    for (const [prefix, state] of Object.entries(this.zipToState)) {
      if (!this.statePrefixes[state]) this.statePrefixes[state] = [];
      this.statePrefixes[state].push(prefix);
    }
  },

  // ── Score all states by ZIP prefix proximity ──────────────────
  // Returns array of { state, score } sorted most-relevant-first.
  // The primary state (exact match) always gets score -1 (best).

  getRelevantStates(zipPrimaryState) {
    // We need ensureStatePrefixes() called before this
    if (!this.statePrefixes) return [];

    const scores = [];
    for (const state of Object.keys(this.statePrefixes)) {
      if (state === zipPrimaryState) {
        scores.push({ state, score: -1 });
      } else {
        // Assign a neutral score for states without a primary match
        scores.push({ state, score: 999 });
      }
    }
    scores.sort((a, b) => a.score - b.score);
    return scores;
  },

  // ── Build a sorted list of states by prefix proximity ─────────
  // For the given ZIP, score every state by how close its 3-digit
  // ZIP prefixes are to the ZIP's own prefix.

  getRankedStates(zip) {
    if (!this.statePrefixes || !this.zipToState) return [];

    const zipPrefixNum = parseInt(zip.substring(0, 3), 10);
    const scores = {};

    for (const [prefixStr, state] of Object.entries(this.zipToState)) {
      const prefixNum = parseInt(prefixStr, 10);
      const dist = Math.abs(prefixNum - zipPrefixNum);
      // Keep the best (minimum) distance for each state
      if (scores[state] === undefined || dist < scores[state]) {
        scores[state] = dist;
      }
    }

    // Ensure all states with prefixes are included
    return Object.entries(scores)
      .map(([state, score]) => ({ state, score }))
      .sort((a, b) => a.score - b.score);
  },

  // ── Main search ───────────────────────────────────────────────

  async search(zip, radiusMiles) {
    const resultsEl = document.getElementById('zipResults');
    if (!resultsEl) return;

    const zipClean = zip.toString().trim().replace(/\D/g, '');
    if (zipClean.length !== 5) {
      resultsEl.innerHTML = '<div class="zip-no-results"><h3>Invalid ZIP code</h3><p>Please enter a 5-digit US ZIP code.</p></div>';
      return;
    }

    resultsEl.innerHTML = '<div class="zip-loading"><div class="zip-loading-spinner"></div><p>Loading ZIP coordinates...</p></div>';

    // ── Phase 0: Load ZIP coordinates ──
    try {
      await this.loadZipCoords();
    } catch (e) {
      resultsEl.innerHTML = `<div class="zip-no-results"><h3>⚠️ Data load error</h3><p>Could not load location data. Please try again later.</p></div>`;
      return;
    }

    const center = this.zipCoords[zipClean];
    if (!center) {
      resultsEl.innerHTML = `<div class="zip-no-results"><h3>📍 ZIP code not found</h3><p>We couldn't find coordinates for "<strong>${zipClean}</strong>". Try a different ZIP code.</p><a href="/states/" class="cta-primary" style="display:inline-block;margin-top:8px">Browse All States →</a></div>`;
      return;
    }

    const [lat, lng] = center;
    const radiusKm = this.milesToKm(radiusMiles);

    // ── Phase 1: Guess primary state + build prefix map ──
    resultsEl.innerHTML = '<div class="zip-loading"><div class="zip-loading-spinner"></div><p>Identifying nearby areas...</p></div>';

    let primaryState;
    try {
      primaryState = await this.guessStateForZip(zipClean);
      await this.ensureStatePrefixes();
    } catch (e) {
      // Non-critical; we'll try all states
      primaryState = null;
    }

    // ── Phase 2: Get ranked states ──
    const rankedStates = this.getRankedStates(zipClean);

    // If we couldn't get ranked states, fall back to all known states
    let stateQueue;
    if (rankedStates.length > 0) {
      stateQueue = rankedStates.map(s => s.state);
    } else if (primaryState && this.statePrefixes) {
      stateQueue = [primaryState, ...Object.keys(this.statePrefixes).filter(s => s !== primaryState)];
    } else {
      // Extreme fallback — alphabetically
      stateQueue = this.loadedStates.size > 0
        ? [...this.loadedStates]
        : [];
    }

    // ── Phase 3: Search states ──
    let results = [];
    let hasShownResults = false;
    const MAX_RESULTS = 50;
    const SHOW_EARLY_THRESHOLD = 3;  // Show results asap once we have at least this many

    for (let i = 0; i < stateQueue.length; i++) {
      const state = stateQueue[i];

      // Show "searching more areas..." if we've loaded initial states
      // and still looking
      if (i > 0 && !hasShownResults) {
        resultsEl.innerHTML = '<div class="zip-loading"><div class="zip-loading-spinner"></div><p>Searching nearby areas...</p></div>';
      } else if (i > 1 && hasShownResults && results.length < 5) {
        // Update the results with a "loading more" indicator
        this.renderResults(resultsEl, results, zipClean, radiusMiles, true);
      }

      try {
        await this.loadInstallersForState(state);
      } catch (e) {
        // Skip states that fail to load
        continue;
      }

      const stateInstallers = this.installers[state] || [];
      for (const inst of stateInstallers) {
        const dist = this.kmToMiles(this.haversineKm(lat, lng, inst.lat, inst.lng));
        if (dist <= radiusMiles) {
          // Avoid duplicates by name + ZIP
          if (!results.some(r => r.n === inst.n && r.z === inst.z)) {
            results.push({ ...inst, distance: Math.round(dist * 10) / 10 });
          }
        }
      }

      // Once we have some results, render them (allows seeing results
      // while we keep loading more states in background)
      if (!hasShownResults && results.length >= SHOW_EARLY_THRESHOLD) {
        hasShownResults = true;
        this.renderResults(resultsEl, results, zipClean, radiusMiles, true);
      }

      // Stop early if we have enough results and have searched at least
      // the primary + nearby states (first 5+ states in ranked order)
      if (results.length >= 10 && i >= 2) {
        break;
      }

      if (results.length >= MAX_RESULTS) break;
    }

    // ── Phase 4: Final render ──
    results.sort((a, b) => a.distance - b.distance);

    // Hook up sort dropdown
    const sortOpt = document.getElementById('zipSort');
    if (sortOpt) {
      sortOpt.onchange = () => {
        const val = sortOpt.value;
        if (val === 'distance') results.sort((a, b) => a.distance - b.distance);
        else if (val === 'rating') results.sort((a, b) => (b.r || 0) - (a.r || 0));
        else if (val === 'reviews') results.sort((a, b) => (b.rv || 0) - (a.rv || 0));
        this.renderResults(resultsEl, results, zipClean, radiusMiles, false);
      };
    }

    this.renderResults(resultsEl, results, zipClean, radiusMiles, false);
  },

  // ── Render results ────────────────────────────────────────────

  renderResults(el, results, zip, radiusMiles, isLoadingMore) {
    const count = results.length;

    // ── Build header ──
    const header = document.getElementById('zipResultsHeader');
    if (header) {
      if (count > 0 || !isLoadingMore) {
        let headerText;
        if (count > 0) {
          headerText = `Found <strong>${count}</strong> installer${count !== 1 ? 's' : ''} near <strong>${zip}</strong>`;
          if (isLoadingMore) {
            headerText += ' <span class="zip-loading-badge">loading more…</span>';
          }
        } else if (isLoadingMore) {
          headerText = `Searching for installers near <strong>${zip}</strong> <span class="zip-loading-badge">loading…</span>`;
        } else {
          headerText = `No installers found within ${radiusMiles} miles of <strong>${zip}</strong>`;
        }

        header.innerHTML = `
          <span class="zip-results-count">${headerText}</span>
          <div class="zip-results-sort">
            <select id="zipSort">
              <option value="distance">Sort: Nearest</option>
              <option value="rating">Sort: Rating</option>
              <option value="reviews">Sort: Most Reviews</option>
            </select>
          </div>`;
      }
    }

    // ── Build result cards ──
    if (count === 0 && !isLoadingMore) {
      el.innerHTML = `
        <div class="zip-no-results">
          <h3>No installers found within ${radiusMiles} miles</h3>
          <p>Try expanding your search radius to 50 miles or check a different ZIP code.</p>
          <a href="/states/" class="cta-primary" style="display:inline-block;margin-top:8px">Browse All States →</a>
        </div>`;
      return;
    }

    let html = '';
    for (const inst of results) {
      const gmaps = inst.g || `https://www.google.com/maps/dir/?api=1&destination=${inst.lat},${inst.lng}`;
      const stars = '★'.repeat(Math.round(inst.r || 0)) + '☆'.repeat(5 - Math.round(inst.r || 0));
      html += `
        <div class="zip-installer-card">
          <div class="zip-installer-left">
            <div class="zip-installer-name">${inst.n}</div>
            <div class="zip-installer-addr">${inst.s}, ${inst.c}, ${inst.st} ${inst.z}</div>
            <div class="zip-installer-meta">
              <span class="zip-installer-distance">📍 ${inst.distance} mi</span>
              <span>${stars} ${inst.r || 'N/A'} (${inst.rv || 0} reviews)</span>
              <span>${inst.p}</span>
            </div>
          </div>
          <div class="zip-installer-right">
            ${inst.w ? `<a href="${inst.w}" target="_blank" rel="noopener" class="maps-link" style="display:block;margin-bottom:6px;text-align:center">🌐 Website</a>` : ''}
            <a href="${gmaps}" target="_blank" rel="noopener" class="cta-primary">🗺️ Directions</a>
          </div>
        </div>`;
    }

    // Append loading indicator if we're still searching
    if (isLoadingMore) {
      html += '<div class="zip-loading-more"><div class="zip-loading-spinner" style="width:24px;height:24px;margin:0 auto 8px"></div><p style="color:var(--text-muted);font-size:0.9rem">Searching additional nearby areas for more results…</p></div>';
    }

    el.innerHTML = html;
  }
};

// ── Rebate Data (unchanged) ─────────────────────────────────────
const REBATE_DATA = {
  federal: {title: 'Federal 30% Tax Credit', amount: 'Up to $1,000', desc: '30% of equipment + installation costs. File IRS Form 8911.', icon: '🇺🇸'},
  state: {
    'CA': {title: 'California CVRP', amount: 'Up to $1,000', desc: 'Income-qualified rebate for EV charger installation from CALeVIP.', icon: '🌴'},
    'CO': {title: 'Colorado EV Charger Rebate', amount: 'Up to $500', desc: 'Point-of-sale rebate for Level 2 charger installation.', icon: '🏔️'},
    'NY': {title: 'NY Drive Clean Rebate', amount: 'Up to $500', desc: 'Residential Level 2 charger rebate through NYSERDA.', icon: '🗽'},
    'MA': {title: 'Massachusetts MOR-EV', amount: 'Up to $700', desc: 'Residential EV charger installation rebate.', icon: '⚓'},
    'OR': {title: 'Oregon EV Charger Rebate', amount: 'Up to $750', desc: 'Residential Level 2 charger rebate through DEQ.', icon: '🌲'},
    'CT': {title: 'CT EV Charger Rebate', amount: 'Up to $500', desc: 'Residential Level 2 charger rebate from DEEP.', icon: '🌊'},
    'MD': {title: 'Maryland EV Charger Rebate', amount: 'Up to $300', desc: 'Residential EV charger rebate from MEA.', icon: '🦀'},
    'NJ': {title: 'NJ Charge Up EV', amount: 'Up to $250', desc: 'Residential Level 2 charger rebate.', icon: '🍑'},
    'VT': {title: 'Vermont EV Charger Rebate', amount: 'Up to $500', desc: 'Residential Level 2 charger rebate.', icon: '🍁'},
    'WA': {title: 'Washington EV Charger Rebate', amount: 'Up to $500', desc: 'Residential EV charger rebate through utilities.', icon: '🌲'},
    'IL': {title: 'Illinois EV Charger Rebate', amount: 'Up to $400', desc: 'Residential Level 2 charger rebate.', icon: '🏙️'},
    'MN': {title: 'Minnesota EV Charger Rebate', amount: 'Up to $250', desc: 'Residential Level 2 charger rebate.', icon: '❄️'},
    'HI': {title: 'Hawaii EV Charger Rebate', amount: 'Up to $500', desc: 'Residential EV charger rebate from HECO.', icon: '🌺'},
  }
};
