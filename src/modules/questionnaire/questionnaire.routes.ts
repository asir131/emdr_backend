import { Router } from 'express';
import { questionnaireController as ctrl } from './questionnaire.controller';
import { authenticate } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import { phq9Schema, gad7Schema, des11Schema, idParamSchema } from './questionnaire.validation';

const router = Router();

router.use(authenticate);

// ── POST: Submit ──────────────────────────────────────────────────────────────

/**
 * @route   POST /api/questionnaire/phq9
 * @desc    Submit a new PHQ-9 (depression) questionnaire
 * @body    { "answers": [0,0,0,0,0,0,0,0,0] }  — 9 values, each 0–3
 * @access  Private (User)
 */
router.post('/phq9',  validate(phq9Schema),  ctrl.submitPHQ9);

/**
 * @route   POST /api/questionnaire/gad7
 * @desc    Submit a new GAD-7 (anxiety) questionnaire
 * @body    { "answers": [0,0,0,0,0,0,0] }  — 7 values, each 0–3
 * @access  Private (User)
 */
router.post('/gad7',  validate(gad7Schema),  ctrl.submitGAD7);

/**
 * @route   POST /api/questionnaire/des11
 * @desc    Submit a new DES-11 (dissociation) questionnaire
 * @body    { "answers": [2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5] }  — 8 values, each 0–100
 * @access  Private (User)
 */
router.post('/des11', validate(des11Schema), ctrl.submitDES11);

// ── GET: All submissions per type ─────────────────────────────────────────────

/**
 * @route   GET /api/questionnaire/phq9
 * @desc    Get all PHQ-9 submissions for the logged-in user (newest first)
 * @access  Private (User)
 */
router.get('/phq9',  ctrl.getAllPHQ9);

/**
 * @route   GET /api/questionnaire/gad7
 * @desc    Get all GAD-7 submissions for the logged-in user (newest first)
 * @access  Private (User)
 */
router.get('/gad7',  ctrl.getAllGAD7);

/**
 * @route   GET /api/questionnaire/des11
 * @desc    Get all DES-11 submissions for the logged-in user (newest first)
 * @access  Private (User)
 */
router.get('/des11', ctrl.getAllDES11);

// ── GET: Single submission by ID ──────────────────────────────────────────────

/**
 * @route   GET /api/questionnaire/:id
 * @desc    Get a single submission by its ID (any type)
 * @access  Private (User — own submissions only)
 */
router.get('/:id', validate(idParamSchema), ctrl.getOne);

export default router;
