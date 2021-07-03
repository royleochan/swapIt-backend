const { Expo } = require("expo-server-sdk");

// Create a new Expo SDK client
const expo = new Expo();

const sendPushNotification = async (targetExpoPushToken, title, body) => {
  // Check that target push token is valid
  // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
  if (!Expo.isExpoPushToken(targetExpoPushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
  }

  const chunks = expo.chunkPushNotifications([
    { to: targetExpoPushToken, sound: "default", title, body },
  ]);

  let ticket;
  try {
    const ticketChunk = await expo.sendPushNotificationsAsync(chunks[0]);
    ticket = ticketChunk;
  } catch (error) {
    // ticket contains error
    console.error(error);
  }

  let receiptId;
  if (ticket.id) {
    receiptId = ticket.id;
  }

  let receiptIdChunks = expo.chunkPushNotificationReceiptIds([receiptId]);
  (async () => {
    try {
      const receipt = await expo.getPushNotificationReceiptsAsync(
        receiptIdChunks[0]
      );

      // The receipts specify whether Apple or Google successfully received the
      // notification and information about an error, if one occurred.
      let { status, message, details } = receipt;
      if (status === "error") {
        console.error(`There was an error sending a notification: ${message}`);
        if (details && details.error) {
          // The error codes are listed in the Expo documentation:
          // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
          // You must handle the errors appropriately.
          console.error(`The error code is ${details.error}`);
        }
      }
    } catch (error) {
      console.error(error);
    }
  })();
};

module.exports = sendPushNotification;
