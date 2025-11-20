const express = require('express');
const router = express.Router();
const SOS = require('../models/SOS');

// Save SOS trigger
router.post('/send', async (req,res)=>{
  try{
    const { note, location } = req.body;
    const data = new SOS({ note, location });
    await data.save();
    res.status(200).json({ message: 'SOS triggered and saved!' });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
});

// Get all SOS history
router.get('/history', async (req,res)=>{
  try{
    const data = await SOS.find().sort({ timestamp: -1 }).limit(50);
    res.status(200).json(data);
  }catch(err){
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;