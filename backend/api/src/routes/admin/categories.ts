import {Hono} from "hono";
import {zValidator} from '@hono/zod-validator'
import {Bindings, Variables} from "../../index";
import {createCategoryScheme, updateCategoryScheme} from "../../schemes/category.scheme";

const categoriesRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

categoriesRoutes.get("/", async (c) => {
  const supabase = c.get("supabaseClient");

  if (!supabase) {
    return c.json({error: "Failed to fetch categories"}, 500);
  }

  const {data, error} = await supabase
    .from("categories")
    .select("*")
    .order("created_at", {ascending: false});

  if (error) {
    return c.json({error: "Failed to fetch categories"}, 500);
  }

  return c.json(data);
});

categoriesRoutes.get("/:id", async (c) => {
  const supabase = c.get("supabaseClient");

  if (!supabase) {
    return c.json({error: "Failed to fetch category"}, 500);
  }

  const {id} = c.req.param();

  const {data, error} = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return c.json({error: "Failed to fetch category"}, 500);
  }

  return c.json(data);
});

categoriesRoutes.post(
  "/",
  zValidator("json", createCategoryScheme),
  async (c) => {
    const supabase = c.get("supabaseClient");

    if (!supabase) {
      return c.json({error: "Failed to create category"}, 500);
    }

    const requestData = c.req.valid("json");

    const {data, error} = await supabase
      .from("categories")
      .insert({name: requestData.name})
      .select("*")
      .single();

    if (error) {
      console.error("Failed to create category", error);
      return c.json({error: "Failed to create category"}, 500);
    }

    console.log("Category created", {id: data.id, adminId: c.get("user")?.id});
    return c.json(data, 201);
  }
);

categoriesRoutes.put(
  "/:id",
  zValidator("json", updateCategoryScheme),
  async (c) => {
    const supabase = c.get("supabaseClient");

    if (!supabase) {
      return c.json({error: "Failed to update category"}, 500);
    }

    const {id} = c.req.param();
    const requestData = c.req.valid("json");

    const {data, error} = await supabase
      .from("categories")
      .update({name: requestData.name})
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Failed to update category", error);
      return c.json({error: "Failed to update category"}, 500);
    }

    console.log("Category updated", {id, adminId: c.get("user")?.id});
    return c.json(data);
  }
);

export default categoriesRoutes;

