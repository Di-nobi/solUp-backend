

//Upcoming updates

// src/controllers/postController.ts
import { Request, Response } from "express";
import Post from "../models/PepPostData";
import User, { IUser } from "../models/UserData";
import { decoded } from "../utils/decodeJwt";
import mongoose from "mongoose";
import { emitNotification } from "../websocket/HandleSocket";
import { sendFCMNotification } from "../middlewares/fcm";
import ConnectionData from "../models/ConnectionData";
import NotificationData from "../models/NotificationData";
import savedPosts from "../models/savedPosts";


// function shuffleArray(array: any[]) {
//   for (let i = array.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [array[i], array[j]] = [array[j], array[i]];
//   }
//   return array;
// }

export const createPost = async (req: Request, res: Response) => {
  try {
    const { title, content, tags } = req.body;
    const media = req.files && !Array.isArray(req.files) && req.files['media']
    ? (req.files['media'] as Express.MulterS3.File[]).map((file) => file.location)
    : [];
    const user = decoded(req);
    if (!user.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const chkuser = await User.findById(user.userId);
    if (!chkuser) {
      return res.status(401).json({ message: "User not found" });
    }
    
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const post = new Post({
      author: user.userId,
      title,
      content,
      tags,
      media
    });
    
    post.shareLink = `${process.env.BASE_URL}/posts/${post._id}`;
    await post.save();

    const signedIn = user.userId;
    const verifyconnected = await ConnectionData.find({
      $and: [
        { status: 'accepted' },
        { $or: [{ sender: signedIn }, { receiver: signedIn }] }
      ]
    });

    if (verifyconnected && verifyconnected.length > 0) {
      const connectedUserIds = Array.from(
        new Set(verifyconnected.map(conn =>
          conn.sender.toString() === signedIn ? conn.receiver : conn.sender
        ))
      );

      const tokens: Set<string> = new Set();
      
      for (const recipientId of connectedUserIds) {
        // Check and create a new notification only if it doesn’t already exist
        const existingNotification = await NotificationData.findOne({
          recipientId,
          senderId: signedIn,
          postId: post._id,
        });

        if (!existingNotification) {
          const newNotification = new NotificationData({
            recipientId,
            senderId: signedIn,
            type: 'new_post',
            postId: post._id,
            message: `${chkuser.firstName} has created a new post`,
          });
          await newNotification.save();
        }

        const recipient = await User.findById(recipientId);
        if (recipient && recipient.fcmToken) {
          tokens.add(recipient.fcmToken);
        }
      }
      
      // Send notification to each unique FCM token
      tokens.forEach(async (token) => {
        await sendFCMNotification(
          token,
          'Pepoz',
          `${chkuser.firstName} just created a new post`
        );
      });
    }

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
};

export const editPost = async (req: Request, res: Response) => {
  try {

    const { title, content, tags } = req.body;
    const media = req.files && !Array.isArray(req.files) && req.files['images']
    ? (req.files['images'] as Express.MulterS3.File[]).map((file) => file.location)
    : [];
    const user = decoded(req).userId;
    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const { postId } = req.params;
    if (!postId) {
      return res.status(400).json({message: "Post ID is required"});
    }

    console.log(media);
    if (!content || !title) {
      return res.status(400).json({ message: "content and title are required" });
    }
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.author.toString() !== user) {
      return res.status(403).json({ message: "You are not authorized to edit this post" });
    }
    if (title) {
        post.title = title;
    }

    if (content) {
      post.content = content;
    }

    if (tags) {
      post.tags = tags;
    }

    if (media) {
      post.media = media;
    }
    await post.save();
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
}


export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.BASE_URL;
    const uploadDir: any = process.env.UPLOAD_DIR || '';
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const skip = (page - 1) * limit;
    const totalPosts = await Post.countDocuments();
    const posts = await Post.find().sort({ createdAt: -1}).skip(skip).limit(limit).populate({
      path: "author",
      select: "firstName lastName profilePicture jobTitle", // Specify fields to include in the result
    }).lean()
    // .populate({
    //   path: 'comments',
    //   model: 'Comment',
    //   select: 'content',
    //   populate: { 
    //     path: 'user',
    //     model: 'UserData', 
    //     select: 'firstName lastName profilePicture', 
    //   }
    // });
    
    // const shuffledPosts = shuffleArray(posts);
    const postsWithFullUrls = posts.map((post: any) => {
      // Check if the author is populated
      const author = post.author && 'firstName' in post.author
        ? post.author as unknown as IUser  // Type guard ensuring author is IUser
        : null;

      // const reactions = Array.isArray(post.reactions) ? post.reactions.map((reaction: any) => {
      //   // Check if the userId is populated
        
      //   const user = reaction.userId && 'firstName' in reaction.userId
      //     ? reaction.userId as unknown as IUser  // Type assertion to convert to unknown first
      //     : null;
      
      //   return {
      //     ...reaction,
      //     userId: user ? {
      //       ...user,
      //       profilePicture: typeof user.profilePicture === 'string' && user.profilePicture?.length
      //     ? user.profilePicture
      //     : null,
      //     } : null,
      //   };
      // }) : [];

      // const media = Array.isArray(post.media) ? post.media.map((path: any) => {
      //   return path ? `${baseUrl}/uploads${path.replace(uploadDir, '')}` : null;
      // }) : [];

      // const comments = (post.comments as unknown as IComment[]).map((comment: IComment) => {
      //   console.log('Comment User Profile Picture:', comment.user?.profilePicture);  // Log user's profile picture in comments
    
      //   return {
      //     content: comment.content,
      //     commenter: comment.user ? {
      //       firstName: comment.user.firstName,
      //       lastName: comment.user.lastName,
      //       profilePicture: comment.user.profilePicture ? `${baseUrl}/uploads${comment.user.profilePicture.replace(uploadDir, '')}` : null,
      //     } : null,
      //   };
      // });

      return {
        _id: post._id,
        author: author ? {
          ...author,
          profilePicture: typeof author.profilePicture === 'string' && author.profilePicture?.length
        ? author.profilePicture
        : null,
        } : null,
        title: post.title || '',
        content: post.content || '',
        media: post.media,
        tags: post.tags,
        // commentCount: comments.length,
        // comments,
        // reactions,
        // isRepost: post.isRepost ? true : false,
        repostCount: post.repostCount ? post.repostCount : 0,
        commentCount: post.commentCount ? post.commentCount : 0,
        reactionCount: post.reactionCount ? post.reactionCount : 0,
        isDeleted: post.isDeleted ? true : false,
        repostMedia: post.repostMedia || [],
        // isLiked: post.isLiked ? true : false,
        // isLikedCount: post.isLikedCount ? post.isLikedCount : 0,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        shareLink: post.shareLink
      };
    });
    return res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      postsWithFullUrls
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getShareLinkPost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const baseUrl = process.env.BASE_URL;
    const uploadDir: any = process.env.UPLOAD_DIR || '';

    // Find the original post by ID
    const post = await Post.findById(postId)
    .populate({
      path: "author",
      select: "firstName lastName profilePicture jobTitle",
    }).lean();
    // .populate({
    //   path: 'comments',
    //   model: 'Comment',
    //   select: 'content',
    //   populate: { 
    //     path: 'user',
    //     model: 'UserData', 
    //     select: 'firstName lastName profilePicture', 
    //   }
    // })
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const author = post.author && 'firstName' in post.author
      ? post.author as unknown as IUser  // Type guard ensuring author is IUser
      : null;

    // const reactions = Array.isArray(post.reactions) ? post.reactions.map(reaction => {
    //   // Check if the userId is populated
    //   const user = reaction.userId && 'firstName' in reaction.userId
    //     ? reaction.userId as unknown as IUser  // Type assertion to convert to unknown first
    //     : null;

    //   return {
    //     ...reaction,
    //     userId: user ? {
    //       ...user,
    //       profilePicture: typeof user.profilePicture === 'string' && user.profilePicture?.length
    //         ? user.profilePicture
    //         : null,
    //     } : null,
    //   };
    // }) : [];


    // const comments = (post.comments as unknown as IComment[]).map((comment: IComment) => {
    //   return {
    //     content: comment.content,
    //     commenter: comment.user ? {
    //       firstName: comment.user.firstName,
    //       lastName: comment.user.lastName,
    //       profilePicture: comment.user.profilePicture ? `${baseUrl}/uploads${comment.user.profilePicture.replace(uploadDir, '')}` : null,
    //     } : null,
    //   };
    // });

    const findPost = {
      _id: post._id,
      author: author ? {
        ...author,
        profilePicture: typeof author.profilePicture === 'string' && author.profilePicture?.length
          ? author.profilePicture
          : null,
      } : null,
      title: post.title,
      content: post.content,
      media: post.media,
      tags: post.tags,
      // commentCount: comments.length,
      // comments,
      // reactions,
      // isRepost: post.isRepost ? true : false,
      repostCount: post.repostCount ? post.repostCount : 0,
      commentCount: post.commentCount ? post.commentCount : 0,
      reactionCount: post.reactionCount ? post.reactionCount : 0,
      isDeleted: post.isDeleted ? true : false,
      repostMedia: post.repostMedia || [],
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      shareLink: post.shareLink
    };

    // Send the response
    return res.status(200).json(findPost);
  } catch (error) {
    console.error("Error fetching share link post:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const user = decoded(req);

    // Check if the provided postId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      console.log("Invalid postId");
      return res.status(400).json({ message: "Invalid post ID" });
    }
    // Find the post by ID
    console.log("post id", postId);

    const post = await Post.findById(postId);
    console.log("post id", post);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user is the author of the post
    if (post.author.toString() !== user.userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this post" });
    }

    // delete post
    const delPost = await Post.deleteOne({ _id: postId });
    console.log(delPost);
    if (!delPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Failed to delete post" });
  }
};

export const savePost = async (req: Request, res: Response) => {
  const postId = req.params.postId;
  const userId = decoded(req).userId; // Assuming you have user info in req.user

  try {
    // Find the post by ID
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure the user is not the owner of the post
    if (post.author.toString() === userId.toString()) {
      return res.status(403).json({ message: 'You cannot save your own post' });
    }

    const chkSavedPost = await savedPosts.findOne({ postId, userId });
    if (chkSavedPost) {
      return res.status(400).json({ message: 'Post already saved' });
    } else {
      // Save the post
      const newSavedPost = new savedPosts({ postId, userId });
      await newSavedPost.save();
     user.savePosts.push(newSavedPost);
      user.save();
    }
    res.status(200).json({ message: 'Post saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Somethig went wrong', error });
  }
};

export const getSavedPosts = async (req: Request, res: Response) => {
  const baseUrl = process.env.BASE_URL;
  const uploadDir: any = process.env.UPLOAD_DIR;
  const userId = decoded(req).userId; // Assuming you have user info in req.user

  try {
    // Find the saved posts of a particular user
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const skip = (page - 1) * limit;

    const totalSavedPosts = await savedPosts.countDocuments({ userId }).exec();
    const savedPost = await savedPosts.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit)
    .populate({
      path: 'postId',
      model: 'Post',
      select: 'author title content media tags reactions comments createdAt repostCount repostMedia commentCount reactionCount isDeleted',
      populate:[ 
        {
          path: 'author',
          model: 'UserData',
          select: 'firstName lastName profilePicture',
        },
      //   {
      //   path: 'comments',
      //   model: 'Comment',
      //   select: 'content user createdAt',
      //   populate: {
      //     path: 'user',
      //     model: 'UserData',
      //     select: 'firstName lastName profilePicture',
      //   },
      // },
    ]
    })
    .populate({
      path: 'userId',
      model: 'UserData',
      select: 'firstName lastName profilePicture jobTitle',
    })
    .lean();

    if (!savedPost) {
      return res.status(404).json({ message: 'Saved post not found' });
    }

    const SavedPosts = savedPost.map(post => {
      // const media = Array.isArray(post.postId.media) ? post.postId.media.map(path => {
      //   return path ? `${baseUrl}/uploads${path.replace(uploadDir, '')}` : null;
      // }) : [];
      return {
        _id: post.postId._id || null,
        author: post.postId.author ? {
          _id: post.postId.author._id,
          firstName: post.postId.author.firstName || null,
          lastName: post.postId.author.lastName || null,
          profilePicture: typeof post.postId.author.profilePicture === 'string' && post.postId.author.profilePicture?.length
        ? post.postId.author.profilePicture
        : null,
        } : null,
        title : post.postId.title,
        content : post.postId.content,
        media: post.postId.media,
        tags: post.postId.tags,
        // reactions: post.postId.reactions,
        // comments: post.postId.comments.map((comment) => ({
        //   content: comment.content,
        //   commenter: comment.user ? {
        //     firstName: comment.user.firstName,
        //     lastName: comment.user.lastName,
        //     profilePicture: comment.user.profilePicture? `${baseUrl}/uploads${comment.user.profilePicture?.replace(uploadDir, '')}`: null,
        //   } : null,
        // })),
        // commentCount: post.postId.comments.length,
        firstName: post.userId.firstName,
        lastName: post.userId.lastName,
        profilePicture: post.userId.profilePicture || null,
        jobTitle: post.userId.jobTitle,
        repostCount: post.postId.repostCount ? post.postId.repostCount : 0,
        commentCount: post.postId.commentCount ? post.postId.commentCount : 0,
        reactionCount: post.postId.reactionCount ? post.postId.reactionCount : 0,
        isDeleted: post.postId.isDeleted ? true : false,
        repostMedia: post.postId.repostMedia || [],
        shareLink: post.postId.shareLink,
      }
    })
    return res.status(200).json({
      SavedPosts,
      currentPage: page,
      totalPages: Math.ceil(totalSavedPosts / limit),
    });
  } catch (error) {
    console.error('Error fetching saved posts:', error); 
    return res.status(500).json({ message: 'Something went wrong', error });
  }
};

// Controller for removing a saved post
export const removeSavedPost = async (req: Request, res: Response) => {
  const userId = decoded(req).userId; // Assuming you have user info in req.user
  const postId = req.params.postId;

  try {
    // Find the user by ID
    const removePost = await savedPosts.findOneAndDelete({ postId, userId});
    if (!removePost) {
      return res.status(404).json({ message: 'Post not found in saved posts' });
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const postObjectId = new mongoose.Types.ObjectId(postId);
    // Remove the post ID from the User’s savedPosts array
    const user = await User.findByIdAndUpdate(
      userObjectId,
      { $pull: { savePosts: postObjectId } },
      { new: true }
    ).exec();
    await user?.save();
    return res.status(200).json({ message: 'Post removed from saved posts' });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.BASE_URL;
    const uploadDir: any = process.env.UPLOAD_DIR;
    const { name } = req.query;
    console.log(name)
    if (!name) {
      return res.status(400).json({ error: "Search query is required" });
    }
    const signedInUser = decoded(req).userId;
    if (!signedInUser) {
      return res.status(401).json({ error: "Unauthorized access" });
    }
    const users = await User.find({
      $or: [
        { firstName: { $regex: name, $options: 'i' } },
        { lastName: { $regex: name, $options: 'i' } },
        { email: { $regex: name, $options: 'i' } },
      ],
      _id: { $ne: signedInUser }
    })
     .select("firstName lastName profilePicture jobTitle")
     .exec();
    if (!users || users.length === 0) {
      return res.status(404).json({ error: "Connection not found" });
    }
    const getUser = users.map(user => {
      return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture || null,
        jobTitle: user.jobTitle
      }
    })
    return res.status(200).json(getUser);
  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({ error: "Unable to search users" });
  }
};