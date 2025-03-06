import { Hono } from 'hono';
import { BookmarkController, createBookmarkSchema, updateBookmarkSchema } from '../controllers/bookmark.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { rateLimit } from '../middlewares/rate-limit.middleware';

// Create router
const router = new Hono();

// Apply authentication middleware to all bookmark routes
router.use('*', authenticate);

// Apply rate limiting
const standardRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
});

/**
 * @openapi
 * /bookmarks:
 *   get:
 *     tags:
 *       - Bookmarks
 *     summary: Get all bookmarks for authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title, description or URL
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tag names
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of bookmarks
 *       401:
 *         description: Unauthorized
 */
router.get('/', standardRateLimit, BookmarkController.getAll);

/**
 * @openapi
 * /bookmarks:
 *   post:
 *     tags:
 *       - Bookmarks
 *     summary: Create a new bookmark
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - title
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               category_id:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Bookmark created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/', validate(createBookmarkSchema), BookmarkController.create);

/**
 * @openapi
 * /bookmarks/{id}:
 *   get:
 *     tags:
 *       - Bookmarks
 *     summary: Get a specific bookmark by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Bookmark ID
 *     responses:
 *       200:
 *         description: Bookmark details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Bookmark not found
 */
router.get('/:id', BookmarkController.getById);

/**
 * @openapi
 * /bookmarks/{id}:
 *   put:
 *     tags:
 *       - Bookmarks
 *     summary: Update a bookmark
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Bookmark ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 nullable: true
 *               category_id:
 *                 type: integer
 *                 nullable: true
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Bookmark updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Bookmark not found
 */
router.put('/:id', validate(updateBookmarkSchema), BookmarkController.update);

/**
 * @openapi
 * /bookmarks/{id}:
 *   delete:
 *     tags:
 *       - Bookmarks
 *     summary: Delete a bookmark
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Bookmark ID
 *     responses:
 *       200:
 *         description: Bookmark deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Bookmark not found
 */
router.delete('/:id', BookmarkController.delete);

export default router;