// browser.alarms.onCreated.addListener(function(name) {
//   browser.storage.local.get(name, function(result) {
//     const reminder = result[name];
//     // use the reminder...
//   });
// });


browser.alarms.onAlarm.addListener(function(alarm) {
  browser.notifications.create({
    "type": "basic",
    // "icons": {
    //   "48": "reminder.png"
    // },
    "title": "Reminder",
    "message": alarm.name
  });
});

browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'clear') {
      browser.storage.local.clear().catch(console.error);
  }
});




// browser.notifications.onClicked.addListener(function(notificationId) {
// browser.tabs.create({
//     url: `popup/popup.html?reminder=${notificationId}`
// });
// });