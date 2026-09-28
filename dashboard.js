// ===== Auth guard =====
(function checkAuth() {
  const session = localStorage.getItem('betabinary_session');
  const demo = localStorage.getItem('betabinary_demo');
  if (!session && !demo) {
    window.location.href = 'index.html';
    return;
  }
})();

// ===== State =====
let balance = 0;
let positions = [];
let currentPrice = 9789.33;
let chartData = [];
let chartAnimId = null;
let selectedDigit = 3;

// Load balance
function loadBalance() {
  const session = localStorage.getItem('betabinary_session');
  const demo = localStorage.getItem('betabinary_demo');
  if (session) {
    const bal = localStorage.getItem('betabinary_balance');
    balance = bal ? parseFloat(bal) : 0;
  } else if (demo) {
    const d = JSON.parse(demo);
    balance = d.balance || 10000;
  }
  updateBalanceUI();
}

function saveBalance() {
  const session = localStorage.getItem('betabinary_session');
  if (session) {
    localStorage.setItem('betabinary_balance', balance.toString());
  } else {
    const demo = JSON.parse(localStorage.getItem('betabinary_demo') || '{}');
    demo.balance = balance;
    localStorage.setItem('betabinary_demo', JSON.stringify(demo));
  }
}

function updateBalanceUI() {
  const el = document.getElementById('balance-display');
  if (el) el.textContent = '$' + balance.toFixed(2);
  const wa = document.getElementById('withdraw-available');
  if (wa) wa.textContent = '$' + balance.toFixed(2);
}

// ===== User profile =====
function loadProfile() {
  const session = localStorage.getItem('betabinary_session');
  const demo = localStorage.getItem('betabinary_demo');
  let name = 'Trader';
  let email = '';

  if (session) {
    const s = JSON.parse(session);
    name = s.name || s.email.split('@')[0];
    email = s.email;
  } else if (demo) {
    const d = JSON.parse(demo);
    name = d.name || 'Demo Trader';
    email = 'demo@betabinary.com';
  }

  document.getElementById('user-name').textContent = name;
  document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();

  // Mask email
  if (email) {
    const [user, domain] = email.split('@');
    const masked = user.slice(0, 2) + '***' + user.slice(-2) + '@' + domain;
    document.getElementById('user-email').textContent = masked;
  }
}

// ===== Sidebar =====
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');

document.getElementById('menu-btn').addEventListener('click', () => {
  sidebar.classList.add('open');
  overlay.classList.add('open');
});
overlay.addEventListener('click', closeSidebar);
function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
}

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
  if (!confirm('Log out of COBRA FX?')) return;
  localStorage.removeItem('betabinary_session');
  localStorage.removeItem('betabinary_demo');
  window.location.href = 'index.html';
});

// ===== Chart =====
const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const wrap = canvas.parentElement;
  canvas.width = wrap.clientWidth * 2;
  canvas.height = wrap.clientHeight * 2;
  ctx.scale(2, 2);
}
resizeCanvas();
window.addEventListener('resize', () => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  resizeCanvas();
});

// Generate initial chart data
function initChartData() {
  chartData = [];
  let price = 9760;
  for (let i = 0; i < 80; i++) {
    price += (Math.random() - 0.48) * 30;
    chartData.push(price);
  }
  currentPrice = chartData[chartData.length - 1];
}

function drawChart() {
  const w = canvas.width / 2;
  const h = canvas.height / 2;
  ctx.clearRect(0, 0, w, h);

  if (chartData.length < 2) return;

  const min = Math.min(...chartData) - 10;
  const max = Math.max(...chartData) + 10;
  const range = max - min || 1;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = (h / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Line path
  ctx.beginPath();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  chartData.forEach((p, i) => {
    const x = (i / (chartData.length - 1)) * w;
    const y = h - ((p - min) / range) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Gradient fill
  const lastY = h - ((chartData[chartData.length - 1] - min) / range) * h;
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(16,185,129,0.25)');
  grad.addColorStop(1, 'rgba(16,185,129,0)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Price label position
  const label = document.getElementById('price-label');
  if (label) {
    label.textContent = currentPrice.toFixed(2);
    label.style.top = ((lastY / h) * 100) + '%';
  }
}

function tickChart() {
  // Add new price point
  const change = (Math.random() - 0.48) * 25;
  currentPrice = chartData[chartData.length - 1] + change;
  chartData.push(currentPrice);
  if (chartData.length > 80) chartData.shift();

  // Update asset change
  const base = chartData[0];
  const pct = ((currentPrice - base) / base * 100).toFixed(2);
  const changeEl = document.getElementById('asset-change');
  if (changeEl) {
    changeEl.textContent = (pct >= 0 ? '+' : '') + pct + '%';
    changeEl.className = 'asset-change ' + (pct >= 0 ? 'up' : 'down');
  }

  // Randomize digit probabilities slightly
  document.querySelectorAll('.digit .d-pct').forEach(el => {
    const v = (6 + Math.random() * 10).toFixed(1);
    el.textContent = v + '%';
  });

  drawChart();
  updatePayouts();
}

// ===== Stake controls =====
const stakeInput = document.getElementById('stake-value');
document.getElementById('stake-minus').addEventListener('click', () => {
  stakeInput.value = Math.max(1, parseInt(stakeInput.value) - 1);
  updatePayouts();
});
document.getElementById('stake-plus').addEventListener('click', () => {
  stakeInput.value = parseInt(stakeInput.value) + 1;
  updatePayouts();
});
stakeInput.addEventListener('input', updatePayouts);

function updatePayouts() {
  const stake = parseFloat(stakeInput.value) || 10;
  const mult = parseFloat(document.getElementById('mult-value').value) || 2;
  const payout = (stake * 0.95 * (mult / 2 + 0.5)).toFixed(2);
  document.getElementById('payout-even').textContent = '$' + payout;
  document.getElementById('payout-odd').textContent = '$' + payout;
}
document.getElementById('mult-value').addEventListener('input', updatePayouts);

// ===== Mode toggle =====
document.getElementById('mode-auto').addEventListener('click', function () {
  this.classList.add('active');
  document.getElementById('mode-manual').classList.remove('active');
});
document.getElementById('mode-manual').addEventListener('click', function () {
  this.classList.add('active');
  document.getElementById('mode-auto').classList.remove('active');
});

// ===== Digits =====
document.querySelectorAll('.digit').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.digit').forEach(d => d.classList.remove('active'));
    btn.classList.add('active');
    selectedDigit = parseInt(btn.dataset.d);
  });
});

// ===== Trade =====
function placeTrade(direction) {
  const stake = parseFloat(stakeInput.value) || 10;
  if (stake > balance) {
    showToast('Insufficient balance. Please deposit funds.', 'lose');
    return;
  }
  if (stake < 1) {
    showToast('Minimum stake is $1', 'lose');
    return;
  }

  balance -= stake;
  saveBalance();
  updateBalanceUI();

  // Simulate result after short delay
  showToast('Trade placed: ' + direction.toUpperCase() + ' · $' + stake.toFixed(2), '');

  const pos = {
    id: Date.now(),
    direction,
    stake,
    price: currentPrice,
    time: new Date().toLocaleTimeString(),
    status: 'open'
  };
  positions.unshift(pos);
  renderPositions();

  // Resolve after 3–6 seconds
  const delay = 3000 + Math.random() * 3000;
  setTimeout(() => {
    // 48% win rate (slight house edge for realism)
    const win = Math.random() < 0.48;
    const payout = stake * 0.95 * 2; // roughly even money with 95% return
    pos.status = win ? 'win' : 'lose';
    pos.result = win ? payout : 0;

    if (win) {
      balance += payout;
      saveBalance();
      updateBalanceUI();
      addHistory({ type: 'trade', amount: stake, direction, result: 'win', pnl: payout - stake });
      showToast('🎉 You won $' + (payout - stake).toFixed(2) + '!', 'win');
    } else {
      addHistory({ type: 'trade', amount: stake, direction, result: 'lose', pnl: -stake });
      showToast('Trade lost −$' + stake.toFixed(2), 'lose');
    }
    renderPositions();
  }, delay);
}

document.getElementById('btn-even').addEventListener('click', () => placeTrade('even'));
document.getElementById('btn-odd').addEventListener('click', () => placeTrade('odd'));

function showToast(msg, type) {
  const t = document.getElementById('trade-toast');
  t.textContent = msg;
  t.className = 'trade-toast show ' + (type || '');
  t.hidden = false;
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => { t.hidden = true; }, 300);
  }, 2800);
}

// ===== Positions =====
function renderPositions() {
  const list = document.getElementById('pos-list');
  if (!positions.length) {
    list.innerHTML = '<div class="pos-empty">No open positions</div>';
    return;
  }
  list.innerHTML = positions.slice(0, 20).map(p => `
    <div class="pos-item">
      <div>
        <span class="pos-dir ${p.direction}">${p.direction.toUpperCase()}</span>
        <span style="color:var(--muted);margin-left:8px">$${p.stake.toFixed(2)}</span>
      </div>
      <div>
        ${p.status === 'open'
          ? '<span style="color:var(--gold)">Pending…</span>'
          : `<span class="pos-result ${p.status}">${p.status === 'win' ? '+' : '−'}$${p.status === 'win' ? (p.result - p.stake).toFixed(2) : p.stake.toFixed(2)}</span>`
        }
      </div>
    </div>
  `).join('');
}

document.getElementById('positions-btn').addEventListener('click', () => {
  document.getElementById('positions-panel').classList.add('open');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('positions-btn').classList.add('active');
});
document.getElementById('close-positions').addEventListener('click', () => {
  document.getElementById('positions-panel').classList.remove('open');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector('.nav-item[data-tab="trade"]').classList.add('active');
});
document.querySelector('.nav-item[data-tab="trade"]').addEventListener('click', () => {
  document.getElementById('positions-panel').classList.remove('open');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector('.nav-item[data-tab="trade"]').classList.add('active');
});

// ===== Deposit =====
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(el) {
  const overlay = el.closest ? el.closest('.modal-overlay') : el;
  if (overlay) overlay.classList.remove('open');
}

document.getElementById('deposit-btn').addEventListener('click', () => openModal('deposit-modal'));
document.getElementById('menu-deposit').addEventListener('click', () => {
  closeSidebar();
  openModal('deposit-modal');
});
document.getElementById('menu-withdraw').addEventListener('click', () => {
  closeSidebar();
  openModal('withdraw-modal');
});
document.getElementById('balance-btn').addEventListener('click', () => openModal('deposit-modal'));

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn));
});
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) closeModal(o); });
});

// ===== Transaction history =====
function getHistory() {
  try { return JSON.parse(localStorage.getItem('cobrafx_history') || '[]'); }
  catch { return []; }
}
function addHistory(entry) {
  const h = getHistory();
  h.unshift({ ...entry, time: new Date().toISOString() });
  localStorage.setItem('cobrafx_history', JSON.stringify(h.slice(0, 100)));
}
function renderHistory() {
  const list = document.getElementById('history-list');
  if (!list) return;
  const h = getHistory();
  if (!h.length) {
    list.innerHTML = '<div class="pos-empty">No transactions yet</div>';
    return;
  }
  list.innerHTML = h.map(e => {
    const sign = e.type === 'deposit' || (e.type === 'trade' && e.result === 'win') ? 'pos' : 'neg';
    const amt = e.type === 'deposit' ? '+' + e.amount.toFixed(2)
      : e.type === 'withdraw' ? '-' + e.amount.toFixed(2)
      : (e.result === 'win' ? '+' : '-') + Math.abs(e.pnl || e.amount).toFixed(2);
    const label = e.type === 'deposit' ? 'Deposit' : e.type === 'withdraw' ? 'Withdrawal' : 'Trade ' + (e.direction || '').toUpperCase();
    const meta = new Date(e.time).toLocaleString() + (e.method ? ' · ' + e.method : '');
    return `<div class="hist-item">
      <div><div class="hist-type ${e.type}">${label}</div><div class="hist-meta">${meta}</div></div>
      <div class="hist-amt ${sign}">$${amt.replace(/^[+-]/, m => m)}</div>
    </div>`;
  }).join('');
}

// Quick amounts + live total
function updateDepositTotals() {
  const amt = parseFloat(document.getElementById('deposit-amount')?.value) || 0;
  const t = document.getElementById('deposit-total');
  const c = document.getElementById('deposit-credit');
  if (t) t.textContent = '$' + amt.toFixed(2);
  if (c) c.textContent = '$' + amt.toFixed(2);
}
document.querySelectorAll('.quick-amounts button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.quick-amounts button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('deposit-amount').value = btn.dataset.amt;
    updateDepositTotals();
  });
});
document.getElementById('deposit-amount')?.addEventListener('input', updateDepositTotals);

// Payment method selection
document.querySelectorAll('#deposit-methods .pay-method').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#deposit-methods .pay-method').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
document.querySelectorAll('#withdraw-methods .pay-method').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#withdraw-methods .pay-method').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

function resetDepositViews() {
  document.getElementById('deposit-form-view').hidden = false;
  document.getElementById('deposit-processing').hidden = true;
  document.getElementById('deposit-done').hidden = true;
}
function resetWithdrawViews() {
  document.getElementById('withdraw-form-view').hidden = false;
  document.getElementById('withdraw-processing').hidden = true;
  document.getElementById('withdraw-done').hidden = true;
}

// Open deposit resets views
const _openModal = openModal;
openModal = function(id) {
  if (id === 'deposit-modal') resetDepositViews();
  if (id === 'withdraw-modal') resetWithdrawViews();
  if (id === 'history-modal') renderHistory();
  _openModal(id);
};

document.getElementById('confirm-deposit').addEventListener('click', async () => {
  const amt = parseFloat(document.getElementById('deposit-amount').value) || 0;
  if (amt < 1) {
    showToast('Minimum deposit is $1', 'lose');
    return;
  }
  const method = document.querySelector('#deposit-methods .pay-method.active')?.dataset.method || 'card';
  document.getElementById('deposit-form-view').hidden = true;
  document.getElementById('deposit-processing').hidden = false;

  await new Promise(r => setTimeout(r, 1800));

  balance += amt;
  saveBalance();
  updateBalanceUI();
  addHistory({ type: 'deposit', amount: amt, method });

  document.getElementById('deposit-processing').hidden = true;
  document.getElementById('deposit-done').hidden = false;
  document.getElementById('deposit-done-msg').textContent = '$' + amt.toFixed(2) + ' added to your account via ' + method;
  showToast('Deposited $' + amt.toFixed(2), 'win');
});

document.getElementById('confirm-withdraw').addEventListener('click', async () => {
  const amt = parseFloat(document.getElementById('withdraw-amount').value) || 0;
  if (amt < 1 || amt > balance) {
    showToast('Invalid withdrawal amount', 'lose');
    return;
  }
  const method = document.querySelector('#withdraw-methods .pay-method.active')?.dataset.method || 'bank';
  const dest = document.getElementById('withdraw-dest')?.value?.trim();
  if (!dest) {
    showToast('Enter account / wallet details', 'lose');
    return;
  }

  document.getElementById('withdraw-form-view').hidden = true;
  document.getElementById('withdraw-processing').hidden = false;

  await new Promise(r => setTimeout(r, 1500));

  balance -= amt;
  saveBalance();
  updateBalanceUI();
  addHistory({ type: 'withdraw', amount: amt, method, dest: dest.slice(0, 12) + '…' });

  document.getElementById('withdraw-processing').hidden = true;
  document.getElementById('withdraw-done').hidden = false;
  document.getElementById('withdraw-done-msg').textContent = '$' + amt.toFixed(2) + ' via ' + method + ' — processing';
  showToast('Withdrawal of $' + amt.toFixed(2) + ' requested', 'win');
});

document.getElementById('menu-history')?.addEventListener('click', () => {
  closeSidebar();
  openModal('history-modal');
});

// ===== Asset picker =====
document.getElementById('asset-select').addEventListener('click', () => openModal('asset-modal'));
document.querySelectorAll('.asset-option').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.asset-option').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('asset-name').textContent = btn.dataset.asset;
    currentPrice = parseFloat(btn.dataset.price);
    // Reset chart around new price
    chartData = [];
    let p = currentPrice - 40;
    for (let i = 0; i < 80; i++) {
      p += (Math.random() - 0.48) * 20;
      chartData.push(p);
    }
    currentPrice = chartData[chartData.length - 1];
    closeModal(document.getElementById('asset-modal'));
    drawChart();
  });
});

// ===== Server time =====
function updateTime() {
  const now = new Date();
  const str = now.toISOString().replace('T', ' ').slice(0, 19) + ' GMT';
  const el = document.getElementById('server-time');
  if (el) el.textContent = str;
}
setInterval(updateTime, 1000);
updateTime();

// ===== Entry Scanner (AI Scanner) =====
const SCAN_ASSETS = [
  'Volatility 10 (1s) Index',
  'Volatility 10 Index',
  'Volatility 15 (1s) Index',
  'Volatility 25 Index',
  'Volatility 25 (1s) Index',
  'Volatility 30 (1s) Index',
  'Volatility 50 Index',
  'Volatility 50 (1s) Index',
  'Volatility 75 Index',
  'Volatility 75 (1s) Index',
  'Volatility 100 Index',
  'Volatility 100 (1s) Index',
  'Crash 500 Index'
];

const MARKET_LABELS = {
  evenodd: 'Even / Odd',
  matches: 'Matches / Differs',
  overunder: 'Over / Under'
};

let scanTimer = null;
let scanResult = null;

function showScannerView(view) {
  document.getElementById('scanner-idle').hidden = view !== 'idle';
  document.getElementById('scanner-running').hidden = view !== 'running';
  document.getElementById('scanner-result').hidden = view !== 'result';
}

function openScanner() {
  if (scanTimer) {
    clearInterval(scanTimer);
    scanTimer = null;
  }
  showScannerView('idle');
  document.getElementById('scanner-bar').style.width = '0%';
  document.getElementById('scanner-progress-count').textContent = '0/13';
  document.getElementById('scanner-status-text').textContent = 'Ready to scan';
  openModal('scanner-modal');
}

document.getElementById('ai-scanner')?.addEventListener('click', openScanner);

function runDeepScan() {
  const marketVal = document.getElementById('scanner-market').value;
  const marketLabel = MARKET_LABELS[marketVal] || 'Even / Odd';

  document.getElementById('scanner-market-locked').value = marketLabel;
  document.getElementById('scanner-market-result').value = marketLabel;
  showScannerView('running');

  let i = 0;
  const total = SCAN_ASSETS.length;

  scanTimer = setInterval(() => {
    if (i >= total) {
      clearInterval(scanTimer);
      scanTimer = null;
      finishScan(marketVal, marketLabel);
      return;
    }
    const asset = SCAN_ASSETS[i];
    const n = i + 1;
    const pct = Math.round((n / total) * 100);

    document.getElementById('scanner-current-asset').textContent = asset;
    document.getElementById('scanner-progress-count-run').textContent = n + '/' + total;
    document.getElementById('scanner-bar-run').style.width = pct + '%';
    document.getElementById('scanner-live-line').innerHTML =
      '<span class="spin-mini"></span> Scanning ' + asset + '…';

    i++;
  }, 380);
}

function finishScan(marketVal, marketLabel) {
  const bestIdx = 5 + Math.floor(Math.random() * 5);
  const asset = SCAN_ASSETS[Math.min(bestIdx, SCAN_ASSETS.length - 1)];
  const quality = (88 + Math.random() * 11).toFixed(2);

  let side = 'Even';
  if (marketVal === 'evenodd') {
    side = Math.random() > 0.45 ? 'Even' : 'Odd';
  } else if (marketVal === 'matches') {
    side = Math.random() > 0.5 ? 'Matches' : 'Differs';
  } else {
    side = Math.random() > 0.5 ? 'Over' : 'Under';
  }

  scanResult = { asset, side, quality, marketVal, marketLabel };

  document.getElementById('bm-name').textContent = asset;
  document.getElementById('bm-detail').innerHTML =
    marketLabel + ' · <span class="bm-side">' + side + '</span>';
  document.getElementById('bm-quality').textContent = quality + '%';
  document.getElementById('btn-load-asset').textContent = 'Load ' + asset;

  showScannerView('result');
}

document.getElementById('btn-deep-scan')?.addEventListener('click', runDeepScan);
document.getElementById('btn-rescan')?.addEventListener('click', () => {
  showScannerView('idle');
  document.getElementById('scanner-bar').style.width = '0%';
  document.getElementById('scanner-progress-count').textContent = '0/13';
  setTimeout(runDeepScan, 200);
});

document.getElementById('btn-load-asset')?.addEventListener('click', () => {
  if (!scanResult) return;
  document.getElementById('asset-name').textContent = scanResult.asset.replace(' Index', '');
  currentPrice = 5000 + Math.random() * 8000;
  chartData = [];
  let p = currentPrice - 50;
  for (let i = 0; i < 80; i++) {
    p += (Math.random() - 0.48) * 25;
    chartData.push(p);
  }
  currentPrice = chartData[chartData.length - 1];
  drawChart();

  if (scanResult.marketVal === 'evenodd') {
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.textContent.includes('Even'));
    });
  }

  closeModal(document.getElementById('scanner-modal'));
  showToast(
    'Loaded ' + scanResult.asset + ' · bias: ' + scanResult.side + ' (' + scanResult.quality + '%)',
    'win'
  );
});

// ===== Sidebar pages =====
function openPage(id) {
  closeSidebar();
  openModal(id);
}

document.getElementById('menu-responsible')?.addEventListener('click', () => openPage('responsible-modal'));
document.getElementById('menu-help')?.addEventListener('click', () => openPage('help-modal'));
document.getElementById('menu-chat')?.addEventListener('click', () => openPage('chat-modal'));
document.getElementById('menu-refer')?.addEventListener('click', () => {
  // Generate stable referral code from email/name
  const session = localStorage.getItem('betabinary_session');
  const demo = localStorage.getItem('betabinary_demo');
  let seed = 'GUEST';
  if (session) seed = JSON.parse(session).email || JSON.parse(session).name || 'USER';
  else if (demo) seed = JSON.parse(demo).name || 'DEMO';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
  const code = 'COBRA-' + Math.abs(hash).toString(36).toUpperCase().slice(0, 4);
  document.getElementById('ref-code').textContent = code;
  openPage('refer-modal');
});

document.getElementById('settings-btn')?.addEventListener('click', () => {
  const session = localStorage.getItem('betabinary_session');
  const demo = localStorage.getItem('betabinary_demo');
  let name = '', email = '';
  if (session) {
    const s = JSON.parse(session);
    name = s.name || '';
    email = s.email || '';
  } else if (demo) {
    name = JSON.parse(demo).name || 'Demo Trader';
    email = 'demo@cobrafx.com';
  }
  document.getElementById('set-name').value = name;
  document.getElementById('set-email').value = email;
  openPage('settings-modal');
});

document.getElementById('save-profile')?.addEventListener('click', () => {
  const name = document.getElementById('set-name').value.trim();
  if (!name) return showToast('Enter a display name', 'lose');
  const session = localStorage.getItem('betabinary_session');
  if (session) {
    const s = JSON.parse(session);
    s.name = name;
    localStorage.setItem('betabinary_session', JSON.stringify(s));
  } else {
    const demo = JSON.parse(localStorage.getItem('betabinary_demo') || '{}');
    demo.name = name;
    localStorage.setItem('betabinary_demo', JSON.stringify(demo));
  }
  loadProfile();
  showToast('Profile saved', 'win');
});

document.getElementById('save-password')?.addEventListener('click', () => {
  const p1 = document.getElementById('set-pass').value;
  const p2 = document.getElementById('set-pass2').value;
  if (!p1) return showToast('Enter a new password', 'lose');
  if (p1.length < 6) return showToast('Password must be at least 6 characters', 'lose');
  if (p1 !== p2) return showToast('Passwords do not match', 'lose');
  const session = localStorage.getItem('betabinary_session');
  if (session) {
    const s = JSON.parse(session);
    const users = JSON.parse(localStorage.getItem('betabinary_users') || '{}');
    if (users[s.email.toLowerCase()]) {
      users[s.email.toLowerCase()].password = p1;
      localStorage.setItem('betabinary_users', JSON.stringify(users));
    }
  }
  document.getElementById('set-pass').value = '';
  document.getElementById('set-pass2').value = '';
  showToast('Password updated', 'win');
});

document.getElementById('copy-ref')?.addEventListener('click', () => {
  const code = document.getElementById('ref-code').textContent;
  navigator.clipboard?.writeText(code).then(() => showToast('Code copied: ' + code, 'win'))
    .catch(() => showToast('Code: ' + code, ''));
});

document.getElementById('rt-support')?.addEventListener('click', () => {
  closeModal(document.getElementById('responsible-modal'));
  openModal('chat-modal');
});
document.getElementById('help-chat')?.addEventListener('click', () => {
  closeModal(document.getElementById('help-modal'));
  openModal('chat-modal');
});

// Live chat bot
const botReplies = [
  'Thanks for your message. A specialist will follow up shortly.',
  'You can deposit from the menu → Deposit anytime.',
  'Withdrawals usually process within the times shown for each method.',
  'For account security, never share your password with anyone.',
  'Try the demo account if you want to practice risk-free.',
  'Is there anything else I can help with?'
];
let botIdx = 0;
document.getElementById('chat-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  const box = document.getElementById('chat-messages');
  const user = document.createElement('div');
  user.className = 'chat-bubble user';
  user.textContent = msg;
  box.appendChild(user);
  input.value = '';
  box.scrollTop = box.scrollHeight;
  setTimeout(() => {
    const bot = document.createElement('div');
    bot.className = 'chat-bubble bot';
    bot.textContent = botReplies[botIdx % botReplies.length];
    botIdx++;
    box.appendChild(bot);
    box.scrollTop = box.scrollHeight;
  }, 700);
});

// ===== Init =====
loadBalance();
loadProfile();
initChartData();
drawChart();
updatePayouts();
setInterval(tickChart, 1000);
