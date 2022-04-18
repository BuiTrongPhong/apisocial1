const postModel = require("../../models/post");
const {Op, QueryTypes} = require("sequelize");
const db = require("../../db/config");
const ImageModel = require("../../models/image");
const likePost = require("../../models/like");
const PostModel = require("../../models/post");
const moment = require("moment");
require('dotenv').config()

exports.listPost = async (id) => {
    try {
        const result = await db.query(
            `select u.firstname, u.lastname,
            p.caption, p.total_comment, p.total_likes,
            i.image_path
            From posts p 
            join users u ON u.id = p.user_id
            join images i ON i.post_id = p.id
            where u.id = ?`,
            {replacements: [id], plain: false, type: QueryTypes.SELECT}
        );

        if (Object.keys(result).length === 0) {
            let err = {
                code: "NOT_FOUND",
                message: "NO RESULT ",
            };
            throw err;
        }
        return result;
    } catch (err) {
        throw err;
    }
};

exports.listPostFollowing = async (id) => {
    try {
        const result = await db.query(
            `SELECT u.firstname, u.lastname,
                   p.caption, p.total_comment, p.total_likes,
                   i.image_path
            From posts p 
            JOIN users u ON u.id = p.user_id
            JOIN images i ON i.post_id = p.id
            WHERE u.id = ?`,
            {replacements: [id], plain: false, type: QueryTypes.SELECT}
        );
        if (Object.keys(result).length === 0) {
            let err = {
                code: "NOT_FOUND",
                message: "NO RESULT ",
            };
            throw err;
        }
        return result;
    } catch (err) {
        throw err;
    }
};

/// S3 presigned URLs
const AWS = require("aws-sdk");
AWS.config.update({
    region: "us-east-1",
    accessKeyId: process.env.AWS_ACCESSKEYID,
    secretAccessKey: process.env.AWS_SECRET_ACCESSKEY,
});
const s3 = new AWS.S3();
const uuid = require("uuid");
exports.savePost = async function (objectPost, image) {
    await postModel.create({
        caption: objectPost.caption,
        created_at: objectPost.created_at,
        user_id: objectPost.user_id,
    });
    const result = await postModel.findOne({
        attributes: ['id'],
        where: {
            created_at: objectPost.created_at,
        },
    });
    const idpost = result.getDataValue("id");
    for (let indexImage in image) {
        image[indexImage].post_id = idpost;
    }
    await ImageModel.bulkCreate(image)
};

exports.getPost = async function (idpost) {
    let result = {};
    const dataPost = await postModel.findOne({
        where: {
            id: idpost
        }
    });
    let urlImage = [];
    let data = await this.getImageInPost(idpost);
    if (data.length !== 0) {
        for (let i = 0; i < data.length; i++) {
            urlImage[i] = {"id": data[i].getDataValue('id'), "path": data[i].getDataValue('downsize')}
        }
        result.urlImage = urlImage;
    }
    if (dataPost.getDataValue('deleted_at')) {
        throw {
            status: "error",
            message: "this already deleted"
        }
    } else {
        result.id = dataPost.getDataValue('id');
        result.caption = dataPost.getDataValue('caption');
        result.created_at = dataPost.getDataValue('created_at');
        result.updated_at = dataPost.getDataValue('updated_at');
        result.total_likes = dataPost.getDataValue('total_likes');
        result.total_comment = dataPost.getDataValue('total_comment');
        result.userid = dataPost.getDataValue('userid');
    }
    return result;
}

exports.IsPostExists = async function (postid) {
    return await postModel.findOne({where: {id: postid}});
}

exports.updatePost = async function (modelPost) {
    const checkPost = this.IsPostExists(modelPost.id);
    if (checkPost.deleted_at == null) {
        await postModel.update({
            caption: modelPost.caption,
            updated_at: moment().format("yyyy-MM-DD HH:mm:ss")
        }, {
            where: {
                id: modelPost.id
            }
        });
    }
    return this.getPost(modelPost.id);
}

exports.deletePost = async function (idpost) {
    const currentTime = moment().format('yyyy-MM-DD HH:mm:ss');
    return await postModel.update({
        deleted_at: currentTime
    }, {
        where: {
            id: idpost
        }
    })
}

exports.getUrlImage = async (arrayFile) => {
    const numberImage = arrayFile.length;
    const arraySignUrl = [];
    const bucketName = process.env.BUCKET_NAME;
    for (let i = 0; i < numberImage; i++) {
        if (
            arrayFile[i].split(".")[1] === "png" ||
            arrayFile[i].split(".")[1] === "jpg"
        ) {
            const key = uuid.v4() + "-" + arrayFile[i];
            const param = {
                Bucket: bucketName,
                Key: key,
                ContentType: "image/png",
                Expires: 6000,
            };
            const url = await s3.getSignedUrlPromise("putObject", param);
            arraySignUrl.push(url);
        } else {
            throw {
                status: "error",
                message: "type of image not valid",
            };
        }
    }
    return arraySignUrl;
};

exports.getImageInPost = async function (idPost) {
    return ImageModel.findAll({
        where: {
            post_id: idPost,
        },
    });
};

exports.getImageById = async function (idImage) {
    return ImageModel.findOne({
        where: {
            id: idImage,
        },
    });
};


exports.updateImagePath = async function (image, firstDownSize, SecDownSize, idImage, metadataImage) {
    const t = await db.transaction();
    await ImageModel.update({
        image_path: image,
        downsize: firstDownSize,
        thumbnail: SecDownSize,
        metadata: metadataImage
    }, {
        whete: {
            id: idImage
        }
    }, {transaction: t});
    await t.commit();
}

exports.LikePost = async function (postid, userid, type) {
    const dateData = moment().format("yyyy-MM-DD HH:mm:ss");
    let datalikepost = await likePost.findOne({
        where: {
            foreign_id: postid,
            user_id: userid,
            type_like: type
        }
    })
    if (datalikepost) {
        return {status: 'success', errorCode: 200, message: 'already has 1 no more', data: ''};
    }
    const t = await db.transaction();
    await likePost.create({
        created_at: dateData,
        foreign_id: postid,
        user_id: userid,
        type_like: type
    }, {transaction: t});
    await t.commit()
    await this.UpdateTotalLike(1, postid);
}

exports.UnLikePost = async function (postid, userid, type) {
    try {
        var datalikepost = await likePost.findOne({where: {foreign_id: postid, user_id: userid, type_like: type}})
    } catch (e) {
        return {status: 'error', errorCode: 404, message: JSON.stringify(e.message), data: ''};
    }
    const t = await db.transaction();
    await likePost.destroy({where: {id: datalikepost.id}}, {transaction: t});
    await t.commit();
    await this.UpdateTotalLike(-1, postid);
}

exports.UpdateTotalLike = async function (updateNumber, postid) {
    const dataExample = await PostModel.findOne({where: {id: postid}});
    let updateData = dataExample.getDataValue('total_likes');
    if (!updateData) {
        updateData = 0;
    }
    updateData = updateData + updateNumber;
    const t = await db.transaction();
    await PostModel.update({total_likes: updateData}, {
        where: {id: postid}
    }, {transaction: t});
    await t.commit();
}
