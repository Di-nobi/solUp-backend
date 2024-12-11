import express from 'express';
import { acceptConnectionRequest, addConnectionRequest, declineConnectionRequest, getMyConnections,
    fetchConnectionRequests, removeConnectionRequest, suggestConnections, searchUsers, newestConnections, oldestConnections } from '../controllers/ConnectionsController';
import { isAuthenticated } from '../middlewares/AuthValidate'; // Replace with your authentication middleware import

const router = express.Router();

// Example route for suggesting connections based on criteria
router.get('/suggest-connections', isAuthenticated, suggestConnections);
router.get('/my-requests', isAuthenticated, fetchConnectionRequests);
router.get('/my-connections', isAuthenticated, getMyConnections);
router.get('/oldest-connections', isAuthenticated, oldestConnections);
router.get('/newest-connections', isAuthenticated, newestConnections);
router.get('/find-user', isAuthenticated, searchUsers);
router.post('/:userId/add-connection-request', isAuthenticated, addConnectionRequest);
router.post('/:userId/remove-connection-request', isAuthenticated, removeConnectionRequest);
router.post('/:requestId/accept', isAuthenticated, acceptConnectionRequest);
router.post('/:requestId/decline', isAuthenticated, declineConnectionRequest);



export default router;
