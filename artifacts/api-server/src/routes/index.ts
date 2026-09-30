import { Router, type IRouter } from "express";
import healthRouter from "./health";
import homeRouter from "./home";
import enquiriesRouter from "./enquiries";
import storageRouter from "./storage";
import coursesMenuRouter from "./courses-menu";

const router: IRouter = Router();

router.use(healthRouter);
router.use(homeRouter);
router.use(enquiriesRouter);
router.use(storageRouter);
router.use(coursesMenuRouter);

export default router;
