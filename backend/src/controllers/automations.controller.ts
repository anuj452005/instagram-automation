import { Request, Response, NextFunction } from 'express';
import { AutomationsService } from '../services/automations.service';

/**
 * POST /api/automations
 * Creates a new automation trigger flow.
 */
export const createAutomation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User session not synchronized.',
        },
      });
      return;
    }

    const payload = req.body;
    const automation = await AutomationsService.createAutomation(user.id, payload);

    res.status(201).json(automation);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED_ACCOUNT') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to configure automations for this Instagram account.',
        },
      });
      return;
    }
    next(error);
  }
};

/**
 * GET /api/automations
 * Retrieves all automations for the authenticated creator.
 */
export const getAutomations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User session not synchronized.',
        },
      });
      return;
    }

    const list = await AutomationsService.getAutomations(user.id);
    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/automations/:id
 * Retrieves a single automation detail.
 */
export const getAutomationById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User session not synchronized.',
        },
      });
      return;
    }

    const { id } = req.params;
    const automation = await AutomationsService.getAutomationById(user.id, id);

    res.status(200).json(automation);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Automation campaign not found.',
        },
      });
      return;
    }
    next(error);
  }
};

/**
 * PUT /api/automations/:id
 * Updates an existing automation flow and keyword configuration.
 */
export const updateAutomation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User session not synchronized.',
        },
      });
      return;
    }

    const { id } = req.params;
    const payload = req.body;
    const updated = await AutomationsService.updateAutomation(user.id, id, payload);

    res.status(200).json(updated);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Automation campaign not found.',
        },
      });
      return;
    }
    if (error.message === 'UNAUTHORIZED_ACCOUNT') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to assign this Instagram account to the automation.',
        },
      });
      return;
    }
    next(error);
  }
};

/**
 * DELETE /api/automations/:id
 * Deletes an automation campaign and cascades deletion to keywords.
 */
export const deleteAutomation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User session not synchronized.',
        },
      });
      return;
    }

    const { id } = req.params;
    await AutomationsService.deleteAutomation(user.id, id);

    res.status(200).json({
      success: true,
      message: 'Automation campaign deleted successfully.',
    });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Automation campaign not found.',
        },
      });
      return;
    }
    next(error);
  }
};
