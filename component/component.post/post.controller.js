const postService = require("./post.service");
const moment = require("moment");

exports.listPost = async (req, res, next) => {
    try {
        console.log(req.id);
        let result = await postService.listPost(req.id);
        res.status(200).json({
            status: "success",
            code: null,
            message: null,
            data: result,
        });
    } catch (error) {
        res.status(400).json({
            status: "Error",
            code: error.code,
            message: error.message,
            data: null,
        });
    }
};

exports.listPostFollowing = async (req, res, next) => {
    try {
        console.log(req.id);
        let result = await postService.listPostFollowing(req.params.id);
        res.status(200).json({
            status: "success",
            code: null,
            message: null,
            data: result,
        });
    } catch (error) {
        res.status(400).json({
            status: "Error",
            code: error.code,
            message: error.message,
            data: null,
        });
    }
}


exports.newPost = async function (req, res) {
    let datapost = {};
    datapost.caption = req.body.caption;
    console.log(moment().format("yyyy-MM-DD HH:mm:ss"));
    datapost.created_at = moment().format("yyyy-MM-DD HH:mm:ss");
    datapost.user_id = req.id;
    const imageurl = req.body.urlImage;
    try {
        await postService.savePost(datapost, imageurl).then();
        res.json(
            {
                status: "success",
                errorCode: null,
                message: null,
                data: null,
            }
        );
    } catch (e) {
        res.status = 200;
        res.json({
            status: "error",
            errorCode: 500,
            message: JSON.stringify(e.message),
            data: '',
        })
    }
}

exports.GetPostById = async function (req, res) {
    const Postid = req.params.id;
    try {
        const dataPost = await postService.getPost(Postid);
        console.log(typeof dataPost);
        res.json({
            status: "success",
            errorCode: null,
            message: null,
            data: dataPost,
        });
    } catch (e) {
        res.status = 200;
        res.json({
            status: "error",
            errorCode: 500,
            message: JSON.stringify(e.message),
            data: "",
        });
    }
};

exports.UpdatePost = async function (req, res) {
    let data = [];
    data.caption = req.body.caption;
    data.id = req.params.id;
    const image = req.body.urlImage;
    if (image.length !== 0 && image != "{}") {
        for (let index = 0; index < image.length; index++) {
            if (image[index]) {
                await postService.updateImagePath(image[index].image_path, image[index].downsize,
                    image[index].thumbnail, image[index].id, image[index].metadata).then();
            }
        }
    }
    try {
        let dataReturn = await postService.updatePost(data).then();
        res.json(
            {
                status: "success",
                errorCode: null,
                message: null,
                data: dataReturn,
            }
        );
    } catch (e) {
        res.status = 200;
        res.json(
            {
                status: "error",
                errorCode: 500,
                message: JSON.stringify(e.message),
                data: null,
            }
        );
    }
}


exports.DeletePost = async function (req, res) {
    const Postid = req.params.id;
    try {
        await postService.deletePost(Postid);
        res.json(
            {
                status: "success",
                errorCode: null,
                message: null,
                data: null,
            }
        );
    } catch (e) {
        res.status = 200;
        res.json({
            status: "error",
            errorCode: 500,
            message: JSON.stringify(e),
            data: '',
        })
    }
}


exports.LikeOrUnLike = async function (req, res) {
    let resultData = {};
    const Postid = req.params.id;
    const userid = req.id;
    const status = req.query.status;
    let checkPost = await postService.IsPostExists(Postid);
    if (!checkPost) {
        res.status = 200;
        res.json({
            status: "error",
            errorCode: 404,
            message: "There weren't have this post in database",
            data: '',
        });
    }
    try {
        switch (status) {
            case "RemoveLike":
                resultData = await postService.UnLikePost(Postid, userid, "1");
                break;
            case "Like":
                resultData = await postService.LikePost(Postid, userid, "1");
                break;
        }
        if (resultData) {
            return res.json(resultData);
        }
        return res.json(
            {
                status: "success",
                errorCode: null,
                message: null,
                data: null,
            }
        );
    } catch (e) {
        res.status = 200;
        res.json({
            status: "error",
            errorCode: 500,
            message: JSON.stringify(e.message),
            data: '',
        });
    }
}

exports.getUrlImage = async (req, res, next) => {
    try {
        const arrayFile = req.body.filename.split(",");
        const arraySignUrl = await postService.getUrlImage(arrayFile);
        res.status(200).json({
            status: "success",
            errorCode: null,
            message: null,
            data: arraySignUrl,
        });
    } catch (error) {
        next(error);
    }
};
