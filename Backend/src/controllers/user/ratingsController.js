const db = require('../../config/db');
const { logAuditEvent } = require('../../utils/auditLogger');

// Submit or Update App Rating
exports.submitRating = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { rating, feedback } = req.body;

        const numRating = parseInt(rating, 10);
        if (!numRating || numRating < 1 || numRating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        const cleanFeedback = feedback ? String(feedback).trim() : null;

        // Check if user already submitted a rating
        const [existing] = await db.promise().query(
            'SELECT id FROM app_ratings WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (existing.length > 0) {
            // Update existing rating
            await db.promise().query(
                'UPDATE app_ratings SET rating = ?, feedback = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
                [numRating, cleanFeedback, userId]
            );
        } else {
            // Insert new rating
            await db.promise().query(
                'INSERT INTO app_ratings (user_id, rating, feedback) VALUES (?, ?, ?)',
                [userId, numRating, cleanFeedback]
            );
        }

        // Audit log
        await logAuditEvent(req, {
            actionType: existing.length > 0 ? 'UPDATE' : 'INSERT',
            tableName: 'app_ratings',
            recordId: userId,
            newValues: { rating: numRating, feedback: cleanFeedback }
        });

        return res.json({
            success: true,
            message: 'Thank you for rating our app! 🎉',
            data: { rating: numRating, feedback: cleanFeedback }
        });

    } catch (error) {
        console.error('Error submitting rating:', error);
        return res.status(500).json({ success: false, message: 'Failed to submit rating' });
    }
};

// Get Logged-In User's Rating
exports.getMyRating = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;

        const [rows] = await db.promise().query(
            'SELECT rating, feedback, created_at, updated_at FROM app_ratings WHERE user_id = ? LIMIT 1',
            [userId]
        );

        if (rows.length === 0) {
            return res.json({ success: true, data: null });
        }

        return res.json({
            success: true,
            data: {
                rating: rows[0].rating,
                feedback: rows[0].feedback,
                createdAt: rows[0].created_at,
                updatedAt: rows[0].updated_at
            }
        });

    } catch (error) {
        console.error('Error fetching rating:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch rating' });
    }
};
