import { config } from "dotenv";
config();

const {
  AGORA_KEY,
  AGORA_SECRET,
  AGORA_APP_ID,
  AGORA_APP_CERTIFICATE,
  JWT_SECRET,
} = process.env;

const serverConfig = {
  jwt: {
    secret: JWT_SECRET || "",
  },
  agora: {
    key: AGORA_KEY || "",
    secret: AGORA_SECRET || "",
    appID: AGORA_APP_ID || "",
    appCertificate: AGORA_APP_CERTIFICATE || "",
  },
};

export default serverConfig;
