const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kenaya_logistics_super_secret_jwt_key_2026_congo_brazza';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Accès non autorisé : jeton d\'authentification manquant.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé : session expirée ou jeton invalide.'
      });
    }
    req.user = decoded;
    next();
  });
}

module.exports = {
  authenticateToken,
  JWT_SECRET
};

