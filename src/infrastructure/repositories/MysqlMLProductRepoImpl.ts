import Database from "../persistence/db";
import {
  MLProductRepo,
  MLProductRow
} from "../interfaces/mlProduct/MLProductRepo";
import MLProduct from "../interfaces/mlProduct/MLProduct";

export default class MysqlMLProductRepoImpl implements MLProductRepo {
  private db: Database;
  private mainTable: string = "ml_products";
  private pricesTable: string = "ml_product_prices";

  constructor(db: Database) {
    this.db = db;
  }

  public async initTransaction(): Promise<void> {
    await this.db.initTransaction();
  }

  public async commitTransaction(): Promise<void> {
    await this.db.commit();
  }

  public async rollbackTransaction(): Promise<void> {
    await this.db.rollback();
  }

  public async addMLProduct(mlProduct: MLProduct): Promise<void> {
    const mlProductData = mlProduct.getData();

    try {
      await this.db.insert(this.mainTable, {
        id: mlProductData.id,
        name: mlProductData.name,
        url: mlProductData.url,
        created: mlProductData.created
      });
      await this.db.insert(this.pricesTable, {
        ml_product_id: mlProductData.id,
        price: mlProductData.price,
        created: mlProductData.created
      });
    } catch (error: any) {
      throw new Error("MLProduct repository error: " + error.message);
    }
  }

  public async addMLProductPrice(mlProduct: MLProduct): Promise<void> {
    try {
      const mlProductData = mlProduct.getData();

      await this.db.insert(this.pricesTable, {
        ml_product_id: mlProductData.id,
        price: mlProductData.price,
        created: mlProductData.created
      });
    } catch (error: any) {
      throw new Error("MLProduct repository error: " + error.message);
    }
  }

  public async getProductWithUrl(url: string): Promise<MLProductRow> {
    try {
      const query = `SELECT id, name, url, created FROM ${this.mainTable} WHERE url = ?`;
      const product = (await this.db.result(query, [url])) as any;
      return product[0];
    } catch (error: any) {
      throw new Error("MLProduct repository error: " + error.message);
    }
  }

  public async productExists(url: string): Promise<boolean> {
    try {
      const query = `SELECT COUNT(*) as count FROM ${this.mainTable} WHERE url = ?`;
      const rows = (await this.db.result(query, [url])) as any;
      return rows[0].count > 0;
    } catch (error: any) {
      throw new Error("MLProduct repository error: " + error.message);
    }
  }

  public async getProductUrlById(productId: string): Promise<string | null> {
    try {
      const query = `SELECT url FROM ${this.mainTable} WHERE id = ?`;
      const rows = (await this.db.result(query, [productId])) as any;
      if (rows.length > 0) {
        return rows[0].url;
      }
      return null;
    } catch (error: any) {
      throw new Error("MLProduct repository error: " + error.message);
    }
  }

  // public async getAllProducts(): Promise<Array<MLProductRow>> {
  //   try {
  //     const query = `SELECT p.id, p.name, p.url, p.created, pp.created AS updated, st.state, pp.price, prev_pp.price AS previous_price
  //     FROM ${this.mainTable} p
  //     JOIN ${this.pricesTable} pp ON p.id = pp.ml_product_id
  //     LEFT JOIN scheduled_tasks st ON p.id = st.product_id
  //     LEFT JOIN (
  //       SELECT pp1.ml_product_id, pp1.price
  //       FROM ${this.pricesTable} pp1
  //       WHERE pp1.created < (
  //         SELECT MAX(pp2.created)
  //         FROM ${this.pricesTable} pp2
  //         WHERE pp2.ml_product_id = pp1.ml_product_id
  //       )
  //       ORDER BY pp1.created DESC
  //       LIMIT 1
  //     ) prev_pp ON p.id = prev_pp.ml_product_id
  //     WHERE pp.created = (
  //       SELECT MAX(pp2.created)
  //       FROM ${this.pricesTable} pp2
  //       WHERE pp2.ml_product_id = p.id
  //     )
  //     ORDER BY p.created DESC;`;
  //     const rows = (await this.db.result(query)) as any;
  //     console.log(rows);

  //     return rows;
  //   } catch (error: any) {
  //     throw new Error("MLProduct repository error: " + error.message);
  //   }

  public async getAllProducts(): Promise<Array<MLProductRow>> {
    try {
      const query = `SELECT id, name, url, created, updated, state, price, previous_price, previous_updated
      FROM (
          SELECT p.id, p.name, p.url, p.created, MAX(pp.created) AS updated, st.state, pp.price, prev_pp.price AS previous_price, MAX(prev_pp.created) AS previous_updated,
          ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY prev_pp.created DESC) AS rn
          FROM ${this.mainTable} p
          JOIN ${this.pricesTable} pp ON p.id = pp.ml_product_id
          LEFT JOIN scheduled_tasks st ON p.id = st.product_id
          LEFT JOIN (
              SELECT pp1.ml_product_id, pp1.price, MAX(pp1.created) AS max_created, pp1.created
              FROM ${this.pricesTable} pp1
              WHERE pp1.created < (
                  SELECT MAX(pp2.created)
                  FROM ${this.pricesTable} pp2
                  WHERE pp2.ml_product_id = pp1.ml_product_id
              )
              GROUP BY pp1.ml_product_id, pp1.price, pp1.created
          ) prev_pp ON p.id = prev_pp.ml_product_id AND prev_pp.created = max_created
          WHERE pp.created = (
              SELECT MAX(pp2.created)
              FROM ${this.pricesTable} pp2
              WHERE pp2.ml_product_id = p.id
          )
          GROUP BY p.id, st.state, pp.price, prev_pp.price, prev_pp.created
      ) AS unique_products
      WHERE rn = 1;`;
      const rows = (await this.db.result(query)) as any;
      console.log(rows);

      return rows;
    } catch (error: any) {
      throw new Error("MLProduct repository error: " + error.message);
    }
  }
  // SELECT id, name, url, updated, state, price, previous_price, previous_updated
  // FROM (
  //     SELECT p.id, p.name, p.url, MAX(pp.created) AS updated, st.state, pp.price, prev_pp.price AS previous_price, MAX(prev_pp.created) AS previous_updated,
  //     ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY prev_pp.created DESC) AS rn
  //     FROM ml_products p
  //     JOIN ml_product_prices pp ON p.id = pp.ml_product_id
  //     LEFT JOIN scheduled_tasks st ON p.id = st.product_id
  //     LEFT JOIN (
  //         SELECT pp1.ml_product_id, pp1.price, MAX(pp1.created) AS max_created, pp1.created
  //         FROM ml_product_prices pp1
  //         WHERE pp1.created < (
  //             SELECT MAX(pp2.created)
  //             FROM ml_product_prices pp2
  //             WHERE pp2.ml_product_id = pp1.ml_product_id
  //         )
  //         GROUP BY pp1.ml_product_id, pp1.price, pp1.created
  //     ) prev_pp ON p.id = prev_pp.ml_product_id AND prev_pp.created = max_created
  //     WHERE pp.created = (
  //         SELECT MAX(pp2.created)
  //         FROM ml_product_prices pp2
  //         WHERE pp2.ml_product_id = p.id
  //     )
  //     GROUP BY p.id, st.state, pp.price, prev_pp.price, prev_pp.created
  // ) AS unique_products
  // WHERE rn = 1;
}
