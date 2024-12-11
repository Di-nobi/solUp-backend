const jwt = require("jsonwebtoken");
import { Request } from "express";



interface UserPayload extends Request {
    firstName: any;
    userId: string;
  }

  export function decoded(req: Request) {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    return jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;
  } 
