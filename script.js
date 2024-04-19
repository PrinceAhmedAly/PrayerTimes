const methodSelect = document.getElementById('method');
const prayerTimesDiv = document.getElementById('prayer-times');
const countdownDiv = document.getElementById('countdown');

function getPrayerTimes(latitude, longitude) {
  const method = methodSelect.value;
  const date = new Date().toLocaleDateString('en-GB').split('/').reverse().join('-'); // Format: DD-MM-YYYY

  const url = `http://api.aladhan.com/v1/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=${method}`;

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Invalid response from server');
      }
      return response.json();
    })
    .then(data => {
      if (!data || !data.data || !data.data.timings) {
        throw new Error('Invalid data format');
      }

      const prayerTimes = data.data.timings;

      // Display prayer times in a user-friendly format
      let output = `<h3>Prayer Times for your location at ${data.data.date.readable}</h3><br>`;
      for (const [prayerName, time] of Object.entries(prayerTimes)) {
        output += `${prayerName}: ${time}<br>`;
      }

      prayerTimesDiv.innerHTML = output;

      // Set up countdown timer for the next prayer
      setNextPrayerCountdown(prayerTimes);
    })
    .catch(error => {
      console.error('Error fetching prayer times:', error);
      prayerTimesDiv.innerHTML = `<b>Error:</b> Could not retrieve prayer times. Please reload the page`;
    });
}

function setNextPrayerCountdown(prayerTimes) {
  const updateCountdown = () => {
    const now = new Date();
    let nextPrayerTime = null;

    // Find the next prayer time that is after the current time
    for (const [prayerName, time] of Object.entries(prayerTimes)) {
      const prayerTimeParts = time.split(':');
      const prayerHour = parseInt(prayerTimeParts[0]);
      const prayerMinute = parseInt(prayerTimeParts[1]);

      const prayerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), prayerHour, prayerMinute);
      if (prayerDate > now && (!nextPrayerTime || prayerDate < nextPrayerTime)) {
        nextPrayerTime = prayerDate;
      }
    }

    if (!nextPrayerTime) {
      countdownDiv.textContent = 'No upcoming prayer times today.';
      return;
    }

    const difference = nextPrayerTime - now;
    if (difference <= 0) {
      countdownDiv.textContent = 'Next prayer time has arrived.';
      return;
    }

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    countdownDiv.textContent = `Next prayer in: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// Get user's geolocation
navigator.geolocation.getCurrentPosition(position => {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  getPrayerTimes(latitude, longitude);
}, error => {
  console.error('Error getting geolocation:', error);
  prayerTimesDiv.innerHTML = `<b>Error:</b> Could not retrieve geolocation.`;
});
