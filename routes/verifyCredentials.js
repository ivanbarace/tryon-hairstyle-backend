const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

module.exports = (db) => {
    router.post('/verify-credentials', async (req, res) => {
        const { email, password, userId } = req.body;

        try {
            const [user] = await db.promise().query(
                'SELECT * FROM users WHERE user_id = ? AND email = ?',
                [userId, email]
            );

            if (user.length === 0) {
                return res.json({ success: false, message: 'Invalid credentials' });
            }

            const validPassword = await bcrypt.compare(password, user[0].password);
            if (!validPassword) {
                return res.json({ success: false, message: 'Invalid credentials' });
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Error verifying credentials:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    return router;
};
