const sqlite3 = require('sqlite3').verbose();
const DB_PATH = 'public/db/recipes.db';
const db = new sqlite3.Database(DB_PATH);

exports.addRecipe = function (req, res) {
  const recipe = req.body.recipeName;
  const description = req.body.recipeDescription;

  if (recipe.length === 0) {
    return res.send({ fieldError: 'Recipe cannot be blank' });
  } else if (description.length === 0) {
    return res.send({ fieldError: 'Description cannot be blank' });
  }

  function insertRecipe() {
    return new Promise((resolve, reject) => {
      db.run("INSERT INTO recipes (created, recipe, description) VALUES (DATETIME('now', 'localtime'), ?, ?)", [recipe, description], function (err) {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  function insertRecipeIntoHistory() {
    return new Promise((resolve, reject) => {
      db.run("INSERT INTO recipe_history (id, edited, recipe, description) SELECT * FROM recipes WHERE id = (SELECT MAX(id) FROM recipes)", [], function (err) {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  function getRecipes() {
    return new Promise((resolve, reject) => {
      db.all("SELECT id, created, recipe, description FROM recipes ORDER BY created DESC", [], (err, rows) => {
        if (err) {
          reject(err);
        }
        const pageData = rows;
        res.send({ recipes: pageData });
      });
    });
  }

  async function addRecipe() {
    try {
      await insertRecipe();
      await insertRecipeIntoHistory();
      await getRecipes();
    } catch (error) {
      console.log(error);
    }
  }

  addRecipe();
};