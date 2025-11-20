// ====== Utilities & State ======
let currentLat = null, currentLng = null;
const mapEl = document.getElementById('map');
let map, marker, accuracyCircle, watchId = null;

// Initialize Map (Leaflet)
function initMap() {
  map = L.map('map', { zoomControl: true }).setView([20.5937, 78.9629], 5); // India center
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);
  // ensure size calculation after CSS/layout settled
  setTimeout(() => { try { map.invalidateSize(); } catch(e){} }, 250);
}
initMap();

// Helper: haversine distance in meters
function distanceMeters(lat1, lon1, lat2, lon2) {
  function toRad(v){return v*Math.PI/180;}
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(lat1))*Math.cos(toRad(lat2)) * Math.sin(dLon/2)*Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Handle a new position (update UI, marker and accuracy circle)
function handlePosition(pos, showMsg = false) {
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  const acc = pos.coords.accuracy || 0;
  const now = new Date();
  const prevLat = currentLat, prevLng = currentLng;
  currentLat = lat; currentLng = lng;

  document.getElementById('currentLocText').innerText = `Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  document.getElementById('timeText').innerText = `Time: ${now.toLocaleString()}`;

  if (!marker) {
    marker = L.marker([lat, lng]).addTo(map).bindPopup('You are here');
    marker.openPopup();
  } else {
    marker.setLatLng([lat, lng]);
  }

  // accuracy circle
  if (!accuracyCircle) {
    accuracyCircle = L.circle([lat, lng], { radius: acc, color: '#3b82f6', fillColor: '#bfdbfe', fillOpacity: 0.35 }).addTo(map);
  } else {
    accuracyCircle.setLatLng([lat, lng]);
    accuracyCircle.setRadius(acc);
  }

  // Pan/fly map when moved more than small threshold to avoid jitter
  let shouldPan = true;
  if (prevLat !== null && prevLng !== null) {
    const moved = distanceMeters(prevLat, prevLng, lat, lng);
    // only pan if moved > 3 meters
    shouldPan = moved > 3;
  }
  if (shouldPan) {
    try { map.panTo([lat, lng], { animate: true, duration: 0.7 }); }
    catch(e) { map.setView([lat, lng]); }
  }

  if (showMsg) console.log('Position updated (watch).');
}

// Start continuous tracking (live updates)
function startWatch() {
  if (!navigator.geolocation) {
    alert('Geolocation not supported by browser.');
    return;
  }
  if (watchId !== null) return; // already watching
  watchId = navigator.geolocation.watchPosition((pos) => {
    handlePosition(pos, true);
  }, (err) => {
    console.error('watchPosition error', err);
    if (err.code === 1) alert('Permission denied for location. Allow location and refresh.');
    else alert('Unable to retrieve location. Please try again.');
  }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 });
  // also request an initial location immediately
  navigator.geolocation.getCurrentPosition((p) => handlePosition(p, false), () => {}, { enableHighAccuracy: true });
}

function stopWatch() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

// Compatibility: one-off update function used in older code
function updateLocationOnce(showMsg = true) {
  if (!navigator.geolocation) {
    if (showMsg) alert('Geolocation not supported by browser.');
    return;
  }
  navigator.geolocation.getCurrentPosition((pos) => {
    handlePosition(pos, showMsg);
  }, (err) => {
    console.error('getCurrentPosition error', err);
    if (err.code === 1) {
      if (showMsg) alert('Permission denied for location. Allow location and refresh.');
    } else {
      if (showMsg) alert('Unable to retrieve location. Please try again.');
    }
  }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
}

// We use continuous watchPosition for live updates. Keep a fallback one-off update every 30s if needed.
setInterval(() => {
  if (document.visibilityState === 'visible' && watchId === null) {
    // If watch isn't active (e.g., denied), try a one-off update
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition((p)=>handlePosition(p,false));
  }
}, 30000);

// ===== Buzz Alert =====
document.getElementById('buzzBtn').addEventListener('click', () => {
  const audio = document.getElementById('buzzSound');
  audio.currentTime = 0;
  audio.play().catch(() => {});
  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
  let i = 0;
  const iv = setInterval(() => {
    audio.play().catch(() => {});
    i++;
    if (i > 6) clearInterval(iv);
  }, 400);
});

// ===== Share / Copy Location =====
document.getElementById('openMap').addEventListener('click', async () => {
  updateLocationOnce();
  document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
});

function makeMapsLink() {
  if (currentLat === null || currentLng === null) return "https://www.google.com/maps";
  return `https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`;
}

document.getElementById('copyLoc').addEventListener('click', async () => {
  const link = makeMapsLink();
  try {
    await navigator.clipboard.writeText(link);
    alert('Location link copied to clipboard');
  } catch (e) {
    prompt('Copy this link', link);
  }
});

document.getElementById('shareLoc').addEventListener('click', async () => {
  const link = makeMapsLink();
  const shareData = { title: 'My live location', text: 'I am here', url: link };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (e) {
      alert('Share canceled');
    }
  } else {
    try {
      await navigator.clipboard.writeText(link);
      alert('No share API — link copied to clipboard');
    } catch {
      prompt('Share this link', link);
    }
  }
});

// ===== Simulate Panic Shake =====
let shakeEnabled = false;
let lastAccel = { x: null, y: null, z: null };

function handleMotion(e) {
  if (!shakeEnabled) return;
  const a = e.accelerationIncludingGravity;
  if (!a || lastAccel.x === null) {
    lastAccel = a;
    return;
  }
  const dx = Math.abs(a.x - lastAccel.x);
  const dy = Math.abs(a.y - lastAccel.y);
  const dz = Math.abs(a.z - lastAccel.z);
  lastAccel = a;
  const total = dx + dy + dz;
  if (total > 30) triggerSOS('Shake detected — auto SOS');
}

document.getElementById('enableShake').addEventListener('click', () => {
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission().then(res => {
      if (res === 'granted') {
        window.addEventListener('devicemotion', handleMotion);
        shakeEnabled = true;
        alert('Shake enabled');
      }
    }).catch(() => alert('Permission for motion not granted'));
  } else {
    window.addEventListener('devicemotion', handleMotion);
    shakeEnabled = true;
    alert('Shake enabled');
  }
});

document.getElementById('disableShake').addEventListener('click', () => {
  shakeEnabled = false;
  window.removeEventListener('devicemotion', handleMotion);
  alert('Shake disabled');
});

// ===== Fake Call =====
document.getElementById('fakeCallBtn').addEventListener('click', () => {
  const modal = document.getElementById('incomingModal');
  modal.classList.remove('hidden');
});

document.getElementById('acceptCall').addEventListener('click', () => {
  document.getElementById('incomingModal').classList.add('hidden');
  alert('Call accepted (fake)');
});

document.getElementById('declineCall').addEventListener('click', () => {
  document.getElementById('incomingModal').classList.add('hidden');
});

// ===== SOS Message =====
function triggerSOS(note = 'SOS') {
  updateLocationOnce(false);
  const link = makeMapsLink();
  const message = `${note} — I need help. My location: ${link}`;
  if (navigator.share) {
    navigator.share({ title: 'SOS', text: message, url: link }).catch(() => {});
  }
  const sms = `sms:?&body=${encodeURIComponent(message)}`;
  window.open(sms, '_self');
}

document.getElementById('sosBtn').addEventListener('click', () => triggerSOS('Emergency!'));

document.getElementById('sosShare').addEventListener('click', () => {
  updateLocationOnce(false);
  const link = makeMapsLink();
  const message = `I need help — ${link}`;
  if (navigator.share) {
    navigator.share({ title: 'Help', text: message, url: link });
  } else {
    navigator.clipboard.writeText(message).then(() => alert('Message copied to clipboard'));
  }
});

// ===== Personal Details save to localStorage =====
const personalForm = document.getElementById('personalForm');
personalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = {
    name: document.getElementById('pName').value,
    rel: document.getElementById('pRel').value,
    phone: document.getElementById('pPhone').value
  };
  localStorage.setItem('empowher_personal', JSON.stringify(data));
  alert('Saved');
});

document.getElementById('clearPersonal').addEventListener('click', () => {
  localStorage.removeItem('empowher_personal');
  document.getElementById('pName').value = '';
  document.getElementById('pRel').value = '';
  document.getElementById('pPhone').value = '';
  alert('Cleared');
});

window.addEventListener('load', () => {
  const saved = localStorage.getItem('empowher_personal');
  if (saved) {
    const d = JSON.parse(saved);
    document.getElementById('pName').value = d.name || '';
    document.getElementById('pRel').value = d.rel || '';
    document.getElementById('pPhone').value = d.phone || '';
  }
  // start continuous live tracking
  startWatch();
});

// ===== Nearby search =====
document.getElementById('nearPolice').addEventListener('click', () => {
  window.open('https://www.google.com/maps/search/police+station+near+me', '_blank');
});

document.getElementById('nearHospital').addEventListener('click', () => {
  window.open('https://www.google.com/maps/search/hospital+near+me', '_blank');
});

// ===== Theme toggle =====
document.getElementById('themeToggle').addEventListener('click', (e) => {
  const btn = e.currentTarget;
  document.documentElement.classList.toggle('dark');
  if (document.documentElement.classList.contains('dark')) {
    document.body.classList.add('bg-gray-900', 'text-white');
    btn.innerText = '☀️ Day';
  } else {
    document.body.classList.remove('bg-gray-900','text-white');
     btn.innerText = '🌙 Night';
  }
    });