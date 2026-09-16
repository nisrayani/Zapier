import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { ZapCreateSchema } from "../types/index.js";
import prisma from "../db/index.js";
const router = Router();
router.post("/create", authMiddleware, async (req, res) => {
    const zapCreateData = ZapCreateSchema.safeParse(req.body);
    if (!zapCreateData.success) {
        return res.status(400).json({
            message: "Validation failed",
        });
    }
    try {
        await prisma.$transaction(async (tx) => {
            const zap = await tx.zap.create({
                data: {
                    name: zapCreateData.data.name ?? "New Zap",
                    // @ts-ignore
                    userId: req.userId,
                    actions: {
                        create: zapCreateData.data.actions.map((action, index) => ({
                            typeId: action.actionTypeId,
                            sortingOrder: index,
                            metadata: action.actionMetadata,
                        })),
                    },
                },
            });
            const trigger = await tx.trigger.create({
                data: {
                    typeId: zapCreateData.data.triggerTypeId,
                    metadata: zapCreateData.data.triggerMetadata,
                    zapId: zap.id,
                },
            });
        });
        console.log("Zap created successfully with trigger and actions");
        res.status(201).json({ message: "Zap created successfully" });
    }
    catch (error) {
        console.error("Error creating zap:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.get("/", authMiddleware, async (req, res) => {
    // @ts-ignore
    const userId = req.userId;
    const zaps = await prisma.zap.findMany({
        where: {
            userId,
        },
        include: {
            actions: {
                include: {
                    type: true,
                },
            },
            trigger: {
                include: {
                    type: true,
                },
            },
        },
    });
    res.json(zaps);
});
router.get("/:zapId", authMiddleware, async (req, res) => {
    // @ts-ignore
    const userId = req.userId;
    const zapId = req.params.zapId;
    const zap = await prisma.zap.findFirst({
        where: {
            id: zapId,
            userId,
        },
        include: {
            actions: {
                include: {
                    type: true,
                },
            },
            trigger: {
                include: {
                    type: true,
                },
            },
        },
    });
    if (!zap) {
        return res.status(404).json({ message: "Zap not found" });
    }
    res.json(zap);
});
export const zapRouter = router;
//# sourceMappingURL=zap.js.map