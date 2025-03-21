const express = require('express');
const router = express.Router();

module.exports = (db) => {
    router.get('/dashboard-stats', async (req, res) => {
        try {
            // Get total users (excluding admin)
            const [userCount] = await db.promise().query(
                'SELECT COUNT(*) as total FROM users WHERE role = "user"'
            );

            // Get total hairstyles
            const [hairstyleCount] = await db.promise().query(
                'SELECT COUNT(*) as total FROM hairstyle WHERE status = "active"'
            );

            // Get hairstyles by face shape with all possible values
            const [faceShapeStats] = await db.promise().query(`
                SELECT f.face_shape, COALESCE(COUNT(h.hairstyle_id), 0) as count
                FROM (
                    SELECT 'oval' as face_shape
                    UNION SELECT 'round'
                    UNION SELECT 'square'
                    UNION SELECT 'rectangle'
                    UNION SELECT 'triangle'
                ) f
                LEFT JOIN hairstyle h ON f.face_shape = h.faceshape AND h.status = 'active'
                GROUP BY f.face_shape
                ORDER BY f.face_shape
            `);

            // Get hairstyles by hair type with all possible values
            const [hairTypeStats] = await db.promise().query(`
                SELECT t.hair_type, COALESCE(COUNT(h.hairstyle_id), 0) as count
                FROM (
                    SELECT 'straight' as hair_type
                    UNION SELECT 'curly'
                    UNION SELECT 'wavy'
                    UNION SELECT 'coily'
                ) t
                LEFT JOIN hairstyle h ON t.hair_type = h.hairtype AND h.status = 'active'
                GROUP BY t.hair_type
                ORDER BY t.hair_type
            `);

            // Get hairstyles by hair length with all possible values
            const [hairLengthStats] = await db.promise().query(`
                SELECT l.hair_length, COALESCE(COUNT(h.hairstyle_id), 0) as count
                FROM (
                    SELECT 'short' as hair_length
                    UNION SELECT 'medium'
                    UNION SELECT 'long'
                ) l
                LEFT JOIN hairstyle h ON l.hair_length = h.hair_length AND h.status = 'active'
                GROUP BY l.hair_length
                ORDER BY l.hair_length
            `);

            // Get average rating
            const [avgRating] = await db.promise().query(
                'SELECT CAST(AVG(rating) AS DECIMAL(10,2)) as average FROM ratings'
            );

            // Get total ratings count
            const [totalRatings] = await db.promise().query(
                'SELECT COUNT(*) as total FROM ratings'
            );

            // Get recently added hairstyles (last 5)
            const [recentHairstyles] = await db.promise().query(
                'SELECT hairstyle_name, created_at FROM hairstyle WHERE status = "active" ORDER BY created_at DESC LIMIT 5'
            );

            // Get user growth data (last 6 months)
            const [userGrowth] = await db.promise().query(`
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as new_users
                FROM users 
                WHERE role = 'user'
                AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY month ASC
            `);

            // Get hairstyle additions over time (last 6 months)
            const [hairstyleGrowth] = await db.promise().query(`
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as new_hairstyles
                FROM hairstyle
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                ORDER BY month ASC
            `);

            res.json({
                success: true,
                data: {
                    totalUsers: userCount[0].total,
                    totalHairstyles: hairstyleCount[0].total,
                    faceShapeStats: faceShapeStats.map(stat => ({
                        faceshape: stat.face_shape,
                        count: stat.count
                    })),
                    hairTypeStats: hairTypeStats.map(stat => ({
                        hairtype: stat.hair_type,
                        count: stat.count
                    })),
                    hairLengthStats: hairLengthStats.map(stat => ({
                        hair_length: stat.hair_length,
                        count: stat.count
                    })),
                    averageRating: Number(avgRating[0].average) || 0,
                    totalRatings: totalRatings[0].total,
                    recentHairstyles: recentHairstyles,
                    userGrowth: userGrowth,
                    hairstyleGrowth: hairstyleGrowth
                }
            });
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching dashboard statistics',
                error: error.message
            });
        }
    });

    return router;
};
