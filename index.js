const express = require("express");
const usersRoute = require("./routes/user.routes");
const authRoute = require("./routes/auth.routes");
const commentRoute = require("./routes/comment.routes");
const postRoute = require("./routes/post.routes");
require("dotenv").config();
const postController = require("./component/component.post/post.controller");
const authMiddleware = require("./middleware/authentication");
const app = express();
const port = process.env.PORT || 3375;
const host = process.env.DB_HOST;

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(authRoute);
app.use(authMiddleware.isAuth);
app.use(usersRoute);
app.use("/posts", postRoute);
app.post("/images", postController.getUrlImage);
app.use(commentRoute);

app.use((req, res, next) => {
  const error = new Error("api not found");
  next(error);
});
app.use((error, req, res, next) => {
  res.status(200).json({
    status: "error",
    message: error,
    error: error.stack,
  });
});

app.listen(port, () => {
  console.log(`App listening at http://${host}:${port}`);
});
