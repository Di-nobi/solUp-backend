// import WebSocket from "ws";
// import CallData from "../../models/CallData";
// import { generateTokenWithUID } from "../../utils/websocket.util";
// import { IWebSocketMessage, onlineUsers } from "../WebsocketUser";
// import { randomUUID } from "crypto";
// import { IRecieveCall } from "./ReceiveCall";

// interface IMakeCall {
//   caller?: string;
//   callee?: string;
// }

// export const MakeCall = async (client: WebSocket, detail: IMakeCall) => {
//   const channelName = randomUUID();
//   const { callee, caller } = detail || {};

//   if (!caller || !callee) {
//     return client.send(
//       JSON.stringify({
//         code: 400,
//         data: "No caller or callee was found!",
//       })
//     );
//   }

//   // Check if the callee is online
//   if (!onlineUsers[callee || ""]) {
//     return client.send(
//       JSON.stringify({
//         code: 404,
//         data: "User is not online!",
//       })
//     );
//   }

//   const tokenWithUid = generateTokenWithUID(caller, channelName);

//   // Create the call data
//   const call = new CallData({
//     createdBy: caller,
//     channelName,
//   });

//   // Save the call data
//   await call.save();

//   const body: IWebSocketMessage<IRecieveCall> = {
//     action: "receive_call",
//     details: {
//       caller,
//       token: tokenWithUid,
//     },
//   };

//   // Notify the callee
//   onlineUsers[callee].send(JSON.stringify(body));

//   return client.send(
//     JSON.stringify({
//       code: 201,
//       data: "Ringing...",
//     })
//   );
// };
