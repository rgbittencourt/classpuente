const SUPPORTED_MANIFEST_VERSION = 1;

export function validateLessonManifest(manifest) {
  const errors = [];
  if (manifest?.schemaVersion !== SUPPORTED_MANIFEST_VERSION) {
    errors.push(`schemaVersion deve ser ${SUPPORTED_MANIFEST_VERSION}.`);
  }
  if (!String(manifest?.lesson?.id || '').trim()) errors.push('lesson.id é obrigatório.');
  if (!String(manifest?.lesson?.title || '').trim()) errors.push('lesson.title é obrigatório.');
  if (!isHttpUrl(manifest?.lesson?.url)) errors.push('lesson.url deve ser uma URL HTTP(S).');
  if (manifest?.classnotlibro?.enabled && !isHttpUrl(manifest?.classnotlibro?.launchUrl)) {
    errors.push('classnotlibro.launchUrl é obrigatório quando habilitado.');
  }
  return { ok: errors.length === 0, errors };
}

export function manifestToProvisioningRequest(manifest, destination) {
  const validation = validateLessonManifest(manifest);
  if (!validation.ok) return { ok: false, errors: validation.errors };
  if (!isHttpUrl(destination?.moodleCourseUrl)) {
    return { ok: false, errors: ['destination.moodleCourseUrl deve ser uma URL HTTP(S).'] };
  }

  const suffix = manifest.classnotlibro?.enabled ? ' (c/ ClassNotlibro)' : '';
  return {
    ok: true,
    request: {
      moodleCourseUrl: destination.moodleCourseUrl,
      section: destination.section || '',
      hiddenInitially: destination.hiddenInitially !== false,
      lessonUrl: manifest.lesson.url,
      title: `${manifest.lesson.title}${suffix}`,
      classnotlibro: manifest.classnotlibro?.enabled
        ? { enabled: true, launchUrl: manifest.classnotlibro.launchUrl }
        : { enabled: false },
      source: {
        catalog: manifest.source?.catalog || 'ClassAcervo',
        lessonId: manifest.lesson.id,
        contentVersion: manifest.lesson.contentVersion || '',
      },
    },
  };
}

export function expandCourseManifest(courseManifest, manifestUrl) {
  const errors = [];
  if (courseManifest?.schemaVersion !== SUPPORTED_MANIFEST_VERSION) errors.push(`schemaVersion deve ser ${SUPPORTED_MANIFEST_VERSION}.`);
  if (!Array.isArray(courseManifest?.lessons) || !courseManifest.lessons.length) errors.push('lessons deve conter pelo menos uma aula.');
  if (!isHttpUrl(manifestUrl)) errors.push('manifestUrl deve ser uma URL HTTP(S).');
  if (errors.length) return { ok: false, errors, manifests: [] };

  const manifests = courseManifest.lessons.map((lesson, index) => ({
    schemaVersion: SUPPORTED_MANIFEST_VERSION,
    source: {
      catalog: courseManifest.source?.catalog || 'ClassAcervo',
      manifestUrl,
      courseTitle: courseManifest.course?.title || '',
    },
    lesson: {
      id: String(lesson?.id || `aula-${index + 1}`),
      title: String(lesson?.title || `Aula ${index + 1}`),
      url: new URL(String(lesson?.path || ''), manifestUrl).href,
      contentVersion: String(lesson?.contentVersion || ''),
    },
    classnotlibro: lesson?.classnotlibro?.enabled
      ? { enabled: true, launchUrl: lesson.classnotlibro.launchUrl }
      : { enabled: false },
  }));

  const invalid = manifests.flatMap((manifest, index) => validateLessonManifest(manifest).errors.map((error) => `lessons[${index}]: ${error}`));
  return invalid.length ? { ok: false, errors: invalid, manifests: [] } : { ok: true, errors: [], manifests };
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}


