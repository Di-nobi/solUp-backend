// express.d.ts
import { Request } from 'express';
import {IUser} from './src/models/UserData'
interface UserPayload {
  id: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string
    };
  }
}
