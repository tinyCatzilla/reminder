document.querySelector("#reminder-form").addEventListener('submit', function(event) {
    event.preventDefault();
    const name = document.querySelector("#reminder-name").value;
    const time = document.querySelector("#reminder-time").value;
  
    // Create the reminder
    if (time) {
      browser.alarms.create(name, {
        delayInMinutes: parseTime(time)
      });
    }
  
    // Save the reminder
    browser.storage.local.set({
      [name]: {
        time: time,
        dueAt: time ? new Date(Date.now() + parseTime(time) * 60000).toISOString() : null
      }
    });
  });

function parseTime(time) {
const match = time.match(/(\d+)([smhdy]|$)/g);
if (!match) {
    // Assume this is an exact time and calculate how many minutes until that time.
    if(time.length !== 4) { return; }
    const now = new Date();
    const exactTime = new Date(now.toDateString() + ' ' + time);
    if (isNaN(exactTime)) {
    throw new Error('Invalid exact time: ' + time);
    }
    const diff = exactTime - now;
    return diff > 0 ? diff / 60000 : (diff + 24 * 60 * 60 * 1000) / 60000;
}

const units = {
    s: 1 / 60,
    m: 1,
    h: 60,
    d: 60 * 24,
    y: 60 * 24 * 365
};

let total = 0;
for (let part of match) {
    const unit = part.slice(-1);
    const value = parseFloat(part.slice(0, -1));
    if (isNaN(value) || !units[unit]) {
    throw new Error('Invalid time part: ' + part);
    }
    total += value * units[unit];
}

return total;
}
  
