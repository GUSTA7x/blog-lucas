// SEGURANÇA: apenas o professor possui credencial/senha
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  }
  return h.toString(36);
}

const CREDS = {
  teacher: { user: 'Lucas_adm', hash: hashStr('12345678') }
};

// DADOS PADRÃO DE INICIALIZAÇÃO
const DEFAULT_TASKS = [
  { id: 1, title: 'Exercícios — Equações de 1° Grau', type: 'diaria', date: '2026-03-06', turma: '1', desc: 'Resolver as questões 1 a 10 da página 45. Mostrar o desenvolvimento completo.', link: '', image: '' },
  { id: 2, title: 'Lista Semanal — Funções do 2° Grau', type: 'semanal', date: '2026-03-10', turma: '2', desc: 'Analisar gráficos e determinar domínio, imagem, vértice e zeros. Entregar no caderno.', link: '', image: '' },
  { id: 3, title: 'Avaliação Mensal — Trigonometria', type: 'mensal', date: '2026-03-29', turma: 'all', desc: 'Prova sobre seno, cosseno, tangente e relações fundamentais. Estudar capítulo 7 completo.', link: '', image: '' },
  { id: 4, title: 'Projeto Bimestral — Estatística', type: 'bimestral', date: '2026-04-15', turma: '3', desc: 'Coleta de dados, construção de gráficos e análise estatística. Grupos de 3 alunos. Apresentação oral.', link: '', image: '' },
];

const DEFAULT_TIPS = [
  { id: 1, icon: '📐', title: 'Truque do Dobro e Metade', desc: 'Para multiplicar dois números onde um é par, divida-o pela metade e dobre o outro. Muito mais rápido mentalmente!', formula: 'Ex: 18 × 15 → 9 × 30 = 270' },
  { id: 2, icon: '🔢', title: 'Porcentagem Rápida', desc: 'Para calcular 10%, divida por 10. Para 5%, divida por 20. Para 15%, some os dois. Sem calculadora!', formula: '15% de 80 → 8 + 4 = 12' },
  { id: 3, icon: '📏', title: 'Regra de Três no Dia a Dia', desc: 'Usada em receitas, escalas de mapas e descontos em lojas. Reconhecer quando aplicar é a chave!', formula: '500g → R$8 / 750g → x = R$12' },
  { id: 4, icon: '💹', title: 'Juros Compostos — Cuidado!', desc: 'No cartão de crédito, os juros são compostos (juros sobre juros). Quite sempre o total para evitar a bola de neve.', formula: 'M = C·(1+i)ⁿ' },
];

let tasks = [], tips = [], nextTaskId = 5, nextTipId = 5;

// CARREGAR DADOS DO LOCALSTORAGE
function loadData() {
  try {
    const t = localStorage.getItem('mc_tasks');
    const d = localStorage.getItem('mc_tips');
    tasks = t ? JSON.parse(t) : [...DEFAULT_TASKS];
    tips = d ? JSON.parse(d) : [...DEFAULT_TIPS];
    nextTaskId = tasks.length ? Math.max(...tasks.map(x => x.id)) + 1 : 1;
    nextTipId = tips.length ? Math.max(...tips.map(x => x.id)) + 1 : 1;
  } catch (e) {
    tasks = [...DEFAULT_TASKS];
    tips = [...DEFAULT_TIPS];
  }
}

// SALVAR DADOS NO LOCALSTORAGE
function saveData() {
  try {
    localStorage.setItem('mc_tasks', JSON.stringify(tasks));
    localStorage.setItem('mc_tips', JSON.stringify(tips));
  } catch (e) {
    console.error("Erro ao salvar dados no localStorage:", e);
  }
}

loadData();

let currentRole = null, currentYear = null;
let editingTaskId = null, editingTipId = null, currentFilter = 'all', fabMode = 'task';

// Símbolos flutuantes
const SYMS = ['∑', 'π', '√', '∞', '∫', 'Δ', 'α', 'β', 'θ', '∂', '≠', '≈', '∈', '∀', '∃', '±', '×', '÷', '²', '³'];
const symC = document.getElementById('symbols');
if (symC) {
  for (let i = 0; i < 20; i++) {
    const d = document.createElement('div');
    d.className = 'sym';
    d.textContent = SYMS[i % SYMS.length];
    d.style.cssText = `left:${Math.random() * 100}%;animation-duration:${14 + Math.random() * 20}s;animation-delay:${Math.random() * -30}s`;
    symC.appendChild(d);
  }
}

// Toast Notification
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// Fluxo de Navegação de Login
function showStep(id) {
  document.querySelectorAll('.login-step').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

window.goBack = s => showStep(s);

window.gotoTeacherLogin = function () {
  document.getElementById('t-user').value = '';
  document.getElementById('t-pass').value = '';
  document.getElementById('err-teacher').style.display = 'none';
  showStep('step-teacher-login');
};

window.gotoYearSelect = function () {
  showStep('step-year');
};

// ACESSO DIRETO DOS ALUNOS (SEM SENHA)
window.selectYear = function (n) {
  currentRole = 'student';
  currentYear = n;
  enterApp();
};

window.loginTeacher = function () {
  const u = document.getElementById('t-user').value.trim();
  const p = document.getElementById('t-pass').value;
  if (u === CREDS.teacher.user && hashStr(p) === CREDS.teacher.hash) {
    currentRole = 'teacher';
    currentYear = null;
    enterApp();
  } else {
    document.getElementById('err-teacher').style.display = 'block';
    document.getElementById('t-pass').value = '';
  }
};

function enterApp() {
  document.getElementById('page-login').classList.remove('active');
  document.getElementById('page-main').classList.add('active');
  initMainPage();
}

window.doLogout = function () {
  currentRole = null;
  currentYear = null;
  document.getElementById('page-main').classList.remove('active');
  document.getElementById('page-login').classList.add('active');
  showStep('step-who');
  document.getElementById('fab').classList.remove('show');
  showSection('home');
};

// Indicador de prazo
function deadlineBadge(dateStr) {
  if (!dateStr) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `<span class="deadline-badge dl-late">🔴 Atrasada ${Math.abs(diff)}d</span>`;
  if (diff === 0) return `<span class="deadline-badge dl-today">⚠️ Vence hoje</span>`;
  if (diff <= 3) return `<span class="deadline-badge dl-warn">⏳ ${diff}d restantes</span>`;
  return `<span class="deadline-badge dl-ok">✅ ${diff}d</span>`;
}

const yearColors = { 1: 'badge-s1', 2: 'badge-s2', 3: 'badge-s3' };
const yearNames = { 1: '1° Ano', 2: '2° Ano', 3: '3° Ano' };
const yearEmojis = { 1: '📗', 2: '📘', 3: '📙' };

function initMainPage() {
  const isT = currentRole === 'teacher';
  const badge = document.getElementById('role-badge');
  if (isT) {
    badge.textContent = '👨‍🏫 Professor';
    badge.className = 'badge-role badge-teacher';
    document.getElementById('welcome-msg').textContent = 'Olá, Prof. Lucas! 👋';
    document.getElementById('welcome-sub').textContent = 'Gerencie tarefas e dicas para todas as turmas.';
    document.getElementById('fab').classList.add('show');
  } else {
    const y = currentYear;
    badge.textContent = `🎓 ${yearNames[y]}`;
    badge.className = `badge-role ${yearColors[y]}`;
    document.getElementById('welcome-msg').textContent = `Olá, ${yearNames[y]}! ${yearEmojis[y]}`;
    document.getElementById('welcome-sub').textContent = 'Confira suas tarefas e dicas de matemática.';
    document.getElementById('fab').classList.remove('show');
  }
  renderStats();
  renderRecentTasks();
  renderTasks();
  renderTips();

  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.onclick = () => {
      currentFilter = btn.dataset.filter;
      document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTasks();
    };
  });
}

window.showSection = function (name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  const names = ['home', 'tasks', 'tips'];
  document.querySelectorAll('.nav-btn').forEach((b, i) => b.classList.toggle('active', names[i] === name));
  document.querySelectorAll('.bnav-btn').forEach((b, i) => b.classList.toggle('active', names[i] === name));
  if (currentRole === 'teacher') {
    fabMode = name === 'tips' ? 'tip' : 'task';
    document.getElementById('fab').classList.add('show');
  }
};

window.openFab = function () {
  if (fabMode === 'tip') {
    openTipModal();
  } else {
    editingTaskId = null;
    document.getElementById('modal-title').textContent = '➕ Nova Tarefa';
    ['m-title', 'm-desc', 'm-link', 'm-image'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('m-type').value = 'semanal';
    document.getElementById('m-turma').value = 'all';
    document.getElementById('m-date').valueAsDate = new Date();
    document.getElementById('task-modal').classList.add('open');
  }
};

window.closeModal = () => document.getElementById('task-modal').classList.remove('open');

window.openTipModal = function (id) {
  editingTipId = id || null;
  if (id) {
    const t = tips.find(x => x.id === Number(id));
    document.getElementById('tip-modal-title').textContent = '✏️ Editar Dica';
    document.getElementById('tm-title').value = t.title;
    document.getElementById('tm-icon').value = t.icon || '';
    document.getElementById('tm-desc').value = t.desc;
    document.getElementById('tm-formula').value = t.formula || '';
  } else {
    document.getElementById('tip-modal-title').textContent = '💡 Nova Dica';
    ['tm-title', 'tm-icon', 'tm-desc', 'tm-formula'].forEach(x => document.getElementById(x).value = '');
  }
  document.getElementById('tip-modal').classList.add('open');
};

window.closeTipModal = () => document.getElementById('tip-modal').classList.remove('open');

document.getElementById('task-modal').addEventListener('click', function (e) { if (e.target === this) closeModal(); });
document.getElementById('tip-modal').addEventListener('click', function (e) { if (e.target === this) closeTipModal(); });

const typeLabels = { diaria: 'Diária', semanal: 'Semanal', mensal: 'Mensal', bimestral: 'Bimestral' };
const typeColors = { diaria: 'badge-diaria', semanal: 'badge-semanal', mensal: 'badge-mensal', bimestral: 'badge-bimestral' };
const turmaLabel = { all: 'Todas', 1: '1° Ano', 2: '2° Ano', 3: '3° Ano' };

function fmtDate(d) {
  if (!d) return '';
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
}

function visibleTasks() {
  const q = (document.getElementById('task-search') || { value: '' }).value.toLowerCase();
  const base = currentRole === 'student' ? tasks.filter(t => t.turma === 'all' || t.turma === String(currentYear)) : tasks;
  const filtered = currentFilter === 'all' ? base : base.filter(t => t.type === currentFilter);
  return q ? filtered.filter(t => t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)) : filtered;
}

function taskCard(t) {
  const isT = currentRole === 'teacher';
  const turmaStr = turmaLabel[t.turma] || 'Todas';
  const linkHtml = t.link ? `<a href="${t.link}" target="_blank" class="task-link">🔗 Abrir link</a>` : '';
  const imgHtml = t.image ? `<div class="task-img-preview"><img src="${t.image}" alt="Foto da tarefa" /></div>` : '';
  const actions = isT ? `<div class="task-actions"><button class="icon-btn" onclick="editTask(${t.id})" title="Editar">✏️</button><button class="icon-btn del" onclick="deleteTask(${t.id})" title="Excluir">🗑️</button></div>` : '';
  
  return `<div class="task-card ${t.type}">
    <div class="task-meta">
      <span class="task-type-badge ${typeColors[t.type]}">${typeLabels[t.type]}</span>
      <span class="turma-tag">📚 ${turmaStr}</span>
      <span class="task-date">📅 ${fmtDate(t.date)}</span>
      ${deadlineBadge(t.date)}
    </div>
    <h3>${t.title}</h3>
    <p>${t.desc}</p>
    ${imgHtml}
    ${linkHtml}
    ${actions}
  </div>`;
}

function renderStats() {
  const vis = currentRole === 'teacher' ? tasks : tasks.filter(t => t.turma === 'all' || t.turma === String(currentYear));
  const byT = tp => vis.filter(x => x.type === tp).length;
  document.getElementById('stats-row').innerHTML = [
    { icon: '📋', val: vis.length, label: 'Tarefas' },
    { icon: '📅', val: byT('diaria'), label: 'Diárias' },
    { icon: '🗓️', val: byT('semanal'), label: 'Semanais' },
    { icon: '📆', val: byT('mensal') + byT('bimestral'), label: 'Mensais/Bimestrais' },
    { icon: '💡', val: tips.length, label: 'Dicas' },
  ].map(r => `<div class="stat-card"><div class="stat-icon">${r.icon}</div><div class="stat-value">${r.val}</div><div class="stat-label">${r.label}</div></div>`).join('');
}

function renderRecentTasks() {
  const vis = currentRole === 'student' ? tasks.filter(t => t.turma === 'all' || t.turma === String(currentYear)) : tasks;
  const recent = [...vis].slice(-3).reverse();
  const el = document.getElementById('recent-tasks');
  if (!recent.length) {
    el.innerHTML = '<div class="empty"><div class="e-icon">📭</div><p>Nenhuma tarefa ainda.</p></div>';
    return;
  }
  el.innerHTML = `<div class="tasks-grid">${recent.map(t => taskCard(t)).join('')}</div>`;
}

function renderTasks() {
  const list = visibleTasks();
  const el = document.getElementById('tasks-container');
  if (!list.length) {
    el.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="e-icon">📭</div><p>Nenhuma tarefa encontrada.</p></div>';
    return;
  }
  el.innerHTML = list.map(t => taskCard(t)).join('');
}

function renderTips() {
  const el = document.getElementById('tips-container');
  const isT = currentRole === 'teacher';
  const q = (document.getElementById('tip-search') || { value: '' }).value.toLowerCase();
  const list = q ? tips.filter(t => t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)) : tips;
  if (!list.length) {
    el.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="e-icon">💡</div><p>Nenhuma dica encontrada.</p></div>';
    return;
  }
  el.innerHTML = list.map(t => `<div class="tip-card"><div class="tip-icon">${t.icon || '💡'}</div><h3>${t.title}</h3><p>${t.desc}</p>${t.formula ? `<div class="tip-formula">${t.formula}</div>` : ''}${isT ? `<div class="task-actions" style="margin-top:1rem"><button class="icon-btn" onclick="openTipModal(${t.id})" title="Editar">✏️</button><button class="icon-btn del" onclick="deleteTip(${t.id})" title="Excluir">🗑️</button></div>` : ''}</div>`).join('');
}

window.saveTask = function () {
  const title = document.getElementById('m-title').value.trim();
  const type = document.getElementById('m-type').value;
  const date = document.getElementById('m-date').value;
  const turma = document.getElementById('m-turma').value;
  const desc = document.getElementById('m-desc').value.trim();
  const link = document.getElementById('m-link').value.trim();
  const fileInput = document.getElementById('m-image');
  const file = fileInput ? fileInput.files[0] : null;

  if (!title) { alert('Preencha o título!'); return; }

  const processAndSave = (imgBase64) => {
    if (editingTaskId) {
      const t = tasks.find(x => x.id === editingTaskId);
      if (t) {
        Object.assign(t, { title, type, date, turma, desc, link });
        if (imgBase64 !== undefined) t.image = imgBase64;
      }
    } else {
      tasks.push({ id: nextTaskId++, title, type, date, turma, desc, link, image: imgBase64 || '' });
    }

    saveData();
    closeModal();
    renderTasks();
    renderRecentTasks();
    renderStats();
    showToast(editingTaskId ? '✅ Tarefa atualizada!' : '✅ Tarefa criada!');
  };

  // Se selecionou uma imagem nova na galeria
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      processAndSave(e.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    // Mantém a imagem anterior se já existia
    const oldTask = tasks.find(x => x.id === editingTaskId);
    processAndSave(oldTask ? oldTask.image : '');
  }
};

window.editTask = function (id) {
  const t = tasks.find(x => x.id === Number(id));
  if (!t) return;
  editingTaskId = id;
  document.getElementById('modal-title').textContent = '✏️ Editar Tarefa';
  document.getElementById('m-title').value = t.title;
  document.getElementById('m-type').value = t.type;
  document.getElementById('m-date').value = t.date;
  document.getElementById('m-turma').value = t.turma || 'all';
  document.getElementById('m-desc').value = t.desc;
  document.getElementById('m-link').value = t.link || '';
  const imgInput = document.getElementById('m-image');
  if (imgInput) imgInput.value = '';
  document.getElementById('task-modal').classList.add('open');
};

window.deleteTask = function (id) {
  openConfirm(() => {
    tasks = tasks.filter(x => x.id !== Number(id));
    saveData();
    renderTasks();
    renderRecentTasks();
    renderStats();
    showToast('🗑️ Tarefa excluída');
  });
};

window.saveTip = function () {
  const title = document.getElementById('tm-title').value.trim();
  const icon = document.getElementById('tm-icon').value.trim() || '💡';
  const desc = document.getElementById('tm-desc').value.trim();
  const formula = document.getElementById('tm-formula').value.trim();

  if (!title || !desc) { alert('Preencha título e explicação!'); return; }

  if (editingTipId) {
    const t = tips.find(x => x.id === Number(editingTipId));
    if (t) Object.assign(t, { title, icon, desc, formula });
  } else {
    tips.push({ id: nextTipId++, icon, title, desc, formula });
  }

  saveData();
  closeTipModal();

  renderTips();
  renderStats();

  showToast(editingTipId ? '✅ Dica atualizada!' : '✅ Dica criada!');
};

window.deleteTip = function (id) {
  openConfirm(() => {
    tips = tips.filter(x => x.id !== Number(id));
    saveData();
    renderTips();
    renderStats();
    showToast('🗑️ Dica excluída');
  });
};

// MODAL DE CONFIRMAÇÃO
let _confirmCb = null;
function openConfirm(cb) {
  _confirmCb = cb;
  document.getElementById('confirm-modal').classList.add('open');
}
window.closeConfirm = function () {
  document.getElementById('confirm-modal').classList.remove('open');
  _confirmCb = null;
};
window.confirmOk = function () {
  document.getElementById('confirm-modal').classList.remove('open');
  if (_confirmCb) _confirmCb();
  _confirmCb = null;
};

document.getElementById('confirm-modal').addEventListener('click', function (e) { if (e.target === this) window.closeConfirm(); });
document.getElementById('confirm-ok-btn').addEventListener('click', window.confirmOk);

// INICIALIZA PÁGINA DE LOGIN
document.getElementById('page-login').classList.add('active');