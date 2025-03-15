const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

module.exports = (db) => {
    router.post('/update-password', async (req, res) => {
        const { email, newPassword, userId } = req.body;

        try {
            // First get all users' passwords to check for duplicates
            const [allUsers] = await db.promise().query(
                'SELECT password FROM users WHERE user_id != ?',
                [userId]
            );

            // Check if the new password matches any existing passwords
            for (const user of allUsers) {
                const passwordExists = await bcrypt.compare(newPassword, user.password);
                if (passwordExists) {
                    return res.json({
                        success: false,
                        message: 'This password is already in use. Please choose a different password.'
                    });
                }
            }

            // Get current user's password
            const [currentUser] = await db.promise().query(
                'SELECT password FROM users WHERE user_id = ? AND email = ?',
                [userId, email]
            );

            if (currentUser.length === 0) {
                return res.json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }

            // Check if new password is same as current password
            const isSamePassword = await bcrypt.compare(newPassword, currentUser[0].password);
            if (isSamePassword) {
                return res.json({
                    success: false,
                    message: 'New password cannot be the same as your current password'
                });
            }

            // Hash and update the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.promise().query(
                'UPDATE users SET password = ? WHERE user_id = ? AND email = ?',
                [hashedPassword, userId, email]
            );

            res.json({ 
                success: true, 
                message: 'Password updated successfully' 
            });
        } catch (error) {
            console.error('Error updating password:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error updating password',
                error: error.message 
            });
        }
    });

    return router;
};
