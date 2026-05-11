const INDEX_KEY = "resummary:index";
const RESUME_PREFIX = "resummary:resume:";

function getIndex(): string[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function setIndex(ids: string[]) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
  } catch {}
}

export function saveResume(data: Record<string, unknown>) {
  const id = data.id as string;
  if (!id) return;
  try {
    localStorage.setItem(`${RESUME_PREFIX}${id}`, JSON.stringify(data));
    const index = getIndex();
    if (!index.includes(id)) {
      setIndex([...index, id]);
    }
  } catch (err) {
    console.warn("resumeStore: localStorage write failed", err);
  }
}

export function loadResume(id: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(`${RESUME_PREFIX}${id}`);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function loadAllResumes(): Record<string, unknown>[] {
  return getIndex()
    .map(loadResume)
    .filter(Boolean) as Record<string, unknown>[];
}
