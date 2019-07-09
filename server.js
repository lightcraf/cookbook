const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const bodyParser = require('body-parser');
const sqlite3 = require("sqlite3").verbose();
const DB_PATH = "public/db/recipes.db";
const db = new sqlite3.Database(DB_PATH);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/recipes', function (req, res) {
  db.all(`SELECT id, created, recipe, description FROM recipes ORDER BY created DESC`, [], (err, rows) => {
    if (err) {
      throw err;
    }
    const pageData = rows;
    res.send({ recipes: pageData });
  });
});

app.post('/api/recipes', (req, res) => {
  const recipe = req.body.recipeName;
  const description = req.body.recipeDescription;

  function insertRecipe() {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO recipes (created, recipe, description) 
        VALUES (DATETIME('now', 'localtime'), ?, ?)`, [recipe, description], function (err) {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  function insertRecipeIntoHistory() {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO recipe_history (id, edited, recipe, description) 
        SELECT * FROM recipes WHERE id = (SELECT MAX(id) FROM recipes)`, [], function (err) {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  function getRecipes() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT id, created, recipe, description FROM recipes ORDER BY created DESC`, [], (err, rows) => {
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
});



app.put('/api/edit', (req, res) => {
  const recipeId = req.body.recipeId;
  const recipe = req.body.recipeName;
  const description = req.body.recipeDescription;

  function updateRecipe() {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE recipes SET recipe = ?, description = ? WHERE id = ?`, [recipe, description, recipeId], function (err) {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  function getRecipes() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT id, created, recipe, description FROM recipes ORDER BY created DESC`, [], (err, rows) => {
        if (err) {
          reject(err);
        }
        const pageData = rows;
        res.send({ recipes: pageData });
      });

    });
  }

  function insertRecipeIntoHistory() {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO recipe_history (id, edited, recipe, description) 
        VALUES (?, DATETIME('now', 'localtime'), ?, ?)`, [recipeId, recipe, description], function (err) {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  async function editRecipe() {
    try {
      await updateRecipe();
      await insertRecipeIntoHistory();
      await getRecipes();
    } catch (error) {
      console.log(error);
    }
  }
  editRecipe();
});

app.post('/api/history', function (req, res) {
  const recipeId = req.body.recipeId;

  db.all(`SELECT edited, recipe, description FROM recipe_history WHERE id = ? ORDER BY edited DESC`, [recipeId], (err, rows) => {
    if (err) {
      throw err;
    }
    const pageData = rows;
    res.send({ recipes: pageData });
  });
});

app.listen(port, () => console.log(`Listening on port ${port}`));