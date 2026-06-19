// Wrapper that validates if a user is admin.
const middlawareHandleAdmin = async (req, res, next) => {
    try {
        const user = req.user;

        if (!user)
            return res.status(401).json({error: 'Login required.'})

        if (user.role !== 'admin')
            return res.status(403).json({ error: 'Forbidden' });

        return next();
    } catch (error) {
        console.error("Admin Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = middlawareHandleAdmin;
