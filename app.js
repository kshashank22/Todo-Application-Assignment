const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API1
const priorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const priorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const statusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const categoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const categoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const categoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
const searchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const result = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, category, status } = request.query;
  switch (true) {
    case priorityAndStatusProperty(request.query):
      if (
        `${priority}` === "HIGH" ||
        `${priority}` === "MEDIUM" ||
        `${priority}` === "LOW"
      ) {
        if (
          `${status}` === "TO DO" ||
          `${status}` === "IN PROGRESS" ||
          `${status}` === "DONE"
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}' AND status = '${status}';`;
          data = await db.all(getTodoQuery);
          response.send(data.map((eachItem) => result(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case priorityProperty(request.query):
      if (
        `${priority}` === "HIGH" ||
        `${priority}` === "MEDIUM" ||
        `${priority}` === "LOW"
      ) {
        getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority ='${priority}';`;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachItem) => result(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case statusProperty(request.query):
      if (
        `${status}` === "TO DO" ||
        `${status}` === "IN PROGRESS" ||
        `${status}` === "DONE"
      ) {
        getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}';`;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachItem) => result(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case categoryAndStatusProperty(request.query):
      if (
        `${category}` === "WORK" ||
        `${category}` === "HOME" ||
        `${category}` === "LEARNING"
      ) {
        if (
          `${status}` === "TO DO" ||
          `${status}` === "IN PROGRESS" ||
          `${status}` === "DONE"
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category = '${category}' AND status ='${status}';`;
          data = await db.all(getTodoQuery);
          response.send(data.map((eachItem) => result(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case categoryProperty(request.query):
      if (
        `${category}` === "WORK" ||
        `${category}` === "HOME" ||
        `${category}` === "LEARNING"
      ) {
        getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}';`;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachItem) => result(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case categoryAndPriorityProperty(request.query):
      if (
        `${category}` === "WORK" ||
        `${category}` === "HOME" ||
        `${category}` === "LEARNING"
      ) {
        if (
          `${priority}` === "HIGH" ||
          `${priority}` === "MEDIUM" ||
          `${priority}` === "LOW"
        ) {
          getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}' AND priority='${priority}';`;
          data = await db.all(getTodoQuery);
          response.send(data.map((eachItem) => result(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    case searchProperty(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(getTodoQuery);
      response.send(data.map((eachItem) => result(eachItem)));
      break;
    default:
      getTodoQuery = `SELECT * FROM todo;`;
      data = await db.all(getTodoQuery);
      response.send(data.map((eachItem) => result(eachItem)));
  }
});

//API2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const data = await db.get(getTodoQuery);
  response.send(result(data));
});

//API3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getTodoQuery = `SELECT * FROM todo WHERE due_date ='${newDate}';`;
    const data = await db.all(getTodoQuery);
    response.send(data.map((eachItem) => result(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `
                               INSERT INTO
                               todo (id, todo, priority, status,category,due_date)
                               VALUES
                                (${id}, '${todo}', '${priority}', '${status}','${category}','${newDueDate}');`;
          await db.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateTodoQuery;
  switch (true) {
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
                     UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
                    due_date='${newDueDate}' WHERE id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send(`Due Date Updated`);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
             UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
              due_date='${dueDate}' WHERE id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send(`Category Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
                UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
                due_date='${dueDate}' WHERE id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send(`Status Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `
                 UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
                 due_date='${dueDate}' WHERE id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send(`Priority Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case requestBody.todo !== undefined:
      updateTodoQuery = `
            UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
            due_date='${dueDate}' WHERE id = ${todoId};`;

      await db.run(updateTodoQuery);
      response.send(`Todo Updated`);
      break;
  }
});

//API6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
