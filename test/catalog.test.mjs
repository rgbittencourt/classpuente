import test from 'node:test';
import assert from 'node:assert/strict';
import { manifestToProvisioningRequest, validateLessonManifest } from '../src/catalog.mjs';

const manifest = {
  schemaVersion: 1,
  source: { catalog: 'ClassAcervo' },
  lesson: {
    id: 'tge101-semana-1',
    title: 'Semana 1 - Fundamentos: Gestão Educacional na Era Digital',
    url: 'https://luislindner.github.io/moodle-ifsc/tedpro/TGE101/',
    contentVersion: '2026.11.24',
  },
  classnotlibro: {
    enabled: true,
    launchUrl: 'https://caderno-aula-lti-homologacao.vercel.app/lti/launch',
  },
};

test('aceita manifesto completo do ClassAcervo', () => {
  assert.deepEqual(validateLessonManifest(manifest), { ok: true, errors: [] });
});

test('transforma manifesto em solicitação sem digitação de URLs pelo professor', () => {
  const result = manifestToProvisioningRequest(manifest, {
    moodleCourseUrl: 'https://moodle.ifsc.edu.br/course/view.php?id=2615',
    section: 'Semana 1',
  });
  assert.equal(result.ok, true);
  assert.match(result.request.title, /ClassNotlibro/);
  assert.equal(result.request.source.lessonId, 'tge101-semana-1');
  assert.equal(result.request.hiddenInitially, true);
});

test('não adiciona ClassNotlibro quando a aula não o habilita', () => {
  const result = manifestToProvisioningRequest({ ...manifest, classnotlibro: { enabled: false } }, {
    moodleCourseUrl: 'https://moodle.ifsc.edu.br/course/view.php?id=2615',
  });
  assert.equal(result.request.classnotlibro.enabled, false);
  assert.doesNotMatch(result.request.title, /ClassNotlibro/);
});


