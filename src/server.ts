import dotenv from "dotenv";
import { connectDB }from "./app";
import { S3BucketUtils } from "./utils/s3BucketUtils";
import { app, server } from "./websocket/HandleSocket";
import { decoded } from "./utils/decodeJwt";
import { isAuthenticated } from "./middlewares/AuthValidate";
// import {
//   handleWebSocketMessage,
//   WebSocketUser,
// } from "./websocket/WebsocketUser";
// import { WS_500 } from "./utils/websocket.util";
// import WebSocket from "ws";
dotenv.config();

const PORT = process.env.PORT || 3000;
// const ws = new WebSocket.WebSocketServer({ port: 8080 });

// app.get("/", (req, res) => {
//   res.send("Hello, world!\n\nWelcome to Pepoz");
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// ws.on("connection", (res:any, req:any) => {
//   try {
//     const user = new WebSocketUser(res, req);
//     res.on("message", (message:any) => handleWebSocketMessage(message, res));
//     res.on("close", user.disconnect);
//   } catch (err) {
//     console.log(err);
//     res.send(WS_500);
//   }
// });

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>SolUp</title>
        <style>
          body {
            background-color: #1a1a1a; /* Dark background */
            color: white; /* White text */
            text-align: center;
            font-family: Arial, sans-serif;
          }

          h1, h3 {
            margin: 20px 0;
          }

          img {
            margin-top: 20px;
            width: 500px;
            height: auto;
          }
        </style>
      </head>
      <body>
        <h1>Greetings from Sol up</h1>
        <h3>Kindly visit our official website to download the app 👉 <a href="https://solUp.com"><em>sol up</em></a></h3>
        <img src="https://media.giphy.com/media/14uQ3cOFteDaU/giphy.gif" alt="Route Unavailable" />
      </body>
    </html>
  `);
});

// A general route to get a presigned access to files in the private folder AWS S3 bucket for 24 hours.
app.get('/file-access', isAuthenticated, async (req, res, next) => {
  try {
    decoded(req).userId; // Authenticated user;
    const file = req.body.url
    // generate a presigned url that can be used to access the data from the frontend. the function can optionally access a ttl.
    const preSignedUrl = await S3BucketUtils.generatePresignedUrl(file) as string;

    return res.status(200).json({
      status: "success",
      message: "Presigned url fetch successfully",
      data: { preSignedUrl },
    });
  } catch (error) {
    next(error);
  }
})


server.listen(PORT, () => {
    connectDB();
  console.log(`Server is running on port ${PORT}`);
});
