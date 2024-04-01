const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
let database = null
const dbPath = path.join(__dirname, 'todoApplication.db')

const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}
initializeDBandServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`
      break
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`
  }

  data = await database.all(getTodosQuery)
  response.send(data)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoListwithTodoID = `
                    SELECT
                      *
                    FROM
                      todo
                    WHERE
                      id=${todoId};`
  const todoListwithTodoID = await database.get(getTodoListwithTodoID)
  response.send(todoListwithTodoID)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const postSqlQuery = `
            INSERT INTO
                todo(id,todo,priority,status)
            VALUES(
              ${id},
              '${todo}',
              '${priority}',
              '${status}'
            )`
  await database.run(postSqlQuery)
  response.send('Todo Successfully Added')
})

const isToDoWillChange = (todo, previousSql) => {
  console.log(todo)
  console.log(previousSql)
  return todo !== previousSql.todo
}
const isPriorityWillChange = (priority, previousSql) => {
  return priority !== previousSql.priority
}
const isStatusWillChange = (status, previousSql) => {
  console.log(status)
  console.log(previousSql)
  return status !== previousSql.status
}
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getPreviousSqlQuery = `
                SELECT
                  *
                FROM
                  todo
                WHERE
                  id=${todoId};`
  const previousSql = await database.get(getPreviousSqlQuery)
  console.log(previousSql)
  let updateSqlQuery = null
  let responseMessage = null
  const {
    todo = previousSql.todo,
    priority = previousSql.priority,
    status = previousSql.status,
  } = request.body
  switch (true) {
    case isToDoWillChange(todo, previousSql):
      updateSqlQuery = `
              UPDATE
                todo
              SET
                todo='${todo}'
              WHERE
                id=${todoId};`
      responseMessage = 'Todo Updated'
      break
    case isPriorityWillChange(priority, previousSql):
      updateSqlQuery = `
              UPDATE
                todo
              SET
                priority='${priority}'
              WHERE
                id=${todoId};`
      responseMessage = 'Priority Updated'
      break
    case isStatusWillChange(status, previousSql):
      updateSqlQuery = `
              UPDATE
                todo
              SET
                status='${status}'
              WHERE
                id=${todoId};`
      responseMessage = 'Status Updated'
      break
  }
  await database.run(updateSqlQuery)
  response.send(responseMessage)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteSqlQuery = `
          DELETE FROM
              todo
          WHERE
              id=${todoId};`
  await database.run(deleteSqlQuery)
  response.send('Todo Deleted')
})

module.exports = app
