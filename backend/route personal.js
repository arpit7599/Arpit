const express = require('express');
const router = express.Router();
const Personal = require('../models/Personal');

// Save personal details
router.post('/save', async (req, res) => {
  try {
    const { name, relation, phone } = req.body;
    const data = new Personal({ name, relation, phone });
    await data.save();
    res.status(200).json({ message: 'Saved successfully' });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Get last saved details
router.get('/', async (req,res)=>{
  try {
    const data = await Personal.find().sort({ createdAt: -1 }).limit(1);
    res.status(200).json(data[0] || {});
  } catch(err){
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;