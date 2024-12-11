
// import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
// import { getMessaging } from 'firebase-admin/messaging';
//import * as serviceAccount from '/home/ubuntu/pepoz_backend/src/pepoz-39817-firebase-adminsdk-2l6ki-e70aeb6401.json'
// import * as serviceAccount from '../pepoz-39817-firebase-adminsdk-2l6ki-e70aeb6401.json'
// process.env.GOOGLE_APPLICATION_CREDIENTIALS;

// initializeApp({
//   credential: cert(serviceAccount as ServiceAccount),
//   projectId: ''
// })

// Function to send FCM message
export async function sendFCMNotification(token: string, title: any, body: any) {
  try {
    // const accessToken: any = await authClient.getAccessToken();
    const message = {
        token,
        notification: {
          title,
          body,
        },
    };
    getMessaging()
    .send(message)
    .then((response) => {
      console.log('Successfully sent message:', response);
    })
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}