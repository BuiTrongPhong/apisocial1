const commentService = require("./comment.service");
const commentPost = async (req, res, next) => {
  try {
    const user_id = req.id;
    const post_id = req.params.id;
    const { content, parent_comment_id } = req.body;
    const comment = await commentService.createComment(
      content,
      post_id,
      user_id,
      parent_comment_id
    );
    res.status(200).json({
      status: "success",
      errorCode: null,
      message: null,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
const reactionComment = async (req, res, next) => {
  try {
    const user_id = req.id;
    const comment_id = req.params.id;
    const status = req.query.status;
    await commentService.reactionComment(
      user_id,
      comment_id,
      status
    );
    res.status(200).json({
      status: "success",
      errorCode: null,
      message: null,
      data: null
    })
  } catch (error) {
    next(error);
  }
};
const deleteComment = async (req, res, next) => {
  try {
    const comment_id = req.params.id;
    await commentService.deleteComment(comment_id);
    res.status(200).json({
      status: "success",
      errorCode: null,
      message: null,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const getComment = async (req, res, next) => {
  try {
    const post_id = req.params.id;
    const {page, pageSize} = req.query
    const listCommentShow = await commentService.getComment(post_id, pageSize, page);
    res.status(200).json({
      status: "success",
      errorCode: null,
      message: null,
      data: listCommentShow,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  commentPost,
  reactionComment,
  deleteComment,
  getComment,
};
