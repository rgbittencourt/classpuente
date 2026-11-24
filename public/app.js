import { expandCourseManifest, manifestToProvisioningRequest } from '../src/catalog.mjs';
import { buildProvisioningPlan } from '../src/planning.mjs';

const $ = (id) => document.getElementById(id);
let lessonManifests = [];

$('loadManifest').addEventListener('click', loadManifest);
$('preparePlan').addEventListener('click', preparePlan);

async function loadManifest() {
  setStatus('sourceStatus', 'Lendo o curso…');
  $('lessonStep').hidden = true;
  $('destinationStep').hidden = true;
  $('planStep').hidden = true;
  try {
    const manifestUrl = new URL($('manifestUrl').value.trim()).href;
    const response = await fetch(manifestUrl, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Não consegui ler o manifesto (HTTP ${response.status}).`);
    const course = await response.json();
    const expanded = expandCourseManifest(course, manifestUrl);
    if (!expanded.ok) throw new Error(expanded.errors.join(' '));
    lessonManifests = expanded.manifests;
    $('courseTitle').textContent = course.course?.title || 'Curso sem título';
    renderLessons();
    $('lessonStep').hidden = false;
    $('destinationStep').hidden = false;
    setStatus('sourceStatus', `${lessonManifests.length} aula(s) encontrada(s).`, 'success');
  } catch (error) {
    setStatus('sourceStatus', error.message || String(error), 'error');
  }
}

function renderLessons() {
  const root = $('lessonList');
  root.replaceChildren();
  lessonManifests.forEach((manifest, index) => {
    const label = document.createElement('label');
    label.className = 'lesson';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.dataset.lessonIndex = String(index);
    const content = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = manifest.lesson.title;
    const meta = document.createElement('small');
    meta.textContent = manifest.classnotlibro.enabled ? 'ClassNotlibro habilitado' : 'Aula convencional';
    if (manifest.classnotlibro.enabled) meta.className = 'notlibro';
    content.append(title, meta);
    label.append(checkbox, content);
    root.appendChild(label);
  });
}

function preparePlan() {
  $('planStep').hidden = true;
  const selected = [...document.querySelectorAll('[data-lesson-index]:checked')]
    .map((input) => lessonManifests[Number(input.dataset.lessonIndex)]);
  if (!selected.length) return setStatus('planStatus', 'Escolha pelo menos uma aula.', 'error');

  const destination = {
    moodleCourseUrl: $('moodleCourseUrl').value.trim(),
    section: $('section').value.trim(),
    hiddenInitially: $('hiddenInitially').checked,
  };
  const plans = [];
  const errors = [];
  for (const manifest of selected) {
    const converted = manifestToProvisioningRequest(manifest, destination);
    if (!converted.ok) { errors.push(...converted.errors); continue; }
    const plan = buildProvisioningPlan(converted.request, {
      authenticatedBrowser: true,
      teacherCanManageActivities: true,
    });
    if (plan.status !== 'ready') errors.push(...plan.errors);
    else plans.push(plan);
  }
  if (errors.length) return setStatus('planStatus', errors.join(' '), 'error');
  renderPlan(plans);
  setStatus('planStatus', 'Plano preparado. Nenhuma atividade foi criada ainda.', 'success');
  $('planStep').hidden = false;
  $('planStep').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderPlan(plans) {
  const summary = $('planSummary');
  summary.replaceChildren();
  plans.forEach((plan) => {
    const item = document.createElement('article');
    item.className = 'plan-item';
    const heading = document.createElement('strong');
    heading.textContent = plan.target.title;
    const detail = document.createElement('span');
    detail.textContent = `${plan.target.section || 'Seção a escolher'} · ${plan.target.hiddenInitially ? 'oculta' : 'visível'} · ${plan.resource.classnotlibro.enabled ? 'com ClassNotlibro' : 'sem ClassNotlibro'}`;
    item.append(heading, detail);
    summary.appendChild(item);
  });
  const steps = $('planSteps');
  steps.replaceChildren();
  (plans[0]?.steps || []).forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    steps.appendChild(li);
  });
}

function setStatus(id, message, kind = '') {
  const element = $(id);
  element.hidden = false;
  element.className = `status ${kind}`.trim();
  element.textContent = message;
}


