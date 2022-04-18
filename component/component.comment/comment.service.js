const Post = require("../../models/post");
const Comment = require("../../models/comment");
const Like = require("../../models/like");
const db = require("../../db/config");
require("dotenv").config();

const createComment = async (content, post_id, user_id, parent_comment_id) => {
  const post = await Post.findByPk(post_id);
  if (!post) {
    throw {
      status: "error",
      message: "post not exist",
    };
  }
  if (!content) {
    throw {
      status: "error",
      message: "content not be null",
    };
  };
  if (!parent_comment_id) {
    const comment = await Comment.create({
      content: content,
      user_id: user_id,
      post_id: post_id
    });
    return comment;
  }
  const t = await db.transaction();
  try {
    const parentComment = await Comment.findByPk(parent_comment_id);
    if (!parentComment || parentComment.deleted_at !== null) {
      throw {
        status: "error",
        message: "parent_comment_id is not exist",
      };
    }
    if (parentComment.parent_comment_id !== null) {
      throw {
        status: "error",
        message: "not 1 level reply",
      };
    }
    const comment = await Comment.create(
      {
        content: content,
        user_id: user_id,
        post_id: post_id,
        parent_comment_id: parent_comment_id,
      },
      { transaction: t }
    );
    await Comment.update(
      { total_comment: (parentComment.total_comment += 1) },
      {
        where: {
          id: parent_comment_id,
        },
        transaction: t
      },
    );
    await t.commit();
    return
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const reactionComment = async (user_id, comment_id, status) => {
  const comment = await Comment.findByPk(comment_id);
  if (!comment) {
    throw {
      status: "error",
      message: "comment is not exist",
    };
  }
  if (status === '1') {
    const checkLike = await Like.findOne({
      where: { foreign_id: comment_id, user_id: user_id, type_like: 2 },
    });
    if (checkLike) {
      throw {
        status: "error",
        message: "like is exist",
      };
    }
    const t = await db.transaction();
    try {
      const like = await Like.create(
        {
          user_id: user_id,
          foreign_id: comment_id,
          type_like: 2,
        },
        { transaction: t }
      );
      await Comment.update(
        { total_like: (comment.total_like += 1) },
        {
          where: {
            id: comment_id,
          },
          transaction: t
        },
      );
      await t.commit();
      return
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } else if (status === '0') {
    const checkLike = await Like.findOne({
      where: { foreign_id: comment_id, user_id: user_id, type_like: 2 },
    });
    if (!checkLike) {
      throw {
        status: "error",
        message: "like is not exist",
      };
    }
    const t = await db.transaction();
    try {
      await Like.destroy(
        {
          where: {
            id: checkLike.id,
          },
          transaction: t
        },
      );
      await Comment.update(
        { total_like: (comment.total_like -= 1) },
        {
          where: {
            id: comment_id,
          },
          transaction: t
        },
      );
      await t.commit();
      return
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
};

const deleteComment = async (comment_id) => {
  const comment = await Comment.findByPk(comment_id);
  if (!comment) {
    throw {
      status: "error",
      message: "comment is not exist",
    };
  }
  const t = await db.transaction()
  try {
    await Comment.update(
      { deleted_at: Date.now() },
      {
        where: {
          id: comment.id,
          transaction: t
        },
      },
    );
    if (comment.total_like === 0) {
      await Like.destroy(
        {
          where: {
            foreign_id: comment_id,
          },
          stransaction: t
        },
      );
    }
    if (comment.total_comment === 0) {
      return
    }
    await Comment.update(
      { deleted_at: Date.now() },
      {
        where: {
          parent_comment_id: comment_id,
        },
        transaction: t
      },
    );
    const commentChild = await Comment.findAll({
      where: {
        parent_comment_id: comment_id,
      },
      transaction: t
    });
    const commentIdDelete = []
    for (let item of commentChild) {
      if (item.total_like !== 0) {
        commentIdDelete.push(item.id)
      }
    }
    await Like.destroy(
      {
        where: {
          foreign_id: commentIdDelete,
        },
        transaction: t
      },
    );
    await t.commit();
    return
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const getComment = async (post_id, pageSize, page) => {
  const post = await Post.findByPk(post_id);
  if (!post) {
    throw {
      status: "error",
      message: "post is not exist",
    };
  }
  console.log('page',page)
  page--
  const listComment = await Comment.findAll({
    where: {
      post_id: post_id,
      deleted_at: null,
    },
    offset: parseInt(page*pageSize),
    limit: parseInt(pageSize)
  }
  );

  const listCommentShow = [];
  let i = 0;
  for (let indexComment1 in listComment) {
    if (listComment[indexComment1].parent_comment_id === null) {
      listCommentShow.push(listComment[indexComment1]);
      listCommentShow[i].dataValues.childComment = [];
      for (let indexComment2 in listComment) {
        if (
          listComment[indexComment2].parent_comment_id ===
          listComment[indexComment1].id
        ) {
          listCommentShow[i].dataValues.childComment.push(
            listComment[indexComment2]
          );
        }
      }
      i++;
    }
  }
  return listCommentShow;
};

module.exports = {
  createComment,
  reactionComment,
  deleteComment,
  getComment,
};
