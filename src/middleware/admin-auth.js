import { supabase } from "../config/supabase.js";

export const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    const accessToken = authHeader.substring(7).trim();

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "Authentication token is missing.",
      });
    }

    if (!supabase) {
      return res.status(503).json({
        success: false,
        error: "Supabase database client is not configured.",
      });
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired authentication token.",
      });
    }

    const role = user.user_metadata?.role;

    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Admin access required.",
      });
    }

    req.adminUser = user;

    next();
  } catch (error) {
    console.error("[Admin Auth Error]:", error);

    return res.status(401).json({
      success: false,
      error: "Authentication failed.",
    });
  }
};
