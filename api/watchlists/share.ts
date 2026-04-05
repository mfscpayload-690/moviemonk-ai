import type { VercelRequest, VercelResponse } from '../_utils/vercel';
import { applyCors } from '../_utils/cors';
import { sendApiError } from '../_utils/http';

// Simple ID generator (replaces uuid which isn't available)
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

const generatetoken = (): string => {
  return Math.random().toString(36).substring(2, 8); // Short token for URLs
};

// In-memory store (in production, use Supabase)
// Structure: { token: { folderId, folderName, folderColor?, folderIcon?, items, created_by, created_at } }
const sharedWatchlists = new Map<string, any>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { originAllowed } = applyCors(req, res, 'GET, POST, OPTIONS');
  
  if (req.headers.origin && !originAllowed) {
    return sendApiError(res, 403, 'forbidden_origin', 'Origin is not allowed');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    if (req.method === 'GET') {
      const token = req.query.token as string;
      
      if (!token) {
        return sendApiError(res, 400, 'missing_token', 'Share token is required');
      }

      // Fetch shared watchlist
      const shared = sharedWatchlists.get(token);
      
      if (!shared) {
        return sendApiError(res, 404, 'not_found', 'Shared watchlist not found or has expired');
      }

      // Check expiration
      if (shared.expires_at && new Date(shared.expires_at) < new Date()) {
        sharedWatchlists.delete(token);
        return sendApiError(res, 404, 'expired', 'This shared watchlist link has expired');
      }

      // Increment view count
      shared.view_count = (shared.view_count || 0) + 1;

      const response = {
        folderName: shared.folderName,
        folderColor: shared.folderColor,
        folderIcon: shared.folderIcon,
        items: shared.items || [],
        shared_by: shared.created_by || 'User',
        created_at: shared.created_at,
        item_count: (shared.items || []).length
      };

      return res.status(200).json(response);
    }

    if (req.method === 'POST') {
      const { folderName, folderColor, folderIcon, items, created_by, expires_at } = req.body;

      if (!folderName || !items) {
        return sendApiError(res, 400, 'invalid_payload', 'Missing required fields');
      }

      // Generate unique share token
      const shareToken = generatetoken();

      // Store shared watchlist
      const sharedData = {
        id: generateId(),
        folderName,
        folderColor,
        folderIcon,
        items,
        created_by: created_by || 'Anonymous',
        created_at: new Date().toISOString(),
        expires_at: expires_at || null,
        view_count: 0,
        is_public: true,
        share_token: shareToken
      };

      sharedWatchlists.set(shareToken, sharedData);

      // Auto-cleanup expired shares after expiration time
      if (expires_at) {
        const expiryTime = new Date(expires_at).getTime() - Date.now();
        if (expiryTime > 0) {
          setTimeout(() => {
            sharedWatchlists.delete(shareToken);
          }, expiryTime);
        }
      }

      return res.status(201).json({
        success: true,
        share_token: shareToken,
        share_url: `${process.env.APP_URL || 'https://moviemonk-ai.vercel.app'}/watchlists/share?token=${shareToken}`,
        expires_at: expires_at || null,
        view_count: 0
      });
    }

    return sendApiError(res, 405, 'method_not_allowed', 'Method not allowed');
  } catch (error) {
    console.error('Watchlist share error:', error);
    return sendApiError(res, 500, 'server_error', 'Failed to process watchlist share');
  }
}
