const express = require('express');
const router = express.Router();
const FakeCall = require('../models/FakeCall');

// Save Fake Call trigger
router.post('/trigger', async (req,res)=>{
  try{
    const { caller } = req.body;
    const data = new FakeCall({ caller });
    await data.save();
    res.status(200).json({ message: 'Fake call triggered and saved!' });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
});

// Get last 50 fake calls
router.get('/history', async (req,res)=>{
  try{
    const data = await FakeCall.find().sort({ timestamp: -1 }).limit(50);
    res.status(200).json(data);
  }catch(err){
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;