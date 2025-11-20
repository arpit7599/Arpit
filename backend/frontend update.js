// Save personal details to backend
personalForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const data = {
    name: document.getElementById('pName').value,
    rel: document.getElementById('pRel').value,
    phone: document.getElementById('pPhone').value
  };

  try {
    const res = await fetch('http://localhost:5000/api/personal/save', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    const result = await res.json();
    alert(result.message);
  } catch(err) {
    console.error(err);
    alert('Error saving data');
  }
});