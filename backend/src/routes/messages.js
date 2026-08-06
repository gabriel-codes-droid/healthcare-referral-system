const express = require('express');
const Referral = require('../models/Referral');
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');
const { audit } = require('../services/audit');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const router = express.Router();
const streams = new Map();

async function allowed(req, referral) {
  if (req.user.role === 'admin') return true;
  if (req.user.role === 'patient') { const patient = await require('../models/Patient').findOne({ email: req.user.email }); return Boolean(patient && referral.patientId.toString() === patient._id.toString()); }
  return [referral.fromOrganization, referral.toOrganization].includes(req.user.organization);
}
router.get('/referral/:referralId', auth, async (req, res) => {
  const referral = await Referral.findById(req.params.referralId);
  if (!referral || !(await allowed(req, referral))) return res.status(403).json({ error: 'Not authorized for this conversation' });
  res.json(await Message.find({ referralId: referral._id }).sort({ createdAt: 1 }));
});
router.get('/stream', (req, res) => {
  try {
    const user = jwt.verify(req.query.token, JWT_SECRET);
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' });
    res.write(': connected\n\n');
    streams.set(res, user);
    req.on('close', () => streams.delete(res));
  } catch { res.status(401).end(); }
});
router.post('/referral/:referralId', auth, async (req, res) => {
  const referral = await Referral.findById(req.params.referralId);
  if (!referral || !(await allowed(req, referral))) return res.status(403).json({ error: 'Not authorized for this conversation' });
  if (!req.body.body?.trim()) return res.status(400).json({ error: 'Message is required' });
  const message = await Message.create({ referralId: referral._id, senderId: req.user.id, senderName: req.user.name, body: req.body.body });
  for (const [stream, user] of streams) {
    if (await allowed({ user }, referral)) stream.write(`event: message\ndata: ${JSON.stringify(message)}\n\n`);
  }
  audit(req, 'message.created', 'Referral', referral._id);
  res.status(201).json(message);
});
module.exports = router;
