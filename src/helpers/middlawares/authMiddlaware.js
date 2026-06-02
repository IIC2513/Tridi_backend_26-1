const jwt = require('jsonwebtoken');

const { Session, User } = require('../../models');

// wrapper that velidates a logged user, adds req.user with id, username and role.
const middlawareHandleLoggin = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { userId } = jwt.verify(token, process.env.JWT_SECRET);

        const activeSession = await Session.findOne({
            where: { token, userId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'role']
                }
            ]
        });

        if (!activeSession) {
            return res.status(401).json({ error: "Unauthorized: Session not found or logged out" });
        }

        if (activeSession.exp_date && new Date() > new Date(activeSession.exp_date)) {
            Session.destroy({ where: { token: token } })
                .catch(dbError => {
                    console.error("Background cleanup failed for expired session:", dbError);
                });

            return res.status(401).json({ error: "Unauthorized: Session has expired" });
        }

        req.user = activeSession.user;

        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            void Session.destroy({ where: { token } }).catch((dbError) => {
                console.error('Background cleanup failed for expired session:', dbError);
            });
            return res.status(401).json({ error: "Unauthorized: Token has expired" });
        }

        console.error("Auth Error:", error);
        return res.status(403).json({ error: "Forbidden: Invalid or expired token" });
    }
};

module.exports = middlawareHandleLoggin;
