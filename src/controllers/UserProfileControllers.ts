
import { Request, Response } from "express";
import User, { IUser } from "../models/UserData";
import { decoded } from "../utils/decodeJwt";
import Post from "../models/PepPostData";
import ConnectionData from "../models/ConnectionData";
import Repost from "../models/RepostData";

export const updateUser = async (req: Request, res: Response) => {
  try {
    const reqUser = decoded(req);
    const userId = reqUser.userId;
    const updates = req.body;
    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ error: "At least one field must be updated" });
    }
    if (updates.interests && !Array.isArray(updates.interests)) {
      return res.status(400).json({ error: "Interests must be an array" });
    }
    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Server error" });
  }
};
export const updateFCMToken = async (req: Request, res: Response) => {
  try {
    const user = decoded(req).userId;
    if (!user) {
      return res.status(401).json({message: "Invalid access"})
    }
    const { fcmToken } =req.body;
    if (!fcmToken) {
      return res.status(409).json({message: 'An FCM token is required'})
    }
    await User.findByIdAndUpdate(user, { fcmToken });
    res.status(200).json({ message: "FCM token updated successfully" });
  } catch (err) {
    return res.status(500).json({message: 'An error occured updating FCM token', err})
  }
}

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const user = decoded(req); 

    if (!user || !user.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const profilePicture = (req.files as { [fieldname: string]: Express.MulterS3.File[] })?.['profile']?.[0]?.location || "";
    const bannerImage = (req.files as { [fieldname: string]: Express.MulterS3.File[] })?.['banner']?.[0]?.location || "";
    const updatedUser = await User.findById(user.userId);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (profilePicture) {
      updatedUser.profilePicture = profilePicture;
    }

    if (bannerImage) {
      updatedUser.bannerImage = bannerImage;
    }
    await updatedUser.save();
    res.status(201).json({message: 'Image uploaded successfully'});
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Something went wrong", error });
  }
};


export const getMyProfile = async (req: Request, res: Response) => {
  const userId  = decoded(req).userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  if (!userId) {
    return res.status(400).json({message: 'Unauthorized access'});
  }
  try {
    // Fetch user details, excluding password and other sensitive fields
    const user = await User.findById(userId)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate({
        path: 'savePosts',
        model: 'SavedPost',
        populate: {
          path: 'postId',
          populate: [
            {
              path: 'author',
              model: 'UserData',
              select: 'firstName lastName profilePicture jobTitle',
            },
            // {
            //   path: 'comments',
            //   model: 'Comment',
            //   populate: {
            //     path: 'user',
            //     model: 'UserData',
            //     select: 'firstName lastName profilePicture',
            //   },
            // },
          //   {
          //     path: 'reactions.userId',
          //     model: 'UserData',
          //     select: 'firstName lastName profilePicture',
          //  },
          ],
        },
      })
      .populate({
        path: 'reposts',
        model: 'Repost',
        populate: {
          path: 'postId',
          model: 'Post',
          select: 'repostMedia repostCount reactionCount commentCount isDeleted media content title updatedAt createdAt shareLink tags',
          populate: [
            {
              path: 'author',
              model: 'UserData',
              select: 'firstName lastName profilePicture jobTitle',
            },
          ],
        },
        
      })
      .populate({
        path: 'school',
        model: 'School',
      })
      .populate({
        path: 'workDetails',
        model: 'WorkExperience',
      })
      .lean()
      .exec();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const SavedPosts = Array.isArray(user.savePosts) ? user.savePosts.map(post => {
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
        repostCount: post.postId.repostCount ? post.postId.repostCount : 0,
        commentCount: post.postId.commentCount ? post.postId.commentCount : 0,
        reactionCount: post.postId.reactionCount ? post.postId.reactionCount : 0,
        isDeleted: post.postId.isDeleted ? true : false,
        repostMedia: post.postId.repostMedia || [],
        firstName: post.userId.firstName,
        lastName: post.userId.lastName,
        profilePicture: post.userId.profilePicture || null,
        jobTitle: post.userId.jobTitle,
        shareLink: post.postId.shareLink,
      }
    }) : [];

    // console.log(reposts);
    const getMyProfile = {
      _id: user._id,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      email: user.email || null,
      city: user.city || null,
      state: user.state || null,
      savedPosts: SavedPosts || [],
      country: user.country || null,
      showLocationInProfile: user.showLocationInProfile || null,
      contactNumber: user.contactNumber || null,
      dateOfBirth: user.dateOfBirth || null,
      onlyYouCanSeeDOB: user.onlyYouCanSeeDOB || null,
      customLink: user.customLink || null,
      showLinkInProfile: user.showLinkInProfile || null,
      bio: user.bio || null,
      profilePicture: user.profilePicture || 'N/A',
      bannerImage: user.bannerImage || 'N/A',
      googleId: user.googleId || null,
      jobTitle: user.jobTitle || null,
      industry: user.industry || null,
      interests: user.interests || null,
      school: user.school || null,
      workDetails: user.workDetails || null,
      connections:  user.connections || [],
      pendingAccept: user.pendingAccept || [],
      shareLink: `${process.env.BASE_URL}/profile/${user._id}` || null
    }

    const getReposts = await Repost.find({ userId })
    .populate({
      path: 'postId',
      model: 'Post',
      select: 'repostMedia repostCount reactionCount commentCount isDeleted media content title createdAt shareLink tags',
      populate: [
        {
          path: 'author',
          model: 'UserData',
          select: 'firstName lastName profilePicture jobTitle',
        },
      ],
    }).lean().exec();
    if (!getReposts) {
      return res.status(400).json({message: 'No repost found'})
    }
    const reposts = getReposts.map((repost: any) => {
      const post = repost.postId;
      if (!post) return null;
      return {
        _id: post._id,
        author: post.author ? {
          firstName: post.author.firstName,
          lastName: post.author.lastName,
          profilePicture: typeof post.author.profilePicture === 'string' && post.author.profilePicture?.length
        ? post.author.profilePicture
        : null,
        } : null,
        title: post.title || '',
        content: post.content || '',
        tags: post.tags,
        repostCount: post.repostCount ? post.repostCount : 0,
        commentCount: post.commentCount ? post.commentCount : 0,
        reactionCount: post.reactionCount ? post.reactionCount : 0,
        isDeleted: post.isDeleted ? true : false,
        repostMedia: post.repostMedia || [],
        shareLink: repost.shareLink,
        createdAt: repost.createdAt || new Date(),
      };
    }).filter(Boolean);

    // Fetch posts made by the user
    const getPosts = await Post.find({ author: userId }).populate('title content media tags repostCount createdAt updatedAt shareLink')
    .populate({
      path: "author",
      select: "firstName lastName profilePicture"
    })
    .lean().exec();
    if (!getPosts) {
      return res.status(400).json({message: 'No post made by this user'})
    }
    const posts = getPosts.map((post: any) => {

      return {
        _id: post._id,
        author: post.author ? {
          firstName: post.author.firstName,
          lastName: post.author.lastName,
          profilePicture: typeof post.author.profilePicture === 'string' && post.author.profilePicture?.length
        ? post.author.profilePicture
        : null,
        } : null,
        title: post.title || '',
        content: post.content || '',
        media: post.media,
        tags: post.tags,
        repostCount: post.repostCount ? post.repostCount : 0,
        commentCount: post.commentCount ? post.commentCount : 0,
        reactionCount: post.reactionCount ? post.reactionCount : 0,
        isDeleted: post.isDeleted ? true : false,
        repostMedia: post.repostMedia || [],
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        shareLink: post.shareLink
      };
    });

    const allPosts = [...reposts, ...posts].sort((a, b) => {
      return new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime(); // Sort by creation date
    });
    const postLength = allPosts.length;
    const paginatePosts = allPosts.slice(skip, skip + limit);
    const totalPosts = allPosts.length;
    const totalPages = Math.ceil(totalPosts / limit);
    // console.log(paginatePosts)
    res.status(200).json({ getMyProfile, 
      posts: paginatePosts,
      currentPage: page,
      postsCount: postLength,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
}

// Get another user's profile and posts
export const getUserProfileById = async (req: Request, res: Response) => {
  const baseUrl = process.env.BASE_URL;
  const uploadDir: any = process.env.UPLOAD_DIR;
  const userId  = req.params.userId;
  const usr = decoded(req).userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  if (!usr) {
    return res.status(409).json({message: 'Unauthorized access'});
  }
  try {
    // Fetch user details, excluding password and other sensitive fields
    const user = await User.findById(userId)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate({
        path: 'savePosts',
        model: 'SavedPost',
        populate: {
          path: 'postId',
          populate: [
            {
              path: 'author',
              model: 'UserData',
              select: 'firstName lastName profilePicture jobTitle',
            },
          ],
        },
      })
      .populate({
        path: 'reposts',
        model: 'Repost',
        populate: {
          path: 'postId',
          model: 'Post',
          select: 'repostMedia repostCount reactionCount commentCount isDeleted media content title  createdAt shareLink tags',
          populate: [
            {
              path: 'author',
              model: 'UserData',
              select: 'firstName lastName profilePicture jobTitle',
            },
          ],
        },
        
      })
      .populate({
        path: 'school',
        model: 'School',
      })
      .populate({
        path: 'workDetails',
        model: 'WorkExperience',
      })
      .lean()
      .exec();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const checkconnection = await ConnectionData.findOne({
      $or: [
        { sender: usr, receiver: userId },
        { sender: userId, receiver: usr }
      ]
    }).select('status')

    const SavedPosts = Array.isArray(user.savePosts) ? user.savePosts.map(post => {
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
    }) : [];

    const getUserProfile = {
      _id: user._id,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      email: user.email || null,
      city: user.city || null,
      state: user.state || null,
      savedPosts: SavedPosts || [],
      country: user.country || null,
      showLocationInProfile: user.showLocationInProfile || null,
      contactNumber: user.contactNumber || null,
      dateOfBirth: user.dateOfBirth || null,
      onlyYouCanSeeDOB: user.onlyYouCanSeeDOB || null,
      customLink: user.customLink || null,
      showLinkInProfile: user.showLinkInProfile || null,
      bio: user.bio || null,
      profilePicture: user.profilePicture || 'N/A',
      bannerImage: user.bannerImage || 'N/A',
      googleId: user.googleId || null,
      jobTitle: user.jobTitle || null,
      industry: user.industry || null,
      interests: user.interests || null,
      school: user.school || null,
      workDetails: user.workDetails || null,
      connections:  user.connections || [],
      pendingAccept: user.pendingAccept || [],
      connectionStatus: checkconnection ? checkconnection : 'potential_connection',
      shareLink: `${process.env.BASE_URL}/profile/${user._id}` || null
    }
    const getReposts = await Repost.find({ userId })
    .populate({
      path: 'postId',
      model: 'Post',
      select: 'repostMedia repostCount reactionCount commentCount isDeleted media content title createdAt shareLink tags',
      populate: [
        {
          path: 'author',
          model: 'UserData',
          select: 'firstName lastName profilePicture jobTitle',
        },
      ],
    }).lean().exec();
    if (!getReposts) {
      return res.status(400).json({message: 'No repost found'})
    }
    const reposts = getReposts.map((repost: any) => {
      const post = repost.PostId;
      if (!post) return null;
      return {
        _id: post._id,
        author: post.author ? {
          firstName: post.author.firstName,
          lastName: post.author.lastName,
          profilePicture: typeof post.author.profilePicture === 'string' && post.author.profilePicture?.length
        ? post.author.profilePicture
        : null,
        } : null,
        title: post.title || '',
        content: post.content || '',
        tags: post.tags,
        repostCount: post.repostCount ? post.repostCount : 0,
        commentCount: post.commentCount ? post.commentCount : 0,
        reactionCount: post.reactionCount ? post.reactionCount : 0,
        isDeleted: post.isDeleted ? true : false,
        repostMedia: post.repostMedia || [],
        shareLink: repost.shareLink,
        createdAt: repost.createdAt || new Date(),
      };
    }).filter(Boolean);

    // Fetch posts made by the user
    const getPosts = await Post.find({ author: userId }).populate('title content media tags repostCount shareLink createdAt updatedAt')
    .populate({
      path: "author",
      select: "firstName lastName profilePicture"
    })
    .lean().exec();
    if (!getPosts) {
      return res.status(400).json({message: 'No post made by this user'})
    }
    // console.log(getPosts);
    const posts = getPosts.map((post: any) => {
      return {
        _id: post._id,
        author: post.author ? {
          firstName: post.author.firstName,
          lastName: post.author.lastName,
          profilePicture: typeof post.author.profilePicture === 'string' && post.author.profilePicture?.length
        ? post.author.profilePicture
        : null,
        } : null,
        title: post.title || '',
        content: post.content || '',
        media: post.media,
        tags: post.tags,
        repostCount: post.repostCount ? post.repostCount : 0,
        commentCount: post.commentCount ? post.commentCount : 0,
        reactionCount: post.reactionCount ? post.reactionCount : 0,
        isDeleted: post.isDeleted ? true : false,
        repostMedia: post.repostMedia || [],
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        shareLink: post.shareLink
      };
    });

    const allPosts = [...reposts, ...posts].sort((a, b) => {
      return new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime(); // Sort by creation date
    });
    const postLength = allPosts.length;
    const paginatePosts = allPosts.slice(skip, skip + limit);
    const totalPosts = allPosts.length;
    const totalPages = Math.ceil(totalPosts / limit);
    // console.log(paginatePosts)
    res.status(200).json({ getUserProfile, 
      posts: paginatePosts,
      currentPage: page,
      postsCount: postLength,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};