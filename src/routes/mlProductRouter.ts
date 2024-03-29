import { Router, Request, Response } from "express";
import MLProductController from "../controllers/MLProductController";
import Database from "../infrastructure/persistence/pgDb";
import ScheduleController from "../controllers/ScheduleController";
import { mlProductUrlValidations } from "../middlewares/mlProductValidations";
import PostgresMLProductRepoImpl from "../infrastructure/repositories/PostgresMLProductRepoImpl";
import PostgresScheduleRepoImpl from "../infrastructure/repositories/PostgresScheduleRepoImpl";

const router = Router();

router.get(
  "/mlProduct",
  mlProductUrlValidations,
  async (req: Request, res: Response) => {
    const db = await Database.getInstance();
    const mlProductRepo = new PostgresMLProductRepoImpl(db);
    const mlProductController = new MLProductController(mlProductRepo);
    const filename = "mLProduct.py";
    try {
      const { url } = req.query;
      let product;
      if (typeof url === "string") {
        product = await mlProductController.run(filename, url);
      } else {
        product = await mlProductController.run(filename);
      }
      res.json({ message: "Product added successfully", name: product.name });
    } catch (error) {
      console.error("Error executing script:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.get("/mlProducts", async (req: Request, res: Response) => {
  const db = await Database.getInstance();
  const mlProductRepo = new PostgresMLProductRepoImpl(db);
  const mlProductController = new MLProductController(mlProductRepo);
  try {
    const products = await mlProductController.getAllData();

    res.json(products);
  } catch (error) {
    console.error("Error getting all products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/schedule/:productId", async (req: Request, res: Response) => {
  const db = await Database.getInstance();
  const scheduleRepo = new PostgresScheduleRepoImpl(db);
  const scheduleController = new ScheduleController(scheduleRepo);
  try {
    const { productId } = req.params;

    await scheduleController.schedule(productId);
    res.json({
      message: `Scheduled daily updates for product ID ${productId}`
    });
  } catch (error) {
    console.error("Error saving schedule:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
