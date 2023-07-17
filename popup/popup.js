document.addEventListener('DOMContentLoaded', function() {

    // Event listener for the reminder form
  document.querySelector("#reminder-form").addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.querySelector("#reminder-name-input").value;
    const time = document.querySelector("#reminder-time-input").value;
    const reminder = {
      name: name,
      time: time,
      dueAt: time ? new Date(Date.now() + parseTime(time) * 1000).toISOString() : null
    };

    if (parseTime(time) > 0) {
      browser.alarms.create(name, {
        delayInMinutes: parseTime(time) / 60
      });
    }

    browser.storage.local.set({[name]: reminder});

    const reminderDiv = createReminderDiv(name, time, reminder.dueAt);
    document.querySelector('#reminder-container').appendChild(reminderDiv);
  });

  // Get all the reminders
  browser.storage.local.get(null, function(items) {
    for (let name in items) {
      const reminder = items[name];
      const reminderDiv = createReminderDiv(name, reminder.time, reminder.dueAt);
      document.querySelector('#reminder-container').appendChild(reminderDiv);
    }
  });

  // Clear all reminders
  document.querySelector("#clear-reminders").addEventListener('click', function(event) {
    event.preventDefault();

    const container = document.querySelector('#reminder-container');
    Array.from(container.children).forEach((child) => {
      const timerId = Number(child.dataset.timerId);
      clearInterval(timerId);
    });

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    browser.storage.local.clear();
  });


  document.querySelector('#settings-icon').addEventListener('click', toggleSettingsMenu);
  document.querySelector("#mode-switch").addEventListener('change', handleModeSwitch);
  loadUserPreferences();

});

window.addEventListener('beforeunload', function() {
  stopCountdown();
});


const createReminderDiv = (name, time, dueAt) => {
  const reminderDiv = document.createElement('div');
  reminderDiv.className = 'reminder';

  const reminderName = document.createElement('h2');
  reminderName.textContent = name;
  reminderName.className = 'reminder-name';
  reminderDiv.appendChild(reminderName);

  const reminderTime = document.createElement('h2');
  reminderTime.className = 'reminder-time';
  reminderDiv.appendChild(reminderTime);

  const deleteButton = document.createElement('button');
  deleteButton.classList.add('reminder-button');
  deleteButton.textContent = 'Delete';
  deleteButton.addEventListener('click', function() {
    deleteReminder(name, reminderDiv);
  });
  reminderDiv.appendChild(deleteButton);

  const parsedTime = parseTime(time);
  if (parsedTime !== '') {
    if (dueAt) {
      let currentTime = new Date();
      let dueTime = new Date(dueAt);
      let remainingSeconds = Math.round((dueTime - currentTime) / 1000);

      if (remainingSeconds <= 0) {
        reminderTime.textContent = 'Time is up!';
      } else {
        reminderTime.textContent = secondsToDuration(remainingSeconds);
        startCountdown(reminderTime, remainingSeconds);
      }
    } else {
      reminderTime.textContent = formatTime(time);
      if (parsedTime > 0) {
        startCountdown(reminderTime, parsedTime);
      }
    }
  } else {
    reminderTime.textContent = '';
  }

  return reminderDiv;
};

// Starts a countdown timer
const startCountdown = (reminderTime, remainingSeconds) => {
  const timerId = setInterval(function() {
    remainingSeconds--;
    if (remainingSeconds <= 0) {
      clearInterval(timerId);
      reminderTime.textContent = 'Time is up!';
    } else {
      reminderTime.textContent = secondsToDuration(remainingSeconds);
    }
  }, 1000);

  reminderTime.parentElement.dataset.timerId = timerId;
};

// Deletes a reminder
const deleteReminder = (name, reminderDiv) => {
  const timerId = Number(reminderDiv.dataset.timerId);
  clearInterval(timerId);

  browser.alarms.clear(name);
  reminderDiv.remove();
  browser.storage.local.remove(name);
};
function parseTime(time) {
  let units = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
    y: 60 * 60 * 24 * 365
  };

  if (time.match(/^(0?[1-9]|1[012])(:[0-5]\d)?[AaPp][Mm]$/)) {
    // this is a specific time
    const now = new Date();
    let [hour, minute] = time.split(/[:\s]/); // split on colon or space
    minute = minute || 0; // default to 0 if no minute is provided
    const period = time.slice(-2).toUpperCase();
    
    if (period === "PM" && hour < 12) hour = +hour + 12;
    if (period === "AM" && hour == 12) hour = 0;
  
    const exactTime = new Date(now.setHours(hour, minute));
  
    if (isNaN(exactTime)) {
      return '';
    }
    const diff = exactTime - now;
    return diff > 0 ? diff / 1000 : (diff + 24 * 60 * 60 * 1000) / 1000;
  } else if (time.match(/^\d+$/)) {
    // this is a number without units, assume minutes
    return parseFloat(time) * units['m'];
  } else {
    // try to parse the time as a duration
    const match = time.match(/(\d+)([smhdy]|$)/g);
    if (!match) {
      return '';
    }

    let total = 0;
    for (let part of match) {
      const unit = part.slice(-1);
      const value = parseFloat(part.slice(0, -1));
      if (isNaN(value) || !units[unit]) {
        return '';
      }
      total += value * units[unit];
    }

    return total;
  }
}


  function formatTime(rawTime) {
    const units = {
        s: 1,
        m: 60,
        h: 60 * 60,
        d: 24 * 60 * 60,
        y: 365 * 24 * 60 * 60,
    };

    if (rawTime.match(/^(0?[1-9]|1[012])(:[0-5]\d)?[AaPp][Mm]$/)) {
      return rawTime;
    } else if (rawTime.match(/^\d+$/)) {
        // this is a number without units, assume minutes
        return parseFloat(rawTime) + ' minutes';
    } else {
        // try to format the time as a duration
        let totalSeconds = 0;
        const timeUnits = rawTime.match(/(\d+)([smhdy]|$)/g);
        if (!timeUnits) {
            return '';
        }

        for (let part of timeUnits) {
            const unit = part.slice(-1);
            const value = parseFloat(part.slice(0, -1));
            if (isNaN(value) || !units[unit]) {
                continue;
            }
            totalSeconds += value * units[unit];
        }

        let formattedTime = '';
        if (totalSeconds / units['y'] >= 1) {
            let years = Math.floor(totalSeconds / units['y']);
            totalSeconds %= units['y'];
            formattedTime += years + ' years, ';
        }
        if (totalSeconds / units['d'] >= 1) {
            let days = Math.floor(totalSeconds / units['d']);
            totalSeconds %= units['d'];
            formattedTime += days + ' days, ';
        }
        if (totalSeconds / units['h'] >= 1) {
            let hours = Math.floor(totalSeconds / units['h']);
            totalSeconds %= units['h'];
            formattedTime += hours + ' hours, ';
        }
        if (totalSeconds / units['m'] >= 1) {
            let minutes = Math.floor(totalSeconds / units['m']);
            totalSeconds %= units['m'];
            formattedTime += minutes + ' minutes, ';
        }
        if (totalSeconds > 0) {
            formattedTime += totalSeconds + ' seconds, ';
        }
  
        // Remove trailing comma and space
        if (formattedTime.length > 2) {
            formattedTime = formattedTime.slice(0, -2);
        }

        return formattedTime;
    }
}


  function secondsToDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60); // Rounded seconds

    let duration = '';
    if (hrs > 0) {
        duration += hrs + ' hours ';
    }
    if (mins > 0) {
        duration += mins + ' minutes ';
    }
    if (secs > 0) {
        duration += secs + ' seconds ';
    }

    // Remove trailing space
    if (duration.length > 0) {
        duration = duration.slice(0, -1);
    }

    return duration;
}

const toggleSettingsMenu = () => {
  const settingsMenu = document.querySelector('#settings-menu');
  const reminderMenu = document.querySelector('.reminder-menu');
  if (settingsMenu.style.display === 'none') {
    settingsMenu.style.display = 'block';
    reminderMenu.style.display = 'none';
  } else {
      settingsMenu.style.display = 'none';
      reminderMenu.style.display = 'block';
  }
}

const handleModeSwitch = (initial=false) => {
  const lightMode = document.querySelector("#mode-switch").checked;
  // Apply the new mode
  if (lightMode) {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }

  // Save the user's preference if this isn't the initial run
  if (!initial) {
    localStorage.setItem('lightMode', lightMode);
  }
}

const loadUserPreferences = () => {
  // Load the user's preference
  let lightMode = localStorage.getItem('lightMode') === 'true';
  document.querySelector("#mode-switch").checked = lightMode;
  handleModeSwitch(true); // Apply the user's preference
}


  
  
  
  




  