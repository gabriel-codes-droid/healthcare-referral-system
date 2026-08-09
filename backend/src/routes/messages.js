const express = require('express');
const Message = require('../models/Message');
const Referral = require('../models/Referral');
const { auth } = require('../middleware/auth');

const router = express.Router();

async function assertAccess(req, res, referralId) {
  const referral = await Referral.findById(referralId);
  if (!referral) {
    res.status(404).json({ error: 'Referral not found' });
    return null;
  }

  const isParty =
    req.user.role === 'admin' ||
    req.user.organization === referral.fromOrganization ||
    req.user.organization === referral.toOrganization;

  if (!isParty) {
    res.status(403).json({ error: 'You are not part of this referral' });
    return null;
  }

  return referral;
}

router.get('/:referralId', auth, async (req, res) => {
  try {
    const referral = await assertAccess(req, res, req.params.referralId);
    if (!referral) return;

    const messages = await Message.find({ referralId: req.params.referralId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/:referralId', auth, async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  try {
    const referral = await assertAccess(req, res, req.params.referralId);
    if (!referral) return;

    const message = new Message({
      referralId: req.params.referralId,
      senderName: req.user.name,
      senderOrg: req.user.organization,
      text: text.trim()
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
