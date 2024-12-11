// import jwt from "jsonwebtoken";
// import WebSocket from "ws";
// import serverConfig from "../config";
// import { DecodedToken } from "../middlewares/AuthValidate";
// import { RtcTokenBuilder } from "agora-token";

// export const WS_500 = JSON.stringify({
//   code: 500,
//   data: "Something went wrong",
// });

// export const getBasicAgoraAuthHeader = () => {
//   const token = Buffer.from(
//     `${serverConfig.agora.key}:${serverConfig.agora.secret}`
//   ).toString("base64");

//   return `Basic ${token}`;
// };

// export const AuthenticateWebSocketUser = (user: WebSocket, token = "") => {
//   const body = JSON.stringify({
//     code: 401,
//     data: "Access denied. No token provided.",
//   });

//   try {
//     if (!token?.trim()) {
//       user.send(body);
//     }

//     const decoded = jwt.verify(token, serverConfig.jwt.secret) as DecodedToken;
//     return decoded;
//   } catch (err) {
//     console.log(err);
//     user.send(body);
//   }
// };

// export const generateTokenWithUID = (uid: string, channelName: string) => {
//   const appId = serverConfig.agora.appID;
//   const appCertificate = serverConfig.agora.appCertificate;
//   const role = 1; // 1 for publisher (recommended), 2 for subscriber
//   const tokenExpirationInSecond = 3600;
//   const privilegeExpirationInSecond = 3600;

//   const tokenWithUid = RtcTokenBuilder.buildTokenWithUid(
//     appId,
//     appCertificate,
//     channelName,
//     uid,
//     role,
//     tokenExpirationInSecond,
//     privilegeExpirationInSecond
//   );

//   return tokenWithUid;
// };
