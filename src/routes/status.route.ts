import { Router } from 'express';
import { StatusController } from '../controllers/status.controller';
import { isAuthenticated } from '../middlewares/AuthValidate'
import { bindMethods } from '../utils/bindMethod';
import { multerUpload } from '../middlewares/MulterUpload';
import path from 'path';

export const status: Router = Router();
// Bind methods to the controller class
const statusCont = bindMethods(new StatusController());

// Set the destination path relative to the current file's location
// const destination = path.join(__dirname, '..', 'uploads', 'status');

// status endpoints
status.post('/statuses/create', isAuthenticated, multerUpload({
    useS3: true,
    // destination: destination, // Destination path for local upload, providing this information will mean setting useS3 to false
    fields: {
      // field name and its attributes
      file: {
        fileType: ['image/jpeg', 'image/jpg', 'image/png'],
        fileSize: 5 * 1024 * 1024, // 5MB
        multipleFiles: false,
      },
    },
}) , statusCont.createStatus);

status.get('/statuses/archive', isAuthenticated, statusCont.getUserArchivedStatus);
status.post('/statuses/archive', isAuthenticated, statusCont.archiveStatus);
status.post('/statuses/reaction', isAuthenticated, statusCont.addReaction);
status.post('/statuses/reply', isAuthenticated, statusCont.addReply);
status.get('/statuses/connection', isAuthenticated, statusCont.getConnectionStatuses);

// dynamic routing these should be below to avoid express routing conflict.
status.get('/users/:userId/statuses', isAuthenticated, statusCont.getStatuses);
status.delete('/statuses/:statusId', isAuthenticated, statusCont.deleteStatus);
