import { Router, type IRouter } from "express";
import healthRouter from "./health";
import homeRouter from "./home";
import enquiriesRouter from "./enquiries";
import storageRouter from "./storage";
import coursesMenuRouter from "./courses-menu";
import knowledgeHubMenuRouter from "./knowledge-hub-menu";
import articleHubRouter from "./article-hub";
import videoHubRouter from "./video-hub";

const router: IRouter = Router();

router.use(healthRouter);
router.use(homeRouter);
router.use(enquiriesRouter);
router.use(storageRouter);
router.use(coursesMenuRouter);
router.use(knowledgeHubMenuRouter);
router.use(articleHubRouter);
router.use(videoHubRouter);

export default router;
