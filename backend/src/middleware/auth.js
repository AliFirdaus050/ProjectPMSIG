const jwt = require('jsonwebtoken');

// Memastikan request punya token JWT valid, lalu attach req.user = { id, role }
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan. Silakan login.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
}

// Membatasi endpoint hanya untuk role tertentu, contoh: authorize('it_site_operations')
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Kamu tidak punya akses ke endpoint ini.' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };