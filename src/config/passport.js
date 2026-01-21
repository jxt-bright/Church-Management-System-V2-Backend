import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User } from "../models/users_model.js";
import dotenv from "dotenv";
dotenv.config({path: './.env'});

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.ACCESS_TOKEN_SECRET
};

const passportConfig = (passport) => {
    passport.use(
        new JwtStrategy(options, async (jwt_payload, done) => {
            try {
                const user = await User.findById(jwt_payload.id).select('_id status groupId churchId');
                
                if (user) {
                    return done(null, user);
                }
                return done(null, false);
            } catch (err) {
                return done(err, false);
            }
        })
    );
};


export default passportConfig;