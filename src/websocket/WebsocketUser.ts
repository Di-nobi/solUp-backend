// import { IncomingMessage } from "http";
// import url from "url";
// import WebSocket from "ws";
// import { MakeCall } from "./actions/MakeCall";
// import { RecieveCall } from "./actions/ReceiveCall";
// // import { AuthenticateWebSocketUser, WS_500 } from "../utils/websocket.util";
// import { DecodedToken } from "../middlewares/AuthValidate";
// import { randomUUID } from "crypto";

// export const onlineUsers: { [key: string]: WebSocket.WebSocket } = {};
// export interface IWebSocketMessage<T = any> {
//   action: "make_call" | "receive_call";
//   details: T;
// }

// export class WebSocketUser {
//   user?: DecodedToken;
//   Details?: WebSocket;

//   constructor(details: WebSocket, req: IncomingMessage) {
//     const { token } = url.parse(req.url || "", true).query;
//     // const user = AuthenticateWebSocketUser(details, token as string);
//     const user = { id: randomUUID() };

//     if (user) {
//       this.Details = details;
//       details.send(
//         JSON.stringify({
//           code: 200,
//           data: user,
//         })
//       );

//       this.user = user;
//       onlineUsers[user.id] = details;
//       console.log(Object.keys(onlineUsers));

//       return this;
//     }
//   }

//   disconnect(ID: string) {
//     delete onlineUsers[ID];
//   }
// }

// export const handleWebSocketMessage = (
//   message: WebSocket.Data,
//   client: WebSocket
// ) => {
//   try {
//     const receivedMessage = JSON.parse(message.toString()) as IWebSocketMessage;

//     switch (receivedMessage.action) {
//       case "make_call":
//         return MakeCall(client, receivedMessage?.details);

//       case "receive_call":
//         return RecieveCall(client, receivedMessage?.details);

//       default:
//         return {
//           code: 400,
//           data: "Invalid action!",
//         };
//     }
//   } catch (err) {
//     console.log(err);
//     return client.send(WS_500);
//   }
// };
