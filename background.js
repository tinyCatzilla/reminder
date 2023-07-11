browser.alarms.onAlarm.addListener(function(alarm) {
    browser.notifications.create({
      "type": "basic",
      "icons": {
        "48": "reminder.png"
      },
      "title": "Reminder",
      "message": alarm.name
    });
  });

browser.notifications.onClicked.addListener(function(notificationId) {
// Open the popup (or a new tab) and pass the notificationId (which should be the reminder name) to it
browser.tabs.create({
    url: `popup/popup.html?reminder=${notificationId}`
});
});