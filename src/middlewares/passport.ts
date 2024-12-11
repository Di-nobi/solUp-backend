import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/UserData'; // Adjust the path to your User model
import jwt from 'jsonwebtoken';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID, 
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: '/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = new User({
            googleId: profile.id,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            email: profile.emails?.[0].value,
            profilePicture: profile.photos?.[0].value,
            isVerified: true,
          });
          await user.save();
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
          expiresIn: '1d',
        });

        done(null, { user, token });
      } catch (err) {
        done(err, undefined);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});
