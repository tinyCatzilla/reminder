// Get all reminders
browser.storage.local.get().then(reminders => {
    // Display the reminders
    for (let name in reminders) {
      const reminder = reminders[name];
      const p = document.createElement('p');
      p.textContent = `Reminder: ${name} at ${reminder.dueAt}`;
      document.body.appendChild(p);
    }
  });
  
const params = new URLSearchParams(window.location.search);
const reminderName = params.get('reminder');

if (reminderName) {
// This popup was opened by clicking a notification, so display options for the reminder
const options = document.createElement('div');
options.innerHTML = `
    <h2>${reminderName}</h2>
    <button id="delete">Delete</button>
    <button id="delay">Delay</button>
    <button id="keep">Keep</button>
`;
document.body.appendChild(options);

document.querySelector("#delete").addEventListener('click', function() {
    // Delete the reminder
    browser.alarms.clear(reminderName);
    browser.storage.local.remove(reminderName);
});

document.querySelector("#delay").addEventListener('click', function() {
    // Display a UI for delaying the reminder
});

document.querySelector("#keep").addEventListener('click', function() {
    // Do nothing
});
}
  