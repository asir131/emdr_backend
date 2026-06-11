import {
  CbtFormulation,
  ICbtFormulation,
  REQUIRED_FIELDS,
  NEGATIVE_BELIEFS,
  CONSEQUENCE_OPTIONS,
  EMOTION_OPTIONS,
} from './cbtFormulation.model';
import { ApiError } from '../../utils/ApiError';
import { logger } from '../../config/logger';

/* ── Updatable field whitelist (prevents mass-assignment) ───── */
const UPDATABLE_FIELDS = [
  'childhood',
  'deepBeliefs',
  'rules',
  'triggers',
  'recentHappening',
  'thoughts',
  'feelings',
  'behaviors',
  'consequences',
  'consequencesOther',
  'superpowers',
  'status',
] as const;

type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

/* ── Helper: pick only allowed fields from payload ───────────── */
function sanitizePayload(data: Record<string, unknown>): Partial<ICbtFormulation> {
  const clean: Record<string, unknown> = {};
  for (const key of UPDATABLE_FIELDS) {
    if (data[key] !== undefined) {
      clean[key] = data[key];
    }
  }
  return clean as Partial<ICbtFormulation>;
}

/* ── Helper: auto-determine status based on required fields ── */
function resolveStatus(doc: ICbtFormulation): 'draft' | 'completed' {
  const allFilled = REQUIRED_FIELDS.every((field) => {
    const val = doc[field];
    if (Array.isArray(val)) return val.length > 0;
    return typeof val === 'string' && val.trim().length > 0;
  });
  return allFilled ? 'completed' : 'draft';
}

/* ══════════════════════════════════════════════════════════════
   CBT Formulation Service
   ══════════════════════════════════════════════════════════════ */
export const cbtFormulationService = {

  /* ─── 1. GET predefined options (beliefs, emotions, consequences) */
  async getOptions() {
    return {
      negativeBeliefs: NEGATIVE_BELIEFS,
      emotions: EMOTION_OPTIONS,
      consequenceOptions: CONSEQUENCE_OPTIONS,
    };
  },

  /* ─── 2. CREATE new formulation ─────────────────────────────── */
  async create(
    userId: string,
    data: Record<string, unknown>
  ) {
    const payload = sanitizePayload(data);

    const formulation = await CbtFormulation.create({
      userId,
      ...payload,
    });

    // Auto-resolve status after save
    formulation.status = resolveStatus(formulation);
    if (formulation.status === 'completed' && !formulation.completedAt) {
      formulation.completedAt = new Date();
    }
    await formulation.save();

    logger.info('CBT formulation created', {
      id: formulation._id,
      userId,
      status: formulation.status,
    });

    return CbtFormulation.findById(formulation._id)
      .populate('userId', 'firstName lastName')
      .lean();
  },

  /* ─── 3. LIST all formulations for a user ───────────────────── */
  async listByUser(userId: string) {
    return CbtFormulation.find({ userId })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();
  },

  /* ─── 4. GET single formulation by ID (with ownership check) ── */
  async getById(id: string, userId: string) {
    const formulation = await CbtFormulation.findById(id)
      .populate('userId', 'firstName lastName')
      .lean();

    if (!formulation) throw ApiError.notFound('CBT formulation not found');
    if (formulation.userId._id?.toString() !== userId &&
        formulation.userId.toString() !== userId) {
      throw ApiError.forbidden('Access denied');
    }

    return formulation;
  },

  /* ─── 5. UPDATE full formulation ────────────────────────────── */
  async update(
    id: string,
    userId: string,
    data: Record<string, unknown>
  ) {
    const formulation = await CbtFormulation.findById(id);
    if (!formulation) throw ApiError.notFound('CBT formulation not found');
    if (formulation.userId.toString() !== userId) {
      throw ApiError.forbidden('Access denied');
    }

    const payload = sanitizePayload(data);

    // Apply changes
    Object.assign(formulation, payload);

    // Auto-resolve status
    formulation.status = resolveStatus(formulation);
    if (formulation.status === 'completed' && !formulation.completedAt) {
      formulation.completedAt = new Date();
    }

    await formulation.save();

    logger.info('CBT formulation updated', {
      id,
      userId,
      status: formulation.status,
    });

    return CbtFormulation.findById(id)
      .populate('userId', 'firstName lastName')
      .lean();
  },

  /* ─── 6. PATCH single section (auto-save) ───────────────────── */
  async patchSection(
    id: string,
    userId: string,
    section: string,
    value: string | string[]
  ) {
    const formulation = await CbtFormulation.findById(id);
    if (!formulation) throw ApiError.notFound('CBT formulation not found');
    if (formulation.userId.toString() !== userId) {
      throw ApiError.forbidden('Access denied');
    }

    // Validate section name is in updatable list (defence-in-depth)
    if (!UPDATABLE_FIELDS.includes(section as UpdatableField)) {
      throw ApiError.validationError(`Invalid section: ${section}`);
    }

    // Apply section update
    (formulation as unknown as Record<string, unknown>)[section] = value;

    // Re-evaluate status after partial update
    formulation.status = resolveStatus(formulation);
    if (formulation.status === 'completed' && !formulation.completedAt) {
      formulation.completedAt = new Date();
    }

    await formulation.save();

    logger.info('CBT formulation section patched', {
      id,
      userId,
      section,
      status: formulation.status,
    });

    return CbtFormulation.findById(id)
      .populate('userId', 'firstName lastName')
      .lean();
  },

  /* ─── 7. DELETE formulation ─────────────────────────────────── */
  async delete(id: string, userId: string) {
    const formulation = await CbtFormulation.findById(id);
    if (!formulation) throw ApiError.notFound('CBT formulation not found');
    if (formulation.userId.toString() !== userId) {
      throw ApiError.forbidden('Access denied');
    }

    await CbtFormulation.findByIdAndDelete(id);

    logger.info('CBT formulation deleted', { id, userId });
    return { message: 'CBT formulation deleted successfully' };
  },
};
