import { validate } from "../middlewares/Validate";
import { isAuthenticated } from "../middlewares/AuthValidate";
import { Router } from "express";
import { mediaUpload } from "../middlewares/MediaUpload";
import { io } from "../websocket/HandleSocket";
import { sendMessage, getMessages, getDisplay, UnRead, searchUsers, 
        deleteMessage, markAsRead, unarchiveMessages, unreadmessagesCount,
        archiveMessages, getArchivedMessages, editMessage } from "../controllers/SingleMessagingController";

const router = Router();

router.get("/", isAuthenticated, (req, res) => {
        getDisplay(req, res, io);
    });
router.get("/archives", isAuthenticated, getArchivedMessages);
router.get("/unread", isAuthenticated, (req, res) => {
        UnRead(req, res, io);
    });
router.get("/query", isAuthenticated, searchUsers);
router.get("/:id", isAuthenticated, (req, res) => {
    getMessages(req, res, io);
});
router.delete("/delete/:messageId", isAuthenticated, (req, res) => {
        deleteMessage(req, res, io);
    });
router.put("/edit/:msgId", isAuthenticated, editMessage);
router.get('/unread-count/:id', isAuthenticated, unreadmessagesCount);
router.get("/read/:id", isAuthenticated, markAsRead);
router.post("/archive/:recipientId", isAuthenticated, archiveMessages);
router.post("/unarchive/:recipientId", isAuthenticated, unarchiveMessages);
router.post("/send/:id", isAuthenticated, mediaUpload, (req, res) => {
        sendMessage(req, res, io);
    });
    
export default router;