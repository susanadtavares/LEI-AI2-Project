const jwt = require("jsonwebtoken");
const { verifyToken } = require("../../utils/tokenutils");
const db = require("../database/db");
const controllers = {};

// Helper function to promisify database queries
const queryAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

const getUserRole = async (userId) => {
//   try {
//     // Check if user is GESTOR (highest priority)
//     const gestorResults = await queryAsync(
//       `SELECT 1 FROM gestor WHERE id_utilizador = ? AND gestor_ativo = TRUE`,
//       [userId]
//     );
    
//     if (gestorResults.length > 0) {
//       return 'Gestor';
//     }

//     // Check if user is both FORMADOR and FORMANDO
//     const formadorResults = await queryAsync(
//       `SELECT 1 FROM formador WHERE id_utilizador = ? AND formador_ativo = TRUE`,
//       [userId]
//     );
    
//     const formandoResults = await queryAsync(
//       `SELECT 1 FROM formando WHERE id_utilizador = ? AND formando_ativo = TRUE`,
//       [userId]
//     );

//     const isFormador = formadorResults.length > 0;
//     const isFormando = formandoResults.length > 0;

//     // Return appropriate role based on what the user is
//     if (isFormador && isFormando) {
//       return 'Formador/Formando';
//     } else if (isFormador) {
//       return 'Formador';
//     } else if (isFormando) {
//       return 'Formando';
//     }

//     // If user has no active roles
//     return null;

//   } catch (error) {
//     console.error("Error checking user role:", error);
//     return null;
//   }
return 'Gestor';
};

controllers.validation = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Not authorized, no token" 
      });
    }

    let user;
    let encryptedToken;

    // Handle both encrypted and regular tokens
    try {
      // Try to parse as JSON (encrypted token)
      encryptedToken = JSON.parse(token);
      console.log('Encrypted token received:', encryptedToken);
      user = verifyToken(encryptedToken);
    } catch (parseError) {
      // If parsing fails, treat as regular JWT token
      console.log('Regular token received, falling back to standard verification');
      user = jwt.verify(token, process.env.JWT_SECRET);
    }

    if (!user) {
      return res.status(403).json({ 
        success: false,
        message: "Invalid token" 
      });
    }

    // Get user role from database
    const userRole = await getUserRole(user.id || user.userId);
    
    // Add role to user object
    user.role = userRole;

    console.log('Authenticated user:', {
      id: user.id || user.userId,
      username: user.username,
      role: userRole
    });

    req.user = user;
    next();

  } catch (error) {
    console.error("Validation error:", error);

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        success: false,
        message: "Token expired",
        code: "TOKEN_EXPIRED"
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
        code: "TOKEN_INVALID"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
};

// Enhanced version without encryption
controllers.validation_noenc = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Not authorized, no token" 
      });
    }

    // Verify JWT token
    const user = jwt.verify(token, process.env.JWT_SECRET);

    if (!user) {
      return res.status(403).json({ 
        success: false,
        message: "Invalid token" 
      });
    }

    // Get user role from database
    const userRole = await getUserRole(user.id || user.userId);
    user.role = userRole;

    console.log('Authenticated user (no encryption):', {
      id: user.id || user.userId,
      username: user.username,
      role: userRole
    });

    req.user = user;
    next();

  } catch (error) {
    console.error("Validation error (no encryption):", error);

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        success: false,
        message: "Token expired",
        code: "TOKEN_EXPIRED"
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        code: "TOKEN_INVALID"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
};


controllers.requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (!req.user.role) {
      return res.status(403).json({
        success: false,
        message: "User role not determined"
      });
    }

    // Convert allowedRoles to array if it's a string
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Utility function to check if user has specific role
controllers.hasRole = (user, role) => {
  if (!user || !user.role) return false;
  
  return user.role === role;
};

module.exports = controllers;