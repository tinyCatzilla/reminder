document.addEventListener('DOMContentLoaded', function() {
    document.querySelector("#reminder-form").addEventListener('submit', function(event) {
        event.preventDefault();
        const name = document.querySelector("#reminder-name-input").value;
        const time = document.querySelector("#reminder-time-input").value;
        const reminder = {
            name: name,
            time: time,
            dueAt: time ? new Date(Date.now() + parseTime(time) * 60000).toISOString() : null
          };
    
        // Create the reminder
        if (time) {
        browser.alarms.create(name, {
            delayInMinutes: parseTime(time)
        });
        }
    
        // Save the reminder
        browser.storage.local.set({[name]: reminder});

        // Create a new reminder div
        const reminderDiv = document.createElement('div');
        reminderDiv.className = 'reminder';

        // Create a new h2 for the reminder name and add it to the div
        const reminderName = document.createElement('h2');
        reminderName.textContent = name;
        reminderName.className = 'reminder-name';  // added class for styling
        reminderDiv.appendChild(reminderName);

        // Create a new h1 for the reminder time and add it to the div
        const reminderTime = document.createElement('h2');
        reminderTime.className = 'reminder-time';  // added class for styling
        const parsedTime = parseTime(time);
        if (parsedTime === '') {
            reminderTime.textContent = '';
        } else {
            reminderTime.textContent = formatTime(time);  // formatted time
        }
        reminderDiv.appendChild(reminderTime);
    
        // Start a countdown timer if the reminder is a duration
        if (parsedTime !== '' && !time.match(/^(0?[1-9]|1[012])(:[0-5]\d)?[AaPp][Mm]$/)) {
            let remainingSeconds = parsedTime * 60;
            reminderTime.textContent = secondsToDuration(remainingSeconds);  // formatted time
        
            const timerId = setInterval(function() {
            remainingSeconds--;
            if (remainingSeconds <= 0) {
                clearInterval(timerId);
                reminderTime.textContent = 'Time is up!';
            } else {
                reminderTime.textContent = secondsToDuration(remainingSeconds);
            }
            }, 1000);  // update every second
        
            // Store the timerId to clear it when the reminder is deleted
            reminderDiv.dataset.timerId = timerId;
        }
        reminderDiv.appendChild(reminderTime);

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('reminder-button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', function() {
          // clear the countdown timer
          const timerId = Number(reminderDiv.dataset.timerId);
          clearInterval(timerId);
      
          // clear the alarm
          browser.alarms.clear(name).then(function(wasCleared) {
              if (wasCleared) {
                  console.log("Alarm was cleared");
              } else {
                  console.log("No alarm with such name was found, or failed to clear the alarm");
              }
          });
      
          // Remove the reminder from the DOM
          reminderDiv.remove();
      
          // Remove the reminder from storage
          browser.storage.local.remove(name);
        });      
        reminderDiv.appendChild(deleteButton);
        
    
        // Add the new reminder div to the reminder container
        document.querySelector('#reminder-container').appendChild(reminderDiv);

    });

    // Get all the reminders
    browser.storage.local.get(null, function(items) {
        // `items` is an object with keys that are the names of the reminders
        for (let name in items) {
        const reminder = items[name];
        
        // Create a new reminder div
        const reminderDiv = document.createElement('div');
        reminderDiv.className = 'reminder';

        // Create a new h2 for the reminder name and add it to the div
        const reminderName = document.createElement('h2');
        reminderName.textContent = name;
        reminderName.className = 'reminder-name';  // added class for styling
        reminderDiv.appendChild(reminderName);

        // Create a new h1 for the reminder time and add it to the div
        const reminderTime = document.createElement('h2');
        reminderTime.className = 'reminder-time';  // added class for styling
        const parsedTime = parseTime(reminder.time);
        if (parsedTime === '') {
            reminderTime.textContent = '';
        } else {
            reminderTime.textContent = formatTime(reminder.time);  // formatted time
        }
        reminderDiv.appendChild(reminderTime);
    
        // Start a countdown timer if the reminder is a duration
        if (parsedTime !== '' && !reminder.time.match(/^(0?[1-9]|1[012])(:[0-5]\d)?[AaPp][Mm]$/)) {
          let remainingSeconds = parsedTime - Math.round((new Date() - new Date(reminder.dueAt)) / 1000);
        if (remainingSeconds <= 0) {
            reminderTime.textContent = 'Time is up!';
        } else {
            reminderTime.textContent = secondsToDuration(remainingSeconds);  // formatted time

            const timerId = setInterval(function() {
            remainingSeconds--;
            if (remainingSeconds <= 0) {
                clearInterval(timerId);
                reminderTime.textContent = 'Time is up!';
            } else {
                reminderTime.textContent = secondsToDuration(remainingSeconds);
            }
            }, 1000);  // update every second

            // Store the timerId to clear it when the reminder is deleted
            reminderDiv.dataset.timerId = timerId;
        }
        }
        reminderDiv.appendChild(reminderTime);

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('reminder-button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', function() {
          // clear the countdown timer
          const timerId = Number(reminderDiv.dataset.timerId);
          clearInterval(timerId);
      
          // clear the alarm
          browser.alarms.clear(name).then(function(wasCleared) {
              if (wasCleared) {
                  console.log("Alarm was cleared");
              } else {
                  console.log("No alarm with such name was found, or failed to clear the alarm");
              }
          });
      
          // Remove the reminder from the DOM
          reminderDiv.remove();
      
          // Remove the reminder from storage
          browser.storage.local.remove(name);
        });
        reminderDiv.appendChild(deleteButton);
    
        // Add the new reminder div to the reminder container
        document.querySelector('#reminder-container').appendChild(reminderDiv);
        }
    });

    // Clear all reminders
    document.querySelector("#clear-reminders").addEventListener('click', function(event) {
        // Clear the reminder container
        const container = document.querySelector('#reminder-container');
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    
        // Clear the local storage
        browser.runtime.sendMessage({action: "clear"}).catch(console.error);
    });    
});

function parseTime(time) {
    let units = {
      s: 1 / 60,
      m: 1,
      h: 60,
      d: 60 * 24,
      y: 60 * 24 * 365
    };
  
    if (time.match(/^(0?[1-9]|1[012])(:[0-5]\d)?[AaPp][Mm]$/)) {
      // this is a specific time
      const now = new Date();
      const exactTime = new Date(now.toDateString() + ' ' + time);
      if (isNaN(exactTime)) {
        return '';
      }
      const diff = exactTime - now;
      return diff > 0 ? diff / 60000 : (diff + 24 * 60 * 60 * 1000) / 60000;
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
    let formattedTime = '';
    const timeUnits = rawTime.match(/(\d+)([smhdy]|$)/g);
    const units = {
      s: ' seconds',
      m: ' minutes',
      h: ' hours',
      d: ' days',
      y: ' years'
    };
  
    if(rawTime.match(/^(0?[1-9]|1[012])(:[0-5]\d)?[AaPp][Mm]$/)) {
      // this is a specific time
      return rawTime;
    } else if (rawTime.match(/^\d+$/)) {
      // this is a number without units, assume minutes
      return parseFloat(rawTime) + units['m'];
    } else {
      // try to format the time as a duration
      if (!timeUnits) {
        return formattedTime;
      }
  
      for (let part of timeUnits) {
        const unit = part.slice(-1);
        const value = parseFloat(part.slice(0, -1));
        if (isNaN(value) || !units[unit]) {
          continue;
        }
        formattedTime += value + units[unit] + ', ';
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


  
  
  
  








// // Get all reminders
// browser.storage.local.get().then(reminders => {
//     // Display the reminders
//     for (let name in reminders) {
//       const reminder = reminders[name];
//       const p = document.createElement('p');
//       p.textContent = `Reminder: ${name} at ${reminder.dueAt}`;
//       document.body.appendChild(p);
//     }
//   });
  
// const params = new URLSearchParams(window.location.search);
// const reminderName = params.get('reminder');

// if (reminderName) {
//     // This popup was opened by clicking a notification, so display options for the reminder
//     const options = document.createElement('div');
//     options.innerHTML = `
//         <h2>${reminderName}</h2>
//         <button id="delete">Delete</button>
//         <button id="delay">Delay</button>
//         <button id="keep">Keep</button>
//     `;
//     document.body.appendChild(options);

//     document.querySelector("#delete").addEventListener('click', function() {
//         // Delete the reminder
//         browser.alarms.clear(reminderName);
//         browser.storage.local.remove(reminderName);
//     });

//     document.querySelector("#delay").addEventListener('click', function() {
//         // Display a UI for delaying the reminder
//     });

//     document.querySelector("#keep").addEventListener('click', function() {
//         // Do nothing
//     });
// }


  