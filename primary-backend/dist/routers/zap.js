import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = Router();
router.post("/signup", authMiddleware, (req, res) => {
    // Handle user signup logic here
    res.send("User signed up successfully");
});
router.post("/signin", authMiddleware, (req, res) => {
    // Handle user login logic here
    res.send("User logged in successfully");
});
router.get("/user", authMiddleware, (req, res) => {
    // Handle fetching user profile logic here
    res.send("User profile data");
});
export const zapRouter = router;
//# sourceMappingURL=zap.js.map