import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { projectsService, CreateProjectData, UpdateProjectData, ProjectFilters } from '../services/projects.service';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler';
import { requireRole, requireOwnership } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Get projects with filtering and pagination
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', [
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));
    throw new ValidationError('Invalid query parameters', details);
  }

  const filters: ProjectFilters = {
    isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
  };

  const result = await projectsService.getProjects(req.user!.builderId, filters);

  res.json(result);
}));

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - city
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *               city:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 */
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
], requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));
    throw new ValidationError('Invalid input data', details);
  }

  const projectData: CreateProjectData = {
    ...req.body,
    builderId: req.user!.builderId,
  };

  const project = await projectsService.createProject(projectData);

  res.status(201).json(project);
}));

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Project not found
 */
router.get('/:id', [
  param('id')
    .isUUID()
    .withMessage('Invalid project ID format'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));
    throw new ValidationError('Invalid project ID', details);
  }

  const { id } = req.params;
  const project = await projectsService.getProjectById(id, req.user!.builderId);

  if (!project) {
    throw new NotFoundError('Project');
  }

  res.json(project);
}));

/**
 * @swagger
 * /projects/{id}:
 *   patch:
 *     summary: Update project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *               city:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Project not found
 */
router.patch('/:id', [
  param('id')
    .isUUID()
    .withMessage('Invalid project ID format'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
], requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));
    throw new ValidationError('Invalid input data', details);
  }

  const { id } = req.params;
  const updateData: UpdateProjectData = req.body;

  const project = await projectsService.updateProject(id, req.user!.builderId, updateData);

  res.json(project);
}));

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Delete project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Project not found
 */
router.delete('/:id', [
  param('id')
    .isUUID()
    .withMessage('Invalid project ID format'),
], requireRole('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));
    throw new ValidationError('Invalid project ID', details);
  }

  const { id } = req.params;

  await projectsService.deleteProject(id, req.user!.builderId);

  res.json({
    message: 'Project deleted successfully',
  });
}));

/**
 * @swagger
 * /projects/{id}/stats:
 *   get:
 *     summary: Get project statistics
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 new:
 *                   type: integer
 *                 booked:
 *                   type: integer
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Project not found
 */
router.get('/:id/stats', [
  param('id')
    .isUUID()
    .withMessage('Invalid project ID format'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));
    throw new ValidationError('Invalid project ID', details);
  }

  const { id } = req.params;
  const stats = await projectsService.getProjectStats(id, req.user!.builderId);

  res.json(stats);
}));

export default router;