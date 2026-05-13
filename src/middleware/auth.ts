import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User'; // Make sure this path to your User model is correct!
import jwt from 'jsonwebtoken';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // 2. Verify token
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your_secret');
        
        // 3. Find user (This was likely where your error was)
        // Ensure 'User' is imported and this is inside the async function
        const user = await User.findById(decoded.id); 

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // 4. Attach user to request object
        (req as any).user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
