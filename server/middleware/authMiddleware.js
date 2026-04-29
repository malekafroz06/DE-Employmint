import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

// JWKS client — works for both dev and production via env variable
const jwks = jwksClient({
  jwksUri: `${process.env.CLERK_ISSUER_URL}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000
});

const getSigningKey = (header, callback) => {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
};

const verifyJWT = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        algorithms: ['RS256'],
        issuer: process.env.CLERK_ISSUER_URL,
      },
      (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      }
    );
  });
};

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    let payload;
    try {
      payload = await verifyJWT(token);
      console.log('✅ Token verified for user:', payload.sub);
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    if (!payload?.sub) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload'
      });
    }

    try {
      const user = await clerk.users.getUser(payload.sub);

      req.auth = {
        userId: payload.sub,
        sessionId: payload.sid,
        sessionClaims: {
          ...payload,
          email: user.emailAddresses?.[0]?.emailAddress,
          username: user.username,
          first_name: user.firstName,
          last_name: user.lastName,
          name: user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.username || '',
          image_url: user.imageUrl,
          email_addresses: user.emailAddresses,
          ...user.publicMetadata,
          ...user.unsafeMetadata
        }
      };

      console.log('✅ Auth set for user:', req.auth.userId, '|', req.auth.sessionClaims.email);
    } catch (userError) {
      console.error('User fetch error (non-fatal):', userError.message);
      req.auth = {
        userId: payload.sub,
        sessionId: payload.sid,
        sessionClaims: { ...payload }
      };
    }

    next();

  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

export const alternativeAuthMiddleware = authMiddleware;