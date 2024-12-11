// middlewares/validate.ts
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { decoded } from "../utils/decodeJwt";
const jwt = require("jsonwebtoken");

interface UserPayload extends Request {
  userId: string;
  // Add any other fields you expect in the JWT payload
}

export interface DecodedToken {
  id: string;
}

// export const validate = (req: Request, res: Response, next: NextFunction) => {
//   const errors = validationResult(req);
//   const token = req.header("Authorization")?.replace("Bearer ", "");
//   if (!token) {
//     return res
//       .status(401)
//       .json({ message: "Access denied. No token provided." });
//   }
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET) as UserPayload;
//     req.user = decoded;
//     next();
//   } catch (err) {
//     res.status(400).json({ message: "Invalid token." });
//   }

//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }
//   next();
// };

// export const checkAuthToken = function (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) {
//   const token = <string>req.headers.authorization;
//   let jwtPayload;
//   try {
//     // check if access token is valid
//     jwtPayload = <any>jwt.verify(token, process.env.JWT_SECRET);
//     console.log("jwt payload", res.locals.jwtPayload);
//     res.locals.jwtPayload = jwtPayload;
//     // extract username from payload and place it in response locals
//     res.locals.userId = jwtPayload["userId"];
//     console.log("jwt payload", res.locals.jwtPayload);
//   } catch (error) {
//     console.log("jwt payload", res.locals);
//     res.status(401).json({ message: "Unauthorized request" }).send();
//     return;
//   }
//   next();
// };

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    //const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    req.user = { id: decoded.id };

    //res.locals.user = decoded(req);

    next();
  } catch (err) {
    console.log(res.locals.user);
    res.status(401).json({ message: "Invalid token." });
  }
};
