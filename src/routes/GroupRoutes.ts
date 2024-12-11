import { validate } from "../middlewares/Validate";
import { isAuthenticated } from "../middlewares/AuthValidate";
import { Router } from "express";
import { AddUserToGroup,
createGroup, getGroups, leaveGroup, deleteGroup, updateGroupProfile, getGroupMembers,
getGroupProfile, AddUserToGroupWithLink, getTotalMembers, removeUserByAdmin, disableUnreadCount,
UpdateuploadImage, updateGroupInfo } from "../controllers/GroupController";
import { io } from "../websocket/HandleSocket";
import { GroupMediaUpload } from "../middlewares/GroupMediaUpload";
import { GroupProfileUpload } from "../middlewares/GroupProfileUpload";
import { sendGroupMessage, getGroupMessage, deleteMessageByAdmin, deleteUserMessage, editGroupMessage } from "../controllers/GroupMessagingController";
// import { GroupBannerUpload } from "../middlewares/GroupBannerUpload";
const router = Router();

router.post("/create-group", isAuthenticated, GroupProfileUpload,  createGroup);
router.get("/all-groups", isAuthenticated, getGroups);
router.put("/update-group-profile/:groupId", isAuthenticated, GroupProfileUpload,  updateGroupProfile);
router.get("/total-members/:groupId", isAuthenticated, getTotalMembers);
router.get("/join-group/:groupId/:token", isAuthenticated, (req, res) => {
    AddUserToGroupWithLink(req, res, io);
});
router.get("/:groupId/members", isAuthenticated, getGroupMembers);
router.put("/disable-unread/:groupId", isAuthenticated, disableUnreadCount);
// router.put("/enable-unread/:groupId", isAuthenticated, enableUnreadCount);
router.delete("/remove-user-admin/:groupId/:userId", isAuthenticated, removeUserByAdmin);
router.post("/send-message/:groupId", isAuthenticated, GroupMediaUpload, (req, res) => {
    sendGroupMessage(req, res, io);
});
router.get("/get-messages/:groupId", isAuthenticated, getGroupMessage);
router.delete("/leave-group/:groupId", isAuthenticated, (req, res) => {
    leaveGroup(req, res, io);
});
router.put("/edit/:msgId/:groupId", isAuthenticated, editGroupMessage);
router.delete("/delete-group/:groupId", isAuthenticated, deleteGroup);
router.get("/group-profile/:groupId", isAuthenticated, getGroupProfile);
router.get("/join/:groupId", isAuthenticated, (req, res) => {
    AddUserToGroup(req, res, io);
});
router.delete("/delete-message-admin/:groupId/:messageId", isAuthenticated, (req, res) => {
    deleteMessageByAdmin(req, res, io);
});
router.delete("/delete-user-message/:groupId/:messageId", isAuthenticated, (req, res) => {
    deleteUserMessage(req, res, io);
});
router.put('/update-image/:groupId', isAuthenticated, GroupProfileUpload, UpdateuploadImage);
router.put('/:groupId', isAuthenticated, updateGroupInfo)
export default router;