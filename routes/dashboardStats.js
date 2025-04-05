const express = require('express');
const router = express.Router();

module.exports = (db) => {
    router.get('/dashboard-stats', async (req, res) => {
        try {
            // Get admin info first
            const [adminResult] = await db.promise().query(
                'SELECT fullname FROM admin WHERE admin_id = 1'
            );
            const adminName = adminResult[0]?.fullname || 'Admin';

            // Get total users (excluding admin)
            const [userCount] = await db.promise().query(
                'SELECT COUNT(*) as total FROM users WHERE role = "user"'
            );

            // Get total hairstyles
            const [hairstyleCount] = await db.promise().query(
                'SELECT COUNT(*) as total FROM hairstyle WHERE status = "active"'
            );

            // Update face shape stats query to use hairstyle_faceshape table
            const [faceShapeStats] = await db.promise().query(`
                SELECT 
                    f.face_shape,
                    COUNT(DISTINCT hf.hairstyle_id) as count
                FROM (
                    SELECT 'Oval' as face_shape
                    UNION SELECT 'Round'
                    UNION SELECT 'Square'
                    UNION SELECT 'Rectangle'
                    UNION SELECT 'Triangle'
                ) f
                LEFT JOIN hairstyle_faceshape hf ON f.face_shape = hf.faceshape
                LEFT JOIN hairstyle h ON hf.hairstyle_id = h.hairstyle_id AND h.status = 'active'
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

            // Get hairstyle additions per day (last 30 days)
            const [hairstyleGrowth] = await db.promise().query(`
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m-%d') as date,
                    COUNT(*) as hairstyles_added
                FROM hairstyle
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                AND status = 'active'
                GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
                ORDER BY date ASC
            `);

            const [activeUsers] = await db.promise().query(`
                SELECT user_id, fullname, email, profile_picture 
                FROM users 
                WHERE role = 'user' 
                ORDER BY created_at DESC 
                LIMIT 10
            `);

            res.json({
                success: true,
                data: {
                    adminName: adminName,
                    totalUsers: userCount[0].total,
                    totalHairstyles: hairstyleCount[0].total,
                    faceShapeStats: faceShapeStats.map(stat => ({
                        faceshape: stat.face_shape,
                        count: parseInt(stat.count)
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
                    hairstyleGrowth: hairstyleGrowth,
                    userGrowth: [], // We'll remove user growth data since we only want hairstyles
                    users: activeUsers
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
