import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
export function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    try {
        const payload = token ? jwt.verify(token, JWT_SECRET) : null;
        // @ts-ignore
        req.userId = payload?.userId;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Unauthorized" });
    }
}
//# sourceMappingURL=authMiddleware.js.map