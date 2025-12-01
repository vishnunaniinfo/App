import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { usersService, CreateUserData, UpdateUserData, UserFilters } from '../services/users.service';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler';
import { requireRole, requireOwnership } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get users with filtering and pagination
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, MANAGER, AGENT]
 *         description: Filter by user role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and email
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
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
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
  query('role')
    .optional()
    .isIn(['ADMIN', 'MANAGER', 'AGENT'])
    .withMessage('Role must be ADMIN, MANAGER, or AGENT'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters'),
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

  const filters: UserFilters = {
    role: req.query.role as any,
    isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    search: req.query.search as string,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
  };

  const result = await usersService.getUsers(req.user!.builderId, filters);

  res.json(result);
}));

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
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
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MANAGER, AGENT]
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: Email already exists
 */
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character'),
  body('role')
    .isIn(['ADMIN', 'MANAGER', 'AGENT'])
    .withMessage('Role must be ADMIN, MANAGER, or AGENT'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));
    throw new ValidationError('Invalid input data', details);
  }

  const userData: CreateUserData = {
    ...req.body,
    builderId: req.user!.builderId,
  };

  const user = await usersService.createUser(userData);

  res.status(201).json(user);
}));

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
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
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.get('/:id', [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID format'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));
    throw new ValidationError('Invalid user ID', details);
  }

  const { id } = req.params;
  const user = await usersService.getUserById(id, req.user!.builderId);

  if (!user) {
    throw new NotFoundError('User');
  }

  res.json(user);
}));

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update user
 *     tags: [Users]
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
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MANAGER, AGENT]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already exists
 */
router.patch('/:id', [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'MANAGER', 'AGENT'])
    .withMessage('Role must be ADMIN, MANAGER, or AGENT'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
], asyncHandler(async (req: Request, res: Response) => {
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
  const updateData: UpdateUserData = req.body;

  const user = await usersService.updateUser(id, req.user!.builderId, updateData);

  res.json(user);
}));

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user (soft delete)
 *     tags: [Users]
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
 *         description: User deleted successfully
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
 *         description: User not found
 */
router.delete('/:id', [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID format'),
], requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));
    throw new ValidationError('Invalid user ID', details);
  }

  const { id } = req.params;

  // Prevent self-deletion
  if (id === req.user!.id) {
    throw new ValidationError('Cannot delete your own account');
  }

  await usersService.deleteUser(id, req.user!.builderId);

  res.json({
    message: 'User deleted successfully',
  });
}));

/**
 * @swagger
 * /users/{id}/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
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
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalLeads:
 *                   type: integer
 *                 recentLeads:
 *                   type: integer
 *                 leadsByStage:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                 recentActivities:
 *                   type: integer
 *                 conversionRate:
 *                   type: number
 *                 lastLoginAt:
 *                   type: string
 *                   format: date-time
 *                 memberSince:
 *                   type: string
 *                   format: date-time
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.get('/:id/stats', [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID format'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));
    throw new ValidationError('Invalid user ID', details);
  }

  const { id } = req.params;

  // Users can only view their own stats, managers can view all
  if (req.user!.role === 'AGENT' && id !== req.user!.id) {
    throw new ValidationError('You can only view your own statistics');
  }

  const stats = await usersService.getUserStats(id, req.user!.builderId);

  res.json(stats);
}));

/**
 * @swagger
 * /users/team/performance:
 *   get:
 *     summary: Get team performance metrics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Team performance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *                   totalLeads:
 *                     type: integer
 *                   recentLeads:
 *                     type: integer
 *                   bookedLeads:
 *                     type: integer
 *                   conversionRate:
 *                     type: number
 *                   avgResponseTime:
 *                     type: number
 *                   lastLoginDaysAgo:
 *                     type: integer
 *                   lastLoginAt:
 *                     type: string
 *                     format: date-time
 *       403:
 *         description: Insufficient permissions
 */
router.get('/team/performance', requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req: Request, res: Response) => {
  const performance = await usersService.getTeamPerformance(req.user!.builderId);

  res.json(performance);
}));

/**
 * @swagger
 * /users/{id}/reset-password:
 *   post:
 *     summary: Reset user password (admin function)
 *     tags: [Users]
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
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *         description: User not found
 */
router.post('/:id/reset-password', [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID format'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character'),
], requireRole('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
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
  const { newPassword } = req.body;

  await usersService.resetUserPassword(id, req.user!.builderId, newPassword);

  res.json({
    message: 'Password reset successfully',
  });
}));

/**
 * @swagger
 * /users/{id}/toggle-status:
 *   patch:
 *     summary: Toggle user active status
 *     tags: [Users]
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
 *         description: User status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.patch('/:id/toggle-status', [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID format'),
], requireRole('ADMIN', 'MANAGER'), asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));
    throw new ValidationError('Invalid user ID', details);
  }

  const { id } = req.params;

  // Prevent deactivating self
  if (id === req.user!.id) {
    throw new ValidationError('Cannot deactivate your own account');
  }

  const user = await usersService.toggleUserStatus(id, req.user!.builderId);

  res.json(user);
}));

/**
 * @swagger
 * /users/bulk/status:
 *   patch:
 *     summary: Update status for multiple users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *               - isActive
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updated:
 *                   type: integer
 *                 failed:
 *                   type: array
 *                   items:
 *                     type: string
 *       403:
 *         description: Insufficient permissions
 */
router.patch('/bulk/status', [
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('userIds must be a non-empty array'),
  body('userIds.*')
    .isUUID()
    .withMessage('Each user ID must be a valid UUID'),
  body('isActive')
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

  const { userIds, isActive } = req.body;

  // Prevent deactivating self
  if (isActive === false && userIds.includes(req.user!.id)) {
    throw new ValidationError('Cannot deactivate your own account');
  }

  const result = await usersService.bulkUpdateStatus(userIds, req.user!.builderId, isActive);

  res.json(result);
}));

/**
 * @swagger
 * /users/bulk/delete:
 *   delete:
 *     summary: Delete multiple users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Users deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deleted:
 *                   type: integer
 *                 failed:
 *                   type: array
 *                   items:
 *                     type: string
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/bulk/delete', [
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('userIds must be a non-empty array'),
  body('userIds.*')
    .isUUID()
    .withMessage('Each user ID must be a valid UUID'),
], requireRole('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));
    throw new ValidationError('Invalid input data', details);
  }

  const { userIds } = req.body;

  // Prevent deleting self
  if (userIds.includes(req.user!.id)) {
    throw new ValidationError('Cannot delete your own account');
  }

  const result = await usersService.bulkDelete(userIds, req.user!.builderId);

  res.json(result);
}));

export default router;