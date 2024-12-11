// import WebSocket from "ws";
// import { onlineUsers } from "../WebsocketUser";

// export interface IRecieveCall {
//   caller?: string;
//   token?: string;
// }

// export const RecieveCall = (client: WebSocket, detail: IRecieveCall) => {
//   const { caller, token } = detail || {};

//   if (!caller || !token) {
//     return {
//       code: 400,
//       data: "No caller or token was found!",
//     };
//   }

//   // Check if the caller is online
//   if (!onlineUsers[caller || ""]) {
//     return {
//       code: 404,
//       data: "Caller is not online!",
//     };
//   }

//   return client.send(
//     JSON.stringify({
//       code: 102,
//       data: detail,
//     })
//   );
// };
